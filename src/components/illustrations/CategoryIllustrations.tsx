import type { FC } from 'react';
import type { CategoryId } from '../../types/quiz';

interface CategorySceneProps {
  categoryId: CategoryId;
  compact?: boolean;
}

const GeographyScene: FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="geo-ocean" cx="38%" cy="32%" r="68%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="42%" stopColor="#0369A1" />
        <stop offset="85%" stopColor="#082F49" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
      <radialGradient id="geo-atmo" cx="50%" cy="50%" r="55%">
        <stop offset="70%" stopColor="rgba(34, 211, 238, 0)" />
        <stop offset="92%" stopColor="rgba(34, 211, 238, 0.35)" />
        <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
      </radialGradient>
      <linearGradient id="geo-land" x1="100" y1="35" x2="220" y2="145" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>

    {/* Coordinate grid & starry sky backdrop */}
    <path d="M20 40H300M20 90H300M20 140H300" stroke="rgba(56,189,248,0.1)" strokeDasharray="3 5" />
    <path d="M70 15V165M160 15V165M250 15V165" stroke="rgba(56,189,248,0.1)" strokeDasharray="3 5" />
    <circle cx="44" cy="32" r="1.5" fill="#7DD3FC" opacity="0.7" />
    <circle cx="276" cy="46" r="1.8" fill="#A5F3FC" opacity="0.8" />
    <circle cx="264" cy="142" r="1.5" fill="#38BDF8" opacity="0.6" />
    <circle cx="58" cy="138" r="1.2" fill="#E0F2FE" opacity="0.6" />

    {/* Atmospheric halo */}
    <circle cx="160" cy="92" r="68" fill="url(#geo-atmo)" />

    {/* Tilted orbital coordinate ring */}
    <ellipse
      cx="160"
      cy="92"
      rx="88"
      ry="24"
      transform="rotate(-18 160 92)"
      stroke="rgba(34, 211, 238, 0.38)"
      strokeWidth="1.2"
      strokeDasharray="5 4"
    />

    {/* 3D Earth Sphere */}
    <circle cx="160" cy="92" r="56" fill="url(#geo-ocean)" stroke="rgba(103, 232, 249, 0.5)" strokeWidth="1.5" />

    {/* Latitude / Longitude meridians */}
    <ellipse cx="160" cy="92" rx="28" ry="56" stroke="rgba(186, 230, 253, 0.22)" strokeWidth="1" />
    <ellipse cx="160" cy="92" rx="56" ry="20" stroke="rgba(186, 230, 253, 0.2)" strokeWidth="1" />
    <path d="M106 76Q160 66 214 76" stroke="rgba(186, 230, 253, 0.18)" strokeWidth="1" />
    <path d="M108 112Q160 122 212 112" stroke="rgba(186, 230, 253, 0.18)" strokeWidth="1" />

    {/* Illuminated stylized continents */}
    <path
      d="M124 62C132 54 146 53 152 60C156 65 148 74 142 78C136 82 140 94 134 98C126 102 118 89 118 79C118 71 120 66 124 62Z"
      fill="url(#geo-land)"
      opacity="0.88"
    />
    <path
      d="M164 56C177 52 194 59 198 70C201 79 192 86 186 92C180 98 184 114 174 122C167 127 159 116 158 104C157 93 162 84 159 74C157 65 157 59 164 56Z"
      fill="url(#geo-land)"
      opacity="0.92"
    />
    <path
      d="M194 104C202 102 208 108 205 117C202 124 192 125 189 118C186 112 188 106 194 104Z"
      fill="url(#geo-land)"
      opacity="0.82"
    />

    {/* Atmospheric cloud wisps */}
    <path d="M118 68C138 62 162 63 182 70" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M142 118C164 124 186 121 200 112" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />

    {/* Floating glowing location markers */}
    <g className="animate-float-gentle">
      <path d="M136 42C136 37.5 139.5 34 144 34C148.5 34 152 37.5 152 42C152 47.5 144 55 144 55C144 55 136 47.5 136 42Z" fill="#22D3EE" stroke="#ECFEFF" strokeWidth="1.2" />
      <circle cx="144" cy="42" r="2.5" fill="#083344" />
    </g>
    <g>
      <path d="M188 54C188 50 191 47 195 47C199 47 202 50 202 54C202 59 195 65 195 65C195 65 188 59 188 54Z" fill="#38BDF8" stroke="#F0F9FF" strokeWidth="1.2" />
      <circle cx="195" cy="54" r="2.2" fill="#082F49" />
    </g>
    <circle cx="232" cy="70" r="3" fill="#22D3EE" />
    <circle cx="232" cy="70" r="7" stroke="rgba(34,211,238,0.45)" strokeWidth="1" />
  </svg>
);

