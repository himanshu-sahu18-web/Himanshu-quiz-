import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildAiQuestionPrompt,
  extractSafeStreamingPreview,
  isValidCategoryId,
  isValidPointLevel,
  parseAndValidateAiQuestion,
  sanitizeRecentQuestions,
} from './src/utils/aiQuestionLogic.ts';
import {
  buildSpinnerBatchPrompt,
  parseAndValidateSpinnerBatch,
  sanitizeSpinnerCount,
} from './src/utils/spinnerQuestionLogic.ts';
import {
  extractClientIp,
  SlidingWindowRateLimiter,
} from './src/utils/rateLimiter.ts';
import type { CategoryId, PointLevel } from './src/types/quiz.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const FAST_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_GEMINI_MODEL = 'gemini-4-hydrogen';
const MAX_GENERATION_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 18000;

const SYSTEM_INSTRUCTION = [
  'You are the quizmaster engine for HIMANSHU QUIZ.',
  'Return one strictly factual, unambiguous multiple-choice question as JSON matching the schema.',
  'Verify all facts, film credits, science, geography, and sports records; if uncertain, pick another verified fact.',
  'Provide 4 distinct plausible options with only 1 correct answer, clear family-friendly English, and progressive point difficulty.',
].join(' ');

const QUESTION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: 'Exact requested category name.',
    },
    points: {
      type: Type.INTEGER,
      description: 'Exact requested point level (100 to 1000).',
    },
    difficulty: {
      type: Type.STRING,
      description: 'Exact calibrated difficulty label.',
    },
    question: {
      type: Type.STRING,
      description: 'Clear, unambiguous trivia question.',
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Four distinct, plausible answer options.',
    },
    correctAnswer: {
      type: Type.STRING,
      description: 'Single correct choice matching one item in options verbatim.',
    },
    explanation: {
      type: Type.STRING,
      description: 'Concise 1-2 sentence factual explanation.',
    },
    questionId: {
      type: Type.STRING,
      description: 'Unique identifier string.',
    },
  },
  propertyOrdering: [
    'category',
    'points',
    'difficulty',
    'question',
    'options',
    'correctAnswer',
    'explanation',
    'questionId',
  ],
  required: [
    'category',
    'points',
    'difficulty',
    'question',
    'options',
    'correctAnswer',
    'explanation',
    'questionId',
  ],
};

const SPINNER_BATCH_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: QUESTION_RESPONSE_SCHEMA,
      description: 'Array of distinct calibrated trivia questions.',
    },
  },
  required: ['questions'],
};

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyGeminiError(err: unknown): {
  status: number;
  errorCode: string;
  message: string;
  retryable: boolean;
} {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const statusMatch = rawMessage.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  const numericStatus = statusMatch ? Number(statusMatch[1]) : 500;
  const upper = rawMessage.toUpperCase();

  if (
    numericStatus === 401 ||
    numericStatus === 403 ||
    upper.includes('API_KEY_INVALID') ||
    upper.includes('PERMISSION_DENIED')
  ) {
    console.warn('[HIMANSHU QUIZ] Upstream AI credentials failed verification.');
    return {
      status: 503,
      errorCode: 'API_KEY_INVALID',
      message:
        'Live AI question generation is temporarily unavailable. Please try Saved Questions or retry shortly.',
      retryable: false,
    };
  }

  if (numericStatus === 429 || upper.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      errorCode: 'RATE_LIMITED',
      message:
        'The AI service is temporarily busy due to request limits. Please wait a moment and try again.',
      retryable: true,
    };
  }

  if (numericStatus === 404 || upper.includes('NOT_FOUND')) {
    return {
      status: 502,
      errorCode: 'MODEL_UNAVAILABLE',
      message:
        'The configured AI question model is currently unavailable. Please try again shortly.',
      retryable: true,
    };
  }

  if (upper.includes('ABORT') || upper.includes('TIMEOUT')) {
    return {
      status: 504,
      errorCode: 'GENERATION_TIMEOUT',
      message:
        'AI question generation took longer than expected. Please press Retry Generation.',
      retryable: true,
    };
  }

  return {
    status: 502,
    errorCode: 'UPSTREAM_ERROR',
    message:
      'Unable to reach the AI question service right now. Please press Generate Question to retry.',
    retryable: true,
  };
}

