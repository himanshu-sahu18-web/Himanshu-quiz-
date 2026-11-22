import type { CategoryId, PointLevel } from '../types/quiz';

export interface AiDifficultySpec {
  points: PointLevel;
  label: string;
  acceptedLabels: readonly string[];
  guidance: string;
}

export const AI_CATEGORY_LABELS: Record<CategoryId, string> = {
  geography: 'Geography',
  bollywood: 'Bollywood',
  science: 'Science',
  'general-knowledge': 'General Knowledge',
  'sports-games': 'Sports & Games',
};

export const AI_DIFFICULTY_MAP: Record<PointLevel, AiDifficultySpec> = {
  100: {
    points: 100,
    label: 'Very Easy',
    acceptedLabels: ['very easy', 'easy'],
    guidance: 'Simple, familiar, and basic factual questions known to a broad audience.',
  },
  200: {
    points: 200,
    label: 'Easy',
    acceptedLabels: ['easy', 'very easy'],
    guidance: 'Common knowledge requiring basic understanding of the category.',
  },
  300: {
    points: 300,
    label: 'Easy to Moderate',
    acceptedLabels: ['easy to moderate', 'moderate', 'easy'],
    guidance: 'Questions requiring some specific, recognizable subject knowledge.',
  },
  400: {
    points: 400,
    label: 'Moderate',
    acceptedLabels: ['moderate', 'easy to moderate'],
    guidance: 'Questions requiring reasonable subject knowledge beyond trivia basics.',
  },
  500: {
    points: 500,
    label: 'Moderate to Challenging',
    acceptedLabels: ['moderate to challenging', 'moderate', 'challenging'],
    guidance: 'Less obvious facts and conceptual understanding within the subject.',
  },
  600: {
    points: 600,
    label: 'Challenging',
    acceptedLabels: ['challenging', 'moderate to challenging', 'difficult'],
    guidance: 'Questions requiring deeper subject knowledge and careful reasoning.',
  },
  700: {
    points: 700,
    label: 'Difficult',
    acceptedLabels: ['difficult', 'challenging', 'very difficult'],
    guidance: 'Specialized facts and more detailed domain understanding.',
  },
  800: {
    points: 800,
    label: 'Very Difficult',
    acceptedLabels: ['very difficult', 'difficult', 'expert'],
    guidance: 'Questions requiring advanced subject knowledge without resorting to obscure wording.',
  },
  900: {
    points: 900,
    label: 'Expert',
    acceptedLabels: ['expert', 'very difficult', 'master level'],
    guidance: 'Uncommon yet strictly verifiable expert-level subject knowledge.',
  },
  1000: {
    points: 1000,
    label: 'Master Level',
    acceptedLabels: ['master level', 'master', 'expert'],
    guidance: 'Extremely challenging questions requiring substantial mastery of the domain.',
  },
};

export interface AiGeneratedQuestionPayload {
  category: string;
  points: PointLevel;
  difficulty: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  questionId: string;
}

export type ValidationResult =
  | { ok: true; data: AiGeneratedQuestionPayload }
  | { ok: false; reason: string };

const VALID_CATEGORY_IDS = new Set<string>(Object.keys(AI_CATEGORY_LABELS));
const VALID_POINT_VALUES = new Set<number>(Object.keys(AI_DIFFICULTY_MAP).map(Number));

export function isValidCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && VALID_CATEGORY_IDS.has(value);
}

export function isValidPointLevel(value: unknown): value is PointLevel {
  return typeof value === 'number' && Number.isInteger(value) && VALID_POINT_VALUES.has(value);
}

export function getAiCategoryName(categoryId: CategoryId): string {
  return AI_CATEGORY_LABELS[categoryId];
}

export function getAiDifficultySpec(points: PointLevel): AiDifficultySpec {
  return AI_DIFFICULTY_MAP[points];
}

export function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDuplicateQuestion(
  candidateQuestion: string,
  recentQuestions: readonly string[],
): boolean {
  const normalizedCandidate = normalizeTextForComparison(candidateQuestion);
  if (!normalizedCandidate) return false;

  for (const prev of recentQuestions) {
    const normalizedPrev = normalizeTextForComparison(prev);
    if (!normalizedPrev) continue;
    if (normalizedCandidate === normalizedPrev) {
      return true;
    }
  }
  return false;
}

