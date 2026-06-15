
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { CoomerPost } from '../types';
import { LoadingSpinner, ShimmerOverlay } from '../components/SkeletonCard';

const visibleCountsCache: Record<string, { Instagram: number, OnlyFans: number }> = {};

const PostCard = React.memo(({ 
  post, 
  index,
  onClick, 
  onLongPress 
}: { 
  post: CoomerPost; 
  index: number;
  onClick: (postIndex: number, imageIndex: number) => void;
  onLongPress: (postId: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);
  const wasLongPressed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    // Clear any existing timer
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      wasLongPressed.current = true;
      onLongPress(post.id);
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
      onPointerDown={(e) => {
        wasLongPressed.current = false;
        handlePointerDown(e);
      }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        if (wasLongPressed.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick(index, 0);
      }}
      className="aspect-[3/4] bg-neutral-900 overflow-hidden relative active:opacity-90 transition-opacity cursor-pointer group select-none"
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none' }}
    >
      {isVisible ? (
        <>
          {/* Skeleton Placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-neutral-800 z-0 overflow-hidden">
              <ShimmerOverlay />
            </div>
          )}
          
          {post.urls[0] && (
            <img 
              src={post.urls[0]} 
              loading="lazy"
              draggable="false"
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-700 pointer-events-none ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error';
                setIsLoaded(true);
              }}
            />
          )}

          {post.type === 'Multiple' && (
            <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none group-active:scale-90 transition-transform drop-shadow-md">
              <div className="relative w-4 h-4">
                {/* Back Layer */}
                <div className="absolute top-0 right-0 w-[13px] h-[13px] border-[1.5px] border-white rounded-[2px] opacity-60" />
                {/* Front Layer */}
                <div className="absolute bottom-0 left-0 w-[13px] h-[13px] bg-white rounded-[2px]" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-neutral-800 overflow-hidden">
          <ShimmerOverlay />
        </div>
      )}
    </div>
  );
});

