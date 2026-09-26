import React from 'react';
import { Download } from 'lucide-react';
import { CopyLinkIcon, CheckIcon } from './SectionIcons';

interface BottomInstallSectionProps {
  manifestUrl: string;
  stremioDeepLink: string;
  onCopyUrl: () => void;
  copied: boolean;
}

export const BottomInstallSection: React.FC<BottomInstallSectionProps> = ({
  manifestUrl,
  stremioDeepLink,
  onCopyUrl,
  copied,
}) => {
  return (
    <section className="p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-4 relative z-10">
      <div>
        <div className="flex items-center gap-3 text-[#FFFFFF]">
          <Download size={22} className="shrink-0" />
          <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Install & Share Addon</h2>
        </div>
        <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
          Copy your personalized manifest link or install directly into Stremio.
        </p>
      </div>

      <div className="space-y-3.5 w-full">
        {/* 1. Manifest URL Input Field (Full rounded capsule) */}
        <input
          id="manifest-url-input"
          type="text"
          readOnly
          value={manifestUrl}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-full px-5 py-3 rounded-full bg-[#222222] border border-white/[0.12] hover:border-white/[0.2] focus:border-white/[0.24] text-xs font-mono text-[#FFFFFF] outline-none select-all transition-colors"
          placeholder="Manifest URL..."
        />

        {/* 2 & 3. Action Buttons Directly Below */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full">
          <a
            href={stremioDeepLink}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#5B6EF5] hover:bg-[#4d60e6] text-white font-medium text-sm transition-all active:scale-[0.98] shadow-sm"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Install in Stremio</span>
          </a>

          <button
            type="button"
            onClick={onCopyUrl}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.12] text-[#FFFFFF] font-medium text-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            {copied ? (
              <>
                <CheckIcon size={20} className="text-[#FFFFFF] shrink-0" />
                <span className="text-[#FFFFFF]">Copied</span>
              </>
            ) : (
              <>
                <CopyLinkIcon size={20} className="text-[#C1C1C1] shrink-0" />
                <span>Copy Manifest</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

