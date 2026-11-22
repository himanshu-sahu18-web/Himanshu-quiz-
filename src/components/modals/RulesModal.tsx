import { useEffect, type FC } from 'react';
import { motion } from 'motion/react';
import { BookOpen, X } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: FC<RulesModalProps> = ({ onClose }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-[#02040B]/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-cyan-400/25 glass-panel p-6 sm:p-8 shadow-[0_24px_80px_-16px_rgba(37,99,235,0.45)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/90 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/15 text-cyan-300">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="rules-modal-title"
                className="font-display text-xl font-bold text-white"
              >
                Rules & Regulations
              </h2>
              <p className="text-xs text-slate-400">
                HIMANSHU QUIZ · Competition Framework
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Rules & Regulations"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
          <div>
            <h3 className="font-display text-sm font-semibold text-cyan-300 uppercase tracking-wider">
              1. Category Selection
            </h3>
            <p className="mt-1">
              Choose one of five competition arenas: Geography, Bollywood, Science, General Knowledge, or Sports & Games.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-blue-300 uppercase tracking-wider">
              2. Point Tiers (100 – 1000)
            </h3>
            <p className="mt-1">
              Select an independent point value across four provisional tiers: Easy (100–300), Moderate (400–600), Difficult (700–800), and Expert (900–1000).
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-violet-300 uppercase tracking-wider">
              3. Three Game Modes
            </h3>
            <p className="mt-1">
              Proceed into AI Questions, Saved Questions (three prepared questions), or Question Spinner (six randomized wheel slots). Active question generation and scoring rules activate in upcoming stages.
            </p>
          </div>
        </div>

        <div className="mt-7 flex justify-end border-t border-slate-800/90 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
