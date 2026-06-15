
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useApp } from '../AppContext';
import { Icons } from '../constants';

export const CoomerImageViewer: React.FC = () => {
  const { id, tab, index } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const queryParams = new URLSearchParams(location.search);
  const imgParam = queryParams.get('img');
  const initialImgIndex = parseInt(imgParam || '0');
  const initialPostIndex = parseInt(index || '0');

  const coomer = state.coomers.find(c => c.id === id);
  const posts = useMemo(() => {
    const rawPosts = tab === 'Instagram' ? (coomer?.instagramPosts || []) : (coomer?.onlyFansPosts || []);
    return [...rawPosts].sort((a, b) => {
      const dateA = a.date || a.createdAt || 0;
      const dateB = b.date || b.createdAt || 0;
      return dateB - dateA; // Newest first
    });
  }, [coomer, tab]);
  
  const allImages = useMemo(() => posts.flatMap(p => p.urls), [posts]);

  const initialFlatIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < initialPostIndex; i++) {
      if (posts[i]) count += posts[i].urls.length;
    }
    return count + initialImgIndex;
  }, [posts, initialPostIndex, initialImgIndex]);

  const [currentIndex, setCurrentIndex] = useState(initialFlatIndex);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Initialize scroll position
  useEffect(() => {
    if (scrollRef.current && !isInitialized && allImages.length > 0) {
      const targetX = initialFlatIndex * scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: targetX, behavior: 'instant' });
      setIsInitialized(true);
    }
  }, [initialFlatIndex, isInitialized, allImages.length]);

  const handleScroll = () => {
    if (scrollRef.current && !isZoomed) {
      const width = scrollRef.current.clientWidth;
      if (width === 0) return;
      const newIndex = Math.round(scrollRef.current.scrollLeft / width);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < allImages.length) {
        setCurrentIndex(newIndex);
        
        // Find post and sub-index for URL update
        let count = 0;
        let foundPostIndex = 0;
        let foundImgIndex = 0;
        for (let i = 0; i < posts.length; i++) {
          if (newIndex < count + posts[i].urls.length) {
            foundPostIndex = i;
            foundImgIndex = newIndex - count;
            break;
          }
          count += posts[i].urls.length;
        }
        
        // Update URL without adding to history
        navigate(`/coomer/${id}/media/${tab}/${foundPostIndex}?img=${foundImgIndex}`, { replace: true });
      }
    }
  };

  const { currentPost, subIndex } = useMemo(() => {
    let count = 0;
    for (const post of posts) {
      if (currentIndex < count + post.urls.length) {
        return { currentPost: post, subIndex: currentIndex - count };
      }
      count += post.urls.length;
    }
    return { currentPost: null, subIndex: 0 };
  }, [posts, currentIndex]);

  if (!coomer || allImages.length === 0) return null;

  const currentItemDate = currentPost?.perImageDates?.[subIndex] || currentPost?.date;

  const handleLongPress = () => {
    if (currentPost) {
      navigate(`/coomer/${id}/add-socials/${currentPost.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden animate-slide-in">
      {/* Minimal X Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-2 left-2 p-5 text-white z-[510] active:scale-90 transition-all tap-highlight-none drop-shadow-lg"
      >
        <Icons.X size={24} />
      </button>

      {/* Date Indicator - Bottom Left */}
      {currentItemDate && (
        <div className="absolute bottom-2 left-2 p-5 text-white/90 text-[12px] font-black uppercase tracking-[0.15em] z-[510] pointer-events-none drop-shadow-lg flex items-center justify-center">
          {new Date(currentItemDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      )}

      {/* Index Indicator - Only for Multiple posts */}
      <div className="absolute top-2 right-2 p-5 text-white/90 text-[12px] font-black uppercase tracking-[0.15em] z-[510] pointer-events-none drop-shadow-lg flex flex-col items-end gap-1">
        {currentPost?.type === 'Multiple' && (
          <span>{subIndex + 1} / {currentPost.urls.length}</span>
        )}
      </div>

      {/* Swipeable Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gpu-accelerated ${isZoomed ? 'overflow-hidden' : ''}`}
        style={{ scrollSnapType: isZoomed ? 'none' : 'x mandatory', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        {allImages.map((url, i) => {
          // Windowed rendering: only render images within +/- 2 of current index
          const isNear = Math.abs(i - currentIndex) <= 2;
          
          return (
            <div key={i} className="w-screen h-full shrink-0 snap-center snap-always flex items-center justify-center relative">
              {isNear ? (
                <ZoomableImage url={url} onZoomChange={setIsZoomed} onLongPress={handleLongPress} />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ZoomableImage: React.FC<{ url: string; onZoomChange: (zoomed: boolean) => void; onLongPress: () => void }> = ({ url, onZoomChange, onLongPress }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const lastTap = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const newScale = scale === 1 ? 2.5 : 1;
      setScale(newScale);
      onZoomChange(newScale > 1);
    }
    lastTap.current = now;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
      longPressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.clientY - pointerDownPos.current.y);
      if (dx > 10 || dy > 10) {
        handlePointerUp();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      onClick={handleDoubleTap}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
      )}
      {error ? (
        <div className="flex flex-col items-center gap-2 opacity-20">
          <Icons.X size={40} />
          <span className="text-[10px] font-black uppercase tracking-widest">Failed to load</span>
        </div>
      ) : (
        <motion.img 
          src={url} 
          drag={scale > 1}
          dragConstraints={containerRef}
          animate={{ scale }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`max-w-full max-h-full object-contain select-none ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          alt=""
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};
