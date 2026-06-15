
import React from 'react';

export const ShimmerOverlay = () => (
  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[shimmer_1.5s_infinite] pointer-events-none" />
);

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col w-full border-b border-white/[0.03] overflow-hidden relative animate-pulse">
      <div className="relative aspect-video bg-white/[0.05] rounded-none">
      </div>
      <div className="pl-3 pr-4 py-3.5 w-full bg-[#0a0a0a]">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col items-start flex-1">
            <div className="w-24 h-3 bg-white/[0.08] rounded mb-2 overflow-hidden relative">
            </div>
            <div className="w-48 h-4 bg-white/[0.08] rounded overflow-hidden relative">
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-2 bg-white/[0.08] rounded overflow-hidden relative">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonLinkCard: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden mb-4 animate-pulse">
      <div className="relative aspect-video bg-white/[0.05] rounded-none overflow-hidden">
      </div>
      <div className="pl-3 pr-3 pt-3 pb-4 w-full">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col items-start min-w-0 flex-1 gap-2.5 mt-1">
            {/* Title Skeleton */}
            <div className="w-48 h-3.5 bg-white/[0.08] rounded-full mb-1">
            </div>
            {/* Actor Name Skeleton */}
            <div className="w-24 h-2.5 bg-white/[0.05] rounded-full">
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 pl-4 mt-1">
            {/* Tag Skeleton */}
            <div className="w-16 h-3 bg-white/[0.05] rounded-full">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonActorHeader: React.FC = () => {
  return (
    <div className="px-5 mb-0 mt-0 animate-pulse">
      <div className="flex items-center gap-7 py-10 border-b border-[var(--border)]">
        <div className="w-24 h-24 rounded-full bg-white/[0.08] relative overflow-hidden shrink-0">
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="w-48 h-8 bg-white/[0.08] rounded mb-3 overflow-hidden relative">
          </div>
          <div className="w-24 h-4 bg-white/[0.05] rounded overflow-hidden relative">
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonCircle: React.FC = () => {
  return (
    <div 
      className="bg-[#141414] border border-white/[0.06] rounded-[20px] flex flex-col items-center justify-center py-4 px-2 min-h-[140px] overflow-hidden relative animate-pulse"
      style={{ contain: 'paint' }}
    >
      <div className="w-[88%] aspect-square rounded-full bg-white/[0.08] relative overflow-hidden">
      </div>
      <div className="w-16 h-3 bg-white/[0.05] rounded mt-4 relative overflow-hidden">
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-40 w-full animate-in fade-in duration-500">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]" />
      </div>
    </div>
  );
};
