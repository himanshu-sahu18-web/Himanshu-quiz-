import type { CategoryId, PointLevel, SavedQuestion } from '../types/quiz';
import {
  getAiCategoryName,
  getAiDifficultySpec,
  isDuplicateQuestion,
  normalizeTextForComparison,
  stripMarkdownCodeFences,
  validateAiQuestionPayload,
  type AiGeneratedQuestionPayload,
} from './aiQuestionLogic.ts';

export const SPINNER_QUESTION_COUNT = 6;

export interface SpinnerQuestionItem {
  questionId: string;
  category: string;
  points: PointLevel;
  difficulty: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  source: 'saved' | 'ai';
}

export type SpinnerBatchValidationResult =
  | { ok: true; data: AiGeneratedQuestionPayload[] }
  | { ok: false; reason: string };

export function sanitizeSpinnerCount(rawCount: unknown): number {
  const numeric = typeof rawCount === 'string' ? Number(rawCount) : rawCount;
  if (typeof numeric !== 'number' || !Number.isInteger(numeric)) {
    return SPINNER_QUESTION_COUNT;
  }
  return Math.max(1, Math.min(SPINNER_QUESTION_COUNT, numeric));
}

export function buildSpinnerBatchPrompt(
  categoryId: CategoryId,
  points: PointLevel,
  countNeeded: number,
  avoidQuestions: readonly string[],
  attemptNumber: number,
  previousRejectionReason?: string,
): string {
  const categoryName = getAiCategoryName(categoryId);
  const difficultySpec = getAiDifficultySpec(points);

  const lines: string[] = [
    `Create ${countNeeded} completely DIFFERENT, strictly factual trivia questions as a JSON object {"questions":[...]}.`,
    `Mandatory inputs for EVERY question: Category="${categoryName}", Points=${points}, Difficulty="${difficultySpec.label}" (${difficultySpec.guidance}).`,
    `Target audience: Standard 11th (Std. 11) students (ages 16-17). Keep wording clear, natural, and unambiguous. Never use graduate-level or specialist competitive-exam trivia; for 900-1000 points, test lesser-known but verifiable general facts with clean phrasing.`,
    `Rules for EACH item: 4 distinct plausible options, 1 unambiguously correctAnswer matching an option verbatim, concise 1-2 sentence explanation, unique questionId. All ${countNeeded} questions must cover distinct topics/answers with zero duplicates.`,
    `Variation=${attemptNumber}-${Date.now().toString(36)}.`,
  ];

  const promptAvoidList = avoidQuestions.slice(-18);
  if (promptAvoidList.length > 0) {
    lines.push(
      `Do NOT repeat or closely paraphrase any of these: ${promptAvoidList
        .map((q) => `"${q.slice(0, 100)}"`)
        .join(' | ')}`,
    );
  }

  if (previousRejectionReason) {
    lines.push(`Fix previous validation issue: ${previousRejectionReason}`);
  }

  return lines.join('\n');
}

export function parseAndValidateSpinnerBatch(
  rawText: string | undefined | null,
  expectedCategoryId: CategoryId,
  expectedPoints: PointLevel,
  expectedCount: number,
  avoidQuestions: readonly string[] = [],
): SpinnerBatchValidationResult {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return { ok: false, reason: 'Empty response from AI model.' };
  }

  const cleaned = stripMarkdownCodeFences(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: 'AI batch response was not valid JSON.' };
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions)
      ? (parsed as { questions: unknown[] }).questions
      : null;

  if (!rawList || rawList.length < expectedCount) {
    return {
      ok: false,
      reason: `Expected ${expectedCount} questions in batch, received ${rawList ? rawList.length : 0}.`,
    };
  }

  const validated: AiGeneratedQuestionPayload[] = [];
  const combinedAvoid = [...avoidQuestions];

  for (let i = 0; i < rawList.length && validated.length < expectedCount; i += 1) {
    const check = validateAiQuestionPayload(
      rawList[i],
      expectedCategoryId,
      expectedPoints,
      combinedAvoid,
    );
    if (!check.ok) {
      return {
        ok: false,
        reason: `Item ${i + 1} invalid: ${check.reason}`,
      };
    }
    combinedAvoid.push(check.data.question);
    validated.push({
      ...check.data,
      questionId: `${check.data.questionId}-s${i + 1}`,
    });
  }

  if (validated.length !== expectedCount) {
    return {
      ok: false,
      reason: `Only ${validated.length} of ${expectedCount} unique valid questions were produced.`,
    };
  }

  return { ok: true, data: validated };
}

export function shuffleItems<T>(
  items: readonly T[],
  randomFn: () => number = Math.random,
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const rand = Math.min(0.999999, Math.max(0, randomFn()));
    const j = Math.floor(rand * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function pickUnusedSavedQuestions(
  savedForSetup: readonly SavedQuestion[],
  usedQuestionIds: ReadonlySet<string>,
  avoidQuestionTexts: readonly string[],
  maxCount = SPINNER_QUESTION_COUNT,
  randomFn: () => number = Math.random,
): SavedQuestion[] {
  const eligible = savedForSetup.filter(
    (item) =>
      !usedQuestionIds.has(item.questionId) &&
      !isDuplicateQuestion(item.question, avoidQuestionTexts),
  );
  return shuffleItems(eligible, randomFn).slice(0, maxCount);
}

export function assembleSpinnerRoundQuestions(
  savedItems: readonly SavedQuestion[],
  aiItems: readonly AiGeneratedQuestionPayload[],
  randomFn: () => number = Math.random,
): SpinnerQuestionItem[] {
  const seenNormalized = new Set<string>();
  const combined: SpinnerQuestionItem[] = [];

  for (const saved of savedItems) {
    const key = normalizeTextForComparison(saved.question);
    if (!key || seenNormalized.has(key)) continue;
    seenNormalized.add(key);
    combined.push({
      questionId: saved.questionId,
      category: saved.category,
      points: saved.points,
      difficulty: saved.difficulty,
      question: saved.question,
      options: [...saved.options] as [string, string, string, string],
      correctAnswer: saved.correctAnswer,
      explanation: saved.explanation,
      source: 'saved',
    });
  }

  for (const ai of aiItems) {
    const key = normalizeTextForComparison(ai.question);
    if (!key || seenNormalized.has(key)) continue;
    seenNormalized.add(key);
    combined.push({
      questionId: ai.questionId,
      category: ai.category,
      points: ai.points,
      difficulty: ai.difficulty,
      question: ai.question,
      options: [...ai.options] as [string, string, string, string],
      correctAnswer: ai.correctAnswer,
      explanation: ai.explanation,
      source: 'ai',
    });
  }

  return shuffleItems(combined, randomFn).slice(0, SPINNER_QUESTION_COUNT);
}

export function pickFairRandomUnit(): number {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}
