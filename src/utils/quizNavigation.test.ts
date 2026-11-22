import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_MODES,
  POINT_LEVELS,
  QUIZ_CATEGORIES,
} from '../data/quizCatalog';
import {
  canAccessScreen,
  computeSpinTarget,
  createInitialQuizState,
  getLogicalParentScreen,
  quizReducer,
} from './quizNavigation';

test('catalog defines exact 5 categories, 10 point levels with Easy/Moderate/Difficult/Expert tiers, and 3 game modes', () => {
  assert.equal(QUIZ_CATEGORIES.length, 5);
  assert.deepEqual(
    QUIZ_CATEGORIES.map((c) => c.name),
    ['Geography', 'Bollywood', 'Science', 'General Knowledge', 'Sports & Games'],
  );

  assert.equal(POINT_LEVELS.length, 10);
  assert.deepEqual(
    POINT_LEVELS.map((p) => p.value),
    [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
  );
  assert.deepEqual(
    POINT_LEVELS.map((p) => p.tier),
    [
      'Easy',
      'Easy',
      'Easy',
      'Moderate',
      'Moderate',
      'Moderate',
      'Difficult',
      'Difficult',
      'Expert',
      'Expert',
    ],
  );

  assert.equal(GAME_MODES.length, 3);
  assert.deepEqual(
    GAME_MODES.map((m) => m.id),
    ['ai-questions', 'saved-questions', 'question-spinner'],
  );
});

test('initial state honors autostart flag and defaults soundEnabled to false', () => {
  const initial = createInitialQuizState(false);
  assert.equal(initial.currentScreen, 'intro');
  assert.equal(initial.soundEnabled, false);
  assert.equal(initial.activeModal, null);
  assert.equal(createInitialQuizState(true).currentScreen, 'home');
});

test('full setup flow advances intro -> home -> category -> points -> mode -> mode screen', () => {
  let state = createInitialQuizState(false);

  state = quizReducer(state, { type: 'ENTER_APP' });
  assert.equal(state.currentScreen, 'home');

  state = quizReducer(state, { type: 'NAVIGATE', screen: 'category' });
  assert.equal(state.currentScreen, 'category');

  state = quizReducer(state, { type: 'SELECT_CATEGORY', category: 'science' });
  assert.equal(state.selectedCategory, 'science');
  assert.equal(state.currentScreen, 'points');

  state = quizReducer(state, { type: 'SELECT_POINTS', points: 500 });
  assert.equal(state.selectedPoints, 500);
  assert.equal(state.currentScreen, 'mode');

  state = quizReducer(state, { type: 'SELECT_MODE', mode: 'question-spinner' });
  assert.equal(state.selectedMode, 'question-spinner');
  assert.equal(state.currentScreen, 'question-spinner');
});

test('sound, reduced-motion, modal, and intro replay actions update state cleanly', () => {
  let state = createInitialQuizState(true);

  state = quizReducer(state, { type: 'TOGGLE_SOUND' });
  assert.equal(state.soundEnabled, true);

  state = quizReducer(state, { type: 'TOGGLE_REDUCED_MOTION' });
  assert.equal(state.reducedMotion, true);

  state = quizReducer(state, { type: 'OPEN_MODAL', modal: 'rules' });
  assert.equal(state.activeModal, 'rules');

  state = quizReducer(state, { type: 'CLOSE_MODAL' });
  assert.equal(state.activeModal, null);

  state = quizReducer(state, { type: 'OPEN_MODAL', modal: 'settings' });
  state = quizReducer(state, { type: 'REPLAY_INTRO' });
  assert.equal(state.currentScreen, 'intro');
  assert.equal(state.activeModal, null);
});

test('access guard prevents jumping to setup-dependent screens prematurely', () => {
  let state = createInitialQuizState(true);
  assert.equal(canAccessScreen('points', state), false);
  assert.equal(canAccessScreen('mode', state), false);
  assert.equal(canAccessScreen('ai-question', state), false);

  state = quizReducer(state, { type: 'NAVIGATE', screen: 'ai-question' });
  assert.equal(state.currentScreen, 'category');
});

test('back navigation and scoreboard return preserve logical hierarchy', () => {
  let state = createInitialQuizState(true);
  state = quizReducer(state, { type: 'SELECT_CATEGORY', category: 'bollywood' });
  state = quizReducer(state, { type: 'SELECT_POINTS', points: 800 });
  state = quizReducer(state, { type: 'SELECT_MODE', mode: 'saved-questions' });
  assert.equal(state.currentScreen, 'saved-questions');

  state = quizReducer(state, { type: 'NAVIGATE', screen: 'scoreboard' });
  assert.equal(state.currentScreen, 'scoreboard');
  assert.equal(getLogicalParentScreen(state), 'saved-questions');

  state = quizReducer(state, { type: 'GO_BACK' });
  assert.equal(state.currentScreen, 'saved-questions');

  state = quizReducer(state, { type: 'GO_BACK' });
  assert.equal(state.currentScreen, 'mode');
});

test('saved slot selection clamps strictly between 1 and 3', () => {
  let state = createInitialQuizState(true);
  state = quizReducer(state, { type: 'SET_SAVED_SLOT', slot: 2 });
  assert.equal(state.activeSavedSlot, 2);

  state = quizReducer(state, { type: 'SET_SAVED_SLOT', slot: 99 });
  assert.equal(state.activeSavedSlot, 3);

  state = quizReducer(state, { type: 'SET_SAVED_SLOT', slot: 0 });
  assert.equal(state.activeSavedSlot, 1);
});

test('computeSpinTarget produces positive forward rotation and valid 1..6 segment', () => {
  const first = computeSpinTarget(0, 0.0, 6);
  assert.equal(first.landedSegment, 1);
  assert.ok(first.nextDeg >= 1440);

  const last = computeSpinTarget(first.nextDeg, 0.99, 6);
  assert.equal(last.landedSegment, 6);
  assert.ok(last.nextDeg > first.nextDeg + 1000);
});

test('RECORD_AI_ANSWER appends session history once per questionId without altering setup or scores', () => {
  let state = createInitialQuizState(true);
  assert.equal(state.aiQuestionHistory.length, 0);

  const entry = {
    questionId: 'geo-100-abc',
    categoryId: 'geography' as const,
    category: 'Geography',
    points: 100 as const,
    difficulty: 'Very Easy',
    question: 'Which ocean is the largest on Earth?',
    selectedAnswer: 'Pacific Ocean',
    correctAnswer: 'Pacific Ocean',
    isCorrect: true,
    explanation: 'The Pacific Ocean covers more area than any other ocean.',
    answeredAt: 1700000000000,
  };

  state = quizReducer(state, { type: 'RECORD_AI_ANSWER', entry });
  assert.equal(state.aiQuestionHistory.length, 1);
  assert.equal(state.aiQuestionHistory[0].questionId, 'geo-100-abc');

  // Duplicate questionId should be ignored cleanly
  state = quizReducer(state, { type: 'RECORD_AI_ANSWER', entry });
  assert.equal(state.aiQuestionHistory.length, 1);
});
