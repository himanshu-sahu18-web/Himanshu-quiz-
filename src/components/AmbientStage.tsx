import type { FC } from 'react';
import type { ScreenId } from '../types/quiz';

interface AmbientStageProps {
  reducedMotion?: boolean;
  intensity?: 'intro' | 'stage';
  currentScreen?: ScreenId;
}

const PARTICLES = [
  { id: 1, left: '6%', top: '16%', size: 3, delay: '0s', duration: '7s', color: 'bg-cyan-300' },
  { id: 2, left: '15%', top: '74%', size: 2, delay: '1.2s', duration: '9s', color: 'bg-sky-400' },
  { id: 3, left: '28%', top: '26%', size: 2, delay: '2.4s', duration: '8s', color: 'bg-violet-300' },
  { id: 4, left: '39%', top: '84%', size: 3, delay: '0.6s', duration: '10s', color: 'bg-blue-400' },
  { id: 5, left: '53%', top: '12%', size: 2, delay: '1.8s', duration: '8.5s', color: 'bg-cyan-200' },
  { id: 6, left: '64%', top: '66%', size: 3, delay: '3.1s', duration: '9.5s', color: 'bg-violet-400' },
  { id: 7, left: '77%', top: '22%', size: 2, delay: '0.9s', duration: '7.8s', color: 'bg-sky-300' },
  { id: 8, left: '86%', top: '79%', size: 3, delay: '2.1s', duration: '11s', color: 'bg-blue-300' },
  { id: 9, left: '12%', top: '44%', size: 2, delay: '1.5s', duration: '8.2s', color: 'bg-cyan-400' },
  { id: 10, left: '91%', top: '40%', size: 2, delay: '2.8s', duration: '9.2s', color: 'bg-indigo-300' },
  { id: 11, left: '47%', top: '48%', size: 2, delay: '0.4s', duration: '10.5s', color: 'bg-cyan-300' },
  { id: 12, left: '71%', top: '88%', size: 2, delay: '1.9s', duration: '8.8s', color: 'bg-violet-300' },
] as const;

function getScreenLightingPreset(screen?: ScreenId): {
  orbLeft: string;
  orbRight: string;
} {
  switch (screen) {
    case 'category':
      return {
        orbLeft: 'bg-cyan-500/18',
        orbRight: 'bg-blue-600/20',
      };
    case 'points':
      return {
        orbLeft: 'bg-blue-600/20',
        orbRight: 'bg-violet-600/22',
      };
    case 'mode':
      return {
        orbLeft: 'bg-violet-600/20',
        orbRight: 'bg-cyan-500/18',
      };
    case 'question-spinner':
    case 'results':
      return {
        orbLeft: 'bg-indigo-600/22',
        orbRight: 'bg-violet-500/22',
      };
    default:
      return {
        orbLeft: 'bg-blue-600/18',
        orbRight: 'bg-violet-600/16',
      };
  }
}

export const AmbientStage: FC<AmbientStageProps> = ({
  reducedMotion = false,
  intensity = 'stage',
  currentScreen,
}) => {
  const beamOpacity = intensity === 'intro' ? 'opacity-90' : 'opacity-65';
  const preset = getScreenLightingPreset(currentScreen);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Fine geometric blueprint grid */}
      <div className="absolute inset-0 arena-grid-bg opacity-65" />

      {/* Subtle diagonal geometric radial ring pattern */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] opacity-[0.04]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <circle cx="400" cy="400" r="240" stroke="#38BDF8" strokeWidth="1" strokeDasharray="6 8" />
        <circle cx="400" cy="400" r="350" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 10" />
        <polygon points="400,70 685,235 685,565 400,730 115,565 115,235" stroke="#2563EB" strokeWidth="1" />
      </svg>

      {/* Atmospheric radial glow */}
      <div
        className={`absolute inset-0 arena-radial-glow ${
          reducedMotion ? '' : 'animate-gradient-drift'
        }`}
      />

      {/* Slow-moving glowing orbs */}
      <div
        className={`absolute -top-28 -left-24 h-96 w-96 rounded-full blur-3xl transition-colors duration-700 ${preset.orbLeft} ${
          reducedMotion ? '' : 'animate-orb-a'
        }`}
      />
      <div
        className={`absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full blur-3xl transition-colors duration-700 ${preset.orbRight} ${
          reducedMotion ? '' : 'animate-orb-b'
        }`}
      />

      {/* Controlled sweeping light beams */}
      <div
        className={`absolute -top-1/3 left-1/4 h-[140%] w-64 bg-gradient-to-b from-cyan-400/14 via-blue-600/10 to-transparent blur-3xl ${beamOpacity} ${
          reducedMotion ? '' : 'animate-beam-sweep'
        }`}
      />
      <div
        className={`absolute -top-1/4 right-1/4 h-[130%] w-56 bg-gradient-to-b from-violet-500/14 via-indigo-600/10 to-transparent blur-3xl ${beamOpacity} ${
          reducedMotion ? '' : 'animate-beam-sweep-reverse'
        }`}
      />

      {/* Slow-moving energy particles */}
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className={`absolute rounded-full ${p.color} opacity-35`}
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: reducedMotion
              ? 'none'
              : `particle-float ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
};