function selectModelConfig(attempt: number, points: PointLevel): {
  model: string;
  thinkingLevel: ThinkingLevel;
} {
  if (attempt <= 2) {
    return {
      model: FAST_GEMINI_MODEL,
      thinkingLevel: points <= 400 ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
    };
  }
  return {
    model: FALLBACK_GEMINI_MODEL,
    thinkingLevel: ThinkingLevel.LOW,
  };
}

function writeSseEvent(
  res: express.Response,
  eventName: string,
  payload: unknown,
): void {
  if (res.writableEnded) return;
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function validateAiRequestBody(
  body: Record<string, unknown> | undefined,
):
  | {
      ok: true;
      categoryId: CategoryId;
      points: PointLevel;
      recentQuestions: string[];
      apiKey: string;
    }
  | {
      ok: false;
      status: number;
      errorCode: string;
      message: string;
    } {
  const categoryId = body?.categoryId;
  const rawPoints = body?.points;
  const points = typeof rawPoints === 'string' ? Number(rawPoints) : rawPoints;

  if (!isValidCategoryId(categoryId)) {
    return {
      ok: false,
      status: 400,
      errorCode: 'INVALID_CATEGORY',
      message: 'Select a valid quiz category before generating an AI question.',
    };
  }

  if (!isValidPointLevel(points)) {
    return {
      ok: false,
      status: 400,
      errorCode: 'INVALID_POINTS',
      message: 'Select a valid point level (100 to 1000) before generating an AI question.',
    };
  }

  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      errorCode: 'MISSING_CONFIG',
      message:
        'Live AI question generation is not enabled on this deployment yet. Please try Saved Questions or check back shortly.',
    };
  }

  return {
    ok: true,
    categoryId,
    points,
    recentQuestions: sanitizeRecentQuestions(body?.recentQuestions),
    apiKey,
  };
}

