import type { FC } from 'react';

interface BrandEmblemProps {
  size?: number;
  className?: string;
}

export const BrandEmblem: FC<BrandEmblemProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hq-outer-grad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="hq-core-grad" x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>

      {/* Outer hexagonal competition frame */}
      <path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        fill="#091229"
        stroke="url(#hq-outer-grad)"
        strokeWidth="2.5"
      />

      {/* Inner structural bevel */}
      <path
        d="M32 10L50 20.5V43.5L32 54L14 43.5V20.5L32 10Z"
        stroke="rgba(148, 163, 184, 0.22)"
        strokeWidth="1"
      />

      {/* Stylized H-Q competition monogram geometry */}
      <path
        d="M23 22V42M41 22V42M23 32H41"
        stroke="url(#hq-core-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="4" fill="#38BDF8" />
      <path
        d="M35.5 35.5L43 43"
        stroke="#A78BFA"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
};