export function sanitizeRecentQuestions(rawList: unknown): string[] {
  if (!Array.isArray(rawList)) return [];
  const cleaned: string[] = [];
  for (const item of rawList) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().slice(0, 280);
    if (trimmed.length >= 6) {
      cleaned.push(trimmed);
    }
    if (cleaned.length >= 30) break;
  }
  return cleaned;
}

export function stripMarkdownCodeFences(rawText: string): string {
  const trimmed = rawText.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

export function validateAiQuestionPayload(
  raw: unknown,
  expectedCategoryId: CategoryId,
  expectedPoints: PointLevel,
  recentQuestions: readonly string[] = [],
): ValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'AI response must be a JSON object.' };
  }

  const record = raw as Record<string, unknown>;
  const expectedCategoryName = getAiCategoryName(expectedCategoryId);
  const difficultySpec = getAiDifficultySpec(expectedPoints);

  // 1. Category check
  if (typeof record.category !== 'string' || !record.category.trim()) {
    return { ok: false, reason: 'Missing category field in AI response.' };
  }
  if (
    normalizeTextForComparison(record.category) !==
    normalizeTextForComparison(expectedCategoryName)
  ) {
    return {
      ok: false,
      reason: `Category mismatch: expected "${expectedCategoryName}", received "${record.category}".`,
    };
  }

  // 2. Points check
  const parsedPoints =
    typeof record.points === 'string' ? Number(record.points) : record.points;
  if (parsedPoints !== expectedPoints) {
    return {
      ok: false,
      reason: `Point value mismatch: expected ${expectedPoints}, received ${String(record.points)}.`,
    };
  }

  // 3. Question and explanation non-empty check
  if (typeof record.question !== 'string' || record.question.trim().length < 10) {
    return { ok: false, reason: 'Question text is empty or too short.' };
  }
  const cleanQuestion = record.question.trim();

  if (typeof record.explanation !== 'string' || record.explanation.trim().length < 8) {
    return { ok: false, reason: 'Explanation text is empty or too short.' };
  }
  const cleanExplanation = record.explanation.trim();

  // 4. Duplicate check
  if (isDuplicateQuestion(cleanQuestion, recentQuestions)) {
    return { ok: false, reason: 'Generated question duplicates a recent session question.' };
  }

  // 5. Options array check (4 distinct non-empty strings)
  if (!Array.isArray(record.options) || record.options.length !== 4) {
    return { ok: false, reason: 'Options must contain exactly 4 choices.' };
  }
  const cleanOptions: string[] = [];
  const seenOptions = new Set<string>();
  for (const opt of record.options) {
    if (typeof opt !== 'string' || !opt.trim()) {
      return { ok: false, reason: 'All 4 answer options must be non-empty strings.' };
    }
    const trimmedOpt = opt.trim();
    const dedupeKey = trimmedOpt.toLowerCase();
    if (seenOptions.has(dedupeKey)) {
      return { ok: false, reason: 'All 4 answer options must be distinct.' };
    }
    seenOptions.add(dedupeKey);
    cleanOptions.push(trimmedOpt);
  }

  // 6. Correct answer matches one of the 4 options
  if (typeof record.correctAnswer !== 'string' || !record.correctAnswer.trim()) {
    return { ok: false, reason: 'Missing correctAnswer field.' };
  }
  const trimmedCorrect = record.correctAnswer.trim();
  const matchedOption = cleanOptions.find(
    (opt) => opt.toLowerCase() === trimmedCorrect.toLowerCase(),
  );
  if (!matchedOption) {
    return {
      ok: false,
      reason: 'correctAnswer does not match any of the 4 options.',
    };
  }

  // 7. Difficulty label check
  if (typeof record.difficulty !== 'string' || !record.difficulty.trim()) {
    return { ok: false, reason: 'Missing difficulty label.' };
  }
  const normalizedDifficulty = normalizeTextForComparison(record.difficulty);
  if (!difficultySpec.acceptedLabels.includes(normalizedDifficulty)) {
    return {
      ok: false,
      reason: `Difficulty label "${record.difficulty}" is not calibrated for ${expectedPoints} points.`,
    };
  }

  const questionId =
    typeof record.questionId === 'string' && record.questionId.trim().length >= 4
      ? record.questionId.trim()
      : `ai-${expectedCategoryId}-${expectedPoints}-${Date.now().toString(36)}`;

  return {
    ok: true,
    data: {
      category: expectedCategoryName,
      points: expectedPoints,
      difficulty: difficultySpec.label,
      question: cleanQuestion,
      options: [cleanOptions[0], cleanOptions[1], cleanOptions[2], cleanOptions[3]],
      correctAnswer: matchedOption,
      explanation: cleanExplanation,
      questionId,
    },
  };
}

