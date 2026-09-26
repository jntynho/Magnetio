import React from 'react';

export type LogoVariant = 'magnet-u-with-m' | 'classic-red-m' | 'solid-m-cutout' | 'minimal-dual-pole';

interface MagnetioLogoProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  glow?: boolean;
  variant?: LogoVariant;
}

/**
 * Magnetio Brand Icon Showcase:
 * - 'magnet-u-with-m': Classic Horseshoe U Magnet holding a glowing letter 'M' inside.
 * - 'classic-red-m': Universal 🧲 Red & Silver Horseshoe Magnet curved as an 'M'.
 * - 'solid-m-cutout': Solid Geometric M with a horseshoe U cutout.
 * - 'minimal-dual-pole': Dual-arc modern monoline magnet with pole caps.
 */
export const MagnetioLogo: React.FC<MagnetioLogoProps> = ({
  className = 'text-[#5B6EF5]',
  size = 28,
  strokeWidth = 2,
  glow = false,
  variant = 'magnet-u-with-m',
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${glow ? 'group' : ''}`}>
      {glow && (
        <div className="absolute -inset-1 rounded-full bg-[#5B6EF5]/20 blur-sm opacity-50 group-hover:opacity-85 transition-opacity" />
      )}

      {/* VARIANT 1: Classic Horseshoe U Magnet holding letter 'M' inside */}
      {variant === 'magnet-u-with-m' && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 transition-transform duration-200 ${className}`}
        >
          {/* Horseshoe Magnet U Body */}
          <path
            d="M4.5 9V14C4.5 18.1421 7.85786 21.5 12 21.5C16.1421 21.5 19.5 18.1421 19.5 14V9"
            stroke="#EF4444"
            strokeWidth={strokeWidth * 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* North Pole Cap (Left - Silver Metallic) */}
          <path
            d="M4.5 3.5V8.5"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth * 1.5}
            strokeLinecap="round"
          />
          {/* North Pole Divider Line */}
          <line
            x1="2.5"
            y1="8.5"
            x2="6.5"
            y2="8.5"
            stroke="#CBD5E1"
            strokeWidth={1.2}
            strokeLinecap="round"
          />

          {/* South Pole Cap (Right - Silver Metallic) */}
          <path
            d="M19.5 3.5V8.5"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth * 1.5}
            strokeLinecap="round"
          />
          {/* South Pole Divider Line */}
          <line
            x1="17.5"
            y1="8.5"
            x2="21.5"
            y2="8.5"
            stroke="#CBD5E1"
            strokeWidth={1.2}
            strokeLinecap="round"
          />

          {/* The Letter 'M' Centered Inside the Horseshoe U */}
          <path
            d="M8.5 15.5V9.5L12 13L15.5 9.5V15.5"
            stroke="#5B6EF5"
            strokeWidth={strokeWidth * 1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Subtle Magnetic Wave Between Poles */}
          <path
            d="M7 4C8.5 2.5 15.5 2.5 17 4"
            stroke="#5B6EF5"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeDasharray="1.5 2"
            className="opacity-60"
          />
        </svg>
      )}

      {/* VARIANT 2: The Universal 🧲 Red & Silver Magnet Shaped as 'M' */}
      {variant === 'classic-red-m' && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 transition-transform duration-200 ${className}`}
        >
          {/* Main Red Horseshoe M Body */}
          <path
            d="M4.5 14V8.5C4.5 5 6.5 3.5 8.8 3.5C10.7 3.5 11.6 5.2 12 7.2C12.4 5.2 13.3 3.5 15.2 3.5C17.5 3.5 19.5 5 19.5 8.5V14"
            stroke="#EF4444"
            strokeWidth={strokeWidth * 1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Left Silver Pole Terminal */}
          <path
            d="M4.5 14V19.5"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth * 1.4}
            strokeLinecap="round"
          />
          <line x1="2.8" y1="14" x2="6.2" y2="14" stroke="#94A3B8" strokeWidth={1.2} strokeLinecap="round" />

          {/* Right Silver Pole Terminal */}
          <path
            d="M19.5 14V19.5"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth * 1.4}
            strokeLinecap="round"
          />
          <line x1="17.8" y1="14" x2="21.2" y2="14" stroke="#94A3B8" strokeWidth={1.2} strokeLinecap="round" />

          {/* Magnetic Flux Loop Underneath */}
          <path
            d="M7 19.5C9 22 15 22 17 19.5"
            stroke="#5B6EF5"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeDasharray="2 2"
            className="opacity-70"
          />

          {/* Center Vertex Spark */}
          <circle cx="12" cy="10" r="1.2" fill="#5B6EF5" />
        </svg>
      )}

      {/* VARIANT 3: Solid Modern Geometric M with Horseshoe U Silhouette */}
      {variant === 'solid-m-cutout' && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 transition-transform duration-200 ${className}`}
        >
          {/* Solid M body with inner horseshoe curve */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3 5C3 3.89543 3.89543 3 5 3H7.5C8.32843 3 9.07843 3.5 9.4 4.25L12 10.2L14.6 4.25C14.9216 3.5 15.6716 3 16.5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H16.5C15.3954 21 14.5 20.1046 14.5 19V11.8L12.9 15.5C12.55 16.3 11.45 16.3 11.1 15.5L9.5 11.8V19C9.5 20.1046 8.60457 21 7.5 21H5C3.89543 21 3 20.1046 3 19V5Z"
            fill="currentColor"
          />
          {/* North pole accent */}
          <rect x="3" y="16" width="6.5" height="5" rx="1.5" fill="#EF4444" />
          {/* South pole accent */}
          <rect x="14.5" y="16" width="6.5" height="5" rx="1.5" fill="#5B6EF5" />
        </svg>
      )}

      {/* VARIANT 4: Sleek Monoline Dual-Arc M */}
      {variant === 'minimal-dual-pole' && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 transition-transform duration-200 ${className}`}
        >
          <path
            d="M4.5 18.5V9C4.5 5.2 6.5 3.8 8.8 3.8C10.7 3.8 11.6 5.5 12 7.6C12.4 5.5 13.3 3.8 15.2 3.8C17.5 3.8 19.5 5.2 19.5 9V18.5"
            stroke="currentColor"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* North Pole */}
          <path d="M4.5 14.5V18.5" stroke="#E08A73" strokeWidth={strokeWidth * 1.2} strokeLinecap="round" />
          {/* South Pole */}
          <path d="M19.5 14.5V18.5" stroke="#5B6EF5" strokeWidth={strokeWidth * 1.2} strokeLinecap="round" />
          <path
            d="M8 18.5C9.2 20.5 14.8 20.5 16 18.5"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeDasharray="1.5 2"
            className="opacity-40"
          />
        </svg>
      )}
    </div>
  );
};