const BollywoodScene: FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bolly-beam-l" x1="30" y1="0" x2="170" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(167, 139, 250, 0.36)" />
        <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
      </linearGradient>
      <linearGradient id="bolly-beam-r" x1="290" y1="0" x2="150" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.28)" />
        <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
      </linearGradient>
      <linearGradient id="bolly-body" x1="108" y1="68" x2="218" y2="138" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B277A" />
        <stop offset="50%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#090D24" />
      </linearGradient>
      <radialGradient id="bolly-lens" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="45%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </radialGradient>
    </defs>

    {/* Stage spotlight beams */}
    <polygon points="18,0 74,0 205,178 125,178" fill="url(#bolly-beam-l)" />
    <polygon points="302,0 246,0 115,178 195,178" fill="url(#bolly-beam-r)" />

    {/* Filmstrip ribbon in background */}
    <path d="M18 138C76 116 244 156 302 128" stroke="rgba(167, 139, 250, 0.28)" strokeWidth="14" strokeLinecap="round" />
    <path d="M18 138C76 116 244 156 302 128" stroke="#090D24" strokeWidth="8" strokeDasharray="6 6" />

    {/* Dual 3D Film Reels */}
    <g className="animate-spin-slow" style={{ transformOrigin: '132px 54px' }}>
      <circle cx="132" cy="54" r="24" fill="#17153B" stroke="#A78BFA" strokeWidth="2" />
      <circle cx="132" cy="54" r="7" fill="#090D24" stroke="#C4B5FD" strokeWidth="1.5" />
      <circle cx="132" cy="39" r="3.5" fill="#2E1065" />
      <circle cx="145" cy="61" r="3.5" fill="#2E1065" />
      <circle cx="119" cy="61" r="3.5" fill="#2E1065" />
    </g>
    <g className="animate-spin-slow" style={{ transformOrigin: '182px 58px' }}>
      <circle cx="182" cy="58" r="20" fill="#17153B" stroke="#818CF8" strokeWidth="2" />
      <circle cx="182" cy="58" r="6" fill="#090D24" stroke="#A5B4FC" strokeWidth="1.5" />
      <circle cx="182" cy="46" r="3" fill="#2E1065" />
      <circle cx="192" cy="64" r="3" fill="#2E1065" />
      <circle cx="172" cy="64" r="3" fill="#2E1065" />
    </g>

    {/* 3D Cinema Camera Body */}
    <rect x="108" y="76" width="96" height="58" rx="12" fill="url(#bolly-body)" stroke="rgba(196, 181, 253, 0.65)" strokeWidth="1.8" />
    <rect x="118" y="86" width="54" height="38" rx="6" fill="#0B1026" stroke="rgba(139, 92, 246, 0.4)" />

    {/* Matte Box & Glowing Lens */}
    <path d="M204 88L238 76V134L204 122V88Z" fill="#1E1B4B" stroke="#A78BFA" strokeWidth="1.8" />
    <ellipse cx="238" cy="105" rx="7" ry="29" fill="url(#bolly-lens)" stroke="#BAE6FD" strokeWidth="1.5" />
    <circle cx="145" cy="105" r="11" fill="url(#bolly-lens)" stroke="#7DD3FC" strokeWidth="1.5" />

    {/* Glowing Clapperboard accent */}
    <g transform="translate(52, 86) rotate(-10)" className="animate-float-gentle">
      <rect x="0" y="10" width="44" height="32" rx="5" fill="#121638" stroke="#A78BFA" strokeWidth="1.5" />
      <path d="M0 10L44 10L40 2L4 2L0 10Z" fill="#7C3AED" stroke="#DDD6FE" strokeWidth="1.2" />
      <path d="M10 2L14 10M22 2L26 10M34 2L38 10" stroke="#090D24" strokeWidth="2.5" />
    </g>

    {/* Star bokeh highlights */}
    <path d="M256 42L259 49L266 52L259 55L256 62L253 55L246 52L253 49L256 42Z" fill="#DDD6FE" opacity="0.85" />
    <circle cx="72" cy="46" r="3" fill="#C4B5FD" opacity="0.55" />
  </svg>
);

