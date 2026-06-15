import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { HanimeEpisode } from '../types';
import { InputBar } from '../components/InputBar';
import { DateSelector } from '../components/DateSelector';
import { CoverPreview } from '../components/CoverPreview';
import { Icons } from '../constants';
import { formatTitle } from '../utils/format';

export const AddEditHanime: React.FC = () => {
  const { id } = useParams();
  const { state, addHanime, updateHanime, isHydrated, hanimeDraft, setHanimeDraft, addNotification } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverOffset, setCoverOffset] = useState(50);
  const [description, setDescription] = useState('');
  const [episodes, setEpisodes] = useState<HanimeEpisode[]>([]);
  const [assignedDate, setAssignedDate] = useState<number | undefined>();
  const [censorship, setCensorship] = useState<'UNCENSORED' | 'CENSORED'>('CENSORED');
  const [secondaryCovers, setSecondaryCovers] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const isSaving = useRef(false);
  const isNavigatingToSubPage = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!isHydrated || initialized.current) return;

    // If there's a draft for THIS specific ID, use it
    if (hanimeDraft && hanimeDraft.id === (id || null)) {
      setTitle(hanimeDraft.title);
      setCoverImage(hanimeDraft.coverImage);
      setCoverOffset(hanimeDraft.coverOffset ?? 50);
      setDescription(hanimeDraft.description);
      setEpisodes(hanimeDraft.episodes);
      setAssignedDate(hanimeDraft.assignedDate);
      setCensorship(hanimeDraft.censorship || 'UNCENSORED');
      setSecondaryCovers(hanimeDraft.secondaryCovers);
      initialized.current = true;
    } else if (id) {
      const hanime = state.hanime.find(h => h.id === id);
      if (hanime) {
        setTitle(hanime.title);
        setCoverImage(hanime.coverImage);
        setCoverOffset(hanime.coverOffset ?? 50);
        setDescription(hanime.description || '');
        setEpisodes(hanime.episodes);
        setAssignedDate(hanime.assignedDate);
        setCensorship(hanime.censorship || 'UNCENSORED');
        setSecondaryCovers(hanime.secondaryCovers || []);
        initialized.current = true;
      }
    } else {
      initialized.current = true;
    }
  }, [id, state.hanime, isHydrated, hanimeDraft]);

  const draftRef = useRef({
    id: id || null,
    title,
    coverImage,
    coverOffset,
    description,
    episodes,
    assignedDate,
    censorship,
    secondaryCovers
  });

  useEffect(() => {
    draftRef.current = {
      id: id || null,
      title,
      coverImage,
      coverOffset,
      description,
      episodes,
      assignedDate,
      censorship,
      secondaryCovers
    };
  }, [id, title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers]);

  // Clear draft when leaving the page (unless going to second covers or episodes)
  useEffect(() => {
    return () => {
      if (isNavigatingToSubPage.current) {
        setHanimeDraft(draftRef.current);
      } else if (!isSaving.current) {
        setHanimeDraft(null);
      }
    };
  }, [setHanimeDraft]);

  const handleSave = useCallback(() => {
    if (!title.trim() || !coverImage.trim()) {
      addNotification("Please fill in both Hanime Name and Cover Image URL.", "error");
      return;
    }

    const isDuplicateTitle = state.hanime.some(h => h.id !== id && h.title.toLowerCase() === title.toLowerCase());
    if (isDuplicateTitle) {
      addNotification("Hanime Name: A Hanime with this title already exists.", "error");
      return;
    }

    const newEpisodeUrls = episodes.map(e => e.url);
    const duplicateHanime = state.hanime.find(h => h.id !== id && h.episodes.some(e => newEpisodeUrls.includes(e.url)));
    const duplicateEpisode = duplicateHanime?.episodes.find(e => newEpisodeUrls.includes(e.url));
    
    if (duplicateEpisode) {
      addNotification(`Episode Link: The link ${duplicateEpisode.url} already exists in another Hanime (${duplicateHanime?.title}).`, "error");
      return;
    }

    const isDuplicateCover = state.hanime.some(h => h.id !== id && h.coverImage === coverImage);
    if (isDuplicateCover) {
      addNotification("Cover Image URL: This cover image is already used in another Hanime.", "error");
      return;
    }

    isSaving.current = true;
    if (id) {
      updateHanime(id, { title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers });
    } else {
      addHanime({ title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers });
    }
    setHanimeDraft(null);
    const from = location.state?.from;
    if (from) {
      navigate(from, { replace: true });
    } else {
      navigate('/manage-hanime', { replace: true });
    }
  }, [id, title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers, updateHanime, addHanime, navigate, location.state?.from, setHanimeDraft, state.hanime, addNotification]);

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

  if (!isHydrated || !isReady) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-6 px-4 pt-4 pb-4 w-full relative animate-pulse">
        <div className="flex flex-col gap-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full w-full px-4 flex flex-col justify-center gap-0.5">
                <div className="h-2 w-10 bg-[var(--border)] rounded-full opacity-50" />
                <div className="h-3.5 w-1/3 bg-[var(--border)] rounded-full opacity-25" />
             </div>
             <div className="h-[48px] bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full w-full px-4 flex flex-col justify-center gap-0.5">
                <div className="h-2 w-10 bg-[var(--border)] rounded-full opacity-50" />
                <div className="h-3.5 w-1/2 bg-[var(--border)] rounded-full opacity-25" />
             </div>
          </div>
          <div className="w-full aspect-video bg-[var(--border)] border border-[var(--border)] rounded-[24px] opacity-10" />
          <div className="flex gap-3">
             <div className="flex-1 h-12 bg-[var(--border)] opacity-20 rounded-full" />
             <div className="flex-1 h-12 bg-[var(--border)] opacity-20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="max-w-xl mx-auto px-4 pb-48 pt-4 w-full flex flex-col gap-y-6"
    >
      <div className="flex flex-col gap-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputBar 
            label="Title" 
            value={title} 
            onChange={(val) => setTitle(formatTitle(val))} 
            placeholder="Hanime Title..." 
            showPaste 
            compact
          />
          <InputBar 
              label="Cover" 
              value={coverImage} 
              onChange={setCoverImage} 
              placeholder="Cover URL..." 
              showPaste 
              compact
          />
        </div>
        
        <div className="w-full">
          <CoverPreview 
            url={coverImage} 
            ratio={'Adaptive'} 
            offset={coverOffset} 
            onOffsetChange={setCoverOffset} 
            onAutoSelect={() => {}} 
            isProcessing={false}
            assignedDate={assignedDate}
            onDateChange={setAssignedDate}
            episodes={episodes}
            isLocked={false}
            objectFit="contain"
          />
        </div>

        <InputBar label="Description" value={description} onChange={setDescription} placeholder="Description..." showPaste />

        <div className="flex gap-3">
          <button
            onClick={() => {
              setHanimeDraft(draftRef.current);
              isNavigatingToSubPage.current = true;
              navigate('/manage-hanime/second-covers');
            }}
            className="flex-1 h-12 rounded-full text-sm font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
            style={{ backgroundColor: state.settings.buttonColor }}
          >
            Add Second Covers {secondaryCovers.length > 0 && `(${secondaryCovers.length})`}
          </button>
          <button
            onClick={() => {
              setHanimeDraft(draftRef.current);
              isNavigatingToSubPage.current = true;
              navigate('/manage-hanime/episodes');
            }}
            className="flex-1 h-12 rounded-full text-sm font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
            style={{ backgroundColor: episodes.length > 0 ? '#22c55e' : state.settings.buttonColor }}
          >
            {episodes.length > 0 ? (
              <>
                Edit Episodes ({episodes.length})
              </>
            ) : (
              <>
                Add episode
              </>
            )}
          </button>
        </div>
        <div className="flex gap-3 w-full">
          {(['UNCENSORED', 'CENSORED'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCensorship(c)}
              className={`flex-1 h-[48px] rounded-full font-black text-[10px] uppercase tracking-widest transition-all border ${censorship === c ? 'text-[var(--surface)] border-transparent shadow-lg' : 'bg-[var(--surface)] text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'}`}
              style={censorship === c ? { backgroundColor: state.settings.buttonColor } : {}}
            >
              {c}
            </button>
          ))}
        </div>
      </div>


    </motion.div>
  );
};
