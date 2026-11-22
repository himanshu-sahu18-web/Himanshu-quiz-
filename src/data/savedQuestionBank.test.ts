import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIZ_CATEGORIES, POINT_LEVELS } from './quizCatalog.ts';
import {
  SAVED_QUESTION_BANK,
  getSavedQuestionsFor,
  isValidSavedQuestion,
} from './savedQuestionBank.ts';
import { normalizeTextForComparison } from '../utils/aiQuestionLogic.ts';

test('SAVED_QUESTION_BANK contains exactly 150 unique questions across 5 categories and 10 point levels', () => {
  assert.equal(SAVED_QUESTION_BANK.length, 150);

  const ids = new Set<string>();
  const normalizedPrompts = new Set<string>();

  for (const question of SAVED_QUESTION_BANK) {
    assert.equal(
      isValidSavedQuestion(question),
      true,
      `Question ${question.questionId} failed structural validation`,
    );
    assert.equal(
      ids.has(question.questionId),
      false,
      `Duplicate questionId detected: ${question.questionId}`,
    );
    ids.add(question.questionId);

    const norm = normalizeTextForComparison(question.question);
    assert.equal(
      normalizedPrompts.has(norm),
      false,
      `Duplicate question text detected: ${question.question}`,
    );
    normalizedPrompts.add(norm);
  }
});

test('every category and point level combination has exactly 3 calibrated questions', () => {
  assert.equal(QUIZ_CATEGORIES.length, 5);
  assert.equal(POINT_LEVELS.length, 10);

  for (const cat of QUIZ_CATEGORIES) {
    for (const level of POINT_LEVELS) {
      const subset = getSavedQuestionsFor(cat.id, level.value);
      assert.equal(
        subset.length,
        3,
        `Expected 3 questions for ${cat.id} @ ${level.value}, found ${subset.length}`,
      );
      for (const q of subset) {
        assert.equal(q.category, cat.name);
        assert.equal(q.points, level.value);
        assert.equal(
          q.difficulty,
          level.tier,
          `Difficulty mismatch for ${q.questionId}: expected ${level.tier}, got ${q.difficulty}`,
        );
      }
    }
  }
});

test('getSavedQuestionsFor returns empty array safely when setup is incomplete', () => {
  assert.deepEqual(getSavedQuestionsFor(null, 100), []);
  assert.deepEqual(getSavedQuestionsFor('science', null), []);
  assert.equal(isValidSavedQuestion(null), false);
});
