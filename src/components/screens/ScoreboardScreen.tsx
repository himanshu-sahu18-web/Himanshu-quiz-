import type { FC } from 'react';
import { Play, Trophy } from 'lucide-react';
import type { ScreenId } from '../../types/quiz';

interface ScoreboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onBack: () => void;
}

export const ScoreboardScreen: FC<ScoreboardScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sky-400 uppercase">
            Standings Architecture
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Scoreboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Competition rankings and match records will populate once the scoring stage is enabled.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('category')}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap shrink-0 shadow-[0_6px_24px_-6px_rgba(37,99,235,0.75)] transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>New Match Setup</span>
        </button>
      </div>

      {/* Table Architecture Ready for Future Scoring Stage */}
      <section
        aria-label="Scoreboard Standings Table"
        className="mt-8 overflow-hidden rounded-2xl border border-cyan-400/20 glass-panel shadow-[0_24px_64px_-24px_rgba(37,99,235,0.3)]"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/90 bg-[#0B142B] text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th scope="col" className="py-3.5 px-5">
                  Rank
                </th>
                <th scope="col" className="py-3.5 px-5">
                  Player
                </th>
                <th scope="col" className="py-3.5 px-5">
                  Category
                </th>
                <th scope="col" className="py-3.5 px-5">
                  Mode
                </th>
                <th scope="col" className="py-3.5 px-5 text-right">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center">
                  <div className="mx-auto max-w-md flex flex-col items-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/90 text-sky-300">
                      <Trophy className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <h2 className="mt-4 font-display text-lg font-semibold text-white">
                      No Recorded Matches Yet
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Scoring rules and live leaderboard persistence are intentionally deferred to their dedicated development stage.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-sky-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      >
                        Return Back
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('home')}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-sky-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      >
                        Main Home
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
