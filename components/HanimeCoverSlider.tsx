import React, { useState, useMemo, useRef, memo, useEffect } from 'react';

interface HanimeCoverSliderProps {
  hanime: any;
}

export const HanimeCoverSlider = memo(({ hanime }: HanimeCoverSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '1200px' }
    );

    if (scrollContainerRef.current) {
      observer.observe(scrollContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  const allCovers = useMemo(() => {
    const covers = [hanime.coverImage];
    if (hanime.secondaryCovers && hanime.secondaryCovers.length > 0) {
      covers.push(...hanime.secondaryCovers);
    }
    return covers.filter(Boolean);
  }, [hanime.coverImage, hanime.secondaryCovers]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const width = scrollContainerRef.current.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-900">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allCovers.map((cover, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center relative">
            {!loadedImages[i] && (
              <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center z-0" />
            )}
            {isInView && (
              <img
                src={cover}
                className={`w-full h-full object-cover transition-opacity duration-500 ${loadedImages[i] ? 'opacity-100' : 'opacity-0'}`}
                style={{ objectPosition: `center ${i === 0 ? (hanime.coverOffset ?? 50) : 50}%` }}
                alt={`${hanime.title} cover ${i + 1}`}
                referrerPolicy="no-referrer"
                draggable="false"
                loading="lazy"
                decoding="async"
                onLoad={() => handleImageLoad(i)}
              />
            )}
          </div>
        ))}
      </div>
      
      {allCovers.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none drop-shadow-md">
          {allCovers.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
