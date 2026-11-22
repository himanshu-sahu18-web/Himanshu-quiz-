import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Send,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { getCategoryById, getPointLevelByValue } from '../../data/quizCatalog';
import {
  getSavedQuestionsFor,
  isValidSavedQuestion,
} from '../../data/savedQuestionBank';
import type {
  CategoryId,
  PointLevel,
  SavedQuestion,
  ScreenId,
} from '../../types/quiz';
import {
  playClickSound,
  playCorrectSound,
  playIncorrectSound,
  playTransitionSound,
} from '../../utils/soundEffects';
import { CategoryIcon } from '../QuizIcons';

interface SavedQuestionsScreenProps {
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  activeSlot: number;
  soundEnabled: boolean;
  reducedMotion: boolean;
  onSelectSlot: (slot: number) => void;
  onNavigate: (screen: ScreenId) => void;
}

interface SavedAnswerRecord {
  selectedOption: string;
  isCorrect: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const CARD_THEMES = [
  {
    label: 'Card 01',
    accentText: 'text-cyan-300',
    badgeBorder: 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200',
    idleBorder: 'border-cyan-500/25 hover:border-cyan-400/70',
    activeBorder:
      'border-cyan-300 ring-2 ring-cyan-400/65 shadow-[0_18px_46px_-14px_rgba(34,211,238,0.5)]',
    gradientBg: 'from-[#07213B]/95 via-[#07132D]/95 to-[#050919]/95',
    btnGradient: 'from-cyan-500 to-blue-600',
  },
  {
    label: 'Card 02',
    accentText: 'text-blue-300',
    badgeBorder: 'border-blue-400/35 bg-blue-500/15 text-blue-200',
    idleBorder: 'border-blue-500/25 hover:border-blue-400/70',
    activeBorder:
      'border-blue-300 ring-2 ring-blue-400/65 shadow-[0_18px_46px_-14px_rgba(59,130,246,0.5)]',
    gradientBg: 'from-[#0A1D47]/95 via-[#08122E]/95 to-[#050919]/95',
    btnGradient: 'from-blue-600 to-indigo-600',
  },
  {
    label: 'Card 03',
    accentText: 'text-violet-300',
    badgeBorder: 'border-violet-400/35 bg-violet-500/15 text-violet-200',
    idleBorder: 'border-violet-500/25 hover:border-violet-400/70',
    activeBorder:
      'border-violet-300 ring-2 ring-violet-400/65 shadow-[0_18px_46px_-14px_rgba(139,92,246,0.5)]',
    gradientBg: 'from-[#1D1144]/95 via-[#101133]/95 to-[#050919]/95',
    btnGradient: 'from-violet-600 to-indigo-600',
  },
] as const;

export const SavedQuestionsScreen: FC<SavedQuestionsScreenProps> = ({
  selectedCategory,
  selectedPoints,
  activeSlot,
  soundEnabled,
  reducedMotion,
  onSelectSlot,
  onNavigate,
}) => {
  const category = getCategoryById(selectedCategory);
  const pointConfig = getPointLevelByValue(selectedPoints);

  const deckQuestions = useMemo(
    () => getSavedQuestionsFor(selectedCategory, selectedPoints),
    [selectedCategory, selectedPoints],
  );

  const [viewMode, setViewMode] = useState<'deck' | 'play'>('deck');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answeredById, setAnsweredById] = useState<Record<string, SavedAnswerRecord>>({});

  // Reset to 3-card selector cleanly whenever category or points changes
  useEffect(() => {
    setViewMode('deck');
    setSelectedOption(null);
  }, [selectedCategory, selectedPoints]);

  const activeQuestion: SavedQuestion | null =
    deckQuestions[Math.max(0, Math.min(2, activeSlot - 1))] ?? null;
  const activeAnswerRecord = activeQuestion
    ? answeredById[activeQuestion.questionId]
    : undefined;
  const isSubmitted = Boolean(activeAnswerRecord);

