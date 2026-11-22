import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  RotateCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { getCategoryById, getPointLevelByValue } from '../../data/quizCatalog';
import {
  SpinnerQuestionRequestError,
  prepareSpinnerRoundQuestions,
} from '../../services/spinnerQuestionService';
import type { CategoryId, PointLevel, ScreenId } from '../../types/quiz';
import { getAiDifficultySpec } from '../../utils/aiQuestionLogic';
import { computeSpinTarget } from '../../utils/quizNavigation';
import {
  playClickSound,
  playCorrectSound,
  playIncorrectSound,
  playSpinnerLandSound,
  playSpinnerTickSound,
  playTransitionSound,
} from '../../utils/soundEffects';
import {
  pickFairRandomUnit,
  type SpinnerQuestionItem,
} from '../../utils/spinnerQuestionLogic';
import { CategoryIcon } from '../QuizIcons';

interface QuestionSpinnerScreenProps {
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  soundEnabled: boolean;
  reducedMotion: boolean;
  onNavigate: (screen: ScreenId) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const WHEEL_SEGMENTS = [
  { num: 1, fill: '#0D214F', activeFill: '#0284C7', accent: '#38BDF8' },
  { num: 2, fill: '#151E4B', activeFill: '#2563EB', accent: '#60A5FA' },
  { num: 3, fill: '#1E1649', activeFill: '#4F46E5', accent: '#818CF8' },
  { num: 4, fill: '#0F254E', activeFill: '#0891B2', accent: '#22D3EE' },
  { num: 5, fill: '#17204D', activeFill: '#1D4ED8', accent: '#3B82F6' },
  { num: 6, fill: '#27144D', activeFill: '#7C3AED', accent: '#A78BFA' },
] as const;

const PERIMETER_DOTS = Array.from({ length: 12 }, (_, idx) => idx * 30);

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function createSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 0 0 ${end.x} ${end.y} Z`;
}

// Smooth quartic deceleration curve mimicking realistic wheel friction
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export const QuestionSpinnerScreen: FC<QuestionSpinnerScreenProps> = ({
  selectedCategory,
  selectedPoints,
  soundEnabled,
  reducedMotion,
  onNavigate,
}) => {
  const category = getCategoryById(selectedCategory);
  const pointConfig = getPointLevelByValue(selectedPoints);
  const difficultySpec = selectedPoints ? getAiDifficultySpec(selectedPoints) : null;

  const [roundNumber, setRoundNumber] = useState(1);
  const [roundQuestions, setRoundQuestions] = useState<SpinnerQuestionItem[]>([]);
  const [loadPhase, setLoadPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);

  const [rotationDeg, setRotationDeg] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [landedNumber, setLandedNumber] = useState<number | null>(null);
  const [showQuestionStage, setShowQuestionStage] = useState(false);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);

  // Track used questions across rounds in the current session to avoid repeats
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());
  const usedQuestionTextsRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const spinLockRef = useRef(false);
  const currentRotationRef = useRef(0);
  const soundEnabledRef = useRef(soundEnabled);
  const questionStageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    currentRotationRef.current = rotationDeg;
  }, [rotationDeg]);

  const cancelSpinAnimations = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    spinLockRef.current = false;
  }, []);

  const loadRound = useCallback(
    async (targetRound: number) => {
      if (!selectedCategory || !selectedPoints) return;

      cancelSpinAnimations();
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoadPhase('loading');
      setErrorInfo(null);
      setIsSpinning(false);
      setLandedNumber(null);
      setShowQuestionStage(false);
      setSelectedOption(null);
      setIsSubmitted(false);
      setIsCorrectAnswer(null);
      setRoundNumber(targetRound);

      try {
        const questions = await prepareSpinnerRoundQuestions({
          categoryId: selectedCategory,
          points: selectedPoints,
          usedQuestionIds: usedQuestionIdsRef.current,
          usedQuestionTexts: usedQuestionTextsRef.current,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        for (const item of questions) {
          usedQuestionIdsRef.current.add(item.questionId);
          usedQuestionTextsRef.current = [
            ...usedQuestionTextsRef.current,
            item.question,
          ].slice(-60);
        }

        setRoundQuestions(questions);
        setLoadPhase('ready');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (err instanceof SpinnerQuestionRequestError) {
          setErrorInfo({ code: err.code, message: err.message });
        } else {
          setErrorInfo({
            code: 'ROUND_LOAD_ERROR',
            message: 'Unable to prepare six unique questions for this round. Please retry.',
          });
        }
        setLoadPhase('error');
      }
    },
    [selectedCategory, selectedPoints, cancelSpinAnimations],
  );

  // Load initial round whenever category or points changes
  useEffect(() => {
    loadRound(1);
    return () => {
      cancelSpinAnimations();
      abortControllerRef.current?.abort();
    };
  }, [loadRound, cancelSpinAnimations]);

  const handleSpin = () => {
    if (
      loadPhase !== 'ready' ||
      roundQuestions.length !== 6 ||
      isSpinning ||
      spinLockRef.current ||
      landedNumber !== null
    ) {
      return;
    }

    spinLockRef.current = true;
    setIsSpinning(true);
    setLandedNumber(null);
    setShowQuestionStage(false);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrectAnswer(null);

    const startDeg = currentRotationRef.current;
    const fairUnit = pickFairRandomUnit();
    const { nextDeg, landedSegment } = computeSpinTarget(
      startDeg,
      fairUnit,
      6,
      reducedMotion ? 1 : 5,
    );

    const durationMs = reducedMotion ? 260 : 3200;
    const startTime = performance.now();
    let lastSliceIndex = Math.floor(startDeg / 60);

    playSpinnerTickSound(soundEnabledRef.current, 0);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutQuart(progress);
      const currentDeg = startDeg + (nextDeg - startDeg) * eased;

      currentRotationRef.current = currentDeg;
      setRotationDeg(currentDeg);

      const currentSliceIndex = Math.floor(currentDeg / 60);
      if (!reducedMotion && currentSliceIndex !== lastSliceIndex) {
        lastSliceIndex = currentSliceIndex;
        playSpinnerTickSound(soundEnabledRef.current, progress);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      rafRef.current = null;
      currentRotationRef.current = nextDeg;
      setRotationDeg(nextDeg);
      setIsSpinning(false);
      setLandedNumber(landedSegment);
      playSpinnerLandSound(soundEnabledRef.current);

      revealTimeoutRef.current = window.setTimeout(
        () => {
          spinLockRef.current = false;
          setShowQuestionStage(true);
          window.setTimeout(() => {
            questionStageRef.current?.scrollIntoView({
              behavior: reducedMotion ? 'auto' : 'smooth',
              block: 'nearest',
            });
          }, 60);
        },
        reducedMotion ? 100 : 420,
      );
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const activeQuestion =
    landedNumber !== null ? roundQuestions[landedNumber - 1] ?? null : null;

  const handleSelectOption = (optionText: string) => {
    if (isSubmitted || !activeQuestion) return;
    playClickSound(soundEnabled);
    setSelectedOption(optionText);
  };

  const handleSubmitAnswer = () => {
    if (!activeQuestion || !selectedOption || isSubmitted) return;

    const correct =
      selectedOption.trim().toLowerCase() === activeQuestion.correctAnswer.trim().toLowerCase();

    if (correct) {
      playCorrectSound(soundEnabled);
    } else {
      playIncorrectSound(soundEnabled);
    }

    setIsCorrectAnswer(correct);
    setIsSubmitted(true);
  };

  const handleNextRound = () => {
    playTransitionSound(soundEnabled);
    loadRound(roundNumber + 1);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Arena Header & Metadata */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
                Game Mode · Question Spinner
              </p>
              <span className="font-mono-tabular rounded-md border border-violet-400/35 bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-200">
                ROUND {roundNumber}
              </span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
              Question Spinner Arena
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => onNavigate('category')}
              className="inline-flex min-h-[38px] items-center rounded-xl border border-slate-700/80 bg-slate-900/75 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Change Category
            </button>
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => onNavigate('points')}
              className="inline-flex min-h-[38px] items-center rounded-xl border border-slate-700/80 bg-slate-900/75 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Change Points
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-xl border border-cyan-400/20 glass-panel px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-cyan-400 uppercase">
              SELECTED CATEGORY
            </p>
            <div className="mt-1 flex items-center gap-2 font-display text-base sm:text-lg font-bold text-white">
              {category && (
                <CategoryIcon
                  iconKey={category.iconKey}
                  className={`w-4 h-4 shrink-0 ${category.textAccentClass}`}
                />
              )}
              <span>{category?.name ?? 'Not Selected'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-400/20 glass-panel px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-blue-300 uppercase">
              SELECTED POINTS
            </p>
            <div className="mt-1 font-mono-tabular text-base sm:text-lg font-bold text-white">
              {pointConfig ? `${pointConfig.value} Points` : 'Not Selected'}
            </div>
          </div>

          <div className="rounded-xl border border-violet-400/25 glass-panel px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-300 uppercase">
              DIFFICULTY
            </p>
            <div className="mt-1 font-display text-base sm:text-lg font-bold text-white">
              {difficultySpec?.label ?? 'Not Calibrated'}
            </div>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loadPhase === 'loading' && (
        <section
          role="status"
          aria-live="polite"
          className="mt-6 rounded-2xl border border-violet-400/25 glass-panel-elevated p-8 sm:p-12 text-center shadow-[0_24px_64px_-24px_rgba(124,58,237,0.35)]"
        >
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span
              className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60 ${
                reducedMotion ? '' : 'animate-spin-slow'
              }`}
              aria-hidden="true"
            />
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-cyan-300">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold text-white">
            Preparing Six Unique Questions for Round {roundNumber}...
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Calibrating {category?.name} · {selectedPoints} Points ({difficultySpec?.label}) for Std. 11 level.
          </p>
        </section>
      )}

      {/* ERROR STATE */}
      {loadPhase === 'error' && errorInfo && (
        <section
          role="alert"
          className="mt-6 rounded-2xl border border-amber-400/35 glass-panel-elevated p-8 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-amber-300 mx-auto" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-bold text-white">
            Round Preparation Paused
          </h2>
          <p className="mt-2 max-w-xl mx-auto text-sm text-slate-300">{errorInfo.message}</p>
          <button
            type="button"
            onClick={() => loadRound(roundNumber)}
            className="mt-5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-6px_rgba(14,165,233,0.75)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry Round Preparation</span>
          </button>
        </section>
      )}

      {/* READY SPINNER ARENA + 6-QUESTION NUMBERED PANEL */}
      {loadPhase === 'ready' && roundQuestions.length === 6 && (
        <>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT: CIRCULAR 6-SEGMENT SPINNER */}
            <section
              aria-label="Circular Question Spinner"
              className="lg:col-span-5 flex flex-col items-center justify-between rounded-2xl border border-violet-400/25 glass-panel-elevated p-5 sm:p-7 shadow-[0_24px_64px_-24px_rgba(124,58,237,0.4)]"
            >
              <div className="w-full flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                  6-Section Wheel
                </span>
                <span
                  aria-live="polite"
                  className={`font-mono-tabular rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                    landedNumber !== null
                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                      : isSpinning
                        ? 'border-violet-400/50 bg-violet-500/20 text-violet-200'
                        : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  {isSpinning
                    ? 'SPINNING...'
                    : landedNumber !== null
                      ? `SELECTED: #${landedNumber}`
                      : 'READY TO SPIN'}
                </span>
              </div>

              <div className="relative my-2 flex items-center justify-center">
                {/* Ambient glow behind wheel */}
                <div
                  className={`pointer-events-none absolute inset-4 rounded-full blur-2xl transition-opacity duration-300 ${
                    landedNumber !== null
                      ? 'bg-cyan-500/30 opacity-100'
                      : isSpinning
                        ? 'bg-violet-500/30 opacity-90'
                        : 'bg-blue-600/20 opacity-60'
                  }`}
                  aria-hidden="true"
                />

                {/* Fixed Top Pointer */}
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_12px_rgba(34,211,238,0.85)]"
                  aria-hidden="true"
                >
                  <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
                    <path
                      d="M17 27L3 3H31L17 27Z"
                      fill="#22D3EE"
                      stroke="#030712"
                      strokeWidth="2.5"
                    />
                    <circle cx="17" cy="9" r="3" fill="#FFFFFF" />
                  </svg>
                </div>

                {/* Rotating SVG Wheel */}
                <div
                  data-testid="spinner-wheel-rotor"
                  style={{ transform: `rotate(${rotationDeg}deg)` }}
                  className="relative w-64 h-64 sm:w-72 sm:h-72 will-change-transform"
                >
                  <svg
                    viewBox="0 0 260 260"
                    className="w-full h-full drop-shadow-[0_12px_36px_rgba(15,23,42,0.85)]"
                    role="img"
                    aria-label="Circular quiz spinner divided into six numbered sections from 1 to 6"
                  >
                    <defs>
                      <radialGradient id="wheelBezelGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="82%" stopColor="#091534" />
                        <stop offset="100%" stopColor="#1E293B" />
                      </radialGradient>
                    </defs>

                    {/* Metallic outer competition ring */}
                    <circle
                      cx="130"
                      cy="130"
                      r="125"
                      fill="url(#wheelBezelGrad)"
                      stroke="rgba(56, 189, 248, 0.55)"
                      strokeWidth="3"
                    />

                    {/* 12 Perimeter LED markers */}
                    {PERIMETER_DOTS.map((angleDeg, idx) => {
                      const dotPos = polarToCartesian(130, 130, 118, angleDeg);
                      const isLit = idx % 2 === 0;
                      return (
                        <circle
                          key={`led-${angleDeg}`}
                          cx={dotPos.x}
                          cy={dotPos.y}
                          r={isLit ? 2.4 : 1.8}
                          fill={
                            landedNumber !== null
                              ? '#22D3EE'
                              : isLit
                                ? '#60A5FA'
                                : '#A78BFA'
                          }
                          opacity={isSpinning ? 0.95 : 0.75}
                        />
                      );
                    })}

                    {/* Six Equal 60-degree Numbered Slices */}
                    {WHEEL_SEGMENTS.map((segment, index) => {
                      const startAngle = index * 60;
                      const endAngle = startAngle + 60;
                      const labelPos = polarToCartesian(130, 130, 74, startAngle + 30);
                      const isLanded = landedNumber === segment.num;
                      const textAngle = startAngle + 30;

                      return (
                        <g key={segment.num}>
                          <path
                            d={createSlicePath(130, 130, 110, startAngle, endAngle)}
                            fill={isLanded ? segment.activeFill : segment.fill}
                            stroke={isLanded ? '#67E8F9' : 'rgba(148, 163, 184, 0.35)'}
                            strokeWidth={isLanded ? 2.8 : 1.5}
                          />
                          <text
                            x={labelPos.x}
                            y={labelPos.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${textAngle}, ${labelPos.x}, ${labelPos.y})`}
                            fill={isLanded ? '#FFFFFF' : '#E2E8F0'}
                            fontSize={isLanded ? '26' : '22'}
                            fontWeight="800"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {segment.num}
                          </text>
                        </g>
                      );
                    })}

                    {/* Center hub socket inside rotating SVG */}
                    <circle
                      cx="130"
                      cy="130"
                      r="26"
                      fill="#040817"
                      stroke={landedNumber !== null ? '#22D3EE' : '#38BDF8'}
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                {/* Upright Static Center Competition Hub */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute z-10 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2 shadow-[0_0_18px_rgba(34,211,238,0.45)] transition-colors ${
                    landedNumber !== null
                      ? 'border-cyan-300 bg-cyan-700/95 text-white'
                      : 'border-sky-400/80 bg-[#0B142E] text-white'
                  }`}
                >
                  <span className="font-mono-tabular text-xs sm:text-sm font-extrabold tracking-wide">
                    {landedNumber !== null ? `#${landedNumber}` : 'SPIN'}
                  </span>
                </div>
              </div>

              {/* Result Pop / SPIN Control */}
              <div className="mt-4 w-full flex flex-col items-center gap-3">
                {landedNumber !== null && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 1, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2.5 text-center shadow-[0_0_24px_rgba(34,211,238,0.28)]"
                  >
                    <p className="font-display text-sm sm:text-base font-bold text-cyan-200">
                      Spinner Stopped on Number #{landedNumber}
                    </p>
                  </motion.div>
                )}

                <button
                  type="button"
                  disabled={isSpinning || landedNumber !== null}
                  onClick={handleSpin}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-6 py-3.5 text-base font-bold tracking-wider text-white shadow-[0_12px_34px_-8px_rgba(37,99,235,0.85)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <RotateCw
                    className={`w-5 h-5 ${isSpinning && !reducedMotion ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>
                    {isSpinning
                      ? 'SPINNING WHEEL...'
                      : landedNumber !== null
                        ? `LANDED ON #${landedNumber}`
                        : 'SPIN'}
                  </span>
                </button>
              </div>
            </section>

            {/* RIGHT: NUMBERED 6-QUESTION PANEL (1 TO 6) */}
            <section
              aria-label="Six Prepared Round Questions"
              className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-800/90 glass-panel p-5 sm:p-7"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3.5">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                      Round {roundNumber} · Six Prepared Questions
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-300">
                      Press <strong className="text-cyan-300">SPIN</strong> to randomly pick one numbered question below.
                    </p>
                  </div>

                  <span className="font-mono-tabular rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                    6 Unique Questions
                  </span>
                </div>

                <ol className="mt-4 space-y-2.5">
                  {roundQuestions.map((item, idx) => {
                    const num = idx + 1;
                    const isSelectedSlot = landedNumber === num;

                    return (
                      <li
                        key={item.questionId}
                        data-spinner-slot={num}
                        className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                          isSelectedSlot
                            ? 'border-cyan-300 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-700/20 ring-2 ring-cyan-400/60 shadow-[0_10px_28px_-10px_rgba(34,211,238,0.5)]'
                            : landedNumber !== null
                              ? 'border-slate-800/75 bg-[#050A18]/65 opacity-60'
                              : 'border-slate-800/90 bg-[#060D20]/85'
                        }`}
                      >
                        <span
                          className={`font-mono-tabular inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                            isSelectedSlot
                              ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900 text-cyan-300'
                          }`}
                        >
                          {num}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm leading-snug ${
                              isSelectedSlot ? 'font-semibold text-white' : 'font-medium text-slate-200'
                            }`}
                          >
                            {item.question}
                          </p>
                        </div>

                        {isSelectedSlot && (
                          <span
                            className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase ${
                              isSubmitted
                                ? isCorrectAnswer
                                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                  : 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                                : 'border-cyan-300/60 bg-cyan-500/25 text-cyan-100'
                            }`}
                          >
                            {isSubmitted
                              ? isCorrectAnswer
                                ? 'Correct'
                                : 'Incorrect'
                              : 'Selected'}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          </div>

          {/* SELECTED QUESTION PLAY STAGE (PART 4 QUESTION INTERFACE) */}
          {showQuestionStage && activeQuestion && landedNumber !== null && (
            <motion.section
              ref={questionStageRef}
              key={activeQuestion.questionId}
              initial={reducedMotion ? false : { opacity: 1, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              aria-label={`Spinner Selected Question #${landedNumber}`}
              className="mt-6 rounded-2xl border border-cyan-400/30 glass-panel-elevated p-5 sm:p-8 shadow-[0_24px_64px_-24px_rgba(37,99,235,0.45)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                  <span className="font-mono-tabular rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-2.5 py-1 text-cyan-200 uppercase tracking-wider">
                    Spinner #{landedNumber}
                  </span>
                  <span className="rounded-lg border border-blue-400/35 bg-blue-500/15 px-2.5 py-1 text-blue-200 uppercase tracking-wider">
                    {activeQuestion.category}
                  </span>
                  <span className="font-mono-tabular rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-2.5 py-1 text-indigo-200">
                    {activeQuestion.points} PTS
                  </span>
                  <span className="rounded-lg border border-violet-400/35 bg-violet-500/15 px-2.5 py-1 text-violet-200">
                    {activeQuestion.difficulty}
                  </span>
                </div>

                <span className="font-mono-tabular text-[11px] text-slate-400">
                  Round {roundNumber}
                </span>
              </div>

              <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold leading-snug text-white">
                {activeQuestion.question}
              </h2>

              <div
                role="radiogroup"
                aria-label="Answer options"
                className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {activeQuestion.options.map((optionText, index) => {
                  const letter = OPTION_LETTERS[index];
                  const isSelected = selectedOption === optionText;
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

              {/* Submit Button Before Answer Evaluation */}
              {!isSubmitted && (
                <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
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

              {/* Answer Evaluation & NEXT ROUND Action (After Submission Only) */}
              {isSubmitted && isCorrectAnswer !== null && (
                <motion.div
                  initial={
                    reducedMotion
                      ? false
                      : isCorrectAnswer
                        ? { opacity: 1, scale: 0.96 }
                        : { opacity: 1, x: -6 }
                  }
                  animate={
                    reducedMotion
                      ? { opacity: 1 }
                      : isCorrectAnswer
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 1, x: [0, -5, 5, -3, 0] }
                  }
                  transition={{ duration: 0.28 }}
                  role="status"
                  aria-live="polite"
                  className={`mt-7 rounded-2xl border p-5 sm:p-6 ${
                    isCorrectAnswer
                      ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_16px_42px_-16px_rgba(16,185,129,0.45)]'
                      : 'border-rose-400/55 bg-rose-500/10 shadow-[0_16px_42px_-16px_rgba(244,63,94,0.4)]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        isCorrectAnswer
                          ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-300'
                          : 'border-rose-400/45 bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {isCorrectAnswer ? (
                        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-6 h-6" aria-hidden="true" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-display text-lg sm:text-xl font-bold tracking-wide ${
                          isCorrectAnswer ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {isCorrectAnswer ? 'CORRECT ANSWER' : 'INCORRECT ANSWER'}
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
                        Scoring & scoreboard totals activate in Part 7.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={handleNextRound}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(14,165,233,0.75)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      <span>NEXT ROUND</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.section>
          )}
        </>
      )}

      {/* Persistent Navigation Footer */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
        <button
          type="button"
          disabled={isSpinning}
          onClick={() => onNavigate('mode')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-sky-400/50 hover:text-white disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span>Switch Game Mode</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => onNavigate('scoreboard')}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-violet-400/50 hover:text-white disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            View Scoreboard
          </button>
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => onNavigate('results')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <span>Preview Results</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
