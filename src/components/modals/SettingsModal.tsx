import { useEffect, type FC } from 'react';
import { motion } from 'motion/react';
import { Film, RotateCcw, Settings, Sparkles, Volume2, VolumeX, X } from 'lucide-react';

interface SettingsModalProps {
  soundEnabled: boolean;
  reducedMotion: boolean;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
  onReplayIntro: () => void;
  onResetSetup: () => void;
  onClose: () => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({
  soundEnabled,
  reducedMotion,
  onToggleSound,
  onToggleReducedMotion,
  onReplayIntro,
  onResetSetup,
  onClose,
}) => {
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
      aria-labelledby="settings-modal-title"
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
        className="relative z-10 w-full max-w-lg rounded-2xl border border-violet-400/25 glass-panel p-6 sm:p-8 shadow-[0_24px_80px_-16px_rgba(124,58,237,0.45)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/90 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/15 text-violet-300">
              <Settings className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="font-display text-xl font-bold text-white"
              >
                Settings
              </h2>
              <p className="text-xs text-slate-400">
                Audio, motion & session controls
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 divide-y divide-slate-800/80">
          {/* Sound Toggle */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold text-white">Sound Effects</p>
                <p className="text-xs text-slate-400">
                  UI clicks, selections, and intro audio
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={onToggleSound}
              className={`min-h-[38px] min-w-[76px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                soundEnabled
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-violet-300 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-white">Reduced Motion</p>
                <p className="text-xs text-slate-400">
                  Minimize particle & burst animations
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reducedMotion}
              onClick={onToggleReducedMotion}
              className={`min-h-[38px] min-w-[76px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                reducedMotion
                  ? 'border-violet-400/60 bg-violet-500/20 text-violet-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {reducedMotion ? 'Reduced' : 'Standard'}
            </button>
          </div>
        </div>

        {/* Utility Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/90 pt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onReplayIntro}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Film className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              <span>Replay Intro</span>
            </button>

            <button
              type="button"
              onClick={onResetSetup}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors hover:border-violet-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <RotateCcw className="w-4 h-4 text-violet-300" aria-hidden="true" />
              <span>Reset Setup</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
