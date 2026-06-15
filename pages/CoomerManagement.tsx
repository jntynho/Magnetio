
import React, { useMemo, memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { toTitleCase } from '../utils/format';

let cachedVisibleCount = 30;

const CoomerListItem = memo(({ coomer, onClick, borderColor, isLast }: { coomer: any, onClick: (id: string) => void, borderColor: string, isLast: boolean }) => {
  const imgSrc = coomer.originalImageUrl || coomer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(coomer.name)}&background=random`;
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onClick(coomer.id)}
      className={`flex items-center gap-4 px-2 py-4 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] cursor-pointer group ${!isLast ? 'border-b border-[var(--border)]' : ''}`}
    >
      <div 
        className="w-16 h-16 rounded-full overflow-hidden bg-[var(--surface)] border-[2px] shrink-0 shadow-md relative transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        {!isLoaded && <div className="absolute inset-0 bg-[var(--border)] animate-pulse" />}
        <img 
          src={imgSrc} 
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          alt={coomer.name}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      <span className="text-[var(--text-primary)] font-bold text-[17px] tracking-normal truncate flex-1 leading-relaxed">
        {toTitleCase(coomer.name)}
      </span>
    </motion.div>
  );
});

const CoomerCardItem = memo(({ coomer, onClick, borderColor }: { coomer: any, onClick: (id: string) => void, borderColor: string }) => {
  const imgSrc = coomer.originalImageUrl || coomer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(coomer.name)}&background=random`;
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onClick(coomer.id)}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center gap-6 px-5 py-4.5 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] active:scale-[0.99] cursor-pointer group mb-3 last:mb-0 shadow-sm"
      style={{ minHeight: '112px' }}
    >
      <div 
        className="w-24 h-24 rounded-full overflow-hidden bg-[var(--surface)] border-[3.5px] shrink-0 shadow-xl relative ring-1 ring-black/10 transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        {!isLoaded && <div className="absolute inset-0 bg-[var(--border)] animate-pulse" />}
        <img 
          src={imgSrc} 
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          alt={coomer.name}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span className="text-[var(--text-primary)] font-bold text-[19px] tracking-normal truncate group-active:text-[var(--accent)] transition-colors leading-relaxed py-1.5">
          {toTitleCase(coomer.name)}
        </span>
      </div>
    </motion.div>
  );
});

export const CoomerManagement: React.FC = React.memo(() => {
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
    return () => clearTimeout(timerId);
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
    let id = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    }, 100);
    return () => clearTimeout(id);
  }, [location.pathname]);
  
  const filteredCoomers = useMemo(() => {
    let coomers = state.coomers.filter(c => !c.isDeleted);
    
    if (deferredSearchQuery.trim()) {
      coomers = coomers.filter(coomer => 
        coomer.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return coomers.sort((a, b) => {
      const order = sortOrder as string;
      if (order === 'Newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (order === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (order === 'A-Z') return a.name.localeCompare(b.name);
      if (order === 'Z-A') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [state.coomers, deferredSearchQuery, sortOrder]);

  useEffect(() => {
    setVisibleCount(30);
    cachedVisibleCount = 30;
  }, [searchQuery, sortOrder]);

  const visibleCoomers = useMemo(() => filteredCoomers.slice(0, visibleCount), [filteredCoomers, visibleCount]);

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
  }, [visibleCoomers.length, isReady]);

  const handleCoomerClick = useCallback((id: string) => {
    navigate(`/coomer/${id}`, { state: { from: location.pathname + location.search } });
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
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`flex items-center gap-4 px-2 py-4 ${i < 11 ? 'border-b border-[var(--border)]' : ''}`}>
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
                animate={{ opacity: 1, transition: { duration: 0.2, staggerChildren: 0.05 } }}
              >
                {visibleCoomers.map((coomer, index) => (
                  <CoomerListItem 
                    key={coomer.id}
                    coomer={coomer} 
                    onClick={handleCoomerClick}
                    borderColor={circleBorderColor}
                    isLast={index === visibleCoomers.length - 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {isReady && visibleCount < filteredCoomers.length && (
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
                 {Array.from({ length: 8 }).map((_, i) => (
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
                animate={{ opacity: 1, transition: { duration: 0.2, staggerChildren: 0.05 } }}
              >
                {visibleCoomers.map(coomer => (
                  <CoomerCardItem 
                    key={coomer.id}
                    coomer={coomer} 
                    onClick={handleCoomerClick}
                    borderColor={circleBorderColor}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {isReady && visibleCount < filteredCoomers.length && (
            <div ref={loadMoreRef} className="h-10 w-full" />
          )}
        </div>
      )}
      
      {isReady && filteredCoomers.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center w-full z-20 relative">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
