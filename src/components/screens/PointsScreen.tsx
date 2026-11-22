import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Crown } from 'lucide-react';
import { getCategoryById, POINT_LEVELS } from '../../data/quizCatalog';
import type { CategoryId, DifficultyTier, PointLevel } from '../../types/quiz';
import { CategoryIllustration } from '../illustrations/CategoryIllustrations';
import { CategoryIcon } from '../QuizIcons';

interface PointsScreenProps {
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  onSelectPoints: (points: PointLevel) => void;
  onChangeCategory: () => void;
  onContinueToMode: () => void;
}

function getTierStyles(
  value: PointLevel,
  tier: DifficultyTier,
  isSelected: boolean,
): string {
  if (isSelected) {
    return 'border-cyan-300 bg-gradient-to-b from-blue-600/40 via-indigo-700/35 to-violet-900/45 ring-2 ring-cyan-400/70 shadow-[0_16px_42px_-10px_rgba(34,211,238,0.55)]';
  }
  if (value === 1000) {
    return 'border-violet-400/60 bg-gradient-to-br from-[#1C1245]/95 via-[#131742]/95 to-[#09122E]/95 shadow-[0_12px_38px_-12px_rgba(139,92,246,0.48)] hover:border-cyan-300/80 hover:shadow-[0_16px_44px_-10px_rgba(34,211,238,0.45)]';
  }
  switch (tier) {
    case 'Easy':
      return 'border-cyan-500/25 bg-gradient-to-b from-[#0A1F38]/90 to-[#060E22]/95 hover:border-cyan-400/70 hover:shadow-[0_14px_34px_-10px_rgba(34,211,238,0.36)]';
    case 'Moderate':
      return 'border-blue-500/30 bg-gradient-to-b from-[#0C1D44]/90 to-[#070E24]/95 hover:border-blue-400/75 hover:shadow-[0_14px_34px_-10px_rgba(37,99,235,0.42)]';
    case 'Difficult':
      return 'border-indigo-500/35 bg-gradient-to-b from-[#131A48]/90 to-[#080D26]/95 hover:border-indigo-400/75 hover:shadow-[0_14px_34px_-10px_rgba(99,102,241,0.42)]';
    case 'Expert':
      return 'border-violet-500/40 bg-gradient-to-b from-[#191546]/90 to-[#090D26]/95 hover:border-violet-400/80 hover:shadow-[0_14px_38px_-10px_rgba(139,92,246,0.48)]';
  }
}

function getTierBadgeColor(tier: DifficultyTier): string {
  switch (tier) {
    case 'Easy':
      return 'text-cyan-300';
    case 'Moderate':
      return 'text-blue-300';
    case 'Difficult':
      return 'text-indigo-300';
    case 'Expert':
      return 'text-violet-300';
  }
}

function getTierBarCount(tier: DifficultyTier): number {
  switch (tier) {
    case 'Easy':
      return 1;
    case 'Moderate':
      return 2;
    case 'Difficult':
      return 3;
    case 'Expert':
      return 4;
  }
}

export const PointsScreen: FC<PointsScreenProps> = ({
  selectedCategory,
  selectedPoints,
  onSelectPoints,
  onChangeCategory,
  onContinueToMode,
}) => {
  const category = getCategoryById(selectedCategory);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-11">
      {/* Prominent Selected Category Banner */}
      {category && (
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 glass-panel-elevated p-4 sm:p-5 shadow-[0_16px_48px_-20px_rgba(37,99,235,0.4)]">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block shrink-0 rounded-xl border border-white/10 bg-[#040817]/80 p-1">
              <CategoryIllustration categoryId={category.id} compact />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
                <CategoryIcon
                  iconKey={category.iconKey}
                  className={`w-4 h-4 ${category.textAccentClass}`}
                />
                <span>Selected Category</span>
              </div>
              <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                {category.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {category.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onChangeCategory}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700/90 bg-slate-900/80 px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Change Category
            </button>

            {selectedPoints && (
              <button
                type="button"
                onClick={onContinueToMode}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shadow-[0_6px_24px_-6px_rgba(37,99,235,0.75)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <span>Continue to Modes</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border-b border-slate-800/80 pb-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
          Step 2 of 3 · Points Selection
        </p>
        <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Select Point Level
        </h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span>
              <strong className="font-semibold text-cyan-300">100–300:</strong> EASY
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span>
              <strong className="font-semibold text-blue-300">400–600:</strong> MODERATE
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span>
              <strong className="font-semibold text-indigo-300">700–800:</strong> DIFFICULT
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span>
              <strong className="font-semibold text-violet-300">900–1000:</strong> EXPERT
            </span>
          </div>
          <span className="text-slate-500">
            Provisional difficulty labels (calibrated in AI question system)
          </span>
        </div>
      </div>

      {/* 10 Individual Point Cards */}
      <div className="mt-7 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {POINT_LEVELS.map((level, index) => {
          const isSelected = selectedPoints === level.value;
          const barCount = getTierBarCount(level.tier);
          const isUltimate = level.value === 1000;

          return (
            <motion.button
              key={level.value}
              type="button"
              initial={{ opacity: 1, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, delay: index * 0.015, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectPoints(level.value)}
              aria-pressed={isSelected}
              aria-label={`${level.value} Points, ${level.tier} difficulty`}
              className={`group relative overflow-hidden flex min-h-[164px] flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${getTierStyles(
                level.value,
                level.tier,
                isSelected,
              )}`}
            >
              <div className="card-reflection pointer-events-none absolute inset-0" aria-hidden="true" />

              {/* Top Row: Difficulty + Intensity Signal Bars */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-bold tracking-[0.14em] uppercase ${getTierBadgeColor(
                    level.tier,
                  )}`}
                >
                  {level.tier}
                </span>

                <div className="flex items-center gap-1" aria-hidden="true">
                  {isUltimate ? (
                    <Crown className="w-4 h-4 text-cyan-300" />
                  ) : (
                    [1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={`h-2.5 w-1 rounded-full transition-colors ${
                          bar <= barCount
                            ? 'bg-cyan-300/90'
                            : 'bg-slate-700/70'
                        }`}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Center Large Animated Point Number */}
              <div className="relative z-10 my-3">
                <div className="font-mono-tabular text-3xl sm:text-4xl font-extrabold tracking-tight text-white transition-transform duration-200 group-hover:scale-105 origin-left">
                  {level.value}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  POINTS
                </div>
              </div>

              {/* Bottom Selection Affordance */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-semibold">
                <span className={isSelected ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'}>
                  {isSelected ? 'Selected' : isUltimate ? 'Ultimate Tier' : 'Select Points'}
                </span>
                {isSelected ? (
                  <Check className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                ) : (
                  <ArrowRight
                    className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-300"
                    aria-hidden="true"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