const ScienceScene: FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="sci-core" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="45%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </radialGradient>
      <linearGradient id="sci-liquid" x1="230" y1="90" x2="260" y2="148" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.95" />
      </linearGradient>
    </defs>

    {/* Molecular hex lattice backdrop */}
    <polygon points="62,48 78,39 94,48 94,66 78,75 62,66" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="1.3" />
    <polygon points="78,75 94,66 110,75 110,93 94,102 78,93" stroke="rgba(34, 211, 238, 0.28)" strokeWidth="1.3" />
    <circle cx="62" cy="48" r="3" fill="#60A5FA" />
    <circle cx="94" cy="48" r="3" fill="#22D3EE" />
    <circle cx="78" cy="75" r="3" fill="#93C5FD" />

    {/* 3D Glowing Bohr Atom */}
    <ellipse cx="152" cy="92" rx="64" ry="22" transform="rotate(32 152 92)" stroke="rgba(56, 189, 248, 0.75)" strokeWidth="1.8" />
    <ellipse cx="152" cy="92" rx="64" ry="22" transform="rotate(-32 152 92)" stroke="rgba(96, 165, 250, 0.75)" strokeWidth="1.8" />
    <ellipse cx="152" cy="92" rx="64" ry="22" transform="rotate(90 152 92)" stroke="rgba(167, 139, 250, 0.65)" strokeWidth="1.8" />

    {/* Nucleus */}
    <circle cx="152" cy="92" r="14" fill="url(#sci-core)" stroke="#BAE6FD" strokeWidth="1.5" />
    <circle cx="152" cy="92" r="24" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="3 4" />

    {/* Electrons */}
    <circle cx="198" cy="122" r="4.5" fill="#22D3EE" stroke="#ECFEFF" strokeWidth="1.2" />
    <circle cx="106" cy="122" r="4.5" fill="#60A5FA" stroke="#EFF6FF" strokeWidth="1.2" />
    <circle cx="152" cy="30" r="4.5" fill="#A78BFA" stroke="#F5F3FF" strokeWidth="1.2" />

    {/* Futuristic Laboratory Erlenmeyer Flask */}
    <g transform="translate(212, 46)" className="animate-float-gentle">
      <path
        d="M28 6H44V28L66 84C68 89 64 95 58 95H14C8 95 4 89 6 84L28 28V6Z"
        fill="rgba(15, 23, 42, 0.72)"
        stroke="#7DD3FC"
        strokeWidth="1.8"
      />
      <path
        d="M14 62H58L63 82C64 86 61 90 56 90H16C11 90 8 86 9 82L14 62Z"
        fill="url(#sci-liquid)"
      />
      <rect x="24" y="2" width="24" height="6" rx="3" fill="#38BDF8" />
      <circle cx="28" cy="76" r="3" fill="#ECFEFF" opacity="0.8" />
      <circle cx="42" cy="82" r="2.2" fill="#ECFEFF" opacity="0.7" />
      <circle cx="36" cy="52" r="2" fill="#67E8F9" opacity="0.85" />
    </g>
  </svg>
);

const GeneralKnowledgeScene: FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="gk-brain-glow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="rgba(129, 140, 248, 0.45)" />
        <stop offset="100%" stopColor="rgba(129, 140, 248, 0)" />
      </radialGradient>
      <linearGradient id="gk-brain-fill" x1="120" y1="36" x2="200" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5B4FC" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
      <linearGradient id="gk-book" x1="90" y1="112" x2="230" y2="156" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>

    {/* Illuminated Knowledge Halo */}
    <circle cx="160" cy="72" r="66" fill="url(#gk-brain-glow)" />
    <circle cx="160" cy="74" r="56" stroke="rgba(165, 180, 252, 0.25)" strokeDasharray="4 5" />

    {/* Open Sculpted Encyclopedic Book Base */}
    <path
      d="M84 126C112 114 138 118 160 132C182 118 208 114 236 126V154C208 142 182 146 160 158C138 146 112 142 84 154V126Z"
      fill="url(#gk-book)"
      stroke="#818CF8"
      strokeWidth="1.8"
    />
    <path d="M160 132V158" stroke="#C7D2FE" strokeWidth="1.5" />
    <path d="M100 132C118 127 134 129 148 136" stroke="rgba(199, 210, 254, 0.35)" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M220 132C202 127 186 129 172 136" stroke="rgba(199, 210, 254, 0.35)" strokeWidth="1.3" strokeLinecap="round" />

    {/* 3D Holographic Brain & Neural Pathways */}
    <g className="animate-float-gentle">
      <path
        d="M158 40C142 40 132 49 130 60C122 62 118 70 120 79C121 88 129 94 138 94H158V40Z"
        fill="url(#gk-brain-fill)"
        stroke="#C7D2FE"
        strokeWidth="1.6"
      />
      <path
        d="M162 40C178 40 188 49 190 60C198 62 202 70 200 79C199 88 191 94 182 94H162V40Z"
        fill="url(#gk-brain-fill)"
        stroke="#C7D2FE"
        strokeWidth="1.6"
      />
      {/* Neural Nodes */}
      <circle cx="142" cy="60" r="3" fill="#22D3EE" />
      <circle cx="136" cy="76" r="2.8" fill="#E0E7FF" />
      <circle cx="178" cy="60" r="3" fill="#22D3EE" />
      <circle cx="184" cy="76" r="2.8" fill="#E0E7FF" />
      <path d="M142 60L136 76M178 60L184 76M142 60L160 54L178 60" stroke="#67E8F9" strokeWidth="1.3" opacity="0.85" />
    </g>

    {/* Illuminated Question & Wisdom Symbols */}
    <text x="64" y="64" fill="#A5B4FC" fontSize="22" fontWeight="700" fontFamily="Outfit, sans-serif" opacity="0.85">
      ?
    </text>
    <text x="242" y="70" fill="#67E8F9" fontSize="24" fontWeight="700" fontFamily="Outfit, sans-serif" opacity="0.85">
      ?
    </text>
    <path d="M244 108L247 114L253 117L247 120L244 126L241 120L235 117L241 114L244 108Z" fill="#C7D2FE" opacity="0.8" />
    <circle cx="76" cy="100" r="3" fill="#818CF8" opacity="0.7" />
  </svg>
);

