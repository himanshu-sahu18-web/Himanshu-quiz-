import type { FC } from 'react';
import { Award, BarChart3, Home, RotateCcw } from 'lucide-react';
import {
  getCategoryById,
  getGameModeById,
  getPointLevelByValue,
} from '../../data/quizCatalog';
import type {
  CategoryId,
  GameModeId,
  PointLevel,
  ScreenId,
} from '../../types/quiz';

interface ResultsScreenProps {
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  selectedMode: GameModeId | null;
  onResetSetup: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const ResultsScreen: FC<ResultsScreenProps> = ({
  selectedCategory,
  selectedPoints,
  selectedMode,
  onResetSetup,
  onNavigate,
}) => {
  const category = getCategoryById(selectedCategory);
  const pointConfig = getPointLevelByValue(selectedPoints);
  const mode = getGameModeById(selectedMode);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <section className="rounded-2xl border border-violet-400/25 glass-panel p-6 sm:p-10 shadow-[0_24px_64px_-24px_rgba(124,58,237,0.35)]">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-400/35 bg-violet-500/15 text-violet-300">
            <Award className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-violet-300 uppercase">
              Post-Match Summary
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Game Results
            </h1>
          </div>
        </div>

        <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-300">
          This foundational summary screen confirms your active setup configuration. Final score totals and accuracy metrics will be computed here once scoring is implemented in its dedicated stage.
        </p>

        {/* Active Setup Breakdown */}
        <dl className="mt-7 divide-y divide-slate-800/80 border-y border-slate-800/80">
          <div className="py-4 flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-400">Category</dt>
            <dd className="text-sm sm:text-base font-semibold text-white">
              {category?.name ?? 'Not selected'}
            </dd>
          </div>
          <div className="py-4 flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-400">Point Tier</dt>
            <dd className="font-mono-tabular text-sm sm:text-base font-semibold text-sky-300">
              {pointConfig ? `${pointConfig.value} Points (${pointConfig.tier})` : 'Not selected'}
            </dd>
          </div>
          <div className="py-4 flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-400">Game Mode</dt>
            <dd className="text-sm sm:text-base font-semibold text-violet-300">
              {mode?.name ?? 'Not selected'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onResetSetup}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_24px_-6px_rgba(37,99,235,0.75)] transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>New Setup</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('scoreboard')}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-violet-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <BarChart3 className="w-4 h-4 text-violet-300" aria-hidden="true" />
            <span>Open Scoreboard</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-sky-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Main Home</span>
          </button>
        </div>
      </section>
    </div>
  );
};
