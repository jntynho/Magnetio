
import React, { useState, useMemo, useCallback, useEffect, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { LinkCard } from '../components/LinkCard';
import { SkeletonLinkCard } from '../components/SkeletonCard';
import { PaginationBar } from '../components/Pagination';
import { usePaginatedLinks } from '../hooks/usePaginatedLinks';

export const Home: React.FC = React.memo(() => {
  const { state, searchQuery, isHydrated, hydrationError, actorMap, studioMap, deleteLink } = useApp();
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const allLinks = useMemo(() => state.links.filter(l => !l.isDeleted), [state.links]);

  
  const {
    filteredLinks,
    paginatedLinks,
    currentPage,
    handlePageChange,
    isLoading,
    isSearching,
    itemsPerPage
  } = usePaginatedLinks(allLinks, searchQuery, actorMap, studioMap);

  const handleToggle = useCallback((id: string) => {
    setActiveLinkId(prev => prev === id ? null : id);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
    let timerId = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timerId);
  }, [state.settings.sortOrder, state.settings.itemsPerPage, deferredSearchQuery, currentPage]);

  useEffect(() => {
    if (isReady) {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    }
  }, [isReady]);

  if (hydrationError) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-center px-6">
        <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.4em] mb-2">Hydration Error</h2>
        <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-medium">{hydrationError}</p>
      </div>
    );
  }

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col gpu-accelerated w-full relative min-h-[500px]">
      <AnimatePresence mode="popLayout">
        {!isReady ? (
          <motion.div 
            key="skeleton-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex flex-col w-full absolute inset-0 left-0 top-0"
          >
            {Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonLinkCard key={i} />)}
          </motion.div>
        ) : (
          <motion.div 
            key="content-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col w-full z-10"
          >
            {paginatedLinks.map((link, index) => (
                <LinkCard 
                  key={link.id}
                  link={link} 
                  isExpanded={activeLinkId === link.id}
                  onToggle={handleToggle}
                  noSideMargins={true}
                  deleteLink={deleteLink}
                  actorMap={actorMap}
                  studioMap={studioMap}
                  settings={state.settings}
                />
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-48 text-center px-6 animate-slide-in">
                <h2 className="text-sm font-black text-white/10 uppercase tracking-[0.4em] mb-2">Database Standby</h2>
                <p className="text-[10px] text-white/5 uppercase tracking-[0.2em] font-medium">No matches found in records</p>
              </div>
            )}
            
            {filteredLinks.length > 0 && (
              <PaginationBar 
                currentPage={currentPage}
                totalLinks={filteredLinks.length}
                itemsPerPage={state.settings.itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
