
import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../constants';

interface GalleryOverlayProps {
  urls: string[];
  isOpen: boolean;
  onClose: () => void;
  bgColor: string;
}

export const GalleryOverlay: React.FC<GalleryOverlayProps> = ({ urls, isOpen, onClose, bgColor }) => {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIndex(0);
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      if (idx !== index) setIndex(idx);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex flex-col animate-slide-in"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <span className="text-[12px] font-black text-white/70 tracking-widest uppercase">
          {index + 1} / {urls.length}
        </span>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <Icons.X />
        </button>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gpu-accelerated"
      >
        {urls.map((url, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center p-4">
            {url && (
              <img 
                src={url} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                alt=""
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
