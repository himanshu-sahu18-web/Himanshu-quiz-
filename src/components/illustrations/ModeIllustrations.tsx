import type { FC } from 'react';
import type { GameModeId } from '../../types/quiz';

interface ModeIllustrationProps {
  modeId: GameModeId;
}

const AiModeIllustration: FC = () => (
  <svg
    viewBox="0 0 280 165"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="mode-ai-aura" cx="50%" cy="50%" r="52%">
        <stop offset="0%" stopColor="rgba(34, 211, 238, 0.42)" />
        <stop offset="55%" stopColor="rgba(124, 58, 237, 0.24)" />
        <stop offset="100%" stopColor="rgba(4, 7, 18, 0)" />
      </radialGradient>
      <linearGradient id="mode-ai-brain" x1="100" y1="38" x2="180" y2="122" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>

    <circle cx="140" cy="84" r="76" fill="url(#mode-ai-aura)" />

    {/* Concentric holographic energy rings */}
    <ellipse cx="140" cy="84" rx="88" ry="28" transform="rotate(-16 140 84)" stroke="rgba(34, 211, 238, 0.55)" strokeWidth="1.5" />
    <ellipse cx="140" cy="84" rx="88" ry="28" transform="rotate(16 140 84)" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" strokeDasharray="6 4" />
    <circle cx="140" cy="84" r="54" stroke="rgba(56, 189, 248, 0.35)" strokeDasharray="3 5" />

    {/* Holographic AI Brain Core */}
    <g className="animate-float-gentle">
      <path
        d="M138 46C118 46 105 58 103 72C94 75 89 85 92 96C94 107 104 114 115 114H138V46Z"
        fill="url(#mode-ai-brain)"
        fillOpacity="0.88"
        stroke="#BAE6FD"
        strokeWidth="1.8"
      />
      <path
        d="M142 46C162 46 175 58 177 72C186 75 191 85 188 96C186 107 176 114 165 114H142V46Z"
        fill="url(#mode-ai-brain)"
        fillOpacity="0.88"
        stroke="#DDD6FE"
        strokeWidth="1.8"
      />

      {/* Circuit & neural spark nodes */}
      <path d="M112 72H128L134 62M168 72H152L146 62M116 96H130L138 86M164 96H150L142 86" stroke="#ECFEFF" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="112" cy="72" r="3" fill="#22D3EE" />
      <circle cx="168" cy="72" r="3" fill="#A78BFA" />
      <circle cx="116" cy="96" r="3" fill="#38BDF8" />
      <circle cx="164" cy="96" r="3" fill="#C4B5FD" />
      <circle cx="140" cy="76" r="4" fill="#FFFFFF" />
    </g>

    {/* Orbiting energy nodes */}
    <circle cx="58" cy="64" r="3.5" fill="#22D3EE" />
    <circle cx="222" cy="102" r="3.5" fill="#A78BFA" />
  </svg>
);

