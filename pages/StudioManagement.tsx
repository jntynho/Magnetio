import React, { useMemo, memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';

let cachedVisibleCount = 30;

const StudioListItem = memo(({ studio, onClick, borderColor, isLast }: { studio: any, onClick: () => void, borderColor: string, isLast: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={`flex items-center gap-4 px-2 py-4 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] cursor-pointer group ${!isLast ? 'border-b border-[var(--border)]' : ''}`}
    >
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--surface)] text-[var(--accent)] border-[2px] shrink-0 overflow-hidden relative shadow-md transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        {studio.originalImageUrl || studio.imageUrl ? (
          <>
            {!isLoaded && <div className="absolute inset-0 bg-[var(--border)] animate-pulse" />}
            <img 
              src={studio.originalImageUrl || studio.imageUrl} 
              loading="lazy"
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
              alt={studio.name}
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoaded(true)}
            />
          </>
        ) : (
          <div className="scale-[1.2] opacity-80">
            <Icons.Studio />
          </div>
        )}
      </div>
      <span className="text-[var(--text-primary)] font-bold text-[17px] tracking-normal truncate flex-1 leading-relaxed">
        {studio.name}
      </span>
    </motion.div>
  );
});

const StudioCardItem = memo(({ studio, onClick, borderColor }: { studio: any, onClick: () => void, borderColor: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center gap-6 px-5 py-4.5 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] active:scale-[0.99] cursor-pointer group mb-3 last:mb-0 shadow-sm"
      style={{ minHeight: '112px' }}
    >
      <div 
        className="w-24 h-24 rounded-full flex items-center justify-center bg-[var(--surface)] text-[var(--accent)] border-[3.5px] shrink-0 overflow-hidden relative shadow-xl ring-1 ring-black/10 transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        {studio.originalImageUrl || studio.imageUrl ? (
          <>
            {!isLoaded && <div className="absolute inset-0 bg-[var(--border)] animate-pulse" />}
            <img 
              src={studio.originalImageUrl || studio.imageUrl} 
              loading="lazy"
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
              alt={studio.name}
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoaded(true)}
            />
          </>
        ) : (
          <div className="scale-[1.8] opacity-70">
            <Icons.Studio />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span className="text-[var(--text-primary)] font-bold text-[19px] tracking-normal truncate group-active:text-[var(--accent)] transition-colors leading-relaxed py-1.5">
          {studio.name}
        </span>
      </div>
    </motion.div>
  );
});

export const StudioManagement: React.FC = React.memo(() => {
  const { state, searchQuery, isHydrated } = useApp();
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const { managementView, sortOrder, circleBorderColor } = state.settings;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
    let timerId = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => {
      clearTimeout(timerId);
    };
  }, [sortOrder, managementView, deferredSearchQuery]);

  const [visibleCount, setVisibleCount] = useState(cachedVisibleCount);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cachedVisibleCount = visibleCount;
  }, [visibleCount]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  useEffect(() => {
    if (isReady) {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    }
  }, [isReady]);

  const filteredStudios = useMemo(() => {
    let studios = state.studios.filter(t => !t.isDeleted);
    
    if (deferredSearchQuery.trim()) {
      studios = studios.filter(studio => 
        studio.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return studios.sort((a, b) => {
      const order = sortOrder as string;
      if (order === 'Newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (order === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (order === 'A-Z') return a.name.localeCompare(b.name);
      if (order === 'Z-A') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [state.studios, deferredSearchQuery, sortOrder]);

  useEffect(() => {
    setVisibleCount(30);
    cachedVisibleCount = 30;
  }, [searchQuery, sortOrder]);

  const visibleStudios = useMemo(() => filteredStudios.slice(0, visibleCount), [filteredStudios, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 30);
        }
      },
      { rootMargin: '800px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleStudios.length, isReady]);

  const handleStudioClick = useCallback((id: string) => {
    navigate(`/studio/${id}`, { state: { from: location.pathname + location.search } });
  }, [navigate, location.pathname, location.search]);

  if (!isHydrated) return null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto px-2 pb-3.5 pt-3.5"
    >
      {managementView === 'List' ? (
        <div className="flex flex-col relative min-h-[500px]">
          <AnimatePresence mode="popLayout">
            {!isReady ? (
              <motion.div 
                key="skeleton-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="w-full absolute inset-0 left-0 top-0"
              >
                {Array.from({ length: Math.min(visibleCount, 15) }).map((_, i) => (
                  <div key={i} className={`flex items-center gap-4 px-2 py-4 ${i < Math.min(visibleCount, 15) - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                    <div className="w-16 h-16 rounded-full bg-[var(--border)] opacity-20 border-[2px] border-transparent animate-pulse shrink-0" />
                    <div className="h-4 bg-[var(--border)] opacity-20 w-1/3 rounded-full animate-pulse" />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="content-list" 
                className="flex flex-col w-full z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
              >
                {visibleStudios.map((studio, index) => (
                  <StudioListItem 
                    key={studio.id}
                    studio={studio} 
                    onClick={() => handleStudioClick(studio.id)}
                    borderColor={circleBorderColor}
                    isLast={index === visibleStudios.length - 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {isReady && visibleCount < filteredStudios.length && (
            <div ref={loadMoreRef} className="h-10 w-full" />
          )}
        </div>
      ) : (
        <div className="flex flex-col relative min-h-[500px]">
          <AnimatePresence mode="popLayout">
            {!isReady ? (
              <motion.div 
                key="skeleton-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex flex-col w-full absolute inset-0 left-0 top-0"
              >
                 {Array.from({ length: Math.min(visibleCount, 10) }).map((_, i) => (
                  <div key={i} className="bg-[var(--surface)] border border-transparent rounded-2xl flex items-center gap-6 px-5 py-4.5 mb-3 animate-pulse" style={{ minHeight: '112px' }}>
                    <div className="w-24 h-24 rounded-full bg-[var(--border)] opacity-20 shrink-0" />
                    <div className="h-5 bg-[var(--border)] opacity-20 w-1/2 rounded-full" />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="content-grid" 
                className="flex flex-col w-full z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
              >
                {visibleStudios.map(studio => (
                  <StudioCardItem 
                    key={studio.id}
                    studio={studio} 
                    onClick={() => handleStudioClick(studio.id)}
                    borderColor={circleBorderColor}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {isReady && visibleCount < filteredStudios.length && (
            <div ref={loadMoreRef} className="h-10 w-full" />
          )}
        </div>
      )}
      
      {isReady && filteredStudios.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center w-full z-20 relative">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
