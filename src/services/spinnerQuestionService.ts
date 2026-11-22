import { getSavedQuestionsFor } from '../data/savedQuestionBank';
import type { CategoryId, PointLevel } from '../types/quiz';
import {
  SPINNER_QUESTION_COUNT,
  assembleSpinnerRoundQuestions,
  pickUnusedSavedQuestions,
  type SpinnerQuestionItem,
} from '../utils/spinnerQuestionLogic';
import type { AiGeneratedQuestionPayload } from '../utils/aiQuestionLogic';

export class SpinnerQuestionRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SpinnerQuestionRequestError';
    this.code = code;
  }
}

export interface PrepareSpinnerRoundParams {
  categoryId: CategoryId;
  points: PointLevel;
  usedQuestionIds: ReadonlySet<string>;
  usedQuestionTexts: readonly string[];
  signal?: AbortSignal;
}

const CLIENT_SPINNER_TIMEOUT_MS = 32000;

export async function prepareSpinnerRoundQuestions({
  categoryId,
  points,
  usedQuestionIds,
  usedQuestionTexts,
  signal,
}: PrepareSpinnerRoundParams): Promise<SpinnerQuestionItem[]> {
  const savedPool = getSavedQuestionsFor(categoryId, points);
  const unusedSaved = pickUnusedSavedQuestions(
    savedPool,
    usedQuestionIds,
    usedQuestionTexts,
    SPINNER_QUESTION_COUNT,
  );

  const countNeeded = SPINNER_QUESTION_COUNT - unusedSaved.length;
  if (countNeeded <= 0) {
    return assembleSpinnerRoundQuestions(unusedSaved, []);
  }

  const avoidForAi = [
    ...usedQuestionTexts,
    ...unusedSaved.map((q) => q.question),
  ];

  const requestController = new AbortController();
  const timeoutHandle = window.setTimeout(
    () => requestController.abort(),
    CLIENT_SPINNER_TIMEOUT_MS,
  );
  const handleExternalAbort = () => requestController.abort();
  signal?.addEventListener('abort', handleExternalAbort);

  let response: Response;
  try {
    response = await fetch('/api/spinner-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        points,
        count: countNeeded,
        recentQuestions: avoidForAi,
      }),
      signal: requestController.signal,
    });
  } catch (err) {
    window.clearTimeout(timeoutHandle);
    signal?.removeEventListener('abort', handleExternalAbort);
    if (err instanceof Error && err.name === 'AbortError') {
      if (signal?.aborted) {
        throw err;
      }
      throw new SpinnerQuestionRequestError(
        'TIMEOUT',
        'Preparing six fresh questions took longer than expected. Please press Retry Round.',
      );
    }
    throw new SpinnerQuestionRequestError(
      'NETWORK_ERROR',
      'Unable to reach the question server right now. Check your connection and try again.',
    );
  } finally {
    window.clearTimeout(timeoutHandle);
    signal?.removeEventListener('abort', handleExternalAbort);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SpinnerQuestionRequestError(
      'INVALID_RESPONSE',
      'Received an unexpected response while preparing the spinner round.',
    );
  }

  if (!response.ok) {
    const errRecord = payload as { errorCode?: unknown; message?: unknown } | null;
    const code =
      typeof errRecord?.errorCode === 'string' ? errRecord.errorCode : 'SERVER_ERROR';
    const message =
      typeof errRecord?.message === 'string'
        ? errRecord.message
        : 'Unable to prepare six spinner questions right now.';
    throw new SpinnerQuestionRequestError(code, message);
  }

  const aiQuestions = (payload as { questions?: AiGeneratedQuestionPayload[] })?.questions;
  if (!Array.isArray(aiQuestions) || aiQuestions.length < countNeeded) {
    throw new SpinnerQuestionRequestError(
      'INCOMPLETE_BATCH',
      'Could not assemble six distinct questions for this round. Please press Retry Round.',
    );
  }

  const assembled = assembleSpinnerRoundQuestions(unusedSaved, aiQuestions);
  if (assembled.length !== SPINNER_QUESTION_COUNT) {
    throw new SpinnerQuestionRequestError(
      'DUPLICATE_DETECTED',
      'Duplicate question filtered during round setup. Please press Retry Round.',
    );
  }

  return assembled;
}
