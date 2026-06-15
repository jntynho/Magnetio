import React, { useEffect, useState } from 'react';
import { Icons } from '../constants';

interface EpornerOverlayProps {
  url: string;
  originalUrl: string;
  title?: string;
  onClose: () => void;
}

export const EpornerOverlay: React.FC<EpornerOverlayProps> = ({ url, originalUrl, title, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
    >
      <div className="absolute top-4 left-4 z-[160] flex items-center gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors shadow-lg border border-white/10"
          title="Close Player"
        >
          <Icons.X size={20} />
        </button>
      </div>

      <div className="relative w-full max-w-6xl aspect-video mx-auto bg-black flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-white/10">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
            <Icons.Loader2 className="animate-spin mb-4" size={32} />
            <p>جاري تحميل المشغل...</p>
          </div>
        )}
        <iframe 
          src={url}
          className="w-full h-full relative z-10"
          frameBorder="0"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};
