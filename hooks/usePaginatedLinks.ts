import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { filterLinks } from '../utils/search';

export const usePaginatedLinks = (
  items: any[],
  searchQuery: string,
  actorMap: Map<string, any>,
  studioMap: Map<string, any>,
  id?: string
) => {
  const location = useLocation();
  const { state, pageRegistry, setPageRegistry } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const pageKey = useMemo(() => location.pathname, [location.pathname]);
  const [currentPage, setCurrentPage] = useState(() => pageRegistry[pageKey] || 1);

  // Sync state with registry when pageKey changes (e.g. navigation)
  useEffect(() => {
    const registeredPage = pageRegistry[pageKey] || 1;
    if (currentPage !== registeredPage) {
      setCurrentPage(registeredPage);
    }
  }, [pageKey, pageRegistry]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setPageRegistry(prev => ({ ...prev, [pageKey]: page }));
  }, [pageKey, setPageRegistry]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    if (searchQuery) {
      handlePageChange(1);
    }
  }, [searchQuery, handlePageChange]);

  // Search effect
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Scroll restoration
  useEffect(() => {
    if (!isLoading && !isSearching) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('restore-scroll'));
      });
    }
  }, [location.pathname, isLoading, isSearching]);

  // Filter and sort logic
  const filteredLinks = useMemo(() => {
    let filtered = filterLinks(items, deferredSearchQuery, actorMap, studioMap, id);

    if (!deferredSearchQuery || typeof deferredSearchQuery !== 'string' || !deferredSearchQuery.trim()) {
      const { sortOrder } = state.settings;
      filtered = [...filtered].sort((a, b) => {
        if (sortOrder === 'Newest') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        
        if (sortOrder === 'DateDesc' || sortOrder === 'DateAsc') {
          const aDate = a.assignedDate;
          const bDate = b.assignedDate;
          
          if (aDate !== undefined && bDate !== undefined) {
            return sortOrder === 'DateDesc' ? bDate - aDate : aDate - bDate;
          }
          if (aDate !== undefined) return -1;
          if (bDate !== undefined) return 1;
          
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        return 0;
      });
    }
    return filtered;
  }, [items, deferredSearchQuery, state.settings.sortOrder, actorMap, studioMap, id]);

  // Pagination logic
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * state.settings.itemsPerPage;
    const end = start + state.settings.itemsPerPage;
    return filteredLinks.slice(start, end);
  }, [filteredLinks, currentPage, state.settings.itemsPerPage]);

  // Reset page if out of bounds
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredLinks.length / state.settings.itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredLinks.length, state.settings.itemsPerPage, currentPage]);

  return {
    filteredLinks,
    paginatedLinks,
    currentPage,
    handlePageChange,
    isLoading,
    isSearching,
    itemsPerPage: state.settings.itemsPerPage
  };
};
