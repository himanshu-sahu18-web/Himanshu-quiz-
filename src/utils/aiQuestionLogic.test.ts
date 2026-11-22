import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_DIFFICULTY_MAP,
  buildAiQuestionPrompt,
  extractSafeStreamingPreview,
  getAiCategoryName,
  getAiDifficultySpec,
  isDuplicateQuestion,
  isValidCategoryId,
  isValidPointLevel,
  parseAndValidateAiQuestion,
  sanitizeRecentQuestions,
  validateAiQuestionPayload,
} from './aiQuestionLogic.ts';
import type { CategoryId, PointLevel } from '../types/quiz.ts';

const ALL_CATEGORIES: readonly CategoryId[] = [
  'geography',
  'bollywood',
  'science',
  'general-knowledge',
  'sports-games',
];

const ALL_POINTS: readonly PointLevel[] = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
];

test('difficulty calibration defines all 10 progressive levels from 100 to 1000', () => {
  assert.equal(Object.keys(AI_DIFFICULTY_MAP).length, 10);
  assert.equal(getAiDifficultySpec(100).label, 'Very Easy');
  assert.equal(getAiDifficultySpec(200).label, 'Easy');
  assert.equal(getAiDifficultySpec(300).label, 'Easy to Moderate');
  assert.equal(getAiDifficultySpec(400).label, 'Moderate');
  assert.equal(getAiDifficultySpec(500).label, 'Moderate to Challenging');
  assert.equal(getAiDifficultySpec(600).label, 'Challenging');
  assert.equal(getAiDifficultySpec(700).label, 'Difficult');
  assert.equal(getAiDifficultySpec(800).label, 'Very Difficult');
  assert.equal(getAiDifficultySpec(900).label, 'Expert');
  assert.equal(getAiDifficultySpec(1000).label, 'Master Level');
});

test('category and point validators accept only supported values', () => {
  for (const cat of ALL_CATEGORIES) {
    assert.equal(isValidCategoryId(cat), true);
  }
  assert.equal(isValidCategoryId('music'), false);
  assert.equal(isValidCategoryId(null), false);

  for (const pts of ALL_POINTS) {
    assert.equal(isValidPointLevel(pts), true);
  }
  assert.equal(isValidPointLevel(150), false);
  assert.equal(isValidPointLevel('100'), false);
});

test('validateAiQuestionPayload accepts valid payloads for test combinations', () => {
  const combinations: Array<[CategoryId, PointLevel]> = [
    ['geography', 100],
    ['science', 500],
    ['bollywood', 700],
    ['general-knowledge', 300],
    ['sports-games', 1000],
  ];

  for (const [catId, points] of combinations) {
    const spec = getAiDifficultySpec(points);
    const catName = getAiCategoryName(catId);
    const result = validateAiQuestionPayload(
      {
        category: catName,
        points,
        difficulty: spec.label,
        question: `Sample verified ${catName} question calibrated for ${points} points?`,
        options: ['Alpha Choice', 'Beta Choice', 'Gamma Choice', 'Delta Choice'],
        correctAnswer: 'Beta Choice',
        explanation: 'Beta Choice is verified by standard competition reference sources.',
        questionId: `q-${catId}-${points}`,
      },
      catId,
      points,
    );

    assert.equal(result.ok, true, `Expected valid result for ${catId} + ${points}`);
    if (result.ok) {
      assert.equal(result.data.category, catName);
      assert.equal(result.data.points, points);
      assert.equal(result.data.difficulty, spec.label);
      assert.equal(result.data.options.length, 4);
    }
  }
});

test('parseAndValidateAiQuestion handles fenced JSON and rejects invalid JSON', () => {
  const fenced = [
    '```json',
    JSON.stringify({
      category: 'Science',
      points: 500,
      difficulty: 'Moderate to Challenging',
      question: 'Which subatomic particle carries no net electric charge inside an atomic nucleus?',
      options: ['Proton', 'Neutron', 'Electron', 'Positron'],
      correctAnswer: 'Neutron',
      explanation: 'A neutron has zero net electric charge, unlike protons (+1) and electrons (-1).',
      questionId: 'sci-500-1',
    }),
    '```',
  ].join('\n');

  const valid = parseAndValidateAiQuestion(fenced, 'science', 500);
  assert.equal(valid.ok, true);

  const invalidJson = parseAndValidateAiQuestion('{not valid json', 'science', 500);
  assert.equal(invalidJson.ok, false);
  if (!invalidJson.ok) {
    assert.match(invalidJson.reason, /valid JSON/i);
  }
});