  const handleOpenQuestionCard = (slotNumber: number) => {
    playTransitionSound(soundEnabled);
    onSelectSlot(slotNumber);
    const targetQ = deckQuestions[slotNumber - 1];
    const priorAnswer = targetQ ? answeredById[targetQ.questionId] : undefined;
    setSelectedOption(priorAnswer ? priorAnswer.selectedOption : null);
    setViewMode('play');
  };

  const handleSelectOption = (optionText: string) => {
    if (isSubmitted) return;
    playClickSound(soundEnabled);
    setSelectedOption(optionText);
  };

  const handleSubmitAnswer = () => {
    if (!activeQuestion || !isValidSavedQuestion(activeQuestion) || !selectedOption || isSubmitted) {
      return;
    }

    const isCorrect =
      selectedOption.trim().toLowerCase() === activeQuestion.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      playCorrectSound(soundEnabled);
    } else {
      playIncorrectSound(soundEnabled);
    }

    setAnsweredById((prev) => ({
      ...prev,
      [activeQuestion.questionId]: {
        selectedOption,
        isCorrect,
      },
    }));
  };

  const handleReturnToDeck = () => {
    playClickSound(soundEnabled);
    setViewMode('deck');
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
      {/* Header & Active Setup Metadata */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
              Game Mode · Saved Questions
            </p>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
              Saved Questions Deck
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
              {pointConfig?.tier ?? 'Not Selected'}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: THREE VISUALLY DISTINCT SAVED QUESTION CARDS */}
      {viewMode === 'deck' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Choose One Prepared Question ({deckQuestions.length} Available)
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Select any of the three prepared challenges below for{' '}
                <span className="font-semibold text-white">{category?.name}</span> at{' '}
                <span className="font-mono-tabular font-semibold text-cyan-300">
                  {pointConfig?.value} Points
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('mode')}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/75 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Modes</span>
            </button>
          </div>

          {deckQuestions.length === 0 ? (
            <div
              role="alert"
              className="rounded-2xl border border-amber-400/35 glass-panel p-6 sm:p-8 text-center"
            >
              <AlertTriangle className="w-8 h-8 text-amber-300 mx-auto" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-bold text-white">
                No Saved Questions Found
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Select a valid category and point level to view its prepared question deck.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {deckQuestions.map((questionItem, index) => {
                const slotNumber = index + 1;
                const theme = CARD_THEMES[index] ?? CARD_THEMES[0];
                const isSelected = activeSlot === slotNumber;
                const priorAnswer = answeredById[questionItem.questionId];

                return (
                  <motion.button
                    key={questionItem.questionId}
                    type="button"
                    initial={reducedMotion ? false : { opacity: 1, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.18,
                      delay: index * 0.03,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                    onClick={() => handleOpenQuestionCard(slotNumber)}
                    aria-pressed={isSelected}
                    className={`group relative overflow-hidden flex flex-col justify-between text-left rounded-2xl border bg-gradient-to-b ${theme.gradientBg} p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected ? theme.activeBorder : theme.idleBorder
                    }`}
                  >
                    <div
                      className="card-reflection pointer-events-none absolute inset-0"
                      aria-hidden="true"
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${theme.badgeBorder}`}
                        >
                          <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{theme.label}</span>
                        </span>

                        {priorAnswer ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              priorAnswer.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {priorAnswer.isCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{priorAnswer.isCorrect ? 'Correct' : 'Incorrect'}</span>
                          </span>
                        ) : (
                          <span className="font-mono-tabular text-xs font-semibold text-slate-400">
                            {questionItem.points} PTS
                          </span>
                        )}
                      </div>

                      <h3 className="mt-5 font-display text-2xl font-bold text-white">
                        Question {slotNumber} of 3
                      </h3>
                      <p
                        className={`mt-1 text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}
                      >
                        {questionItem.category} · {questionItem.difficulty}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">
                        {priorAnswer
                          ? 'Completed in this session. Open to review your answer and explanation.'
                          : `Curated ${questionItem.difficulty.toLowerCase()}-tier challenge ready with four multiple-choice options.`}
                      </p>
                    </div>

                    <div className="relative z-10 mt-6 border-t border-white/10 pt-4">
                      <div
                        className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${theme.btnGradient} px-4 py-2.5 text-sm font-semibold text-white transition-all group-hover:brightness-110`}
                      >
                        <span>
                          {priorAnswer
                            ? `Review Question ${slotNumber}`
                            : `Open Question ${slotNumber}`}
                        </span>
                        <ArrowRight
                          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Persistent Footer Links */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-5">
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
        </div>
      )}

      {/* VIEW 2: SAVED QUESTION PLAY & ANSWER EVALUATION INTERFACE */}
      {viewMode === 'play' && (
        <section
          aria-label={`Saved Question ${activeSlot} Play Stage`}
          className="mt-6 rounded-2xl border border-cyan-400/25 glass-panel-elevated p-5 sm:p-8 shadow-[0_24px_64px_-24px_rgba(37,99,235,0.4)]"
        >
          {!isValidSavedQuestion(activeQuestion) ? (
            <div role="alert" className="py-6 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-300 mx-auto" aria-hidden="true" />
              <h2 className="mt-3 font-display text-xl font-bold text-white">
                Question Data Unavailable
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                This saved question could not be verified. Please return and choose another card.
              </p>
              <button
                type="button"
                onClick={handleReturnToDeck}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back to 3 Questions</span>
              </button>
            </div>
          ) : (
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
                  <span className="font-mono-tabular rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
                    Question {activeSlot} of 3
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReturnToDeck}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/75 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Back to 3 Questions</span>
                </button>
              </div>

              {/* Question Prompt */}
              <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold leading-snug text-white">
                {activeQuestion.question}
              </h2>

              {/* Four Answer Options (A, B, C, D) */}
              <div
                role="radiogroup"
                aria-label="Answer options"
                className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {activeQuestion.options.map((optionText, index) => {
                  const letter = OPTION_LETTERS[index];
                  const activeSelection = isSubmitted
                    ? activeAnswerRecord?.selectedOption
                    : selectedOption;
                  const isSelected = activeSelection === optionText;
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
                    cardClasses =
                      'border-slate-800/80 bg-[#050A18]/80 text-slate-400 opacity-75';
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
              {!isSubmitted && (
                <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={handleReturnToDeck}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700/85 bg-slate-900/80 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Choose Another Card</span>
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

              {/* Answer Evaluation & Explanation (Revealed Only After Submission) */}
              {isSubmitted && activeAnswerRecord && (
                <motion.div
                  initial={
                    reducedMotion
                      ? false
                      : activeAnswerRecord.isCorrect
                        ? { opacity: 1, scale: 0.96 }
                        : { opacity: 1, x: -6 }
                  }
                  animate={
                    reducedMotion
                      ? { opacity: 1 }
                      : activeAnswerRecord.isCorrect
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 1, x: [0, -5, 5, -3, 0] }
                  }
                  transition={{ duration: 0.28 }}
                  role="status"
                  aria-live="polite"
                  className={`mt-7 rounded-2xl border p-5 sm:p-6 ${
                    activeAnswerRecord.isCorrect
                      ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_16px_42px_-16px_rgba(16,185,129,0.45)]'
                      : 'border-rose-400/55 bg-rose-500/10 shadow-[0_16px_42px_-16px_rgba(244,63,94,0.4)]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        activeAnswerRecord.isCorrect
                          ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-300'
                          : 'border-rose-400/45 bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {activeAnswerRecord.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-6 h-6" aria-hidden="true" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-display text-lg sm:text-xl font-bold tracking-wide ${
                          activeAnswerRecord.isCorrect
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                        }`}
                      >
                        {activeAnswerRecord.isCorrect ? 'CORRECT ANSWER' : 'INCORRECT ANSWER'}
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
                        Scoring & scoreboard totals connect in Part 7.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={handleReturnToDeck}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(14,165,233,0.75)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      <span>Back to 3 Questions</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Persistent Footer Links */}
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
      )}
    </div>
  );
};
