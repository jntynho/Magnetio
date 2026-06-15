
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { AspectRatio, Studio, Actor, LinkItem } from '../types';
import { ActorSelector } from '../components/ActorSelector';
import { StudioSelector } from '../components/StudioSelector';
import { DateSelector } from '../components/DateSelector';
import { CoverPreview } from '../components/CoverPreview';
import { InputBar } from '../components/InputBar';
import { useLinkDetection } from '../hooks/useLinkDetection';





import { formatTitle } from '../utils/format';

export const AddEditLink: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, addLink, updateLink, formDraft, setFormDraft, addNotification, isHydrated, addActor, addStudio } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSaving = useRef(false);
  const isNavigatingToSubPage = useRef(false);
  
  const [isLocked, setIsLocked] = useState(true);
  const toggleLock = useCallback(() => setIsLocked(prev => !prev), []);
  
  const existing = useMemo(() => id ? state.links.find(l => l.id === id) : null, [state.links, id]);

  const [title, setTitle] = useState(() => (formDraft?.id === (id || null) ? formDraft?.title : existing?.title) || '');
  const [urlHD, setUrlHD] = useState(() => (formDraft?.id === (id || null) ? formDraft?.urlHD : existing?.urlHD) || '');
  const [url4K, setUrl4K] = useState(() => (formDraft?.id === (id || null) ? formDraft?.url4K : existing?.url4K) || '');
  const [magnet, setMagnet] = useState(() => (formDraft?.id === (id || null) ? (formDraft as any)?.magnet : existing?.magnet) || '');
  const [magnet4K, setMagnet4K] = useState(() => (formDraft?.id === (id || null) ? (formDraft as any)?.magnet4K : existing?.magnet4K) || '');
  const [coverImage, setCoverImage] = useState(() => (formDraft?.id === (id || null) ? formDraft?.coverImage : existing?.coverImage) || '');
  const [coverOffset, setCoverOffset] = useState(() => (formDraft?.id === (id || null) ? (formDraft as any)?.coverOffset : existing?.coverOffset) ?? 50);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => (formDraft?.id === (id || null) ? formDraft?.aspectRatio : existing?.aspectRatio) || '16:9');
  const [assignedDate, setAssignedDate] = useState<number | undefined>(() => (formDraft?.id === (id || null) ? formDraft?.assignedDate : existing?.assignedDate));
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>(() => {
    if (formDraft?.id === (id || null)) return formDraft?.actorIds || [];
    if (existing) return existing.actorIds || [];
    
    // Check query params for new link
    const params = new URLSearchParams(location.search);
    const actorId = params.get('actor');
    return actorId ? [actorId] : [];
  });
  const [selectedStudioIds, setSelectedStudioIds] = useState<string[]>(() => {
    if (formDraft?.id === (id || null)) return (formDraft as any)?.studioIds || [];
    if (existing) return existing.studioIds || [];
    
    // Check query params for new link
    const params = new URLSearchParams(location.search);
    const studioId = params.get('studio');
    return studioId ? [studioId] : [];
  });
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => (formDraft?.id === (id || null) ? formDraft?.galleryUrls : existing?.galleryUrls) || []);
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isHydrated && id && existing && !hasInitialized.current) {
      // Only populate if we don't have a matching draft or if the draft is empty
      const useExisting = !formDraft || formDraft.id !== id;
      
      if (useExisting) {
        setTitle(existing.title || '');
        setUrlHD(existing.urlHD || '');
        setUrl4K(existing.url4K || '');
        setMagnet(existing.magnet || '');
        setMagnet4K(existing.magnet4K || '');
        setCoverImage(existing.coverImage || '');
        setCoverOffset(existing.coverOffset ?? 50);
        setAspectRatio(existing.aspectRatio || '16:9');
        setAssignedDate(existing.assignedDate);
        setSelectedActorIds(existing.actorIds || []);
        setSelectedStudioIds(existing.studioIds || []);
        setGalleryUrls(existing.galleryUrls || []);
      }
      hasInitialized.current = true;
    }
  }, [isHydrated, id, existing, formDraft]);

  useEffect(() => {
    const locState = location.state as any;
    if (locState?.newlyAddedActorId || locState?.newlyAddedStudioId) {
      if (locState.newlyAddedActorId) {
        setSelectedActorIds(prev => prev.includes(locState.newlyAddedActorId) ? prev : [...prev, locState.newlyAddedActorId]);
      }
      if (locState.newlyAddedStudioId) {
        setSelectedStudioIds(prev => prev.includes(locState.newlyAddedStudioId) ? prev : [...prev, locState.newlyAddedStudioId]);
      }
      
      const newState = { ...locState };
      delete newState.newlyAddedActorId;
      delete newState.newlyAddedStudioId;
      navigate(location.pathname + location.search, { replace: true, state: newState });
    }
  }, [location.state, navigate, location.pathname, location.search]);

  const [actorSearch, setActorSearch] = useState('');
  const [studioSearch, setStudioSearch] = useState('');
  const [isFetchingThumb, setIsFetchingThumb] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  const { performIntelligentDetection } = useLinkDetection(state.actors, state.studios, setSelectedActorIds, setSelectedStudioIds, setAspectRatio);

  const draftRef = useRef({
    id: id || null,
    title, urlHD, url4K, magnet, magnet4K, coverImage, aspectRatio, 
    actorIds: selectedActorIds, studioIds: selectedStudioIds, galleryUrls,
    coverOffset, assignedDate
  });

  useEffect(() => {
    draftRef.current = {
      id: id || null,
      title, urlHD, url4K, magnet, magnet4K, coverImage, aspectRatio, 
      actorIds: selectedActorIds, studioIds: selectedStudioIds, galleryUrls,
      coverOffset, assignedDate
    };
  }, [title, urlHD, url4K, magnet, magnet4K, coverImage, coverOffset, aspectRatio, selectedActorIds, selectedStudioIds, galleryUrls, id, assignedDate]);

  useEffect(() => {
    return () => {
      if (isNavigatingToSubPage.current) {
        setFormDraft(draftRef.current as any);
      } else if (!isSaving.current) {
        setFormDraft(null);
      }
    };
  }, [setFormDraft]);

  const [isExtractorMode, setIsExtractorMode] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

  const handleExtract = async () => {
    const isXxxclub = /^https?:\/\/(www\.)?xxxclub\.to/i.test(title);
    const isJavtrailers = /^https?:\/\/(www\.)?javtrailers\.com\/video\//i.test(title);
    
    if (!isXxxclub && !isJavtrailers) {
      addNotification("Please enter a valid supported link", "error");
      return;
    }

    setIsExtracting(true);
    if (!hasExtracted) {
      setUrlHD('');
      setUrl4K('');
    }
    try {
      const endpoint = isJavtrailers ? '/api/extract/javtrailers' : '/api/extract/xxxclub';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: title.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to extract');

      if (isJavtrailers) {
        let extractedTitle = data.tag || '';
        const dateStr = data.date || '';
        const actorNames = data.actors || [];
        const coverSrc = data.cover || '';
        
        if (extractedTitle) {
          setTitle(extractedTitle);
        } else {
          setTitle('');
        }
        
        const newActorIds: string[] = [];
        for (const aName of actorNames) {
            if (aName.length < 2) continue;
            let existing = state.actors.find(a => a.name.toLowerCase() === aName.toLowerCase() && !a.isDeleted);
            if (existing) {
                newActorIds.push(existing.id);
            } else {
                let aId = addActor({ name: aName, imageUrl: '', originalImageUrl: '' });
                newActorIds.push(aId);
            }
        }
        
        if (newActorIds.length > 0) {
          setSelectedActorIds(prev => Array.from(new Set([...prev, ...newActorIds])));
        }
        
        if (dateStr) {
          // Date format: 14 Nov 2025
          const dateMatch = dateStr.match(/(\d+)\s+([A-Za-z]+)\s+(\d{4})/);
          if (dateMatch) {
            const months: Record<string, number> = {
              Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
              January: 0, February: 1, March: 2, April: 3, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
            };
            const day = parseInt(dateMatch[1], 10);
            const monthStr = dateMatch[2].substring(0, 3);
            const month = months[monthStr] !== undefined ? months[monthStr] : new Date(`1 ${monthStr} 2000`).getMonth();
            const year = parseInt(dateMatch[3], 10);
            const parsedDate = new Date(year, month, day).getTime();
            if (!isNaN(parsedDate)) {
               setAssignedDate(parsedDate);
            }
          }
        }
        
        if (coverSrc && !coverImage) {
           setCoverImage(coverSrc);
        }
        addNotification("Extracted JavTrailers data!", "success");
      } else {
        const extractedTitle = data.title;
        const extractedMagnet = data.magnet;
        const parsedData = data.parsed;

        if (hasExtracted) {
          // Second extra run for xxxclub: only capture magnet link and quality
          const quality = (parsedData?.quality || '').toLowerCase();
          const titleLower = (extractedTitle || '').toLowerCase();
          const is4K = quality.includes('2160') || quality.includes('4k') || titleLower.includes('2160p') || titleLower.includes('4k');

          if (is4K) {
            setMagnet4K(extractedMagnet);
            addNotification("Extracted 4K Magnet only!", "success");
          } else {
            setMagnet(extractedMagnet);
            addNotification("Extracted HD Magnet only!", "success");
          }
          setTitle('');
        } else {
          const matchActorsByTitle = (titleText: string) => {
            if (!titleText) return [];
            const lowercaseTitle = titleText.toLowerCase();
            const matchedIds: string[] = [];
            
            state.actors.forEach(actor => {
              if (actor.isDeleted) return;
              const actorNameLower = actor.name.toLowerCase();
              if (actorNameLower && actorNameLower.length >= 2) {
                if (lowercaseTitle.includes(actorNameLower)) {
                  matchedIds.push(actor.id);
                } else {
                  const cleanedTitle = lowercaseTitle.replace(/[^a-z0-9]/g, ' ');
                  const cleanedActor = actorNameLower.replace(/[^a-z0-9]/g, ' ');
                  if (cleanedTitle.includes(cleanedActor)) {
                    matchedIds.push(actor.id);
                  }
                }
              }
            });
            return matchedIds;
          };

          if (parsedData) {
            let studioName = parsedData.tag || '';
            const dateStr = parsedData.date || '';
            const quality = parsedData.quality?.toLowerCase() || '';

            // Ensure studio looks nice
            if (studioName) {
              if (studioName.toLowerCase() === 'sexmex') studioName = 'SexMex';

              let studioObj = state.studios.find(t => t.name.toLowerCase() === studioName.toLowerCase() && !t.isDeleted);
              let studioId = studioObj?.id;
              if (!studioId) {
                 studioId = addStudio({ name: studioName, imageUrl: '', originalImageUrl: '' });
              }
              setSelectedStudioIds(prev => prev.includes(studioId!) ? prev : [...prev, studioId!]);
            }

            // Match actor IDs automatically from title
            const matchedActorIds = matchActorsByTitle(extractedTitle || '');
            if (matchedActorIds.length > 0) {
              setSelectedActorIds(prev => Array.from(new Set([...prev, ...matchedActorIds])));
            }

            if (dateStr) {
              const splitParts = dateStr.trim().split(/\s+/);
              if (splitParts.length === 3) {
                const yy = parseInt(splitParts[0], 10);
                const mm = parseInt(splitParts[1], 10);
                const dd = parseInt(splitParts[2], 10);

                const year = 2000 + yy;
                const month = mm - 1;
                const day = dd;
                const parsedDate = new Date(year, month, day).getTime();
                if (!isNaN(parsedDate)) {
                   setAssignedDate(parsedDate);
                }
              }
            }

            if (quality.includes('2160') || quality.includes('4k')) {
               setMagnet4K(extractedMagnet);
            } else {
               setMagnet(extractedMagnet);
            }

            setTitle('');
          } else {
            if (extractedTitle) {
              const partsRegex = /^([a-zA-Z0-9\s\-]+?)\s+(\d{2}\s\d{2}\s\d{2})/i;
              const match = extractedTitle.match(partsRegex);
              
              if (match) {
                let studioName = match[1].trim();
                const dateStr = match[2].trim();
                
                if (studioName.toLowerCase() === 'sexmex') studioName = 'SexMex';

                let studioObj = state.studios.find(t => t.name.toLowerCase() === studioName.toLowerCase() && !t.isDeleted);
                let studioId = studioObj?.id;
                if (!studioId) {
                   studioId = addStudio({ name: studioName, imageUrl: '', originalImageUrl: '' });
                }
                setSelectedStudioIds(prev => prev.includes(studioId!) ? prev : [...prev, studioId!]);

                const splitParts = dateStr.trim().split(/\s+/);
                if (splitParts.length === 3) {
                  const yy = parseInt(splitParts[0], 10);
                  const mm = parseInt(splitParts[1], 10);
                  const dd = parseInt(splitParts[2], 10);

                  const year = 2000 + yy;
                  const month = mm - 1;
                  const day = dd;
                  const parsedDate = new Date(year, month, day).getTime();
                  if (!isNaN(parsedDate)) {
                     setAssignedDate(parsedDate);
                  }
                }
              }

              const qualityRegex = /(\d{3,4}p|4K|8K|2160p)/i;
              const qualityMatch = extractedTitle.match(qualityRegex);
              const quality = qualityMatch ? qualityMatch[1].trim().toLowerCase() : '';

              if (quality.includes('2160') || quality.includes('4k')) {
                 setMagnet4K(extractedMagnet);
              } else {
                 setMagnet(extractedMagnet);
              }

              // Match actor IDs automatically from title
              const matchedActorIds = matchActorsByTitle(extractedTitle);
              if (matchedActorIds.length > 0) {
                setSelectedActorIds(prev => Array.from(new Set([...prev, ...matchedActorIds])));
              }
            }
            setTitle('');
          }
          setHasExtracted(true);
          addNotification("Extracted data!", "success");
        }
      }
      setIsExtractorMode(false);
    } catch (e: any) {
      addNotification(e.message, "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAutoSelect = useCallback(() => {
    if (galleryUrls.length === 0) {
      addNotification("No staged gallery images found to select from.", "error");
      return;
    }

    setIsAutoSelecting(true);

    const analyzeImages = async () => {
      const candidates: { url: string; ratio: number; priority: number }[] = [];
      
      const promises = galleryUrls.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.width >= img.height) {
              const ratio = img.width / img.height;
              let priority = 3; 
              
              if (Math.abs(ratio - (16/9)) < 0.1) {
                priority = 1;
              } 
              else if (Math.abs(ratio - (3/2)) < 0.1) {
                priority = 2;
              }
              
              candidates.push({ url, ratio, priority });
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        });
      });

      await Promise.all(promises);

      candidates.sort((a, b) => a.priority - b.priority);

      const selected = candidates.slice(0, 5).map(c => c.url);
      
      if (selected.length > 0) {
        if (navigator.vibrate) navigator.vibrate(50);
        addNotification("Gallery assets auto-selected.", "success");
      } else {
        addNotification("No landscape-oriented images found in the gallery buffer.", "error");
      }
      setIsAutoSelecting(false);
    };

    analyzeImages();
  }, [galleryUrls, addNotification]);

  const existingTitles = useMemo(() => new Set(state.links.filter(l => l.id !== id && !l.isDeleted && l.title).map(l => l.title.trim().toLowerCase())), [state.links, id]);
  const existingHds = useMemo(() => new Set(state.links.filter(l => l.id !== id && !l.isDeleted && l.urlHD).map(l => String(l.urlHD).trim().toLowerCase())), [state.links, id]);
  const existingCovers = useMemo(() => new Set(state.links.filter(l => l.id !== id && !l.isDeleted && l.coverImage).map(l => String(l.coverImage).trim().toLowerCase())), [state.links, id]);

  const isTitleDup = useMemo(() => existingTitles.has(title.trim().toLowerCase()), [title, existingTitles]);
  const isHdDup = useMemo(() => existingHds.has(String(urlHD).trim().toLowerCase()), [urlHD, existingHds]);
  const isCoverDup = useMemo(() => existingCovers.has(String(coverImage).trim().toLowerCase()), [coverImage, existingCovers]);

  const prevTitleRef = useRef('');
  useEffect(() => {
    if (id) return; 
    
    const trimmedTitle = title.trim();
    if (trimmedTitle === prevTitleRef.current || !trimmedTitle) return;
    prevTitleRef.current = trimmedTitle;

    const timer = setTimeout(() => {
      performIntelligentDetection(trimmedTitle, selectedStudioIds);
    }, 800);
    return () => clearTimeout(timer);
  }, [title, id, performIntelligentDetection, selectedStudioIds]);

  const isValidUrl = (urlString: string) => {
    if (!urlString.trim()) return true;
    try { new URL(urlString); return true; }
    catch(e){ return false; }
  };

  const handleSave = useCallback(() => {
    isSaving.current = true;
    if (!title.trim()) {
      addNotification("Please provide a title.", "error");
      isSaving.current = false;
      return;
    }
    
    if (!isValidUrl(urlHD) || !isValidUrl(url4K) || !isValidUrl(coverImage)) {
      addNotification("Please provide valid URLs.", "error");
      isSaving.current = false;
      return;
    }
    
    if (isTitleDup || isHdDup || isCoverDup) {
      addNotification("Duplicate values detected. Please resolve them.", "error");
      isSaving.current = false;
      return;
    }
    
    const data = { 
      title: title.trim(), 
      urlHD: urlHD.trim(), 
      url4K: url4K.trim(), 
      magnet: magnet.trim(),
      magnet4K: magnet4K.trim(),
      coverImage: coverImage.trim(), 
      coverOffset,
      aspectRatio, 
      actorIds: selectedActorIds, 
      studioIds: selectedStudioIds, 
      galleryUrls,
      assignedDate
    };

    if (id) {
      updateLink(id, data);
    } else {
      addLink(data);
    }
    
    setFormDraft(null); 
    addNotification("Link saved successfully.", "success");
    navigate((location.state as any)?.from || '/', { replace: true });
  }, [title, urlHD, url4K, magnet, magnet4K, coverImage, coverOffset, aspectRatio, selectedActorIds, selectedStudioIds, galleryUrls, id, addLink, updateLink, navigate, setFormDraft, addNotification, isTitleDup, isHdDup, isCoverDup, assignedDate, location.state]);

  useEffect(() => {
    const trigger = () => handleSave();
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleSave]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timerId = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timerId);
  }, []);

  const currentPath = location.pathname + location.search;

  const handleUrlChange = (val: string, setter: (v: string) => void, is4k: boolean) => {
    const trimmed = val.trim();
    const magnetMatch = trimmed.match(/magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32,}/i);
    if (magnetMatch) {
      if (is4k) setMagnet4K(magnetMatch[0]);
      else setMagnet(magnetMatch[0]);
      addNotification("Magnet link extracted and moved to correct field", "info");
      const cleaned = trimmed.replace(magnetMatch[0], '').trim();
      if (cleaned) setter(cleaned);
      return;
    }
    setter(trimmed);
  };

  const handleTitleChange = (val: string) => {
    const trimmed = val.trim();
    const magnetMatch = trimmed.match(/magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32,}/i);
    if (magnetMatch) {
      setMagnet(magnetMatch[0]);
      addNotification("Magnet link extracted from title", "info");
      const cleaned = trimmed.replace(magnetMatch[0], '').trim();
      setTitle(isExtractorMode ? cleaned : formatTitle(cleaned));
      return;
    }
    
    const isUrl = /^https?:\/\//i.test(trimmed);
    setTitle(isExtractorMode || isUrl ? trimmed : formatTitle(val));
  };

  if (!isHydrated || !isReady) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col pb-48 px-4 pt-4 w-full animate-pulse">
        <div className="flex flex-col mb-4 gap-y-4">
          <div className="flex w-full gap-3">
             <div className="h-[48px] flex-1 bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-6 flex flex-col justify-center gap-1">
                <div className="h-2 w-12 bg-[var(--border)] rounded-full opacity-50" />
                <div className="h-4 w-1/3 bg-[var(--border)] rounded-full opacity-25" />
             </div>
             <div className="w-[48px] h-[48px] rounded-full bg-[var(--border)] opacity-20 shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-4 flex flex-col justify-center gap-0.5">
               <div className="h-2 w-10 bg-[var(--border)] rounded-full opacity-50" />
               <div className="h-3.5 w-1/2 bg-[var(--border)] rounded-full opacity-25" />
            </div>
            <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-4 flex flex-col justify-center gap-0.5">
               <div className="h-2 w-10 bg-[var(--border)] rounded-full opacity-50" />
               <div className="h-3.5 w-1/2 bg-[var(--border)] rounded-full opacity-25" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-4 flex flex-col justify-center gap-0.5">
               <div className="h-2 w-14 bg-[var(--border)] rounded-full opacity-50" />
               <div className="h-3.5 w-2/3 bg-[var(--border)] rounded-full opacity-25" />
            </div>
            <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-4 flex flex-col justify-center gap-0.5">
               <div className="h-2 w-14 bg-[var(--border)] rounded-full opacity-50" />
               <div className="h-3.5 w-2/3 bg-[var(--border)] rounded-full opacity-25" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-4 flex flex-col justify-center gap-0.5">
               <div className="h-2 w-10 bg-[var(--border)] rounded-full opacity-50" />
               <div className="h-3.5 w-1/2 bg-[var(--border)] rounded-full opacity-25" />
            </div>
             <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full px-4 flex flex-col justify-center gap-0.5">
               <div className="h-2 w-10 bg-[var(--border)] rounded-full opacity-50" />
               <div className="h-3.5 w-1/3 bg-[var(--border)] rounded-full opacity-25" />
            </div>
          </div>
          <div className="w-full aspect-video bg-[var(--border)] rounded-2xl opacity-10 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto flex flex-col pb-48 px-4 pt-4 w-full"
    >
      <div className="flex flex-col mb-4 gap-y-4">
        <div className="flex w-full gap-3">
          <InputBar 
            label={isExtractorMode ? "Scraper" : "Title"} 
            value={title} 
            onChange={handleTitleChange} 
            placeholder={isExtractorMode ? "Paste link" : "Link description..."} 
            showPaste 
            onPasteCapture={(text) => {
              const trimmed = text.trim();
              const magnetMatch = trimmed.match(/magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32,}/i);
              if (magnetMatch) {
                setMagnet(magnetMatch[0]);
                addNotification("Magnet link caught and moved to HD Magnet field", "info");
              }
            }}
            isDuplicate={!isExtractorMode && isTitleDup} 
            compact
          />
          <button
            type="button"
            onClick={() => {
              const checkSupported = (url: string) => /^https?:\/\/(www\.)?(xxxclub\.to|javtrailers\.com\/video\/)/i.test(url);
              const isSupportedUrl = checkSupported(title);
              if (isExtractorMode && isSupportedUrl) {
                handleExtract();
              } else {
                setIsExtractorMode(!isExtractorMode);
                if (!isExtractorMode && !checkSupported(title)) {
                  setTitle('');
                }
              }
            }}
            disabled={isExtracting}
            className={`w-[48px] h-[48px] rounded-full shrink-0 flex items-center justify-center bg-[var(--surface)] shadow-[inset_0_0_0_1px_var(--border)] active:scale-95 transition-all text-[var(--text-primary)] tap-highlight-none ${isExtracting ? 'opacity-50' : ''}`}
          >
            {isExtracting ? <Icons.Loader2 className="w-6 h-6 animate-spin" /> :
             (isExtractorMode && /^https?:\/\/(www\.)?(xxxclub\.to|javtrailers\.com\/video\/)/i.test(title)) ? <Icons.Download className="w-6 h-6 text-green-400" /> :
             isExtractorMode ? <Icons.X className="w-6 h-6" /> :
             <Icons.Plus className="w-6 h-6" />}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <InputBar label="HD URL" value={urlHD} onChange={(v) => handleUrlChange(v, setUrlHD, false)} placeholder="Standard link..." showPaste isDuplicate={isHdDup} compact />
          <InputBar label="4K URL" value={url4K} onChange={(v) => handleUrlChange(v, setUrl4K, true)} placeholder="Ultra HD link..." showPaste compact />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputBar label="HD Magnet" value={magnet} onChange={setMagnet} placeholder="Magnet link..." showPaste compact />
          <InputBar label="4K Magnet" value={magnet4K} onChange={setMagnet4K} placeholder="4K Magnet link..." showPaste compact />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <InputBar 
            label="Cover" value={coverImage} onChange={setCoverImage} placeholder="Image URL..." showPaste
            isLoading={isFetchingThumb}
            isDuplicate={isCoverDup}
            compact
          />
          
          <button
            type="button"
            onClick={() => {
              setFormDraft(draftRef.current as any);
              isNavigatingToSubPage.current = true;
              navigate('/add-gallery', { state: { from: currentPath } });
            }}
            className="w-full h-full min-h-[48px] rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] text-[var(--surface)] shadow-[inset_0_0_0_1px_var(--border),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] flex items-center justify-center gap-2"
            style={{ backgroundColor: state.settings.buttonColor }}
          >
             Gallery {galleryUrls.length > 0 && <span className="opacity-90">({galleryUrls.length})</span>}
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const r = new FileReader();
            r.onloadend = async () => {
              setCoverImage(r.result as string);
            };
            r.readAsDataURL(f);
          }
        }} />

        <CoverPreview 
          url={coverImage} 
          ratio={aspectRatio} 
          offset={coverOffset} 
          onOffsetChange={setCoverOffset} 
          onAutoSelect={handleAutoSelect}
          isProcessing={isAutoSelecting}
          assignedDate={assignedDate}
          onDateChange={setAssignedDate}
          isLocked={isLocked}
          onToggleLock={toggleLock}
          episodes={[]}
        />

        <div className="flex gap-3 w-full">
          {(['16:9', '3:2', 'Adaptive'] as AspectRatio[]).map(ratio => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`flex-1 h-[48px] rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${aspectRatio === ratio ? 'text-[var(--surface)] shadow-[inset_0_0_0_1px_var(--border),0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]' : 'bg-[var(--surface)] text-[var(--text-muted)] shadow-[inset_0_0_0_1px_var(--border)] active:scale-95'}`}
              style={aspectRatio === ratio ? { backgroundColor: state.settings.buttonColor } : {}}
            >
              {ratio === '16:9' ? 'Standard' : ratio === '3:2' ? 'DVD' : ratio}
            </button>
          ))}
        </div>
      </div>

      <ActorSelector
        actorSearch={actorSearch}
        setActorSearch={setActorSearch}
        selectedActorIds={selectedActorIds}
        setSelectedActorIds={setSelectedActorIds}
        currentPath={currentPath}
        onAddClick={() => { isNavigatingToSubPage.current = true; }}
      />

      <StudioSelector
        studioSearch={studioSearch}
        setStudioSearch={setStudioSearch}
        selectedStudioIds={selectedStudioIds}
        setSelectedStudioIds={setSelectedStudioIds}
        currentPath={currentPath}
        onAddClick={() => { isNavigatingToSubPage.current = true; }}
      />
    </motion.div>
  );
};
