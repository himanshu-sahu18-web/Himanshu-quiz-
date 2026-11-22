import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { GAME_MODES, QUIZ_CATEGORIES } from '../../data/quizCatalog';
import type { CategoryId, ScreenId } from '../../types/quiz';
import { CategoryIcon, ModeIcon } from '../QuizIcons';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onQuickSelectCategory: (category: CategoryId) => void;
}

export const HomeScreen: FC<HomeScreenProps> = ({
  onNavigate,
  onQuickSelectCategory,
}) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
      {/* Main Hero Tournament Banner */}
      <motion.section
        initial={{ opacity: 1, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl border border-cyan-400/25 glass-panel-elevated p-6 sm:p-10 shadow-[0_28px_80px_-24px_rgba(37,99,235,0.48)]"
      >
        {/* Subtle edge accent lighting */}
        <div
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-600/24 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-500/18 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <p className="font-display text-xs sm:text-sm font-semibold tracking-[0.24em] text-cyan-300 uppercase">
              WELCOME TO
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white [text-wrap:balance] drop-shadow-[0_0_24px_rgba(56,189,248,0.28)]">
              HIMANSHU QUIZ
            </h1>
            <p className="mt-3 font-display text-base sm:text-xl font-semibold tracking-[0.14em] text-blue-200/95 uppercase">
              CHALLENGE YOUR KNOWLEDGE
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('category')}
                className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-8 py-3.5 text-sm sm:text-base font-bold tracking-wide text-white whitespace-nowrap shadow-[0_12px_38px_-6px_rgba(37,99,235,0.85)] transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>START QUIZ</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('scoreboard')}
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-slate-700/90 bg-slate-900/75 px-6 py-3 text-sm font-semibold text-slate-200 whitespace-nowrap transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                View Scoreboard
              </button>
            </div>
          </div>

          {/* Competition Scope Overview */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
            <h2 className="font-display text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase mb-4">
              Arena Structure
            </h2>
            <div className="divide-y divide-white/10">
              <div className="py-3 flex items-baseline justify-between gap-4">
                <span className="text-sm text-slate-300">Categories</span>
                <span className="font-mono-tabular text-base font-bold text-cyan-300">
                  5 Categories
                </span>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <span className="text-sm text-slate-300">Difficulty Scale</span>
                <span className="font-mono-tabular text-base font-bold text-blue-300">
                  10 Point Levels
                </span>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <span className="text-sm text-slate-300">Formats</span>
                <span className="font-mono-tabular text-base font-bold text-violet-300">
                  3 Game Modes
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick Category Arena Strip */}
      <section className="mt-8" aria-labelledby="quick-categories-heading">
        <div className="flex items-baseline justify-between gap-4 mb-3.5">
          <h2
            id="quick-categories-heading"
            className="font-display text-lg sm:text-xl font-semibold text-white"
          >
            5 Categories
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('category')}
            className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
          >
            <span>Open selector</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {QUIZ_CATEGORIES.map((category, index) => (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 1, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, delay: index * 0.015 }}
              onClick={() => onQuickSelectCategory(category.id)}
              className={`group relative overflow-hidden text-left rounded-xl border border-slate-800/90 glass-panel p-4 transition-all duration-200 hover:-translate-y-0.5 ${category.borderHoverClass} ${category.glowClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400`}
            >
              <div className="card-reflection pointer-events-none absolute inset-0" aria-hidden="true" />
              <div
                className={`relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg border ${category.iconBgClass}`}
              >
                <CategoryIcon iconKey={category.iconKey} className="w-5 h-5" />
              </div>
              <h3 className="relative z-10 mt-3 font-display text-base font-semibold text-white">
                {category.name}
              </h3>
              <p className="relative z-10 mt-1 text-xs text-slate-400 line-clamp-2">
                {category.tagline}
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 3 Game Modes Strip */}
      <section className="mt-8" aria-labelledby="modes-overview-heading">
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="modes-overview-heading"
            className="font-display text-lg sm:text-xl font-semibold text-white"
          >
            3 Game Modes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Select a category and point level to enter a mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onNavigate('category')}
              className={`group relative overflow-hidden text-left rounded-xl border border-slate-800/90 glass-panel p-5 transition-all duration-200 hover:-translate-y-0.5 ${mode.borderClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400`}
            >
              <div className="card-reflection pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="font-display text-base font-bold tracking-wide text-white">
                  {mode.name}
                </span>
                <ModeIcon
                  iconKey={mode.iconKey}
                  className={`w-5 h-5 shrink-0 ${mode.accentClass}`}
                />
              </div>
              <p className="relative z-10 mt-2 text-sm leading-relaxed text-slate-300">
                {mode.description}
              </p>
              <p className="relative z-10 mt-3 text-xs text-slate-500">
                {mode.questionCountLabel} · Setup required
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
