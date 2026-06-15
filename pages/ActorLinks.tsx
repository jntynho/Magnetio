
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Navigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { LinkCard } from '../components/LinkCard';
import { PaginationBar } from '../components/Pagination';
import { SkeletonActorHeader, SkeletonLinkCard } from '../components/SkeletonCard';
import { toTitleCase } from '../utils/format';
import { usePaginatedLinks } from '../hooks/usePaginatedLinks';

export const ActorLinks: React.FC = React.memo(() => {
  const { id } = useParams();
  const { state, searchQuery, actorMap, studioMap, isHydrated, deleteLink } = useApp();
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const associatedLinks = useMemo(() => {
    if (!id || !isHydrated) return [];
    return state.links.filter(l => !l.isDeleted && l.actorIds.includes(id));
  }, [state.links, id, isHydrated]);

  const {
    filteredLinks,
    paginatedLinks,
    currentPage,
    handlePageChange,
    isLoading,
    isSearching,
    itemsPerPage
  } = usePaginatedLinks(associatedLinks, searchQuery, actorMap, studioMap, id);

  useEffect(() => {
    setIsReady(false);
    let timerId = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timerId);
  }, [state.settings.sortOrder, state.settings.itemsPerPage, searchQuery, currentPage]);

  useEffect(() => {
    if (isReady) {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    }
  }, [isReady]);

  const actor = useMemo(() => actorMap.get(id || ''), [actorMap, id]);

  const handleToggle = React.useCallback((id: string) => {
    setActiveLinkId(prev => prev === id ? null : id);
  }, []);

  if (!isHydrated || !isReady) {
    return (
      <div className="flex flex-col animate-pulse w-full">
        <SkeletonActorHeader />
        {Array.from({ length: Math.min(itemsPerPage, 15) }).map((_, i) => <SkeletonLinkCard key={i} />)}
      </div>
    );
  }
  if (!actor) return <Navigate to="/manage-actors" replace />;

  return (
    <motion.div 
      key={`${currentPage}-${state.settings.sortOrder}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0 }}
      className="flex flex-col gpu-accelerated w-full"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="px-5 mb-0 mt-0" style={{ backgroundColor: 'var(--bg)' }}>
         <div className="flex items-center gap-7 py-10 border-b border-[var(--border)]">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden border-[4px] shrink-0 bg-[var(--surface)] shadow-2xl ring-1 ring-black/10 transition-colors duration-500"
              style={{ borderColor: state.settings.circleBorderColor }}
            >
               {(actor.originalImageUrl || actor.imageUrl) && (
                 <img 
                   src={actor.originalImageUrl || actor.imageUrl} 
                   className="w-full h-full object-cover" 
                   alt={actor.name}
                   referrerPolicy="no-referrer"
                 />
               )}
            </div>
            <div className="flex flex-col min-w-0">
               <h3 className="text-[26px] font-black text-[var(--text-primary)] tracking-tight leading-relaxed mb-1 truncate">
                 {toTitleCase(actor.name)}
               </h3>
               <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.25em] mt-2 py-0.5">
                 {filteredLinks.length} {filteredLinks.length === 1 ? 'link' : 'links'}
               </span>
            </div>
         </div>
      </div>

      {filteredLinks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center px-6 opacity-30">
          <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.4em]">No links</h2>
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col w-full overflow-x-hidden min-h-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
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
          <PaginationBar 
            currentPage={currentPage}
            totalLinks={filteredLinks.length}
            itemsPerPage={state.settings.itemsPerPage}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}
    </motion.div>
  );
});
