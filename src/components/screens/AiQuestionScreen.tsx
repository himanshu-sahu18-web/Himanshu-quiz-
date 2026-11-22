import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { getCategoryById, getPointLevelByValue } from '../../data/quizCatalog';
import {
  AiQuestionRequestError,
  generateAiQuestion,
} from '../../services/aiQuestionService';
import type {
  AiGeneratedQuestion,
  AiQuestionHistoryItem,
  CategoryId,
  PointLevel,
  ScreenId,
} from '../../types/quiz';
import {
  getAiDifficultySpec,
  type SafeStreamingPreview,
} from '../../utils/aiQuestionLogic';
import {
  playClickSound,
  playCorrectSound,
  playIncorrectSound,
  playTransitionSound,
} from '../../utils/soundEffects';
import { ModeIllustration } from '../illustrations/ModeIllustrations';
import { CategoryIcon } from '../QuizIcons';

interface AiQuestionScreenProps {
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  soundEnabled: boolean;
  reducedMotion: boolean;
  aiQuestionHistory: readonly AiQuestionHistoryItem[];
  onRecordAiAnswer: (entry: AiQuestionHistoryItem) => void;
  onNavigate: (screen: ScreenId) => void;
}

type GenerationPhase = 'idle' | 'loading' | 'question' | 'submitted' | 'error';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const AiQuestionScreen: FC<AiQuestionScreenProps> = ({
  selectedCategory,
  selectedPoints,
  soundEnabled,
  reducedMotion,
  aiQuestionHistory,
  onRecordAiAnswer,
  onNavigate,
}) => {
  const category = getCategoryById(selectedCategory);
  const pointConfig = getPointLevelByValue(selectedPoints);
  const difficultySpec = selectedPoints ? getAiDifficultySpec(selectedPoints) : null;

  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [activeQuestion, setActiveQuestion] = useState<AiGeneratedQuestion | null>(null);
  const [streamingPreview, setStreamingPreview] = useState<SafeStreamingPreview | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Connecting to fast Gemini question stream...',
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<boolean | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Guard against duplicate requests from rapid button clicks + store seen questions
  const inFlightRef = useRef(false);
  const seenQuestionsRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const recentQuestionsList = useMemo(() => {
    const merged = new Set<string>(seenQuestionsRef.current);
    for (const item of aiQuestionHistory) {
      merged.add(item.question);
    }
    return Array.from(merged).slice(-30);
  }, [aiQuestionHistory, activeQuestion]);

  // Reset active question cleanly if category or points changes
  useEffect(() => {
    abortControllerRef.current?.abort();
    inFlightRef.current = false;
    setPhase('idle');
    setActiveQuestion(null);
    setStreamingPreview(null);
    setSelectedOption(null);
    setEvaluationResult(null);
    setErrorInfo(null);
  }, [selectedCategory, selectedPoints]);

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      inFlightRef.current = false;
    };
  }, []);

  const handleGenerateQuestion = useCallback(async () => {
    if (!selectedCategory || !selectedPoints || inFlightRef.current) return;

    inFlightRef.current = true;
    playTransitionSound(soundEnabled);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPhase('loading');
    setStreamingPreview(null);
    setStatusMessage('Connecting to fast Gemini question stream...');
    setErrorInfo(null);
    setSelectedOption(null);
    setEvaluationResult(null);

    try {
      const generated = await generateAiQuestion({
        categoryId: selectedCategory,
        points: selectedPoints,
        recentQuestions: recentQuestionsList,
        signal: controller.signal,
        onStatus: (msg) => {
          if (!controller.signal.aborted) {
            setStatusMessage(msg);
          }
        },
        onPartial: (preview) => {
          if (!controller.signal.aborted) {
            setStreamingPreview(preview);
            setStatusMessage('Streaming verified question & options...');
          }
        },
      });

      if (controller.signal.aborted) return;

      seenQuestionsRef.current = [...seenQuestionsRef.current, generated.question].slice(-30);
      setStreamingPreview(null);
      setActiveQuestion(generated);
      setPhase('question');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      setStreamingPreview(null);
      if (err instanceof AiQuestionRequestError) {
        setErrorInfo({ code: err.code, message: err.message });
      } else {
        setErrorInfo({
          code: 'UNKNOWN_ERROR',
          message: 'Unable to generate a question right now. Please try again.',
        });
      }
      setPhase('error');
    } finally {
      inFlightRef.current = false;
    }
  }, [selectedCategory, selectedPoints, soundEnabled, recentQuestionsList]);

  const handleSelectOption = (optionText: string) => {
    if (phase !== 'question') return;
    playClickSound(soundEnabled);
    setSelectedOption(optionText);
  };

  const handleSubmitAnswer = () => {
    if (phase !== 'question' || !activeQuestion || !selectedOption || !selectedCategory) {
      return;
    }

    const isCorrect =
      selectedOption.trim().toLowerCase() === activeQuestion.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      playCorrectSound(soundEnabled);
    } else {
      playIncorrectSound(soundEnabled);
    }

    setEvaluationResult(isCorrect);
    setPhase('submitted');

    onRecordAiAnswer({
      questionId: activeQuestion.questionId,
      categoryId: selectedCategory,
      category: activeQuestion.category,
      points: activeQuestion.points,
      difficulty: activeQuestion.difficulty,
      question: activeQuestion.question,
      selectedAnswer: selectedOption,
      correctAnswer: activeQuestion.correctAnswer,
      isCorrect,
      explanation: activeQuestion.explanation,
      answeredAt: Date.now(),
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
      {/* Top Arena Metadata Strip */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
              Game Mode · AI Questions
            </p>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
              Intelligent Question Engine
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('category')}
              className="inline-flex min-h-[38px] items-center rounded-xl border border-slate-700/80 bg-slate-900/75 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Change Category
            </button>
            <button
              type="button"
              onClick={() => onNavigate('points')}
              className="inline-flex min-h-[38px] items-center rounded-xl border border-slate-700/80 bg-slate-900/75 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Change Points
            </button>
          </div>
        </div>

        {/* Selected Category, Selected Points & Calibrated Difficulty Readout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-xl border border-cyan-400/20 glass-panel px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-cyan-400 uppercase">
              SELECTED CATEGORY
            </p>
            <div className="mt-1.5 flex items-center gap-2 font-display text-base sm:text-lg font-bold text-white">
              {category && (
                <CategoryIcon
                  iconKey={category.iconKey}
                  className={`w-4 h-4 shrink-0 ${category.textAccentClass}`}
                />
              )}
              <span>{category?.name ?? 'Not Selected'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-400/20 glass-panel px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-blue-300 uppercase">
              SELECTED POINTS
            </p>
            <div className="mt-1.5 font-mono-tabular text-base sm:text-lg font-bold text-white">
              {pointConfig ? `${pointConfig.value} Points` : 'Not Selected'}
            </div>
          </div>

          <div className="rounded-xl border border-violet-400/25 glass-panel px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-300 uppercase">
              DIFFICULTY
            </p>
            <div className="mt-1.5 font-display text-base sm:text-lg font-bold text-white">
              {difficultySpec?.label ?? 'Not Calibrated'}
            </div>
            {difficultySpec && (
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {difficultySpec.guidance}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Animated AI Question Generation Panel */}
      <section
        aria-label="AI Question Generation Stage"
        className="mt-5 relative overflow-hidden rounded-2xl border border-cyan-400/25 glass-panel-elevated p-5 sm:p-7 shadow-[0_24px_64px_-24px_rgba(37,99,235,0.4)]"
      >
        {/* IDLE / READY TO GENERATE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center py-2 sm:py-3">
            <div className="w-44 max-w-full mb-3">
              <ModeIllustration modeId="ai-questions" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gemini Question Core Ready</span>
            </div>

            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
              Ready to Generate Question
            </h2>
            <p className="mt-2.5 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
              Configured for{' '}
              <span className="font-semibold text-white">{category?.name}</span> at{' '}
              <span className="font-mono-tabular font-semibold text-cyan-300">
                {selectedPoints} Points
              </span>{' '}
              ({difficultySpec?.label}). Press below to stream a verified multiple-choice question.
            </p>

            <button
              type="button"
              onClick={handleGenerateQuestion}
              className="mt-7 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-8 py-3.5 text-sm sm:text-base font-bold tracking-wide text-white shadow-[0_12px_34px_-8px_rgba(14,165,233,0.85)] transition-all hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>GENERATE QUESTION</span>
            </button>
          </div>
        )}

        {/* AI THINKING + SAFE PROGRESSIVE STREAMING PREVIEW */}
        {phase === 'loading' && (
          <div role="status" aria-live="polite" className="py-4 sm:py-6">
            <div className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <span
                  className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60 ${
                    reducedMotion ? '' : 'animate-spin-slow'
                  }`}
                  aria-hidden="true"
                />
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>

              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                  Generating {category?.name} Question...
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-cyan-200/90">
                  {statusMessage} · {selectedPoints} Points ({difficultySpec?.label})
                </p>
              </div>
            </div>

            {streamingPreview?.question ? (
              <div className="mt-5">
                <p className="font-display text-xl sm:text-2xl font-bold leading-snug text-white">
                  {streamingPreview.question}
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {OPTION_LETTERS.map((letter, idx) => {
                    const streamedOpt = streamingPreview.options?.[idx];
                    return (
                      <div
                        key={`stream-opt-${letter}`}
                        className={`flex min-h-[58px] items-center gap-3.5 rounded-xl border px-4 py-3 text-sm sm:text-base transition-all ${
                          streamedOpt
                            ? 'border-cyan-400/35 bg-[#07112A]/90 text-slate-100'
                            : 'border-slate-800/80 bg-[#050A18]/65 text-slate-500'
                        }`}
                      >
                        <span className="font-mono-tabular inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-cyan-300">
                          {letter}
                        </span>
                        <span className={streamedOpt ? 'font-medium' : 'italic text-xs'}>
                          {streamedOpt ?? 'Streaming option...'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Finalizing validation before enabling answer selection...
                </p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center justify-center py-6 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <span
                    className={`absolute inset-0 rounded-full border-2 border-cyan-400/30 ${
                      reducedMotion ? '' : 'animate-ping'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`absolute inset-2 rounded-full border-2 border-dashed border-sky-400/60 ${
                      reducedMotion ? '' : 'animate-spin-slow'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/50 bg-gradient-to-br from-blue-600/40 via-cyan-500/30 to-violet-600/40 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.4)]">
                    <Sparkles className="w-6 h-6" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-xs font-medium text-slate-400">
                  Ensuring accurate question structure and four distinct choices...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ERROR / MISSING CONFIGURATION STATE */}
        {phase === 'error' && errorInfo && (
          <div role="alert" className="flex flex-col items-center text-center py-6 sm:py-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>

            <h2 className="mt-4 font-display text-xl sm:text-2xl font-bold text-white">
              {errorInfo.code === 'MISSING_CONFIG' || errorInfo.code === 'API_KEY_INVALID'
                ? 'AI Question Engine Unavailable'
                : 'Question Generation Paused'}
            </h2>
            <p className="mt-2.5 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
              {errorInfo.message}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleGenerateQuestion}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-6px_rgba(14,165,233,0.7)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Retry Generation</span>
              </button>
              <button
                type="button"
                onClick={() => setPhase('idle')}
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/75 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Reset Stage
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE QUESTION OR SUBMITTED EVALUATION */}
        {(phase === 'question' || phase === 'submitted') && activeQuestion && (
          <motion.div
            key={activeQuestion.questionId}
            initial={reducedMotion ? false : { opacity: 1, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Question Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                <span className="rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-cyan-200 uppercase tracking-wider">
                  {activeQuestion.category}
                </span>
                <span className="font-mono-tabular rounded-lg border border-blue-400/35 bg-blue-500/15 px-2.5 py-1 text-blue-200">
                  {activeQuestion.points} PTS
                </span>
                <span className="rounded-lg border border-violet-400/35 bg-violet-500/15 px-2.5 py-1 text-violet-200">
                  {activeQuestion.difficulty}
                </span>
              </div>

              <span className="font-mono-tabular text-[11px] text-slate-400">
                ID: {activeQuestion.questionId}
              </span>
            </div>

            {/* Question Prompt */}
            <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold leading-snug text-white">
              {activeQuestion.question}
            </h2>

            {/* Four Distinct Answer Options */}
            <div
              role="radiogroup"
              aria-label="Answer options"
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
              {activeQuestion.options.map((optionText, index) => {
                const letter = OPTION_LETTERS[index];
                const isSelected = selectedOption === optionText;
                const isSubmitted = phase === 'submitted';
                const isThisCorrect =
                  isSubmitted &&
                  optionText.toLowerCase() === activeQuestion.correctAnswer.toLowerCase();
                const isSelectedWrong = isSubmitted && isSelected && !isThisCorrect;

                let cardClasses =
                  'border-slate-700/80 bg-[#060D20]/90 text-slate-100 hover:border-cyan-400/65 hover:bg-[#0B1736]/95';
                let badgeClasses = 'border-slate-700 bg-slate-900 text-cyan-300';

                if (!isSubmitted && isSelected) {
                  cardClasses =
                    'border-cyan-300 bg-gradient-to-r from-blue-600/35 via-cyan-600/20 to-indigo-700/35 text-white ring-2 ring-cyan-400/60 shadow-[0_10px_28px_-8px_rgba(34,211,238,0.45)]';
                  badgeClasses = 'border-cyan-300 bg-cyan-500 text-slate-950';
                } else if (isThisCorrect) {
                  cardClasses =
                    'border-emerald-400 bg-emerald-500/15 text-white ring-2 ring-emerald-400/50 shadow-[0_10px_28px_-8px_rgba(16,185,129,0.45)]';
                  badgeClasses = 'border-emerald-300 bg-emerald-400 text-slate-950';
                } else if (isSelectedWrong) {
                  cardClasses =
                    'border-rose-400 bg-rose-500/15 text-white ring-2 ring-rose-400/45';
                  badgeClasses = 'border-rose-300 bg-rose-500 text-white';
                } else if (isSubmitted) {
                  cardClasses = 'border-slate-800/80 bg-[#050A18]/80 text-slate-400 opacity-75';
                }

                return (
                  <button
                    key={`${activeQuestion.questionId}-opt-${letter}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(optionText)}
                    className={`group flex min-h-[60px] items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${cardClasses}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`font-mono-tabular inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${badgeClasses}`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base font-medium leading-snug break-words">
                        {optionText}
                      </span>
                    </div>

                    {isThisCorrect && (
                      <CheckCircle2
                        className="w-5 h-5 shrink-0 text-emerald-300"
                        aria-hidden="true"
                      />
                    )}
                    {isSelectedWrong && (
                      <XCircle
                        className="w-5 h-5 shrink-0 text-rose-300"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Row Before Submission */}
            {phase === 'question' && (
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={handleGenerateQuestion}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700/85 bg-slate-900/80 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>GENERATE ANOTHER</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleSubmitAnswer}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-7 py-3 text-sm font-bold tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(37,99,235,0.8)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>SUBMIT ANSWER</span>
                </button>
              </div>
            )}

            {/* Answer Evaluation Banner (After Submission Only) */}
            {phase === 'submitted' && evaluationResult !== null && (
              <motion.div
                initial={
                  reducedMotion
                    ? false
                    : evaluationResult
                      ? { opacity: 1, scale: 0.96 }
                      : { opacity: 1, x: -6 }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : evaluationResult
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 1, x: [0, -5, 5, -3, 0] }
                }
                transition={{ duration: 0.28 }}
                role="status"
                aria-live="polite"
                className={`mt-7 rounded-2xl border p-5 sm:p-6 ${
                  evaluationResult
                    ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_16px_42px_-16px_rgba(16,185,129,0.45)]'
                    : 'border-rose-400/55 bg-rose-500/10 shadow-[0_16px_42px_-16px_rgba(244,63,94,0.4)]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        evaluationResult
                          ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-300'
                          : 'border-rose-400/45 bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {evaluationResult ? (
                        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-6 h-6" aria-hidden="true" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-display text-lg sm:text-xl font-bold tracking-wide ${
                          evaluationResult ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {evaluationResult ? 'CORRECT ANSWER' : 'INCORRECT ANSWER'}
                      </p>
                      <p className="mt-1 text-sm text-white">
                        Correct Answer:{' '}
                        <span className="font-semibold text-emerald-300">
                          {activeQuestion.correctAnswer}
                        </span>
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-200">
                        {activeQuestion.explanation}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Answer recorded in session history. Point scoring & leaderboard updates activate in Part 7.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={handleGenerateQuestion}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(14,165,233,0.75)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>GENERATE ANOTHER</span>
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Persistent Navigation Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
          <button
            type="button"
            onClick={() => onNavigate('mode')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-sky-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Switch Game Mode</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('scoreboard')}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-violet-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              View Scoreboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <span>Preview Results</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Session Question History Panel (Only Past Submitted Answers) */}
      {aiQuestionHistory.length > 0 && (
        <section
          aria-label="Session Question History"
          className="mt-6 rounded-2xl border border-slate-800/90 glass-panel p-5 sm:p-6"
        >
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            aria-expanded={historyOpen}
            className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <h2 className="font-display text-base sm:text-lg font-semibold text-white">
                Session Question History ({aiQuestionHistory.length})
              </h2>
            </div>
            {historyOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
          </button>

          {historyOpen && (
            <ul className="mt-4 space-y-3 border-t border-slate-800/80 pt-4">
              {aiQuestionHistory.map((item) => (
                <li
                  key={item.questionId}
                  className="rounded-xl border border-slate-800 bg-[#060C1B]/80 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-cyan-300">{item.category}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono-tabular text-slate-300">{item.points} pts</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{item.difficulty}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        item.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-white">{item.question}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
                    <span>
                      Selected:{' '}
                      <strong className={item.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                        {item.selectedAnswer}
                      </strong>
                    </span>
                    <span>
                      Correct Answer:{' '}
                      <strong className="text-emerald-300">{item.correctAnswer}</strong>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
