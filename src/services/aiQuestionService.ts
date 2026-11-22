import type {
  AiGeneratedQuestion,
  CategoryId,
  PointLevel,
} from '../types/quiz';
import {
  type SafeStreamingPreview,
  validateAiQuestionPayload,
} from '../utils/aiQuestionLogic';

export class AiQuestionRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = 'AiQuestionRequestError';
    this.code = code;
    this.status = status;
  }
}

export interface GenerateAiQuestionParams {
  categoryId: CategoryId;
  points: PointLevel;
  recentQuestions: readonly string[];
  signal?: AbortSignal;
  onPartial?: (preview: SafeStreamingPreview) => void;
  onStatus?: (message: string) => void;
}

const CLIENT_REQUEST_TIMEOUT_MS = 25000;

function parseSseBlock(rawBlock: string): { event: string; data: string } | null {
  const lines = rawBlock.split('\n');
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return null;
  return { event: eventName, data: dataLines.join('\n') };
}

export async function generateAiQuestion({
  categoryId,
  points,
  recentQuestions,
  signal,
  onPartial,
  onStatus,
}: GenerateAiQuestionParams): Promise<AiGeneratedQuestion> {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(
    () => timeoutController.abort(),
    CLIENT_REQUEST_TIMEOUT_MS,
  );

  const onExternalAbort = () => timeoutController.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  let response: Response;
  try {
    response = await fetch('/api/ai-question/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        categoryId,
        points,
        recentQuestions,
      }),
      signal: timeoutController.signal,
    });
  } catch (err) {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);

    if (err instanceof Error && err.name === 'AbortError') {
      if (signal?.aborted) {
        throw err;
      }
      throw new AiQuestionRequestError(
        'CLIENT_TIMEOUT',
        'The request timed out while waiting for an AI question. Please try again.',
        504,
      );
    }

    throw new AiQuestionRequestError(
      'NETWORK_ERROR',
      'Could not connect to the quiz server. Check your connection and try again.',
      0,
    );
  }

  try {
    const contentType = response.headers.get('content-type') ?? '';

    // Handle standard JSON responses (400/503 validation/config errors or non-SSE responses)
    if (!contentType.includes('text/event-stream')) {
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new AiQuestionRequestError(
          'INVALID_SERVER_RESPONSE',
          'Received an unexpected response from the quiz server. Please try again.',
          response.status,
        );
      }

      if (!response.ok) {
        const errRecord = (data && typeof data === 'object' ? data : {}) as Record<
          string,
          unknown
        >;
        const code =
          typeof errRecord.errorCode === 'string'
            ? errRecord.errorCode
            : 'GENERATION_FAILED';
        const message =
          typeof errRecord.message === 'string'
            ? errRecord.message
            : 'AI question generation failed. Please try again.';
        throw new AiQuestionRequestError(code, message, response.status);
      }

      const questionRaw =
        data && typeof data === 'object'
          ? (data as Record<string, unknown>).question
          : null;
      const validated = validateAiQuestionPayload(
        questionRaw,
        categoryId,
        points,
        recentQuestions,
      );
      if (!validated.ok) {
        throw new AiQuestionRequestError(
          'CLIENT_VALIDATION_FAILED',
          'The generated question failed format verification. Please try again.',
          502,
        );
      }
      return validated.data;
    }

    // Stream SSE chunks cleanly
    const reader = response.body?.getReader();
    if (!reader) {
      throw new AiQuestionRequestError(
        'STREAM_UNSUPPORTED',
        'Streaming connection could not be initialized. Please try again.',
        500,
      );
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      let separatorIdx = buffer.indexOf('\n\n');
      while (separatorIdx !== -1) {
        const rawBlock = buffer.slice(0, separatorIdx).trim();
        buffer = buffer.slice(separatorIdx + 2);

        if (rawBlock) {
          const parsedBlock = parseSseBlock(rawBlock);
          if (parsedBlock) {
            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(parsedBlock.data) as Record<string, unknown>;
            } catch {
              payload = {};
            }

            if (parsedBlock.event === 'status' && typeof payload.message === 'string') {
              onStatus?.(payload.message);
            } else if (parsedBlock.event === 'partial') {
              onPartial?.({
                question:
                  typeof payload.question === 'string' ? payload.question : undefined,
                options: Array.isArray(payload.options)
                  ? payload.options.filter((x): x is string => typeof x === 'string')
                  : undefined,
              });
            } else if (parsedBlock.event === 'error') {
              const code =
                typeof payload.errorCode === 'string'
                  ? payload.errorCode
                  : 'GENERATION_FAILED';
              const message =
                typeof payload.message === 'string'
                  ? payload.message
                  : 'AI question generation failed. Please try again.';
              throw new AiQuestionRequestError(code, message, 502);
            } else if (parsedBlock.event === 'complete') {
              const validated = validateAiQuestionPayload(
                payload.question,
                categoryId,
                points,
                recentQuestions,
              );
              if (!validated.ok) {
                throw new AiQuestionRequestError(
                  'CLIENT_VALIDATION_FAILED',
                  'The generated question failed format verification. Please try again.',
                  502,
                );
              }
              return validated.data;
            }
          }
        }

        separatorIdx = buffer.indexOf('\n\n');
      }

      if (done) {
        break;
      }
    }

    throw new AiQuestionRequestError(
      'STREAM_INCOMPLETE',
      'The AI stream ended before question verification completed. Please try again.',
      502,
    );
  } catch (err) {
    if (err instanceof AiQuestionRequestError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      if (signal?.aborted) {
        throw err;
      }
      throw new AiQuestionRequestError(
        'CLIENT_TIMEOUT',
        'The request timed out while waiting for an AI question. Please try again.',
        504,
      );
    }
    throw new AiQuestionRequestError(
      'NETWORK_ERROR',
      'Connection interrupted while receiving the AI question. Please try again.',
      500,
    );
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
