
import { AppState, LinkItem, Actor, Studio, Coomer, CoomerPost, AppSettings, SortOrder, HanimeItem, HanimeEpisode, AspectRatio } from './types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import * as storage from './utils/storage';
export type SettingsView = 'main' | 'theme' | 'display' | 'interaction' | 'data' | 'header' | 'cover' | 'statistics' | 'statistics-detail' | 'integrations';

interface FormDraft {
  id: string | null; 
  title: string;
  urlHD: string;
  url4K: string;
  magnet: string;
  magnet4K: string;
  coverImage: string;
  coverOffset: number;
  aspectRatio: AspectRatio;
  actorIds: string[];
  studioIds: string[];
  galleryUrls: string[];
  assignedDate?: number;
}

interface ActorDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
}

interface StudioDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
}

interface CoomerDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  instagramPosts?: CoomerPost[];
  onlyFansPosts?: CoomerPost[];
  instagramLinks?: string[];
  onlyFansLinks?: string[];
}

interface HanimeDraft {
  id: string | null;
  title: string;
  coverImage: string;
  coverOffset: number;
  secondaryCovers: string[];
  description: string;
  assignedDate?: number;
  censorship?: 'UNCENSORED' | 'CENSORED';
  episodes: HanimeEpisode[];
}

interface AppContextType {
  state: AppState;
  addLink: (link: Omit<LinkItem, 'id' | 'isDeleted'>) => void;
  updateLink: (id: string, updates: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  restoreLink: (id: string) => void;
  permDeleteLink: (id: string) => void;
  clearAllTrash: () => void;
  addActor: (actor: Omit<Actor, 'id' | 'isDeleted'>) => string;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  deleteActor: (id: string) => void;
  restoreActor: (id: string) => void;
  permDeleteActor: (id: string) => void;
  addCoomer: (coomer: Omit<Coomer, 'id' | 'isDeleted'>) => string;
  updateCoomer: (id: string, updates: Partial<Coomer>) => void;
  deleteCoomer: (id: string) => void;
  restoreCoomer: (id: string) => void;
  permDeleteCoomer: (id: string) => void;
  addStudio: (studio: Omit<Studio, 'id' | 'isDeleted'>) => string;
  updateStudio: (id: string, updates: Partial<Studio>) => void;
  deleteStudio: (id: string) => void;
  restoreStudio: (id: string) => void;
  permDeleteStudio: (id: string) => void;
  addHanime: (hanime: Omit<HanimeItem, 'id' | 'isDeleted'>) => string;
  updateHanime: (id: string, updates: Partial<HanimeItem>) => void;
  deleteHanime: (id: string) => void;
  restoreHanime: (id: string) => void;
  permDeleteHanime: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSort: () => void;
  importData: (data: string) => boolean;
  runSystemCheck: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  settingsView: SettingsView;
  setSettingsView: (view: SettingsView) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  formDraft: FormDraft | null;
  setFormDraft: (draft: FormDraft | null) => void;
  hanimeDraft: HanimeDraft | null;
  setHanimeDraft: (draft: HanimeDraft | null) => void;
  actorDraft: ActorDraft | null;
  setActorDraft: (draft: ActorDraft | null) => void;
  studioDraft: StudioDraft | null;
  setStudioDraft: (draft: StudioDraft | null) => void;
  coomerDraft: CoomerDraft | null;
  setCoomerDraft: (draft: CoomerDraft | null) => void;
  coomerActiveTab: 'Instagram' | 'OnlyFans';
  setCoomerActiveTab: (tab: 'Instagram' | 'OnlyFans') => void;
  pageRegistry: Record<string, number>;
  setPageRegistry: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isHydrated: boolean;
  hydrationError: string | null;
  actorMap: Map<string, Actor>;
  studioMap: Map<string, Studio>;
  actorUsageMap: Record<string, number>;
  studioUsageMap: Record<string, number>;
  actorStudioAffinityMap: Record<string, Record<string, number>>;
  notifications: { id: string; message: string; type: 'success' | 'error' }[];
  addNotification: (message: string, type: 'success' | 'error') => void;
  removeNotification: (id: string) => void;
}

const STORAGE_KEY = 'linkvault_state_v18_final';

const defaultSettings: AppSettings = {
  theme: 'Dark',
  accentColor: '#3b82f6',
  actorNameColor: '#3b82f6',
  circleBorderColor: '#ffffff',
  torboxApiKey: '',
  enableTorbox: true,
  realDebridApiKey: '',
  enableRealDebrid: true,
  titleSize: 'Medium',
  metadataSize: 'Small',
  cardStyle: 'FullWidth',
  managementView: 'Card',
  showActors: true,
  showStudios: true,
  showActorCheckmark: true,
  enableGalleryPreview: true,
  sortOrder: 'Newest',
  itemsPerPage: 20,
  blurIntensity: 30,
  blurCovers: false,
  buttonStyle: 'Glass',
  buttonColor: '#3b82f6',
  galleryBgColor: '#1a1a1acc',
  headerOpacity: 100,
  headerTheme: 'Default',
};

const initialState: AppState = {
  links: [],
  trashLinks: [],
  hanime: [],
  actors: [],
  coomers: [],
  studios: [],
  settings: defaultSettings,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [hanimeDraft, setHanimeDraft] = useState<HanimeDraft | null>(null);
  const [actorDraft, setActorDraft] = useState<ActorDraft | null>(null);
  const [studioDraft, setStudioDraft] = useState<StudioDraft | null>(null);
  const [coomerDraft, setCoomerDraft] = useState<CoomerDraft | null>(null);
  const [coomerActiveTab, setCoomerActiveTab] = useState<'Instagram' | 'OnlyFans'>('Instagram');
  const [pageRegistry, setPageRegistry] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      addNotification(customEvent.detail.message, customEvent.detail.type);
    };
    window.addEventListener('app-notification', handleNotification);
    return () => window.removeEventListener('app-notification', handleNotification);
  }, [addNotification]);

  const actorMap = useMemo(() => new Map(state.actors.map(a => [a.id, a])), [state.actors]);
  const studioMap = useMemo(() => new Map(state.studios.map(t => [t.id, t])), [state.studios]);

  const actorUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.links.forEach(l => l.actorIds.forEach(aid => map[aid] = (map[aid] || 0) + 1));
    return map;
  }, [state.links]);

  const studioUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.links.forEach(l => l.studioIds.forEach(sid => map[sid] = (map[sid] || 0) + 1));
    return map;
  }, [state.links]);

  const actorStudioAffinityMap = useMemo(() => {
    const affinity: Record<string, Record<string, number>> = {};
    state.links.forEach(link => {
      link.actorIds.forEach(actorId => {
        if (!affinity[actorId]) affinity[actorId] = {};
        link.studioIds.forEach(studioId => {
          affinity[actorId][studioId] = (affinity[actorId][studioId] || 0) + 1;
        });
      });
    });
    return affinity;
  }, [state.links]);

  // Initial load from IndexedDB with migration fallback from localStorage
  useEffect(() => {
    const hydrate = async () => {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          const loadedStudios = saved.studios || saved.tags || [];
          const loadedLinks = (saved.links || []).map((l: any) => ({
            ...l,
            studioIds: l.studioIds || l.tagIds || []
          }));
          const loadedTrashLinks = (saved.trashLinks || []).map((l: any) => ({
            ...l,
            studioIds: l.studioIds || l.tagIds || []
          }));

          setState({
            ...initialState,
            ...saved,
            studios: loadedStudios,
            links: loadedLinks,
            trashLinks: loadedTrashLinks,
            settings: { ...defaultSettings, ...(saved.settings || {}) }
          });
        } else {
          // Fallback to localStorage migration for legacy users
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy) {
            const parsed = JSON.parse(legacy);
            const loadedStudios = parsed.studios || parsed.tags || [];
            const loadedLinks = (parsed.links || []).map((l: any) => ({
              ...l,
              studioIds: l.studioIds || l.tagIds || []
            }));
            const loadedTrashLinks = (parsed.trashLinks || []).map((l: any) => ({
              ...l,
              studioIds: l.studioIds || l.tagIds || []
            }));

            const migratedState = {
              ...initialState,
              ...parsed,
              studios: loadedStudios,
              links: loadedLinks,
              trashLinks: loadedTrashLinks,
              settings: { ...defaultSettings, ...(parsed.settings || {}) }
            };
            setState(migratedState);
            await storage.setItem(STORAGE_KEY, migratedState);
            // Optional: clean up localStorage after successful migration
            // localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error("Hydration failed", e);
        setHydrationError(e instanceof Error ? e.message : 'Unknown hydration error');
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  // Persist state to IndexedDB on changes
  useEffect(() => {
    if (!isHydrated) return;
    const handler = setTimeout(async () => {
      try {
        await storage.setItem(STORAGE_KEY, state);
        localStorage.setItem('local_state_updated_at', Date.now().toString());
      } catch (e) {
        console.error("Save to IndexedDB failed", e);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [state, isHydrated]);

  const addLink = (link: Omit<LinkItem, 'id' | 'isDeleted'>) => {
    const newLink: LinkItem = {
      ...link,
      id: Math.random().toString(36).substr(2, 9),
      isDeleted: false,
      createdAt: Date.now(),
    };
    setState(prev => ({ ...prev, links: [newLink, ...prev.links] }));
  };

  const updateLink = (id: string, updates: Partial<LinkItem>) => {
    setState(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, ...updates } : l),
      trashLinks: prev.trashLinks.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  };

  const deleteLink = useCallback((id: string) => {
    setState(prev => {
      const item = prev.links.find(l => l.id === id);
      if (!item) return prev;
      return {
        ...prev,
        links: prev.links.filter(l => l.id !== id),
        trashLinks: [{ ...item, isDeleted: true, deletedAt: Date.now() }, ...prev.trashLinks],
      };
    });
  }, []);

  const restoreLink = (id: string) => {
    setState(prev => {
      const item = prev.trashLinks.find(l => l.id === id);
      if (!item) return prev;
      return {
        ...prev,
        trashLinks: prev.trashLinks.filter(l => l.id !== id),
        links: [{ ...item, isDeleted: false, deletedAt: undefined }, ...prev.links],
      };
    });
  };

  const permDeleteLink = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      trashLinks: prev.trashLinks.filter(l => l.id !== id),
      links: prev.links.filter(l => l.id !== id),
    }));
  };

  const clearAllTrash = useCallback(() => {
    setState(prev => ({ ...prev, trashLinks: [] }));
  }, []);

  const addActor = (actor: Omit<Actor, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      actors: [...prev.actors, { ...actor, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateActor = (id: string, updates: Partial<Actor>) => {
    setState(prev => ({
      ...prev,
      actors: prev.actors.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const deleteActor = (id: string) => {
    setState(prev => ({
      ...prev,
      actors: prev.actors.map(a => a.id === id ? { ...a, isDeleted: true } : a),
    }));
  };

  const restoreActor = (id: string) => {
    setState(prev => ({
      ...prev,
      actors: prev.actors.map(a => a.id === id ? { ...a, isDeleted: false } : a)
    }));
  };

  const permDeleteActor = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      actors: prev.actors.filter(a => a.id !== id),
      links: prev.links.map(l => ({ ...l, actorIds: l.actorIds.filter(aid => aid !== id) })),
    }));
  };

  const addCoomer = (coomer: Omit<Coomer, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      coomers: [...prev.coomers, { ...coomer, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateCoomer = (id: string, updates: Partial<Coomer>) => {
    setState(prev => ({
      ...prev,
      coomers: prev.coomers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCoomer = (id: string) => {
    setState(prev => ({
      ...prev,
      coomers: prev.coomers.map(c => c.id === id ? { ...c, isDeleted: true } : c),
    }));
  };

  const restoreCoomer = (id: string) => {
    setState(prev => ({
      ...prev,
      coomers: prev.coomers.map(c => c.id === id ? { ...c, isDeleted: false } : c)
    }));
  };

  const permDeleteCoomer = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      coomers: prev.coomers.filter(c => c.id !== id),
    }));
  };

  const addStudio = (studio: Omit<Studio, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      studios: [...prev.studios, { ...studio, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateStudio = (id: string, updates: Partial<Studio>) => {
    setState(prev => ({
      ...prev,
      studios: prev.studios.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteStudio = (id: string) => {
    setState(prev => ({
      ...prev,
      studios: prev.studios.map(t => t.id === id ? { ...t, isDeleted: true } : t)
    }));
  };

  const restoreStudio = (id: string) => {
    setState(prev => ({
      ...prev,
      studios: prev.studios.map(t => t.id === id ? { ...t, isDeleted: false } : t)
    }));
  };

  const permDeleteStudio = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      studios: prev.studios.filter(t => t.id !== id),
      links: prev.links.map(l => ({ ...l, studioIds: l.studioIds.filter(sid => sid !== id) })),
    }));
  };

  const addHanime = (hanime: Omit<HanimeItem, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      hanime: [...prev.hanime, { ...hanime, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateHanime = (id: string, updates: Partial<HanimeItem>) => {
    setState(prev => ({
      ...prev,
      hanime: prev.hanime.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };

  const deleteHanime = (id: string) => {
    setState(prev => ({
      ...prev,
      hanime: prev.hanime.map(h => h.id === id ? { ...h, isDeleted: true } : h),
    }));
  };

  const restoreHanime = (id: string) => {
    setState(prev => ({
      ...prev,
      hanime: prev.hanime.map(h => h.id === id ? { ...h, isDeleted: false } : h)
    }));
  };

  const permDeleteHanime = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      hanime: prev.hanime.filter(h => h.id !== id),
    }));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  };

  const toggleSort = () => {
    const orders: SortOrder[] = ['Newest', 'Oldest', 'DateDesc', 'DateAsc'];
    const currentIndex = orders.indexOf(state.settings.sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    updateSettings({ sortOrder: orders[nextIndex] });
  };

  const runSystemCheck = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setState(prev => {
      const missavStudio = prev.studios.find(t => t.name.toUpperCase() === 'MISSAV' && !t.isDeleted);
      const codeRegex = /[A-Z0-9]{2,10}-\d{2,10}/i;
      
      const updateLinkSet = (linkSet: any[]) => linkSet.map(link => {
        const target = link.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const currentActorIds = new Set(link.actorIds);
        const currentStudioIds = new Set(link.studioIds || []);
        
        prev.actors.forEach(actor => {
          if (actor.isDeleted) return;
          const cleanActor = actor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanActor.length > 2 && target.includes(cleanActor)) currentActorIds.add(actor.id);
        });

        prev.studios.forEach(studio => {
          if (studio.isDeleted) return;
          const cleanStudio = studio.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanStudio.length > 1 && target.includes(cleanStudio)) currentStudioIds.add(studio.id);
        });

        if (missavStudio && codeRegex.test(link.title)) currentStudioIds.add(missavStudio.id);

        return {
          ...link,
          actorIds: Array.from(currentActorIds),
          studioIds: Array.from(currentStudioIds)
        };
      });

      return { 
        ...prev, 
        links: updateLinkSet(prev.links), 
        trashLinks: updateLinkSet(prev.trashLinks),
      };
    });
  }, []);

  const importData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data && typeof data === 'object') {
        const newState: AppState = {
          links: (Array.isArray(data.links) ? data.links : []).map((l: any) => ({
            ...l,
            studioIds: l.studioIds || l.tagIds || []
          })),
          trashLinks: (Array.isArray(data.trashLinks) ? data.trashLinks : []).map((l: any) => ({
            ...l,
            studioIds: l.studioIds || l.tagIds || []
          })),
          hanime: Array.isArray(data.hanime) ? data.hanime : [],
          actors: Array.isArray(data.actors) ? data.actors : [],
          coomers: Array.isArray(data.coomers) ? data.coomers : [],
          studios: Array.isArray(data.studios) ? data.studios : (Array.isArray(data.tags) ? data.tags : []),
          settings: { ...defaultSettings, ...(data.settings || {}) }
        };
        console.log(`[ImportData] Decoded state has ${newState.links.length} links and ${newState.actors.length} actors.`);
        setState(newState);
        addNotification(`Data imported successfully (${newState.links.length} links).`, "success");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import failed", e);
      addNotification("Failed to parse import data.", "error");
      return false;
    }
  };

  const contextValue = useMemo(() => ({
    state, addLink, updateLink, deleteLink, restoreLink, permDeleteLink,
    clearAllTrash,
    addActor, updateActor, deleteActor, restoreActor, permDeleteActor,
    addCoomer, updateCoomer, deleteCoomer, restoreCoomer, permDeleteCoomer,
    addStudio, updateStudio, deleteStudio, restoreStudio, permDeleteStudio,
    addHanime, updateHanime, deleteHanime, restoreHanime, permDeleteHanime,
    updateSettings, toggleSort, importData, runSystemCheck, searchQuery, setSearchQuery,
    settingsView, setSettingsView,
    isMenuOpen, setIsMenuOpen,
    formDraft, setFormDraft,
    hanimeDraft, setHanimeDraft,
    actorDraft, setActorDraft,
    studioDraft, setStudioDraft,
    coomerDraft, setCoomerDraft,
    coomerActiveTab, setCoomerActiveTab,
    pageRegistry, setPageRegistry,
    isHydrated,
    hydrationError,
    actorMap,
    studioMap,
    actorUsageMap,
    studioUsageMap,
    actorStudioAffinityMap,
    notifications, addNotification, removeNotification,
  }), [
    state, searchQuery, settingsView, isMenuOpen, formDraft, hanimeDraft, actorDraft, studioDraft, coomerDraft, 
    coomerActiveTab, pageRegistry, isHydrated, hydrationError, actorMap, studioMap, actorUsageMap, studioUsageMap, actorStudioAffinityMap, clearAllTrash, runSystemCheck, notifications,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
