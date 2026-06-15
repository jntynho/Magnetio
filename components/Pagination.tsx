
import React from 'react';
import { Icons } from '../constants';

interface PaginationProps {
  currentPage: number;
  totalLinks: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const PaginationBar: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalLinks, 
  itemsPerPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalLinks / itemsPerPage);

  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page === currentPage) return;
    
    onPageChange(page);
    
    // When manually changing pages, scroll to top of the specific container
    const scrollContainer = document.getElementById('scroll-area');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const renderPages = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic for many pages
      if (currentPage <= 4) {
        // Near the start: 1 2 3 4 5 ... totalPages
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-end');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end: 1 ... totalPages-4 totalPages-3 totalPages-2 totalPages-1 totalPages
        pages.push(1);
        pages.push('ellipsis-start');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle: 1 ... currentPage-1 currentPage currentPage+1 ... totalPages
        pages.push(1);
        pages.push('ellipsis-start');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis-end');
        pages.push(totalPages);
      }
    }

    return pages.map((page, index) => {
      if (typeof page === 'string') {
        return (
          <span key={page} className="text-[var(--text-muted)] opacity-40 px-1 select-none">
            ...
          </span>
        );
      }

      return (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          className={`transition-all duration-300 min-w-[28px] h-8 rounded-md flex items-center justify-center text-[13px] font-bold active:scale-90 ${
            currentPage === page 
              ? 'text-[var(--accent)] bg-[var(--accent)]/10' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
          }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="w-full flex items-center justify-center pt-4 pb-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageClick(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            currentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 active:scale-90'
          }`}
        >
          <Icons.ChevronLeft />
        </button>
        
        <div className="flex items-center gap-1">
          {renderPages()}
        </div>

        <button
          onClick={() => handlePageClick(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 active:scale-90'
          }`}
        >
          <Icons.ChevronRight />
        </button>
      </div>
    </div>
  );
};
