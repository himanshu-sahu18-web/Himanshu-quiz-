import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import {
  GAME_MODES,
  getCategoryById,
  getPointLevelByValue,
} from '../../data/quizCatalog';
import type { CategoryId, GameModeId, PointLevel } from '../../types/quiz';
import { ModeIllustration } from '../illustrations/ModeIllustrations';
import { CategoryIcon, ModeIcon } from '../QuizIcons';

interface ModeScreenProps {
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  selectedMode: GameModeId | null;
  onSelectMode: (mode: GameModeId) => void;
  onChangeCategory: () => void;
  onChangePoints: () => void;
}

function getModeButtonGradient(modeId: GameModeId): string {
  switch (modeId) {
    case 'ai-questions':
      return 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 shadow-[0_8px_28px_-6px_rgba(14,165,233,0.75)]';
    case 'saved-questions':
      return 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-[0_8px_28px_-6px_rgba(124,58,237,0.75)]';
    case 'question-spinner':
      return 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 shadow-[0_8px_28px_-6px_rgba(56,189,248,0.7)]';
  }
}

function getModePanelBg(modeId: GameModeId): string {
  switch (modeId) {
    case 'ai-questions':
      return 'from-[#071F3A]/95 via-[#07122B]/95 to-[#050919]/95';
    case 'saved-questions':
      return 'from-[#1B1142]/95 via-[#0F1133]/95 to-[#050919]/95';
    case 'question-spinner':
      return 'from-[#0A1F3E]/95 via-[#13123A]/95 to-[#050919]/95';
  }
}

export const ModeScreen: FC<ModeScreenProps> = ({
  selectedCategory,
  selectedPoints,
  selectedMode,
  onSelectMode,
  onChangeCategory,
  onChangePoints,
}) => {
  const category = getCategoryById(selectedCategory);
  const pointConfig = getPointLevelByValue(selectedPoints);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-11">
      <div className="border-b border-slate-800/80 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
          Step 3 of 3 · Game Mode Selection
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Select Game Mode
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
          {category && (
            <span className="inline-flex items-center gap-2 font-medium text-white">
              <CategoryIcon
                iconKey={category.iconKey}
                className={`w-4 h-4 ${category.textAccentClass}`}
              />
              <span>{category.name}</span>
            </span>
          )}
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          {pointConfig && (
            <span className="font-mono-tabular font-semibold text-cyan-300">
              {pointConfig.value} Points ({pointConfig.tier})
            </span>
          )}
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={onChangeCategory}
              className="font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
            >
              Edit Category
            </button>
            <button
              type="button"
              onClick={onChangePoints}
              className="font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
            >
              Edit Points
            </button>
          </div>
        </div>
      </div>

      {/* Three Large Premium Game Mode Panels */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {GAME_MODES.map((mode, index) => {
          const isSelected = selectedMode === mode.id;
          return (
            <motion.button
              key={mode.id}
              type="button"
              initial={{ opacity: 1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectMode(mode.id)}
              aria-pressed={isSelected}
              className={`group relative overflow-hidden flex flex-col justify-between text-left rounded-2xl border bg-gradient-to-b ${getModePanelBg(
                mode.id,
              )} p-6 transition-all duration-250 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isSelected
                  ? 'border-cyan-300 ring-2 ring-cyan-400/60 shadow-[0_20px_54px_-14px_rgba(34,211,238,0.5)]'
                  : `border-slate-800/90 ${mode.borderClass} hover:shadow-[0_18px_46px_-14px_rgba(37,99,235,0.45)]`
              }`}
            >
              <div className="card-reflection pointer-events-none absolute inset-0" aria-hidden="true" />

              <div className="relative z-10">
                {/* 3D-Style Holographic Illustration Showcase */}
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#040817]/75 mb-5 p-2">
                  <div className="flex items-center justify-between px-2 pt-1">
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${mode.iconBgClass}`}
                    >
                      <ModeIcon iconKey={mode.iconKey} className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <div className="transition-transform duration-300 group-hover:scale-[1.03]">
                    <ModeIllustration modeId={mode.id} />
                  </div>
                </div>

                <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                  {mode.name}
                </h2>
                <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${mode.accentClass}`}>
                  {mode.subtitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {mode.description}
                </p>
              </div>

              <div className="relative z-10 mt-7 border-t border-white/10 pt-5">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Format</span>
                  <span className="font-medium text-slate-200">{mode.questionCountLabel}</span>
                </div>

                <div
                  className={`inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all group-hover:brightness-110 ${getModeButtonGradient(
                    mode.id,
                  )}`}
                >
                  <span>
                    {mode.id === 'ai-questions'
                      ? 'Launch AI Questions'
                      : mode.id === 'saved-questions'
                        ? 'Open Saved Questions'
                        : 'Open Question Spinner'}
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
    </div>
  );
};
