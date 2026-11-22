import { useCallback, useEffect, useReducer } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { AppShell } from './components/AppShell';
import { AiQuestionScreen } from './components/screens/AiQuestionScreen';
import { CategoryScreen } from './components/screens/CategoryScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { IntroScreen } from './components/screens/IntroScreen';
import { ModeScreen } from './components/screens/ModeScreen';
import { PointsScreen } from './components/screens/PointsScreen';
import { QuestionSpinnerScreen } from './components/screens/QuestionSpinnerScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { SavedQuestionsScreen } from './components/screens/SavedQuestionsScreen';
import { ScoreboardScreen } from './components/screens/ScoreboardScreen';
import { SCREEN_TITLES } from './data/quizCatalog';
import type { CategoryId, GameModeId, PointLevel, ScreenId } from './types/quiz';
import {
  createInitialQuizState,
  quizReducer,
} from './utils/quizNavigation';
import {
  playCategorySound,
  playClickSound,
  playIntroSound,
  playPointSound,
  playTransitionSound,
} from './utils/soundEffects';

function isAutostartEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
}

function getSystemReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function App() {
  const [state, dispatch] = useReducer(quizReducer, undefined, () =>
    createInitialQuizState(isAutostartEnabled(), getSystemReducedMotion()),
  );

  useEffect(() => {
    document.body.dataset.state = state.currentScreen;
    document.title =
      state.currentScreen === 'intro'
        ? 'HIMANSHU QUIZ'
        : `${SCREEN_TITLES[state.currentScreen]} · HIMANSHU QUIZ`;
    window.scrollTo(0, 0);
  }, [state.currentScreen]);

  const handleEnterFromIntro = useCallback(() => {
    playTransitionSound(state.soundEnabled);
    dispatch({ type: 'ENTER_APP' });
  }, [state.soundEnabled]);

  const handleToggleSoundFromIntro = useCallback(() => {
    const nextEnabled = !state.soundEnabled;
    dispatch({ type: 'TOGGLE_SOUND' });
    if (nextEnabled) {
      playIntroSound(true);
    }
  }, [state.soundEnabled]);

  const handleNavigate = (screen: ScreenId) => {
    playTransitionSound(state.soundEnabled);
    dispatch({ type: 'NAVIGATE', screen });
  };

  const handleBack = () => {
    playClickSound(state.soundEnabled);
    dispatch({ type: 'GO_BACK' });
  };

  const handleSelectCategory = (category: CategoryId) => {
    playCategorySound(state.soundEnabled);
    dispatch({ type: 'SELECT_CATEGORY', category, advance: true });
  };

  const handleSelectPoints = (points: PointLevel) => {
    playPointSound(state.soundEnabled, points);
    dispatch({ type: 'SELECT_POINTS', points, advance: true });
  };

  const handleSelectMode = (mode: GameModeId) => {
    playTransitionSound(state.soundEnabled);
    dispatch({ type: 'SELECT_MODE', mode, advance: true });
  };

  const handleToggleSound = () => {
    const nextEnabled = !state.soundEnabled;
    dispatch({ type: 'TOGGLE_SOUND' });
    if (nextEnabled) {
      playClickSound(true);
    }
  };

  const handleReplayIntro = () => {
    dispatch({ type: 'REPLAY_INTRO' });
    if (state.soundEnabled) {
      playIntroSound(true);
    }
  };

  const transitionDuration = state.reducedMotion ? 0 : 0.22;

  const screenOrder: Record<ScreenId, number> = {
    intro: 0,
    home: 1,
    category: 2,
    points: 3,
    mode: 4,
    'ai-question': 5,
    'saved-questions': 5,
    'question-spinner': 5,
    results: 6,
    scoreboard: 6,
  };
  const prevRank = state.previousScreen ? screenOrder[state.previousScreen] : 0;
  const currRank = screenOrder[state.currentScreen];
  const isAdvancing = currRank >= prevRank;

  return (
    <MotionConfig reducedMotion={state.reducedMotion ? 'always' : 'user'}>
      <AppShell
        currentScreen={state.currentScreen}
        soundEnabled={state.soundEnabled}
        reducedMotion={state.reducedMotion}
        activeModal={state.activeModal}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onToggleSound={handleToggleSound}
        onToggleReducedMotion={() => {
          playClickSound(state.soundEnabled);
          dispatch({ type: 'TOGGLE_REDUCED_MOTION' });
        }}
        onOpenModal={(modal) => {
          playClickSound(state.soundEnabled);
          dispatch({ type: 'OPEN_MODAL', modal });
        }}
        onCloseModal={() => {
          playClickSound(state.soundEnabled);
          dispatch({ type: 'CLOSE_MODAL' });
        }}
        onReplayIntro={handleReplayIntro}
        onResetSetup={() => {
          playTransitionSound(state.soundEnabled);
          dispatch({ type: 'RESET_SETUP' });
        }}
      >
        <motion.div
          key={state.currentScreen}
          initial={
            state.reducedMotion
              ? false
              : {
                  opacity: 1,
                  scale: isAdvancing ? 0.98 : 1.02,
                  x: isAdvancing ? 16 : -16,
                }
          }
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col"
        >
            {state.currentScreen === 'intro' && (
              <IntroScreen
                soundEnabled={state.soundEnabled}
                reducedMotion={state.reducedMotion}
                onToggleSoundAndPlay={handleToggleSoundFromIntro}
                onEnter={handleEnterFromIntro}
              />
            )}

            {state.currentScreen === 'home' && (
              <HomeScreen
                onNavigate={handleNavigate}
                onQuickSelectCategory={handleSelectCategory}
              />
            )}

            {state.currentScreen === 'category' && (
              <CategoryScreen
                selectedCategory={state.selectedCategory}
                onSelectCategory={handleSelectCategory}
                onContinueToPoints={() => handleNavigate('points')}
              />
            )}

            {state.currentScreen === 'points' && (
              <PointsScreen
                selectedCategory={state.selectedCategory}
                selectedPoints={state.selectedPoints}
                onSelectPoints={handleSelectPoints}
                onChangeCategory={() => handleNavigate('category')}
                onContinueToMode={() => handleNavigate('mode')}
              />
            )}

            {state.currentScreen === 'mode' && (
              <ModeScreen
                selectedCategory={state.selectedCategory}
                selectedPoints={state.selectedPoints}
                selectedMode={state.selectedMode}
                onSelectMode={handleSelectMode}
                onChangeCategory={() => handleNavigate('category')}
                onChangePoints={() => handleNavigate('points')}
              />
            )}

            {state.currentScreen === 'ai-question' && (
              <AiQuestionScreen
                selectedCategory={state.selectedCategory}
                selectedPoints={state.selectedPoints}
                soundEnabled={state.soundEnabled}
                reducedMotion={state.reducedMotion}
                aiQuestionHistory={state.aiQuestionHistory}
                onRecordAiAnswer={(entry) =>
                  dispatch({ type: 'RECORD_AI_ANSWER', entry })
                }
                onNavigate={handleNavigate}
              />
            )}

            {state.currentScreen === 'saved-questions' && (
              <SavedQuestionsScreen
                selectedCategory={state.selectedCategory}
                selectedPoints={state.selectedPoints}
                activeSlot={state.activeSavedSlot}
                soundEnabled={state.soundEnabled}
                reducedMotion={state.reducedMotion}
                onSelectSlot={(slot) => {
                  playClickSound(state.soundEnabled);
                  dispatch({ type: 'SET_SAVED_SLOT', slot });
                }}
                onNavigate={handleNavigate}
              />
            )}

            {state.currentScreen === 'question-spinner' && (
              <QuestionSpinnerScreen
                selectedCategory={state.selectedCategory}
                selectedPoints={state.selectedPoints}
                soundEnabled={state.soundEnabled}
                reducedMotion={state.reducedMotion}
                onNavigate={handleNavigate}
              />
            )}

            {state.currentScreen === 'scoreboard' && (
              <ScoreboardScreen
                onNavigate={handleNavigate}
                onBack={handleBack}
              />
            )}

            {state.currentScreen === 'results' && (
              <ResultsScreen
                selectedCategory={state.selectedCategory}
                selectedPoints={state.selectedPoints}
                selectedMode={state.selectedMode}
                onResetSetup={() => {
                  playTransitionSound(state.soundEnabled);
                  dispatch({ type: 'RESET_SETUP' });
                }}
                onNavigate={handleNavigate}
              />
            )}
        </motion.div>
      </AppShell>
    </MotionConfig>
  );
}