const SavedModeIllustration: FC = () => (
  <svg
    viewBox="0 0 280 165"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="mode-saved-aura" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
        <stop offset="100%" stopColor="rgba(4, 7, 18, 0)" />
      </radialGradient>
      <linearGradient id="mode-saved-card" x1="80" y1="36" x2="200" y2="136" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2E1065" />
        <stop offset="50%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#090D24" />
      </linearGradient>
      <linearGradient id="mode-saved-ribbon" x1="126" y1="24" x2="156" y2="112" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="55%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
    </defs>

    <circle cx="140" cy="84" r="76" fill="url(#mode-saved-aura)" />

    {/* Layered 3-Card Archive Fan */}
    <g transform="rotate(-11 140 96)">
      <rect x="86" y="42" width="108" height="84" rx="12" fill="#13163B" stroke="rgba(139, 92, 246, 0.45)" strokeWidth="1.5" />
    </g>
    <g transform="rotate(10 140 96)">
      <rect x="86" y="42" width="108" height="84" rx="12" fill="#171B45" stroke="rgba(96, 165, 250, 0.45)" strokeWidth="1.5" />
    </g>

    {/* Front Highlighted Card + Bookmark Ribbon */}
    <g className="animate-float-gentle">
      <rect x="84" y="38" width="112" height="90" rx="14" fill="url(#mode-saved-card)" stroke="#A78BFA" strokeWidth="2" />
      <path d="M100 72H144M100 88H176M100 104H162" stroke="rgba(221, 214, 254, 0.4)" strokeWidth="3" strokeLinecap="round" />

      {/* 3 Prepared Question Slots Indicator */}
      <circle cx="102" cy="54" r="4" fill="#22D3EE" />
      <circle cx="116" cy="54" r="4" fill="#818CF8" />
      <circle cx="130" cy="54" r="4" fill="#A78BFA" />

      {/* Glowing Bookmark Emblem */}
      <path
        d="M158 26H184V78L171 67L158 78V26Z"
        fill="url(#mode-saved-ribbon)"
        stroke="#F5F3FF"
        strokeWidth="1.5"
      />
    </g>
  </svg>
);

const SpinnerModeIllustration: FC = () => (
  <svg
    viewBox="0 0 280 165"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="mode-spin-aura" cx="50%" cy="52%" r="54%">
        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.36)" />
        <stop offset="60%" stopColor="rgba(124, 58, 237, 0.24)" />
        <stop offset="100%" stopColor="rgba(4, 7, 18, 0)" />
      </radialGradient>
    </defs>

    <circle cx="140" cy="86" r="76" fill="url(#mode-spin-aura)" />

    {/* 3D Wheel Base Rim */}
    <circle cx="140" cy="88" r="60" fill="#050B1D" stroke="rgba(34, 211, 238, 0.65)" strokeWidth="2.5" />

    {/* Six Illuminated Rotating Segments */}
    <g className="animate-spin-slow" style={{ transformOrigin: '140px 88px' }}>
      <path d="M140 88L140 34A54 54 0 0 1 186.7 61Z" fill="#0284C7" fillOpacity="0.82" stroke="rgba(186,230,253,0.4)" />
      <path d="M140 88L186.7 61A54 54 0 0 1 186.7 115Z" fill="#4F46E5" fillOpacity="0.82" stroke="rgba(186,230,253,0.4)" />
      <path d="M140 88L186.7 115A54 54 0 0 1 140 142Z" fill="#7C3AED" fillOpacity="0.82" stroke="rgba(186,230,253,0.4)" />
      <path d="M140 88L140 142A54 54 0 0 1 93.3 115Z" fill="#1D4ED8" fillOpacity="0.82" stroke="rgba(186,230,253,0.4)" />
      <path d="M140 88L93.3 115A54 54 0 0 1 93.3 61Z" fill="#0891B2" fillOpacity="0.82" stroke="rgba(186,230,253,0.4)" />
      <path d="M140 88L93.3 61A54 54 0 0 1 140 34Z" fill="#6D28D9" fillOpacity="0.82" stroke="rgba(186,230,253,0.4)" />
    </g>

    {/* Metallic Center Hub */}
    <circle cx="140" cy="88" r="15" fill="#091229" stroke="#22D3EE" strokeWidth="2.5" />
    <circle cx="140" cy="88" r="5" fill="#C4B5FD" />

    {/* Top Pointer Prism */}
    <path d="M140 38L131 20H149L140 38Z" fill="#22D3EE" stroke="#ECFEFF" strokeWidth="1.5" />
  </svg>
);

export const ModeIllustration: FC<ModeIllustrationProps> = ({ modeId }) => {
  return (
    <div className="h-36 sm:h-40 w-full">
      {modeId === 'ai-questions' && <AiModeIllustration />}
      {modeId === 'saved-questions' && <SavedModeIllustration />}
      {modeId === 'question-spinner' && <SpinnerModeIllustration />}
    </div>
  );
};
