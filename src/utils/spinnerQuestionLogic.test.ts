import assert from 'node:assert/strict';
import test from 'node:test';
import { getSavedQuestionsFor } from '../data/savedQuestionBank.ts';
import { computeSpinTarget } from './quizNavigation.ts';
import {
  SPINNER_QUESTION_COUNT,
  assembleSpinnerRoundQuestions,
  buildSpinnerBatchPrompt,
  parseAndValidateSpinnerBatch,
  pickUnusedSavedQuestions,
  sanitizeSpinnerCount,
} from './spinnerQuestionLogic.ts';

function makeBatchPayload(
  count: number,
  category = 'Science',
  points = 500,
  difficulty = 'Moderate to Challenging',
) {
  return {
    questions: Array.from({ length: count }, (_, idx) => ({
      category,
      points,
      difficulty,
      question: `Sample calibrated Std. 11 question number ${idx + 1} about topic ${idx + 10}?`,
      options: [
        `Answer Alpha ${idx + 1}`,
        `Answer Beta ${idx + 1}`,
        `Answer Gamma ${idx + 1}`,
        `Answer Delta ${idx + 1}`,
      ],
      correctAnswer: `Answer Beta ${idx + 1}`,
      explanation: `Answer Beta ${idx + 1} is verified for this concept.`,
      questionId: `sp-${idx + 1}`,
    })),
  };
}

test('sanitizeSpinnerCount bounds count cleanly between 1 and 6', () => {
  assert.equal(sanitizeSpinnerCount(undefined), 6);
  assert.equal(sanitizeSpinnerCount(3), 3);
  assert.equal(sanitizeSpinnerCount('4'), 4);
  assert.equal(sanitizeSpinnerCount(0), 1);
  assert.equal(sanitizeSpinnerCount(12), 6);
});

test('parseAndValidateSpinnerBatch accepts valid unique batches and rejects duplicates', () => {
  const validJson = JSON.stringify(makeBatchPayload(3, 'Science', 500));
  const validRes = parseAndValidateSpinnerBatch(validJson, 'science', 500, 3);
  assert.equal(validRes.ok, true);
  if (validRes.ok) {
    assert.equal(validRes.data.length, 3);
    assert.equal(new Set(validRes.data.map((q) => q.question)).size, 3);
  }

  // Duplicate inside batch
  const dupPayload = makeBatchPayload(3, 'Science', 500);
  dupPayload.questions[2].question = dupPayload.questions[0].question;
  const dupRes = parseAndValidateSpinnerBatch(JSON.stringify(dupPayload), 'science', 500, 3);
  assert.equal(dupRes.ok, false);

  // Duplicate against avoid list
  const avoidRes = parseAndValidateSpinnerBatch(
    validJson,
    'science',
    500,
    3,
    [makeBatchPayload(3).questions[1].question],
  );
  assert.equal(avoidRes.ok, false);
});

test('pickUnusedSavedQuestions and assembleSpinnerRoundQuestions produce 6 distinct questions without repeating used ones', () => {
  const savedForGeo300 = getSavedQuestionsFor('geography', 300);
  assert.equal(savedForGeo300.length, 3);

  const usedIds = new Set<string>([savedForGeo300[0].questionId]);
  const unused = pickUnusedSavedQuestions(savedForGeo300, usedIds, []);
  assert.equal(unused.length, 2);
  assert.ok(unused.every((q) => q.questionId !== savedForGeo300[0].questionId));

  const aiBatch = parseAndValidateSpinnerBatch(
    JSON.stringify(makeBatchPayload(4, 'Geography', 300, 'Easy to Moderate')),
    'geography',
    300,
    4,
  );
  assert.equal(aiBatch.ok, true);
  if (aiBatch.ok) {
    const assembled = assembleSpinnerRoundQuestions(unused, aiBatch.data);
    assert.equal(assembled.length, SPINNER_QUESTION_COUNT);
    assert.equal(new Set(assembled.map((q) => q.question)).size, 6);
    assert.ok(assembled.every((q) => q.category === 'Geography' && q.points === 300));
  }
});

test('buildSpinnerBatchPrompt encodes Std. 11 calibration, category, points, and avoid list', () => {
  const prompt = buildSpinnerBatchPrompt('bollywood', 700, 3, ['Previous trivia prompt?'], 1);
  assert.match(prompt, /Bollywood/);
  assert.match(prompt, /700/);
  assert.match(prompt, /Standard 11th/);
  assert.match(prompt, /Previous trivia prompt/);
});

test('computeSpinTarget lands every segment 1..6 cleanly under the top pointer (0 deg mod 360)', () => {
  for (let segIdx = 0; segIdx < 6; segIdx += 1) {
    const unit = (segIdx + 0.5) / 6;
    const { nextDeg, landedSegment } = computeSpinTarget(140, unit, 6);
    assert.equal(landedSegment, segIdx + 1);
    const sliceMidAngle = segIdx * 60 + 30;
    const finalAngleUnderTopPointer = (sliceMidAngle + nextDeg) % 360;
    assert.equal(finalAngleUnderTopPointer, 0);
  }
});