export function parseAndValidateAiQuestion(
  rawText: string | undefined | null,
  expectedCategoryId: CategoryId,
  expectedPoints: PointLevel,
  recentQuestions: readonly string[] = [],
): ValidationResult {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return { ok: false, reason: 'Empty response from AI model.' };
  }

  const cleaned = stripMarkdownCodeFences(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: 'AI response was not valid JSON.' };
  }

  return validateAiQuestionPayload(
    parsed,
    expectedCategoryId,
    expectedPoints,
    recentQuestions,
  );
}

export function buildAiQuestionPrompt(
  categoryId: CategoryId,
  points: PointLevel,
  recentQuestions: readonly string[],
  attemptNumber: number,
  previousRejectionReason?: string,
): string {
  const categoryName = getAiCategoryName(categoryId);
  const difficultySpec = getAiDifficultySpec(points);

  const lines: string[] = [
    `Create 1 accurate trivia question: Category="${categoryName}", Points=${points}, Difficulty="${difficultySpec.label}" (${difficultySpec.guidance}).`,
    `Rules: 4 distinct plausible options, 1 unambiguously correctAnswer matching an option verbatim, concise 1-2 sentence explanation, unique questionId. Never use the Australia/Canberra example.`,
    `Variation=${attemptNumber}-${Date.now().toString(36)}.`,
  ];

  const promptAvoidList = recentQuestions.slice(-12);
  if (promptAvoidList.length > 0) {
    lines.push(
      `Do not repeat: ${promptAvoidList.map((q) => `"${q.slice(0, 110)}"`).join(' | ')}`,
    );
  }

  if (previousRejectionReason) {
    lines.push(`Fix previous issue: ${previousRejectionReason}`);
  }

  return lines.join('\n');
}

export interface SafeStreamingPreview {
  question?: string;
  options?: string[];
}

function unescapePartialJsonString(raw: string): string {
  return raw
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
}

export function extractSafeStreamingPreview(buffer: string): SafeStreamingPreview {
  const preview: SafeStreamingPreview = {};

  // Extract partial or complete "question" string value safely
  const qMatch = buffer.match(/"question"\s*:\s*"((?:\\.|[^"\\])*)/);
  if (qMatch && qMatch[1]) {
    const cleanQ = unescapePartialJsonString(qMatch[1]).trim();
    if (cleanQ.length >= 4) {
      preview.question = cleanQ;
    }
  }

  // Extract only completed strings inside "options": [ ... ] — never touch correctAnswer or explanation
  const optStartMatch = buffer.match(/"options"\s*:\s*\[/);
  if (optStartMatch && optStartMatch.index !== undefined) {
    const afterArrayStart = buffer.slice(optStartMatch.index + optStartMatch[0].length);
    const closedArrayEnd = afterArrayStart.indexOf(']');
    const sliceToScan =
      closedArrayEnd >= 0 ? afterArrayStart.slice(0, closedArrayEnd) : afterArrayStart;

    const extractedOpts: string[] = [];
    const itemRegex = /"((?:\\.|[^"\\])*)"/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(sliceToScan)) !== null) {
      const cleanOpt = unescapePartialJsonString(match[1]).trim();
      if (cleanOpt) {
        extractedOpts.push(cleanOpt);
      }
      if (extractedOpts.length >= 4) break;
    }
    if (extractedOpts.length > 0) {
      preview.options = extractedOpts;
    }
  }

  return preview;
}
