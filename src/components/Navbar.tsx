import React from 'react';
import { MagnetioLogo } from './MagnetioLogo';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0B0B0B]/85 backdrop-blur-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <MagnetioLogo
            size={26}
            glow
            variant="magnet-u-with-m"
            className="text-[#5B6EF5]"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold tracking-tight text-[#FFFFFF] transition-colors">
              Magnetio
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-white/[0.06] text-[#C1C1C1] rounded-full">
              Addon
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
