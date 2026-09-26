import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-10 pb-8 px-4 sm:px-6 max-w-7xl mx-auto border-b border-white/[0.06]">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        {/* Clean, Non-distracting Display Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FFFFFF] leading-[1.15]">
          Every source. One clean stream.
        </h1>

        {/* Calm Explanatory Subtitle */}
        <p className="mt-3.5 text-sm sm:text-base text-[#C1C1C1] font-normal leading-relaxed max-w-2xl">
          Configure torrent providers, stream sorting, priority languages, quality exclusions, size limits, and Debrid caching for Stremio.
        </p>
      </div>
    </section>
  );
};

