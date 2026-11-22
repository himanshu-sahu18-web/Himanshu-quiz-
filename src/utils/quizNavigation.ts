import { getGameModeById } from '../data/quizCatalog';
import type {
  GameModeId,
  QuizAction,
  QuizAppState,
  ScreenId,
} from '../types/quiz';

export function createInitialQuizState(
  autostart = false,
  prefersReducedMotion = false,
): QuizAppState {
  return {
    currentScreen: autostart ? 'home' : 'intro',
    previousScreen: null,
    selectedCategory: null,
    selectedPoints: null,
    selectedMode: null,
    activeSavedSlot: 1,
    spinnerRotationDeg: 0,
    selectedSpinnerSegment: null,
    aiQuestionHistory: [],
    soundEnabled: false,
    reducedMotion: prefersReducedMotion,
    activeModal: null,
  };
}

export function getModeTargetScreen(mode: GameModeId): ScreenId {
  const config = getGameModeById(mode);
  return config ? config.screenId : 'mode';
}

export function getLogicalParentScreen(state: QuizAppState): ScreenId {
  switch (state.currentScreen) {
    case 'intro':
      return 'intro';
    case 'home':
      return 'intro';
    case 'category':
      return 'home';
    case 'points':
      return 'category';
    case 'mode':
      return 'points';
    case 'ai-question':
    case 'saved-questions':
    case 'question-spinner':
      return 'mode';
    case 'results':
      return state.selectedMode ? getModeTargetScreen(state.selectedMode) : 'home';
    case 'scoreboard':
      return state.previousScreen && state.previousScreen !== 'scoreboard'
        ? state.previousScreen
        : 'home';
    default:
      return 'home';
  }
}

export function canAccessScreen(screen: ScreenId, state: QuizAppState): boolean {
  switch (screen) {
    case 'intro':
    case 'home':
    case 'category':
    case 'scoreboard':
      return true;
    case 'points':
      return state.selectedCategory !== null;
    case 'mode':
      return state.selectedCategory !== null && state.selectedPoints !== null;
    case 'ai-question':
    case 'saved-questions':
    case 'question-spinner':
    case 'results':
      return (
        state.selectedCategory !== null &&
        state.selectedPoints !== null &&
        state.selectedMode !== null
      );
    default:
      return false;
  }
}

export function computeSpinTarget(
  currentDeg: number,
  randomUnit: number,
  segmentCount = 6,
  fullTurns = 4,
): { nextDeg: number; landedSegment: number } {
  const clampedUnit = Math.min(0.999999, Math.max(0, randomUnit));
  const targetSegmentIndex = Math.floor(clampedUnit * segmentCount);
  const segmentAngle = 360 / segmentCount;
  const targetOffsetWithinCircle =
    (segmentCount - targetSegmentIndex) * segmentAngle - segmentAngle / 2;
  const extraSpinDeg = 360 * fullTurns;
  const currentRemainder = ((currentDeg % 360) + 360) % 360;
  const deltaToAlign = (targetOffsetWithinCircle - currentRemainder + 360) % 360;
  const nextDeg = currentDeg + extraSpinDeg + deltaToAlign;

  return {
    nextDeg,
    landedSegment: targetSegmentIndex + 1,
  };
}

export function quizReducer(state: QuizAppState, action: QuizAction): QuizAppState {
  switch (action.type) {
    case 'ENTER_APP':
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: 'home',
        activeModal: null,
      };

    case 'REPLAY_INTRO':
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: 'intro',
        activeModal: null,
      };

    case 'NAVIGATE': {
      if (action.screen === state.currentScreen) {
        return { ...state, activeModal: null };
      }
      if (!canAccessScreen(action.screen, state)) {
        const fallback: ScreenId =
          state.selectedCategory === null
            ? 'category'
            : state.selectedPoints === null
              ? 'points'
              : 'mode';
        return {
          ...state,
          previousScreen: state.currentScreen,
          currentScreen: fallback,
          activeModal: null,
        };
      }
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: action.screen,
        activeModal: null,
      };
    }

    case 'SELECT_CATEGORY': {
      const shouldAdvance = action.advance ?? true;
      return {
        ...state,
        selectedCategory: action.category,
        previousScreen: state.currentScreen,
        currentScreen: shouldAdvance ? 'points' : state.currentScreen,
      };
    }

    case 'SELECT_POINTS': {
      const shouldAdvance = action.advance ?? true;
      return {
        ...state,
        selectedPoints: action.points,
        previousScreen: state.currentScreen,
        currentScreen: shouldAdvance ? 'mode' : state.currentScreen,
      };
    }

    case 'SELECT_MODE': {
      const shouldAdvance = action.advance ?? true;
      const targetScreen = getModeTargetScreen(action.mode);
      return {
        ...state,
        selectedMode: action.mode,
        previousScreen: state.currentScreen,
        currentScreen: shouldAdvance ? targetScreen : state.currentScreen,
      };
    }

    case 'SET_SAVED_SLOT': {
      const clampedSlot = Math.min(3, Math.max(1, Math.round(action.slot)));
      return {
        ...state,
        activeSavedSlot: clampedSlot,
      };
    }

    case 'SPIN_WHEEL':
      return {
        ...state,
        spinnerRotationDeg: state.spinnerRotationDeg + action.deltaDeg,
        selectedSpinnerSegment: action.targetSegment,
      };

    case 'RECORD_AI_ANSWER': {
      const alreadyRecorded = state.aiQuestionHistory.some(
        (item) => item.questionId === action.entry.questionId,
      );
      if (alreadyRecorded) {
        return state;
      }
      return {
        ...state,
        aiQuestionHistory: [action.entry, ...state.aiQuestionHistory].slice(0, 50),
      };
    }

    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: !state.soundEnabled,
      };

    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        reducedMotion: !state.reducedMotion,
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        activeModal: action.modal,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        activeModal: null,
      };

    case 'GO_BACK': {
      const parent = getLogicalParentScreen(state);
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: parent,
        activeModal: null,
      };
    }

    case 'RESET_SETUP':
      return {
        ...state,
        selectedCategory: null,
        selectedPoints: null,
        selectedMode: null,
        activeSavedSlot: 1,
        selectedSpinnerSegment: null,
        activeModal: null,
        previousScreen: state.currentScreen,
        currentScreen: 'category',
      };

    default:
      return state;
  }
}