export const CoomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, coomerActiveTab, setCoomerActiveTab, updateCoomer, isHydrated } = useApp();

  const [visibleCounts, setVisibleCounts] = useState<{ Instagram: number, OnlyFans: number }>(() => {
    return visibleCountsCache[id || ''] || { Instagram: 30, OnlyFans: 30 };
  });
  const visibleCount = visibleCounts[coomerActiveTab as keyof typeof visibleCounts] || 30;
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      visibleCountsCache[id] = visibleCounts;
    }
  }, [visibleCounts, id]);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    });
  }, [location.pathname, coomerActiveTab]);

  const coomer = useMemo(() => state.coomers.find(c => c.id === id), [state.coomers, id]);

  const posts = useMemo(() => {
    if (!coomer) return [];
    const rawPosts = coomerActiveTab === 'Instagram' ? (coomer.instagramPosts || []) : (coomer.onlyFansPosts || []);
    return [...rawPosts].sort((a, b) => {
      const dateA = a.date || a.createdAt || 0;
      const dateB = b.date || b.createdAt || 0;
      return dateB - dateA; // Newest first
    });
  }, [coomer, coomerActiveTab]);

  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCounts((prev) => ({
            ...prev,
            [coomerActiveTab]: (prev[coomerActiveTab as keyof typeof prev] || 30) + 30
          }));
        }
      },
      { rootMargin: '800px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visiblePosts.length, coomerActiveTab]);

  // Migration logic
  useEffect(() => {
    if (coomer && (coomer.instagramLinks?.length || coomer.onlyFansLinks?.length)) {
      const updates: any = {};
      
      if (coomer.instagramLinks?.length && !coomer.instagramPosts?.length) {
        updates.instagramPosts = coomer.instagramLinks.map(url => ({
          id: Math.random().toString(36).substr(2, 9),
          urls: [url],
          type: 'Single',
          createdAt: Date.now()
        }));
        updates.instagramLinks = [];
      }

      if (coomer.onlyFansLinks?.length && !coomer.onlyFansPosts?.length) {
        updates.onlyFansPosts = coomer.onlyFansLinks.map(url => ({
          id: Math.random().toString(36).substr(2, 9),
          urls: [url],
          type: 'Single',
          createdAt: Date.now()
        }));
        updates.onlyFansLinks = [];
      }

      if (Object.keys(updates).length > 0) {
        updateCoomer(coomer.id, updates);
      }
    }
  }, [coomer, updateCoomer]);

  const handlePostClick = useCallback((postIndex: number, imageIndex: number) => {
    navigate(`/coomer/${id}/media/${coomerActiveTab}/${postIndex}?img=${imageIndex}`);
  }, [navigate, id, coomerActiveTab]);

  const handlePostLongPress = useCallback((postId: string) => {
    navigate(`/coomer/${id}/add-socials/${postId}`);
  }, [navigate, id]);

  if (!isHydrated) return null;

  if (!coomer) return <Navigate to="/manage-coomers" replace />;

  const imgSrc = coomer.originalImageUrl || coomer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(coomer.name)}&background=random`;

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-slide-in">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center pt-3 pb-5">
        <div 
          className="w-24 h-24 rounded-full border-[3px] overflow-hidden bg-neutral-800 shadow-2xl relative ring-4 ring-black/20"
          style={{ borderColor: state.settings.circleBorderColor }}
        >
          {!isProfileLoaded && (
            <div className="absolute inset-0 bg-neutral-800 z-0 overflow-hidden">
              <ShimmerOverlay />
            </div>
          )}
          <img 
            src={imgSrc} 
            className={`w-full h-full object-cover transition-opacity duration-500 ${isProfileLoaded ? 'opacity-100' : 'opacity-0'}`}
            alt={coomer.name}
            referrerPolicy="no-referrer"
            onLoad={() => setIsProfileLoaded(true)}
          />
        </div>
        <h1 className="mt-3 text-[20px] font-black tracking-tight text-[var(--text-primary)]">
          {coomer.name}
        </h1>
      </div>

      {/* Tabs Section */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg)]">
        <button 
          onClick={() => setCoomerActiveTab('Instagram')}
          className="flex-1 py-4 relative transition-all active:scale-95 tap-highlight-none flex flex-col items-center justify-center gap-1"
        >
          <div className={`transition-all duration-300 ${coomerActiveTab === 'Instagram' ? 'text-white' : 'opacity-20 text-white'}`}>
            <Icons.Instagram />
          </div>
          {coomerActiveTab === 'Instagram' && (
            <motion.div 
              layoutId={`activeTab-${id}`}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)]"
              transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
            />
          )}
        </button>
        <button 
          onClick={() => setCoomerActiveTab('OnlyFans')}
          className="flex-1 py-4 relative transition-all active:scale-95 tap-highlight-none flex flex-col items-center justify-center gap-1"
        >
          <div className={`transition-all duration-300 ${coomerActiveTab === 'OnlyFans' ? 'text-white' : 'opacity-20 text-white'}`}>
            <Icons.OnlyFans />
          </div>
          {coomerActiveTab === 'OnlyFans' && (
            <motion.div 
              layoutId={`activeTab-${id}`}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)]"
              transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
            />
          )}
        </button>
      </div>

      {/* Media Grid Section */}
      <div className="grid grid-cols-3 gap-[2px] pt-[2px]">
        {visiblePosts.length > 0 ? (
          <>
            {visiblePosts.map((post, idx) => (
              <PostCard 
                key={post.id || idx} 
                post={post} 
                index={idx}
                onClick={handlePostClick} 
                onLongPress={handlePostLongPress}
              />
            ))}
            {visibleCount < posts.length && (
              <div ref={loadMoreRef} className="col-span-3 h-10" />
            )}
          </>
        ) : (
          <div className="col-span-3 py-20 flex flex-col items-center justify-center opacity-20">
            <div className="mb-4 scale-150">
              {coomerActiveTab === 'Instagram' ? <Icons.LayoutDashboard /> : <Icons.Scale />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Media Found</span>
          </div>
        )}
      </div>
    </div>
  );
};
