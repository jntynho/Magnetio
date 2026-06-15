
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons, THEME_CONFIGS } from '../constants';
import { Notification } from './Notification';

const globalScrollRegistry: Record<string, number> = {};

const CompactIcon: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 21 }) => (
  <div style={{ transform: `scale(${size / 24})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </div>
);

const MorphingSortIcon: React.FC<{ order: string }> = ({ order }) => {
  const paths: Record<string, string> = {
    'N': "M6 18V6L18 18V6",
    'O': "M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6",
    'D': "M8 6V18H12C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6H8",
    'V': "M6 6L12 18L18 6"
  };
  let letter = 'N';
  if (order === 'Newest') letter = 'N';
  else if (order === 'Oldest') letter = 'O';
  else if (order === 'DateDesc') letter = 'D';
  else if (order === 'DateAsc') letter = 'V';
  
  const currentPath = paths[letter] || paths['N'];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 ease-in-out">
      <path d={currentPath} className="transition-all duration-500 ease-in-out" style={{ transitionProperty: 'd' }} />
    </svg>
  );
};

const SimplePencilIcon = Icons.Edit;

const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

const SearchInput = React.memo(({ 
  value, 
  onChange, 
  placeholder, 
  hColors, 
  accentColor 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="flex-1 h-10 flex items-center mx-3 min-w-0 relative bg-[var(--accent)]/15 rounded-full overflow-hidden">
      <div 
        className="absolute left-[15px] inset-y-0 flex items-center justify-center pointer-events-none" 
        style={{ color: accentColor }}
      >
        <Icons.SearchIcon size={21} />
      </div>
      <input 
        type="text" 
        placeholder="" 
        value={value} 
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => onChange(e.target.value)} 
        className="bg-transparent border-none outline-none flex-1 text-[15px] font-semibold tracking-tight w-full text-center px-10" 
        style={{ color: hColors.textPrimary }} 
      />
      {value && (
        <button 
          onClick={() => { onChange(''); }} 
          className="w-6 h-6 flex items-center justify-center rounded-full transition-all tap-highlight-none pointer-events-auto absolute right-3 hover:bg-[var(--accent)]/10 active:scale-90" 
          style={{ color: accentColor }}
        >
          <CompactIcon size={16}><Icons.X /></CompactIcon>
        </button>
      )}
    </div>
  );
});

const MenuButton = React.memo(({ icon: Icon, label, path, isLast, hColors, accentColor, onNavigate }: any) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onNavigate(path);
    }}
    className={`flex items-center gap-4 w-full h-14 px-6 transition-colors duration-200 active:bg-[var(--accent)]/10 tap-highlight-none group ${!isLast ? 'border-b' : ''}`}
    style={{ color: hColors.textPrimary, borderColor: hColors.border }}
  >
    <div style={{ color: accentColor }} className="shrink-0 transition-transform duration-200 group-active:scale-90"><CompactIcon size={18}><Icon /></CompactIcon></div>
    <span className="text-[12px] font-black tracking-[0.22em] flex-1 text-left leading-none mt-[1px]">{label}</span>
    <div className="opacity-20 transform scale-75 transition-transform duration-200 group-active:translate-x-1"><Icons.ChevronRight /></div>
  </button>
));

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, searchQuery, setSearchQuery, settingsView, setSettingsView, isMenuOpen, setIsMenuOpen, toggleSort, setFormDraft } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, accentColor, sortOrder, headerOpacity, headerTheme } = state.settings;
  const colors = (THEME_CONFIGS as any)[theme];

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);

  const isHome = location.pathname === '/';
  const isSettings = location.pathname === '/settings';
  const isActorVault = location.pathname.startsWith('/actor/');
  const isStudioVault = location.pathname.startsWith('/studio/');
  const isManageActors = location.pathname === '/manage-actors';
  const isManageStudios = location.pathname === '/manage-studios';
  const isManageCoomers = location.pathname === '/manage-coomers';
  const isManageHanime = location.pathname === '/manage-hanime';
  const isCoomerDetail = location.pathname.startsWith('/coomer/') && !location.pathname.endsWith('/add-socials') && !location.pathname.includes('/media/');
  const isHanimeDetail = location.pathname.startsWith('/hanime/');
  const isAddCoomerSocials = location.pathname.includes('/add-socials');
  
  const isEditPage = location.pathname === '/add' || 
                    location.pathname.startsWith('/edit/') || 
                    location.pathname === '/add-gallery' ||
                    location.pathname === '/multi-cover' ||
                    location.pathname.startsWith('/manage-actors/edit/') || 
                    location.pathname === '/manage-actors/add' ||
                    location.pathname.startsWith('/manage-studios/edit/') ||
                    location.pathname === '/manage-studios/add' ||
                    location.pathname.startsWith('/manage-coomers/edit/') ||
                    location.pathname === '/manage-coomers/add' ||
                    location.pathname.startsWith('/manage-hanime/edit/') ||
                    location.pathname.startsWith('/edit-episode/') ||
                    location.pathname === '/manage-hanime/add' ||
                    location.pathname === '/manage-hanime/second-covers' ||
                    location.pathname === '/manage-hanime/episodes' ||
                    isAddCoomerSocials;

  const isImmersivePage = isHome || isActorVault || isStudioVault || isCoomerDetail || isHanimeDetail;
  const activeHeaderTheme = headerTheme === 'Default' ? theme : headerTheme;
  const hColors = (THEME_CONFIGS as any)[activeHeaderTheme];

  const totalLinkCount = useMemo(() => state.links.filter(l => !l.isDeleted).length, [state.links]);

  const getScrollKey = useCallback((specificPath?: string, specificSearch?: string) => {
    const path = specificPath || location.pathname;
    // Only include search query in scroll key for home and vault pages to avoid unnecessary re-renders in edit pages
    const isSearchable = path === '/' || path.startsWith('/actor/') || path.startsWith('/studio/') || path.startsWith('/manage-');
    const search = isSearchable ? (specificSearch !== undefined ? specificSearch : searchQuery) : '';
    
    if (path === '/settings') return `settings:${settingsView}`;
    
    // Remember scroll position per tab in CoomerDetail
    if (path.startsWith('/coomer/') && !path.includes('/media/') && !path.includes('/add-socials')) {
      return `${path}:${state.coomerActiveTab}`;
    }
    
    return `${path}:${search}`;
  }, [location.pathname, settingsView, searchQuery, state.coomerActiveTab]);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevScrollKeyRef = useRef<string>(getScrollKey());

  useEffect(() => {
    prevScrollKeyRef.current = getScrollKey();
  }, [getScrollKey]);

  const saveCurrentScroll = useCallback((isSyncParam?: boolean | React.UIEvent) => {
    const isSync = typeof isSyncParam === 'boolean' ? isSyncParam : false;
    
    if (!scrollAreaRef.current) return;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    const container = scrollAreaRef.current;
    const currentScroll = container.scrollTop;
    
    // Capture the key SYNCHRONOUSLY at the moment the scroll event fires
    const keyAtEvent = prevScrollKeyRef.current;
    
    if (isSync) {
      if (globalScrollRegistry[keyAtEvent] !== currentScroll) {
        globalScrollRegistry[keyAtEvent] = currentScroll;
      }
    } else {
      scrollTimeoutRef.current = setTimeout(() => {
        if (container) {
          // Use the synchronously captured currentScroll in case route already changed
          if (globalScrollRegistry[keyAtEvent] !== currentScroll) {
            globalScrollRegistry[keyAtEvent] = currentScroll;
          }
        }
        scrollTimeoutRef.current = null;
      }, 150);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      saveCurrentScroll(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [saveCurrentScroll]);

  useLayoutEffect(() => {
    const container = scrollAreaRef.current;
    if (!container) return;

    let rAF_id: number;
    let attempts = 0;
    
    const performScroll = () => {
      if (!scrollAreaRef.current) return;
      const key = getScrollKey();
      const targetY = globalScrollRegistry[key] || 0;
      
      // If we don't need to scroll, stop.
      if (targetY === 0) {
        container.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      container.scrollTo({ top: targetY, behavior: 'instant' });
      
      // If the container hasn't expanded enough to reach targetY, try again, up to 60 frames
      if (Math.abs(container.scrollTop - targetY) > 0.5 && attempts < 60) {
        attempts++;
        rAF_id = requestAnimationFrame(performScroll);
      }
    };

    const handleRestore = () => {
      attempts = 0;
      rAF_id = requestAnimationFrame(performScroll);
    };

    window.addEventListener('restore-scroll', handleRestore);
    
    // Initial restore on path/search/tab change
    handleRestore();

    return () => {
      window.removeEventListener('restore-scroll', handleRestore);
      cancelAnimationFrame(rAF_id);
    };
  }, [location.pathname, location.search, getScrollKey]);

  const headerTitle = useMemo(() => {
    let title = '';
    if (location.pathname.startsWith('/edit')) title = 'Edit Link';
    else if (location.pathname === '/add') title = 'Add Link';
    else if (location.pathname === '/add-gallery') title = 'Gallery';
    else if (location.pathname === '/multi-cover') title = 'Multi Cover';
    else if (location.pathname.startsWith('/manage-actors/edit')) title = 'Edit Actor';
    else if (location.pathname === '/manage-actors/add') title = 'Add Actor';
    else if (location.pathname.startsWith('/manage-studios/edit')) title = 'Edit Studio';
    else if (location.pathname === '/manage-studios/add') title = 'Add Studio';
    else if (location.pathname.startsWith('/manage-coomers/edit')) title = 'Edit Person';
    else if (location.pathname === '/manage-coomers/add') title = 'Add Person';
    else if (location.pathname.startsWith('/manage-hanime/edit')) title = 'Edit Hanime';
    else if (location.pathname === '/manage-hanime/add') title = 'Add Hanime';
    else if (location.pathname.startsWith('/edit-episode/')) title = 'Edit Episode';
    else if (location.pathname === '/manage-hanime/episodes') title = 'Episodes';
    else if (location.pathname === '/manage-hanime/second-covers') title = 'Second Covers';
    else if (isAddCoomerSocials) title = 'Add Socials';
    else if (location.pathname === '/scraper') title = 'Scraper';
    else if (isActorVault) title = 'Actor Vault';
    else if (isStudioVault) title = 'Studio Vault';
    else if (isCoomerDetail) title = '';
    else if (isManageActors) title = 'Actors';
    else if (isManageStudios) title = 'Studio';
    else if (isManageCoomers) title = 'Coomer';
    else if (isManageHanime) title = '';
    else if (location.pathname.startsWith('/hanime/')) {
      const parts = location.pathname.split('/');
      const hId = parts[2];
      const h = state.hanime.find(item => item.id === hId);
      title = h ? h.title : 'Episodes';
    }
    else if (isSettings) {
      switch (settingsView as any) {
        case 'theme': title = 'Theme'; break;
        case 'header': title = 'Header Setting'; break;
        case 'cover': title = 'Cover Customization'; break;
        case 'display': title = 'Display'; break;
        case 'data': title = 'Data Management'; break;
        case 'statistics': title = 'Statistics'; break;
        case 'statistics-detail': title = 'Asset Browser'; break;
        default: title = 'Settings'; break;
      }
    }
    return title;
  }, [location.pathname, settingsView, isActorVault, isStudioVault, isManageActors, isManageStudios, isManageCoomers, isManageHanime, isCoomerDetail, isSettings, isAddCoomerSocials, state.hanime]);

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search when global searchQuery changes from elsewhere (e.g. navigation)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce local search to global searchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  useEffect(() => {
    setIsMenuOpen(false); 
    if (!isManageActors && !isManageStudios && !isManageCoomers && !isHome && !isActorVault && !isStudioVault) {
      setSearchQuery(''); 
    }
  }, [location.pathname, isManageActors, isManageStudios, isManageCoomers, isHome, isActorVault, isStudioVault, setSearchQuery, setIsMenuOpen]);

  useEffect(() => {
    if (location.pathname === '/settings') {
      const view = (location.state as any)?.settingsView || 'main';
      if (settingsView !== view) {
        setSettingsView(view);
      }
    } else {
      setSettingsView('main');
    }
  }, [location.pathname, location.state, setSettingsView, settingsView]);

  const handleBack = useCallback(() => {
    saveCurrentScroll(true);

    if (isSettings && settingsView !== 'main') {
      navigate('/settings', { replace: true });
      return;
    }

    if (isAddCoomerSocials) {
      const parts = location.pathname.split('/');
      if (parts[2]) navigate(`/coomer/${parts[2]}`);
      else navigate('/');
      return;
    }

    // Clear draft if leaving a main add/edit page
    if (location.pathname === '/add' || location.pathname.startsWith('/edit/')) {
      setFormDraft(null);
    }
    
    const state = location.state as any;
    if (state && state.from && typeof state.from === 'string') {
      const currentFullPath = location.pathname + location.search;
      if (state.from !== currentFullPath && state.from !== location.pathname) {
        navigate(state.from, { replace: true });
        return;
      }
    }

    // --- Explicit Navigation Fallbacks ---
    
    // Hanime sub-pages
    if (location.pathname === '/manage-hanime/second-covers' || location.pathname === '/manage-hanime/episodes') {
      const _state = location.state as any;
      if (_state && _state.hanimeId) navigate(`/manage-hanime/edit/${_state.hanimeId}`, { replace: true });
      else navigate('/manage-hanime/add', { replace: true });
      return;
    }
    
    if (location.pathname.startsWith('/edit-episode/')) {
      const parts = location.pathname.split('/');
      if (parts[2] && parts[2] !== 'new') {
        navigate(`/manage-hanime/edit/${parts[2]}`, { replace: true });
      } else {
        navigate('/manage-hanime/add', { replace: true });
      }
      return;
    }

    // Edit and Detail pages backing to their respective management views
    if (location.pathname.startsWith('/manage-actors/')) { navigate('/manage-actors', { replace: true }); return; }
    if (location.pathname.startsWith('/manage-studios/')) { navigate('/manage-studios', { replace: true }); return; }
    if (location.pathname.startsWith('/manage-coomers/')) { navigate('/manage-coomers', { replace: true }); return; }
    if (location.pathname.startsWith('/manage-hanime/')) { navigate('/manage-hanime', { replace: true }); return; }
    
    if (isActorVault) { navigate('/manage-actors', { replace: true }); return; }
    if (isStudioVault) { navigate('/manage-studios', { replace: true }); return; }
    if (isCoomerDetail) { navigate('/manage-coomers', { replace: true }); return; }
    if (isHanimeDetail) { navigate('/manage-hanime', { replace: true }); return; }

    // Top management views backing to Home
    if (location.pathname === '/manage-actors' || 
        location.pathname === '/manage-studios' || 
        location.pathname === '/manage-coomers' || 
        location.pathname === '/manage-hanime' ||
        location.pathname === '/add' ||
        location.pathname.startsWith('/edit/') ||
        location.pathname === '/add-gallery' ||
        location.pathname === '/scraper' ||
        location.pathname === '/settings') {
      navigate('/', { replace: true });
      return;
    }

    // Default fallback if we somehow didn't match anything
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [isSettings, settingsView, navigate, location, setFormDraft, isActorVault, isStudioVault, isCoomerDetail, isHanimeDetail, isEditPage, saveCurrentScroll, isAddCoomerSocials]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isMenuOpen) {
        e.preventDefault();
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMenuOpen, setIsMenuOpen, location.pathname]);

  const handleMenuNavigate = useCallback((path: string) => {
    setSearchQuery('');
    navigate(path);
    setIsMenuOpen(false);
  }, [setSearchQuery, navigate, setIsMenuOpen]);

  const btnClass = "w-10 h-10 flex items-center justify-center rounded-full transition-all bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 active:scale-90";
  
  const isSearchablePage = isHome || isActorVault || isStudioVault;

  const Header = useMemo(() => {
    return (
      <header className={`fixed top-0 left-0 right-0 h-16 z-[170] flex items-center border-b px-4 gpu-accelerated transition-colors duration-300 ease-in-out`} 
        style={{ 
          backgroundColor: hexToRgba(colors.bg, 100),
          borderColor: hColors.border,
          color: hColors.textPrimary,
        }}>
        <div className="w-full max-w-2xl mx-auto flex items-center h-full relative">
          {isSearchablePage ? (
            <>
              {isHome ? (
                <button id="menu-trigger-btn" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className={`${btnClass} relative z-[210] tap-highlight-none`} style={{ color: accentColor }}>
                  <div className={`transition-transform duration-300 ease-in-out ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                    <CompactIcon size={22}>{isMenuOpen ? <Icons.X /> : <Icons.Menu />}</CompactIcon>
                  </div>
                </button>
              ) : (
                <button onClick={handleBack} className={btnClass} style={{ color: accentColor }}>
                  <CompactIcon size={20}><Icons.ChevronLeft /></CompactIcon>
                </button>
              )}
              
              <button onClick={toggleSort} className={`${btnClass} ml-2`} style={{ color: accentColor }}><div className="scale-[0.8]"><MorphingSortIcon order={sortOrder} /></div></button>
              
              <SearchInput 
                value={localSearch} 
                onChange={setLocalSearch} 
                placeholder="Search" 
                hColors={hColors} 
                accentColor={accentColor} 
              />
              
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => {
                    if (isHome) {
                      navigate('/add');
                    } else {
                      const parts = location.pathname.split('/');
                      const id = parts[parts.length - 1];
                      const type = isActorVault ? 'actor' : 'studio';
                      navigate(`/add?${type}=${id}`, { state: { from: location.pathname + location.search } });
                    }
                  }} 
                  className={btnClass} 
                  style={{ color: accentColor }}
                >
                  <CompactIcon size={22}><Icons.Plus /></CompactIcon>
                </button>
                
                {isHome ? (
                  <button onClick={() => navigate('/settings')} className={btnClass} style={{ color: accentColor }}><CompactIcon size={18}><Icons.Settings /></CompactIcon></button>
                ) : (
                  <button onClick={() => {
                    const parts = location.pathname.split('/');
                    const id = parts[parts.length - 1];
                    const currentPath = location.pathname + location.search;
                    navigate(`/manage-${isActorVault ? 'actors' : 'studios'}/edit/${id}?from=vault`, { state: { from: currentPath } });
                  }} className={btnClass} style={{ color: accentColor }}>
                    <CompactIcon size={18}><SimplePencilIcon /></CompactIcon>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full h-full relative">
              <button onClick={handleBack} className={btnClass} style={{ color: accentColor }}>
                <CompactIcon size={20}><Icons.ChevronLeft /></CompactIcon>
              </button>
              {!isHanimeDetail && headerTitle !== '' && !(isManageActors || isManageStudios || isManageCoomers || isManageHanime) && (
                <h1 className="h-10 flex items-center justify-center rounded-full bg-[var(--accent)]/15 px-4 text-[15px] font-bold tracking-tight truncate" style={{ color: accentColor, fontFamily: headerTitle === 'Hanime' ? "'Manga', 'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive" : undefined, letterSpacing: headerTitle === 'Hanime' ? '1px' : undefined }}>{headerTitle}</h1>
              )}
              {(isManageActors || isManageStudios || isManageCoomers || isManageHanime) && (
                <SearchInput 
                  value={localSearch} 
                  onChange={setLocalSearch} 
                  placeholder={headerTitle || "Search"} 
                  hColors={hColors} 
                  accentColor={accentColor} 
                />
              )}
                <div className="min-w-[40px] flex justify-end items-center gap-2 shrink-0">
                  {isEditPage ? (
                    <button onClick={() => window.dispatchEvent(new CustomEvent('vault-save-trigger'))} className={btnClass} style={{ color: accentColor }}>
                      <CompactIcon size={22}><Icons.Check /></CompactIcon>
                    </button>
                  ) : (
                    <>
                      {isCoomerDetail && (
                        <button onClick={() => {
                          const parts = location.pathname.split('/');
                          const id = parts[parts.length - 1];
                          navigate(`/coomer/${id}/add-socials`, { state: { from: location.pathname } });
                        }} className={btnClass} style={{ color: accentColor }}>
                          <CompactIcon size={22}><Icons.Plus /></CompactIcon>
                        </button>
                      )}
                      {(isActorVault || isStudioVault || isCoomerDetail || isHanimeDetail) && (
                        <button onClick={() => {
                          const parts = location.pathname.split('/');
                          const id = parts[parts.length - 1];
                          const currentPath = location.pathname + location.search;
                          if (isCoomerDetail) {
                            navigate(`/manage-coomers/edit/${id}?from=vault`, { state: { from: currentPath } });
                          } else if (isHanimeDetail) {
                            navigate(`/manage-hanime/edit/${id}?from=vault`, { state: { from: currentPath } });
                          } else {
                            navigate(`/manage-${isActorVault ? 'actors' : 'studios'}/edit/${id}?from=vault`, { state: { from: currentPath } });
                          }
                        }} className={btnClass} style={{ color: accentColor }}>
                          <CompactIcon size={18}><SimplePencilIcon /></CompactIcon>
                        </button>
                      )}
                      {(isManageActors || isManageStudios || isManageCoomers || isManageHanime) && (
                        <div className="flex items-center gap-2">
                          <button onClick={toggleSort} className={btnClass} style={{ color: accentColor }}>
                            <div className="scale-[0.8]"><MorphingSortIcon order={sortOrder} /></div>
                          </button>
                          <button onClick={() => {
                            const currentPath = location.pathname + location.search;
                            navigate(`/manage-${isManageActors ? 'actors' : (isManageStudios ? 'studios' : (isManageCoomers ? 'coomers' : 'hanime'))}/add`, { state: { from: currentPath } });
                          }} className={btnClass} style={{ color: accentColor }}>
                            <CompactIcon size={22}><Icons.Plus /></CompactIcon>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
            </div>
          )}
        </div>
      </header>
    );
  }, [isHome, isMenuOpen, hColors, colors, accentColor, totalLinkCount, localSearch, searchQuery, sortOrder, headerTitle, isEditPage, isCoomerDetail, isActorVault, isStudioVault, isManageActors, isManageStudios, isManageCoomers, isManageHanime, navigate, handleBack, toggleSort, setIsMenuOpen, setSearchQuery, btnClass]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative" style={{ 
        backgroundColor: 'var(--bg)', color: 'var(--text-primary)',
        ['--accent' as any]: accentColor, ['--bg' as any]: colors.bg,
        ['--surface' as any]: colors.surface, ['--text-primary' as any]: colors.textPrimary,
        ['--text-secondary' as any]: colors.textSecondary, ['--text-muted' as any]: colors.textMuted,
        ['--border' as any]: colors.border,
      }}>
      {Header}
      <div 
        ref={menuRef} 
        className="fixed top-16 left-0 right-0 z-[160] transition-transform duration-200 ease-out pointer-events-none border-b will-change-transform" 
        style={{ 
          transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)', 
          backgroundColor: hexToRgba(hColors.bg, 100), 
          borderColor: hColors.border, 
          opacity: isMenuOpen ? 1 : 0,
          transitionProperty: 'transform, opacity'
        }}
      >
        <div className="w-full pointer-events-auto">
          <div className="max-w-2xl mx-auto flex flex-col">
            <MenuButton icon={Icons.UserGroup} label="Actors" path="/manage-actors" hColors={hColors} accentColor={accentColor} onNavigate={handleMenuNavigate} />
            <MenuButton icon={Icons.Studio} label="Studios" path="/manage-studios" hColors={hColors} accentColor={accentColor} onNavigate={handleMenuNavigate} />
            <MenuButton icon={Icons.User} label="Coomer" path="/manage-coomers" hColors={hColors} accentColor={accentColor} onNavigate={handleMenuNavigate} />
            <MenuButton icon={Icons.Anime} label="Hanime" path="/manage-hanime" hColors={hColors} accentColor={accentColor} onNavigate={handleMenuNavigate} />
            <MenuButton icon={Icons.Scraper} label="Scraper" path="/scraper" hColors={hColors} accentColor={accentColor} isLast onNavigate={handleMenuNavigate} />
          </div>
        </div>
      </div>
      <div className={`fixed inset-0 z-[150] bg-black/50 transition-all duration-300 ${isMenuOpen ? 'opacity-100 backdrop-blur-[1px] pointer-events-auto' : 'opacity-0 backdrop-blur-none pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
      <main 
        ref={scrollAreaRef} 
        id="scroll-area" 
        onScroll={saveCurrentScroll}
        onTouchStart={(e) => {
          const activeEl = document.activeElement;
          if (activeEl && 
              (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
              activeEl !== e.target) {
            (activeEl as HTMLElement).blur();
          }
        }}
        className="h-full w-full overflow-y-auto overflow-x-hidden pt-16 overscroll-contain" 
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={`w-full max-w-2xl mx-auto transition-opacity duration-300 ${isImmersivePage ? 'px-0' : 'px-4 pt-4 pb-0'}`}>
          {children}
        </div>
        <Notification />
      </main>
    </div>
  );
};
