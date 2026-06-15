import React, { useMemo, memo, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { toTitleCase } from '../utils/format';
import { Icons } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { PaginationBar } from '../components/Pagination';

import { HanimeCoverSlider } from '../components/HanimeCoverSlider';

const HanimeGridItem = memo(({ hanime, onClick, onDelete }: { hanime: any, onClick: () => void, onDelete: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const { buttonStyle } = state.settings;

  const easeOutExpo = "cubic-bezier(0.19, 1, 0.22, 1)";

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    setIsPressing(true);
    isLongPressActive.current = false;
    
    if (pressTimer.current) clearTimeout(pressTimer.current);
    
    pressTimer.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      setIsExpanded(true);
      setIsPressing(false);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      pressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerCancel = () => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActive.current = false;
      return;
    }
    if (isExpanded) {
      if (!isConfirming) setIsExpanded(false);
      return;
    }
    onClick();
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={handleItemClick}
        className={`rounded-xl cursor-pointer shadow-md relative overflow-hidden aspect-[5/7] select-none bg-neutral-800/80 transition-all duration-500 ease-out ${isPressing ? 'scale-[0.96] brightness-75' : 'scale-100 hover:shadow-xl hover:-translate-y-1 hover:ring-1 hover:ring-white/10'}`}
        style={{ touchAction: 'pan-x pan-y', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Full cover image */}
        <HanimeCoverSlider hanime={hanime} />

        <div 
          className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center gap-6 gpu-accelerated will-change-[opacity]" 
          style={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none', transition: `opacity 300ms ${easeOutExpo}` }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isConfirming) setIsExpanded(false);
          }}
        >
          {isConfirming ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center justify-center gap-4 p-4 w-full" 
              onClick={e => e.stopPropagation()}
            >
              <span className="text-white text-lg font-medium tracking-wide text-center mb-2">Are you sure?</span>
              <div className="flex flex-col gap-3 w-full max-w-[160px]">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); onDelete(hanime.id); setIsExpanded(false); setIsConfirming(false); }} className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-600 text-white text-sm font-semibold uppercase tracking-wider">
                  <Icons.Trash size={16} /> Delete
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }} className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-neutral-700 text-white text-sm font-semibold uppercase tracking-wider">
                  <Icons.X size={16} /> Cancel
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center gap-4 p-4 w-full" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col gap-3 w-full max-w-[160px]">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); navigate(`/manage-hanime/edit/${hanime.id}`, { state: { from: location.pathname + location.search } }); }} className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold uppercase tracking-wider">
                  <Icons.Edit size={16} /> Edit
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setIsConfirming(true); }} className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-600 text-white text-sm font-semibold uppercase tracking-wider">
                  <Icons.Trash size={16} /> Delete
                </motion.button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-white/50 text-xs font-medium tracking-widest uppercase mt-2">
                Cancel
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="px-1 mt-0.5 h-[2.75rem] flex items-start">
        <h3 
          className="text-transparent bg-clip-text bg-gradient-to-b from-pink-100 to-rose-300 font-bold text-[13px] tracking-tight line-clamp-2 leading-snug"
          title={toTitleCase(hanime.title)}
          style={{ fontFamily: "'Manga', 'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive", letterSpacing: '0.5px' }}
        >
          {toTitleCase(hanime.title)}
        </h3>
      </div>
    </div>
  );
});

export const HanimeManagement: React.FC = React.memo(() => {
  const { state, searchQuery, isHydrated, deleteHanime, pageRegistry, setPageRegistry } = useApp();
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const { sortOrder, itemsPerPage = 20 } = state.settings;
  const [isReady, setIsReady] = useState(false);

  const pageKey = useMemo(() => location.pathname, [location.pathname]);
  const [currentPage, setCurrentPage] = useState(() => pageRegistry[pageKey] || 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPageRegistry(prev => ({ ...prev, [pageKey]: currentPage }));
  }, [currentPage, pageKey, setPageRegistry]);

  useEffect(() => {
    setIsReady(false);
    let timerId = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timerId);
  }, [sortOrder, deferredSearchQuery, currentPage]);

  useEffect(() => {
    if (isReady) {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    }
  }, [isReady]);
  
  const filteredHanime = useMemo(() => {
    let hanime = state.hanime.filter(h => !h.isDeleted);
    
    if (deferredSearchQuery.trim()) {
      hanime = hanime.filter(h => 
        h.title.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return hanime.sort((a, b) => {
      if (sortOrder === 'Newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOrder === 'DateDesc') return (b.assignedDate || b.createdAt || 0) - (a.assignedDate || a.createdAt || 0);
      if (sortOrder === 'DateAsc') return (a.assignedDate || a.createdAt || 0) - (b.assignedDate || b.createdAt || 0);
      if (sortOrder === 'A-Z') return a.title.localeCompare(b.title);
      if (sortOrder === 'Z-A') return b.title.localeCompare(a.title);
      return 0;
    });
  }, [state.hanime, deferredSearchQuery, sortOrder]);

  const paginatedHanime = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredHanime.slice(start, end);
  }, [filteredHanime, currentPage, itemsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredHanime.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredHanime.length, itemsPerPage, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleHanimeClick = (id: string) => {
    navigate(`/hanime/${id}`, { state: { from: location.pathname + location.search } });
  };

  if (!isHydrated) return null;

  return (
    <div className="w-full px-1 pb-3.5 pt-3.5 animate-slide-in gpu-accelerated relative min-h-[500px]">
      <AnimatePresence mode="popLayout">
        {!isReady ? (
          <motion.div 
            key="skeleton-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-2 gap-4 w-full absolute inset-0 left-0 top-0 px-1 pt-3.5"
          >
            {Array.from({ length: Math.min(itemsPerPage, 12) }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="rounded-xl bg-[var(--border)] opacity-20 aspect-[5/7] animate-pulse" />
                <div className="h-4 bg-[var(--border)] opacity-20 w-3/4 rounded-full mt-0.5 animate-pulse" />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="content-grid" 
            className="grid grid-cols-2 gap-4 w-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
          >
            {paginatedHanime.map((hanime, index) => (
                <HanimeGridItem 
                  key={`${hanime.id}-${sortOrder}`} 
                  hanime={hanime} 
                  onClick={() => handleHanimeClick(hanime.id)}
                  onDelete={deleteHanime}
                />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {isReady && filteredHanime.length > 0 && (
        <PaginationBar 
          currentPage={currentPage}
          totalLinks={filteredHanime.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}

      {isReady && filteredHanime.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center w-full z-20 relative">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </motion.div>
      )}
    </div>
  );
});