test('validateAiQuestionPayload rejects mismatched category, points, duplicate options, missing answer, and empty text', () => {
  const base = {
    category: 'Science',
    points: 500,
    difficulty: 'Moderate to Challenging',
    question: 'Which organelle synthesizes ATP through oxidative phosphorylation?',
    options: ['Mitochondrion', 'Ribosome', 'Golgi apparatus', 'Lysosome'],
    correctAnswer: 'Mitochondrion',
    explanation: 'Mitochondria generate cellular ATP via aerobic respiration.',
    questionId: 'sci-500-2',
  };

  assert.equal(
    validateAiQuestionPayload({ ...base, category: 'Geography' }, 'science', 500).ok,
    false,
  );
  assert.equal(
    validateAiQuestionPayload({ ...base, points: 100 }, 'science', 500).ok,
    false,
  );
  assert.equal(
    validateAiQuestionPayload({ ...base, options: ['A', 'B', 'C'] }, 'science', 500).ok,
    false,
  );
  assert.equal(
    validateAiQuestionPayload(
      { ...base, options: ['Mitochondrion', 'mitochondrion', 'Ribosome', 'Lysosome'] },
      'science',
      500,
    ).ok,
    false,
  );
  assert.equal(
    validateAiQuestionPayload({ ...base, correctAnswer: 'Nucleus' }, 'science', 500).ok,
    false,
  );
  assert.equal(
    validateAiQuestionPayload({ ...base, explanation: '' }, 'science', 500).ok,
    false,
  );
  assert.equal(
    validateAiQuestionPayload({ ...base, difficulty: 'Very Easy' }, 'science', 1000).ok,
    false,
  );
});

test('duplicate question prevention detects normalized repeats and prompt embeds recent questions', () => {
  const recent = sanitizeRecentQuestions([
    'What is the largest planet in our solar system?',
    'bad',
  ]);
  assert.equal(recent.length, 1);
  assert.equal(
    isDuplicateQuestion('what is the largest planet in our solar system', recent),
    true,
  );
  assert.equal(
    isDuplicateQuestion('Which planet has the most prominent ring system?', recent),
    false,
  );

  const rejectedDup = validateAiQuestionPayload(
    {
      category: 'Science',
      points: 100,
      difficulty: 'Very Easy',
      question: 'What is the largest planet in our solar system?',
      options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
      correctAnswer: 'Jupiter',
      explanation: 'Jupiter is the largest planet by mass and volume.',
      questionId: 'sci-100-dup',
    },
    'science',
    100,
    recent,
  );
  assert.equal(rejectedDup.ok, false);

  const prompt = buildAiQuestionPrompt('bollywood', 700, recent, 2, 'Duplicate detected');
  assert.match(prompt, /Bollywood/);
  assert.match(prompt, /700/);
  assert.match(prompt, /Difficult/);
  assert.match(prompt, /largest planet/i);
});

test('extractSafeStreamingPreview reveals question and completed options incrementally without leaking correctAnswer', () => {
  const partial1 = '{"category":"Science","points":500,"question":"Which force keeps planets in';
  const preview1 = extractSafeStreamingPreview(partial1);
  assert.equal(preview1.question, 'Which force keeps planets in');
  assert.equal(preview1.options, undefined);

  const partial2 =
    '{"category":"Science","points":500,"question":"Which force keeps planets in orbit?","options":["Gravity","Friction","Magnetic';
  const preview2 = extractSafeStreamingPreview(partial2);
  assert.equal(preview2.question, 'Which force keeps planets in orbit?');
  assert.deepEqual(preview2.options, ['Gravity', 'Friction']);

  const partial3 =
    '{"category":"Science","points":500,"question":"Which force keeps planets in orbit?","options":["Gravity","Friction","Magnetism","Nuclear"],"correctAnswer":"Gravity","explanation":"Gravity attracts masses."';
  const preview3 = extractSafeStreamingPreview(partial3) as Record<string, unknown>;
  assert.deepEqual(preview3.options, ['Gravity', 'Friction', 'Magnetism', 'Nuclear']);
  assert.equal('correctAnswer' in preview3, false);
  assert.equal('explanation' in preview3, false);
});