async function runSingleStreamAttempt(params: {
  ai: GoogleGenAI;
  categoryId: CategoryId;
  points: PointLevel;
  recentQuestions: string[];
  attempt: number;
  lastRejectionReason?: string;
  externalSignal: AbortSignal;
  onPartial?: (preview: { question?: string; options?: string[] }) => void;
}) {
  const {
    ai,
    categoryId,
    points,
    recentQuestions,
    attempt,
    lastRejectionReason,
    externalSignal,
    onPartial,
  } = params;

  const { model, thinkingLevel } = selectModelConfig(attempt, points);
  const prompt = buildAiQuestionPrompt(
    categoryId,
    points,
    recentQuestions,
    attempt,
    lastRejectionReason,
  );

  const attemptController = new AbortController();
  const timeoutHandle = setTimeout(() => attemptController.abort(), ATTEMPT_TIMEOUT_MS);
  const onExternalAbort = () => attemptController.abort();
  externalSignal.addEventListener('abort', onExternalAbort, { once: true });

  let fullText = '';
  let lastPreviewKey = '';

  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: QUESTION_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel },
        abortSignal: attemptController.signal,
      },
    });

    for await (const chunk of stream) {
      if (attemptController.signal.aborted) {
        break;
      }
      if (chunk.text) {
        fullText += chunk.text;
        if (onPartial) {
          const preview = extractSafeStreamingPreview(fullText);
          if (preview.question || (preview.options && preview.options.length > 0)) {
            const key = `${preview.question ?? ''}|${(preview.options ?? []).join('||')}`;
            if (key !== lastPreviewKey) {
              lastPreviewKey = key;
              onPartial(preview);
            }
          }
        }
      }
    }
  } finally {
    clearTimeout(timeoutHandle);
    externalSignal.removeEventListener('abort', onExternalAbort);
  }

  return parseAndValidateAiQuestion(fullText, categoryId, points, recentQuestions);
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });

  app.use(express.json({ limit: '64kb' }));
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (
        err &&
        typeof err === 'object' &&
        'type' in err &&
        err.type === 'entity.parse.failed'
      ) {
        res.status(400).json({
          errorCode: 'INVALID_JSON',
          message: 'Request body must be valid JSON.',
        });
        return;
      }
      next(err);
    },
  );

  const aiRateLimiter = new SlidingWindowRateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
    burstWindowMs: 5_000,
    burstMaxRequests: 6,
    maxTrackedKeys: 10_000,
  });

  const enforceAiRateLimit: express.RequestHandler = (req, res, next) => {
    const clientIp = extractClientIp({
      expressIp: req.ip,
      forwardedFor: req.headers['x-forwarded-for'],
      remoteAddress: req.socket?.remoteAddress,
    });
    const decision = aiRateLimiter.check(clientIp);
    res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds));
      res.status(429).json({
        errorCode: 'RATE_LIMITED',
        message: `Too many AI question requests in a short time. Please wait ${decision.retryAfterSeconds} seconds and try again.`,
      });
      return;
    }
    next();
  };

  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      aiConfigured: Boolean(getConfiguredApiKey()),
    });
  });

  app.post('/api/ai-question/stream', enforceAiRateLimit, async (req, res) => {
    const validatedReq = validateAiRequestBody(
      req.body as Record<string, unknown> | undefined,
    );

    if (!validatedReq.ok) {
      res.status(validatedReq.status).json({
        errorCode: validatedReq.errorCode,
        message: validatedReq.message,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        clientController.abort();
      }
    });

    const ai = new GoogleGenAI({
      apiKey: validatedReq.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let lastRejectionReason: string | undefined;
    let lastErrorSummary: ReturnType<typeof classifyGeminiError> | null = null;

    writeSseEvent(res, 'status', {
      stage: 'generating',
      message: 'Connecting to fast Gemini question stream...',
    });

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      if (clientController.signal.aborted) {
        res.end();
        return;
      }

      try {
        const result = await runSingleStreamAttempt({
          ai,
          categoryId: validatedReq.categoryId,
          points: validatedReq.points,
          recentQuestions: validatedReq.recentQuestions,
          attempt,
          lastRejectionReason,
          externalSignal: clientController.signal,
          onPartial: (preview) => {
            writeSseEvent(res, 'partial', preview);
          },
        });

        if (result.ok) {
          writeSseEvent(res, 'complete', { question: result.data });
          res.end();
          return;
        }

        lastRejectionReason = result.reason;
      } catch (err) {
        if (clientController.signal.aborted) {
          res.end();
          return;
        }
        const classified = classifyGeminiError(err);
        lastErrorSummary = classified;
        if (!classified.retryable) {
          writeSseEvent(res, 'error', {
            errorCode: classified.errorCode,
            message: classified.message,
          });
          res.end();
          return;
        }
      }

      if (attempt < MAX_GENERATION_ATTEMPTS) {
        writeSseEvent(res, 'status', {
          stage: 'retrying',
          message: 'Refining question format & retrying verification...',
        });
        await sleep(200 * attempt);
      }
    }

    if (lastErrorSummary) {
      writeSseEvent(res, 'error', {
        errorCode: lastErrorSummary.errorCode,
        message: lastErrorSummary.message,
      });
      res.end();
      return;
    }

    writeSseEvent(res, 'error', {
      errorCode: 'VALIDATION_FAILED',
      message:
        'The AI response did not pass quality validation after multiple attempts. Please press Generate Question to try again.',
    });
    res.end();
  });

  app.post('/api/ai-question', enforceAiRateLimit, async (req, res) => {
    const validatedReq = validateAiRequestBody(
      req.body as Record<string, unknown> | undefined,
    );

    if (!validatedReq.ok) {
      res.status(validatedReq.status).json({
        errorCode: validatedReq.errorCode,
        message: validatedReq.message,
      });
      return;
    }

    const clientController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        clientController.abort();
      }
    });

    const ai = new GoogleGenAI({
      apiKey: validatedReq.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let lastRejectionReason: string | undefined;
    let lastErrorSummary: ReturnType<typeof classifyGeminiError> | null = null;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      if (clientController.signal.aborted) return;

      try {
        const result = await runSingleStreamAttempt({
          ai,
          categoryId: validatedReq.categoryId,
          points: validatedReq.points,
          recentQuestions: validatedReq.recentQuestions,
          attempt,
          lastRejectionReason,
          externalSignal: clientController.signal,
        });

        if (result.ok) {
          res.json({ question: result.data });
          return;
        }

        lastRejectionReason = result.reason;
      } catch (err) {
        if (clientController.signal.aborted) return;
        const classified = classifyGeminiError(err);
        lastErrorSummary = classified;
        if (!classified.retryable) {
          res.status(classified.status).json({
            errorCode: classified.errorCode,
            message: classified.message,
          });
          return;
        }
      }

      if (attempt < MAX_GENERATION_ATTEMPTS) {
        await sleep(200 * attempt);
      }
    }

    if (lastErrorSummary) {
      res.status(lastErrorSummary.status).json({
        errorCode: lastErrorSummary.errorCode,
        message: lastErrorSummary.message,
      });
      return;
    }

    res.status(502).json({
      errorCode: 'VALIDATION_FAILED',
      message:
        'The AI response did not pass quality validation after multiple attempts. Please press Generate Question to try again.',
    });
  });

  app.post('/api/spinner-questions', enforceAiRateLimit, async (req, res) => {
    const validatedReq = validateAiRequestBody(
      req.body as Record<string, unknown> | undefined,
    );

    if (!validatedReq.ok) {
      res.status(validatedReq.status).json({
        errorCode: validatedReq.errorCode,
        message: validatedReq.message,
      });
      return;
    }

    const countNeeded = sanitizeSpinnerCount(
      (req.body as Record<string, unknown> | undefined)?.count,
    );

    const clientController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        clientController.abort();
      }
    });

    const ai = new GoogleGenAI({
      apiKey: validatedReq.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let lastRejectionReason: string | undefined;
    let lastErrorSummary: ReturnType<typeof classifyGeminiError> | null = null;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      if (clientController.signal.aborted) return;

      const { model, thinkingLevel } = selectModelConfig(attempt, validatedReq.points);
      const prompt = buildSpinnerBatchPrompt(
        validatedReq.categoryId,
        validatedReq.points,
        countNeeded,
        validatedReq.recentQuestions,
        attempt,
        lastRejectionReason,
      );

      const attemptController = new AbortController();
      const timeoutHandle = setTimeout(() => attemptController.abort(), 24000);
      const onExternalAbort = () => attemptController.abort();
      clientController.signal.addEventListener('abort', onExternalAbort);

      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: SPINNER_BATCH_RESPONSE_SCHEMA,
            thinkingConfig: { thinkingLevel },
            temperature: attempt === 1 ? 0.65 : 0.45,
            abortSignal: attemptController.signal,
          },
        });

        const validation = parseAndValidateSpinnerBatch(
          response.text,
          validatedReq.categoryId,
          validatedReq.points,
          countNeeded,
          validatedReq.recentQuestions,
        );

        if (validation.ok) {
          res.json({ questions: validation.data });
          return;
        }

        lastRejectionReason = validation.reason;
      } catch (err) {
        if (clientController.signal.aborted) return;
        const classified = classifyGeminiError(err);
        lastErrorSummary = classified;
        if (!classified.retryable) {
          res.status(classified.status).json({
            errorCode: classified.errorCode,
            message: classified.message,
          });
          return;
        }
      } finally {
        clearTimeout(timeoutHandle);
        clientController.signal.removeEventListener('abort', onExternalAbort);
      }

      if (attempt < MAX_GENERATION_ATTEMPTS) {
        await sleep(200 * attempt);
      }
    }

    if (lastErrorSummary) {
      res.status(lastErrorSummary.status).json({
        errorCode: lastErrorSummary.errorCode,
        message: lastErrorSummary.message,
      });
      return;
    }

    res.status(502).json({
      errorCode: 'VALIDATION_FAILED',
      message:
        'Unable to prepare six unique spinner questions after multiple attempts. Please retry round preparation.',
    });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({
      errorCode: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const distAssetsDir = path.join(distDir, 'assets');
    app.use(
      '/assets',
      express.static(distAssetsDir, {
        maxAge: '1y',
        immutable: true,
        fallthrough: true,
      }),
    );
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: '1h',
      }),
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`HIMANSHU QUIZ server running on port ${PORT}`);
  });

  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer().catch((err) => {
  console.error(
    'Failed to start HIMANSHU QUIZ server:',
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