const SportsGamesScene: FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sport-flood-l" x1="36" y1="8" x2="170" y2="165" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.34)" />
        <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
      </linearGradient>
      <linearGradient id="sport-flood-r" x1="284" y1="8" x2="150" y2="165" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(34, 211, 238, 0.32)" />
        <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
      </linearGradient>
      <linearGradient id="sport-trophy" x1="130" y1="36" x2="195" y2="146" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <radialGradient id="sport-cricket" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="55%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </radialGradient>
      <radialGradient id="sport-football" cx="35%" cy="30%" r="68%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="65%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#475569" />
      </radialGradient>
    </defs>

    {/* Stadium night floodlights & arena pitch arc */}
    <polygon points="28,8 66,8 190,165 110,165" fill="url(#sport-flood-l)" />
    <polygon points="292,8 254,8 130,165 210,165" fill="url(#sport-flood-r)" />
    <ellipse cx="160" cy="150" rx="116" ry="20" stroke="rgba(56, 189, 248, 0.28)" strokeWidth="1.5" />

    {/* Dynamic motion trail arcs */}
    <path d="M54 96C72 72 96 62 118 66" stroke="rgba(251, 113, 133, 0.45)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
    <path d="M266 94C248 70 226 62 204 66" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />

    {/* 3D Championship Trophy Centerpiece */}
    <g className="animate-float-gentle">
      <path d="M132 42H188V76C188 94 175 108 160 108C145 108 132 94 132 76V42Z" fill="url(#sport-trophy)" stroke="#FEF3C7" strokeWidth="1.5" />
      <path d="M132 50H116V66C116 76 123 82 132 82" stroke="#FBBF24" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M188 50H204V66C204 76 197 82 188 82" stroke="#FBBF24" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="153" y="108" width="14" height="22" fill="#D97706" />
      <path d="M136 130H184L188 144H132L136 130Z" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.6" />
      <path d="M160 56L163 63L170 66L163 69L160 76L157 69L150 66L157 63L160 56Z" fill="#FFFBEB" />
    </g>

    {/* Cricket Ball (Left) */}
    <g transform="translate(64, 102)">
      <circle cx="20" cy="20" r="18" fill="url(#sport-cricket)" stroke="#FDA4AF" strokeWidth="1.2" />
      <path d="M9 9C16 16 24 24 31 31" stroke="#FEF3C7" strokeWidth="1.8" strokeDasharray="2.5 2.5" strokeLinecap="round" />
    </g>

    {/* Football (Right) */}
    <g transform="translate(216, 100)">
      <circle cx="22" cy="22" r="20" fill="url(#sport-football)" stroke="#E2E8F0" strokeWidth="1.2" />
      <polygon points="22,14 29,19 26,27 18,27 15,19" fill="#0F172A" />
      <path d="M22 14V4M29 19L39 14M26 27L34 36M18 27L10 36M15 19L5 14" stroke="#1E293B" strokeWidth="1.4" />
    </g>
  </svg>
);

export const CategoryIllustration: FC<CategorySceneProps> = ({
  categoryId,
  compact = false,
}) => {
  const wrapperClass = compact ? 'h-20 w-36' : 'h-40 sm:h-44 w-full';

  return (
    <div className={wrapperClass}>
      {categoryId === 'geography' && <GeographyScene />}
      {categoryId === 'bollywood' && <BollywoodScene />}
      {categoryId === 'science' && <ScienceScene />}
      {categoryId === 'general-knowledge' && <GeneralKnowledgeScene />}
      {categoryId === 'sports-games' && <SportsGamesScene />}
    </div>
  );
};
