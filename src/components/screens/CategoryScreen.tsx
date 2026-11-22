import type { FC } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { QUIZ_CATEGORIES } from '../../data/quizCatalog';
import type { CategoryId } from '../../types/quiz';
import { CategoryIllustration } from '../illustrations/CategoryIllustrations';
import { CategoryIcon } from '../QuizIcons';

interface CategoryScreenProps {
  selectedCategory: CategoryId | null;
  onSelectCategory: (category: CategoryId) => void;
  onContinueToPoints: () => void;
}

function getCategoryEnvironmentBg(id: CategoryId): string {
  switch (id) {
    case 'geography':
      return 'from-[#062238]/90 via-[#07152B]/95 to-[#040919]/95';
    case 'bollywood':
      return 'from-[#231048]/85 via-[#110D2D]/95 to-[#060919]/95';
    case 'science':
      return 'from-[#0A1E46]/90 via-[#08132D]/95 to-[#040919]/95';
    case 'general-knowledge':
      return 'from-[#16194A]/90 via-[#0C112E]/95 to-[#040919]/95';
    case 'sports-games':
      return 'from-[#0A253A]/90 via-[#0B142C]/95 to-[#040919]/95';
  }
}

export const CategoryScreen: FC<CategoryScreenProps> = ({
  selectedCategory,
  onSelectCategory,
  onContinueToPoints,
}) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-11">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
            Step 1 of 3 · Category Selection
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Choose Your Arena
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Select one of the five themed competition categories to begin level setup.
          </p>
        </div>

        {selectedCategory && (
          <button
            type="button"
            onClick={onContinueToPoints}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap shrink-0 shadow-[0_8px_28px_-6px_rgba(37,99,235,0.8)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span>Continue to Points</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {QUIZ_CATEGORIES.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          const spanClass =
            index < 2
              ? 'lg:col-span-3'
              : index === 4
                ? 'md:col-span-2 lg:col-span-2'
                : 'lg:col-span-2';
          return (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.025, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectCategory(category.id)}
              aria-pressed={isSelected}
              className={`group relative overflow-hidden flex flex-col justify-between text-left rounded-2xl border bg-gradient-to-b ${getCategoryEnvironmentBg(
                category.id,
              )} p-5 sm:p-6 transition-all duration-250 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${spanClass} ${
                isSelected
                  ? `ring-2 ${category.ringClass} shadow-[0_20px_54px_-14px_rgba(34,211,238,0.5)]`
                  : `border-slate-800/90 ${category.borderHoverClass} ${category.glowClass}`
              }`}
            >
              {/* Light reflection sweep layer */}
              <div className="card-reflection pointer-events-none absolute inset-0" aria-hidden="true" />

              {/* Large Central 3D-Style Scene */}
              <div className="relative z-10 overflow-hidden rounded-xl border border-white/10 bg-[#040817]/75 mb-5">
                <div className="flex items-center justify-between px-3.5 pt-3">
                  <div
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${category.iconBgClass}`}
                  >
                    <CategoryIcon iconKey={category.iconKey} className="w-4 h-4" />
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-slate-400">
                    0{index + 1}
                  </span>
                </div>

                <div className="px-2 pb-2 transition-transform duration-300 group-hover:scale-[1.03]">
                  <CategoryIllustration categoryId={category.id} />
                </div>
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                    {category.name}
                  </h2>
                  <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${category.textAccentClass}`}>
                    {category.tagline}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    {category.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="font-mono-tabular text-xs text-slate-400">
                    100 – 1000 PTS
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                      isSelected
                        ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-200'
                        : 'border-white/15 bg-white/5 text-slate-100 group-hover:border-cyan-400/50 group-hover:bg-blue-600/25 group-hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>SELECTED</span>
                      </>
                    ) : (
                      <>
                        <span>SELECT CATEGORY</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
