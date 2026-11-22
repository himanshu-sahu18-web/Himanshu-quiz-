import type { CategoryId, PointLevel, SavedQuestion } from '../types/quiz';
import { BOLLYWOOD_SAVED_QUESTIONS } from './savedQuestions/bollywoodQuestions';
import { GENERAL_KNOWLEDGE_SAVED_QUESTIONS } from './savedQuestions/generalKnowledgeQuestions';
import { GEOGRAPHY_SAVED_QUESTIONS } from './savedQuestions/geographyQuestions';
import { SCIENCE_SAVED_QUESTIONS } from './savedQuestions/scienceQuestions';
import { SPORTS_GAMES_SAVED_QUESTIONS } from './savedQuestions/sportsGamesQuestions';

export const SAVED_QUESTION_BANK: readonly SavedQuestion[] = [
  ...GEOGRAPHY_SAVED_QUESTIONS,
  ...BOLLYWOOD_SAVED_QUESTIONS,
  ...SCIENCE_SAVED_QUESTIONS,
  ...GENERAL_KNOWLEDGE_SAVED_QUESTIONS,
  ...SPORTS_GAMES_SAVED_QUESTIONS,
];

export function getSavedQuestionsFor(
  categoryId: CategoryId | null,
  points: PointLevel | null,
): readonly SavedQuestion[] {
  if (!categoryId || !points) {
    return [];
  }
  return SAVED_QUESTION_BANK.filter(
    (item) => item.categoryId === categoryId && item.points === points,
  );
}

export function isValidSavedQuestion(question: SavedQuestion | undefined | null): question is SavedQuestion {
  if (!question) return false;
  if (!question.questionId.trim() || !question.question.trim() || !question.explanation.trim()) {
    return false;
  }
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return false;
  }
  const normalizedOptions = question.options.map((opt) => opt.trim().toLowerCase());
  if (normalizedOptions.some((opt) => !opt) || new Set(normalizedOptions).size !== 4) {
    return false;
  }
  return normalizedOptions.includes(question.correctAnswer.trim().toLowerCase());
}
