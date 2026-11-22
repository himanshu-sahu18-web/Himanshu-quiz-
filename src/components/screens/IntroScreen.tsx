import { useEffect, useRef, useState, type FC } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { BrandEmblem } from '../BrandEmblem';

interface IntroScreenProps {
  soundEnabled: boolean;
  reducedMotion: boolean;
  onToggleSoundAndPlay: () => void;
  onEnter: () => void;
}

type IntroPhase = 'charging' | 'burst' | 'revealed';

const BURST_RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export const IntroScreen: FC<IntroScreenProps> = ({
  soundEnabled,
  reducedMotion,
  onToggleSoundAndPlay,
  onEnter,
}) => {
  const [phase, setPhase] = useState<IntroPhase>(
    reducedMotion ? 'revealed' : 'charging',
  );
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    if (reducedMotion) {
      setPhase('revealed');
      return;
    }

    setPhase('charging');
    const burstTimer = window.setTimeout(() => setPhase('burst'), 450);
    const revealTimer = window.setTimeout(() => setPhase('revealed'), 950);
    const enterTimer = window.setTimeout(() => onEnterRef.current(), 5500);

    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(enterTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'BUTTON' || activeTag === 'A') return;
        event.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <section
      aria-label="Cinematic Introduction"
      className="relative flex-1 flex flex-col items-center justify-center px-6 py-10 text-center overflow-hidden bg-[#02050E]/90"
    >
      {/* Top-right Intro Controls: Sound Toggle + Skip Intro */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSoundAndPlay}
          aria-label={soundEnabled ? 'Mute intro audio' : 'Enable intro sound'}
          aria-pressed={soundEnabled}
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            soundEnabled
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
              : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-300" aria-hidden="true" />
          ) : (
            <VolumeX className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>

        <button
          type="button"
          data-start="true"
          onClick={onEnter}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700/90 bg-slate-900/85 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors hover:border-cyan-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <span>Skip Intro</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Controlled Cinematic Energy Burst Stage */}
      {!reducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Pre-burst converging energy core */}
          <motion.div
            initial={{ scale: 1.9, opacity: 0 }}
            animate={
              phase === 'charging'
                ? { scale: 0.3, opacity: 0.85 }
                : { scale: 0.1, opacity: 0 }
            }
            transition={{ duration: 0.45, ease: 'easeIn' }}
            className="h-44 w-44 rounded-full bg-radial from-cyan-300/60 via-blue-600/35 to-transparent blur-xl"
          />

          {/* Controlled expansion shockwave ring */}
          <motion.div
            initial={{ scale: 0.15, opacity: 0 }}
            animate={
              phase === 'burst' || phase === 'revealed'
                ? { scale: 3.4, opacity: [0.95, 0.45, 0] }
                : { scale: 0.15, opacity: 0 }
            }
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute h-56 w-56 rounded-full border-2 border-cyan-300/75 shadow-[0_0_60px_rgba(34,211,238,0.65)]"
          />

          {/* Secondary violet energy wave */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={
              phase === 'burst' || phase === 'revealed'
                ? { scale: 2.5, opacity: [0.8, 0.3, 0] }
                : { scale: 0.2, opacity: 0 }
            }
            transition={{ duration: 1.05, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="absolute h-56 w-56 rounded-full border border-violet-400/70"
          />

          {/* Controlled radial light burst streaks */}
          {BURST_RAYS.map((angle) => (
            <motion.span
              key={angle}
              initial={{ opacity: 0, scaleY: 0.2 }}
              animate={
                phase === 'burst' || phase === 'revealed'
                  ? {
                      opacity: [0, 0.85, 0],
                      scaleY: [0.3, 1.5, 0.4],
                      y: [-20, -140],
                    }
                  : { opacity: 0 }
              }
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              style={{ rotate: `${angle}deg`, transformOrigin: 'center center' }}
              className="absolute h-20 w-0.5 rounded-full bg-gradient-to-t from-transparent via-cyan-300 to-white"
            />
          ))}
        </div>
      )}

      {/* Ambient halo behind revealed title */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[440px] w-[440px] rounded-full bg-gradient-to-tr from-blue-600/25 via-cyan-400/12 to-violet-600/25 blur-3xl animate-subtle-orbit"
        aria-hidden="true"
      />

      {/* Revealed Title Lockup */}
      <motion.div
        initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.82 }}
        animate={
          phase === 'revealed' || reducedMotion
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.82 }
        }
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-3xl mx-auto flex flex-col items-center"
      >
        <div className="mb-7 flex items-center justify-center rounded-2xl border border-cyan-400/35 bg-[#08122A]/90 p-5 shadow-[0_0_54px_-10px_rgba(34,211,238,0.5)]">
          <BrandEmblem size={76} />
        </div>

        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_0_28px_rgba(56,189,248,0.45)] [text-wrap:balance]">
          HIMANSHU QUIZ
        </h1>

        <motion.p
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          animate={
            phase === 'revealed' || reducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 12 }
          }
          transition={{ duration: 0.55, delay: reducedMotion ? 0 : 0.25 }}
          className="mt-4 font-display text-sm sm:text-lg font-semibold tracking-[0.24em] text-cyan-300 uppercase"
        >
          THINK FAST. ANSWER SMART. WIN BIG.
        </motion.p>

        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={
            phase === 'revealed' || reducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 10 }
          }
          transition={{ duration: 0.45, delay: reducedMotion ? 0 : 0.45 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={onEnter}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_8px_32px_-6px_rgba(37,99,235,0.8)] transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span>Enter Main Home</span>
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </motion.div>

        <p className="mt-7 text-xs text-slate-400 tracking-wide">
          {reducedMotion
            ? 'Reduced motion active · Press Enter or click to continue'
            : 'Transitioning to dashboard automatically · Press Enter or Skip Intro'}
        </p>
      </motion.div>
    </section>
  );
};
