import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { InputBar } from './InputBar';

interface StudioSelectorProps {
  studioSearch: string;
  setStudioSearch: (search: string) => void;
  selectedStudioIds: string[];
  setSelectedStudioIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentPath: string;
  onAddClick?: () => void;
}

export const StudioSelector: React.FC<StudioSelectorProps> = ({
  studioSearch,
  setStudioSearch,
  selectedStudioIds,
  setSelectedStudioIds,
  currentPath,
  onAddClick
}) => {
  const navigate = useNavigate();
  const { state, studioUsageMap } = useApp();

  const filteredStudios = useMemo(() => {
    const isSearching = studioSearch.trim().length > 0;
    let pool = state.studios.filter(t => !t.isDeleted);

    if (isSearching) {
      const search = studioSearch.toLowerCase().replace(/\s+/g, '');
      pool = pool.filter(t => t.name.toLowerCase().replace(/\s+/g, '').includes(search));
    }

    const sorted = pool.sort((a, b) => {
      const aSel = selectedStudioIds.includes(a.id) ? 1 : 0;
      const bSel = selectedStudioIds.includes(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;

      const aUse = studioUsageMap[a.id] || 0;
      const bUse = studioUsageMap[b.id] || 0;
      return bUse - aUse;
    });

    return isSearching ? sorted : sorted.slice(0, 10);
  }, [state.studios, studioSearch, selectedStudioIds, studioUsageMap]);

  return (
    <div className="flex flex-col">
      <div className="flex w-full gap-3">
        <InputBar 
          label="Studio" 
          value={studioSearch} 
          onChange={setStudioSearch} 
          placeholder="Filter studios..." 
          showPaste
          compact
        />
        <button
          type="button"
          onClick={() => {
            if (onAddClick) onAddClick();
            navigate('/manage-studios/add?from=add', { state: { from: currentPath } });
          }}
          className="w-[48px] h-[48px] rounded-full shrink-0 flex items-center justify-center bg-[var(--surface)] shadow-[inset_0_0_0_1px_var(--border)] active:scale-95 transition-all text-[var(--text-primary)] tap-highlight-none"
          title="Add Studio"
        >
          <Icons.Plus className="w-6 h-6" />
        </button>
      </div>
      <div className="flex flex-wrap gap-4 mt-5 px-1 min-h-[40px] items-center">
        {filteredStudios.map(t => (
          <button 
            key={t.id} 
            onClick={() => {
              if (selectedStudioIds.includes(t.id)) {
                setSelectedStudioIds([]);
              } else {
                setSelectedStudioIds([t.id]);
              }
            }} 
            className={`text-[12px] font-black tracking-widest transition-all ${selectedStudioIds.includes(t.id) ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
          >
            {t.name}
          </button>
        ))}
        {!studioSearch && state.studios.filter(t => !t.isDeleted).length > filteredStudios.length && (
          <div className="flex items-center justify-center text-[var(--text-muted)] opacity-50 px-2 select-none"><Icons.MoreHorizontal className="w-5 h-5"/></div>
        )}
      </div>
    </div>
  );
};
