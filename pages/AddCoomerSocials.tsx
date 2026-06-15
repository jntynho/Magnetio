
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { CoomerPost } from '../types';
import { DateSelector } from '../components/DateSelector';
import { InputBar } from '../components/InputBar';
import { motion, AnimatePresence } from 'framer-motion';

export const AddCoomerSocials: React.FC = () => {
  const { id, postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updateCoomer, coomerActiveTab } = useApp();

  const coomer = state.coomers.find(c => c.id === id);
  const isEditMode = !!postId;
  
  const [platform, setPlatform] = useState<'Instagram' | 'OnlyFans'>(coomerActiveTab);
  const [mode, setMode] = useState<'Single' | 'Multiple'>('Single');
  const [input, setInput] = useState('');
  const [stagedItems, setStagedItems] = useState<{ id: string; url: string; date?: number }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [backupItems, setBackupItems] = useState<{ id: string; url: string; date?: number }[] | null>(null);

  const handleOpenDateSelector = () => {
    setBackupItems([...stagedItems]);
    setShowDateSelector(true);
  };

  const handleCancelDateSelector = () => {
    if (backupItems) {
      setStagedItems(backupItems);
    }
    setBackupItems(null);
    setShowDateSelector(false);
  };

  const handleConfirmDateSelector = (timestamp: number) => {
    handleDateChange(timestamp);
    setBackupItems(null);
    setShowDateSelector(false);
  };

  const handleDateChange = (newDate: number) => {
    setStagedItems(prev => prev.map((item, i) => 
      i === activeIndex ? { ...item, date: newDate } : item
    ));
  };

  useEffect(() => {
    if (isEditMode && coomer) {
      const allPosts = [...(coomer.instagramPosts || []), ...(coomer.onlyFansPosts || [])];
      const postToEdit = allPosts.find(p => p.id === postId);
      if (postToEdit) {
        const isInsta = (coomer.instagramPosts || []).some(p => p.id === postId);
        setPlatform(isInsta ? 'Instagram' : 'OnlyFans');
        setMode(postToEdit.type);
        setStagedItems(postToEdit.urls.map((url, idx) => ({ 
          id: Math.random().toString(36).substr(2, 9), 
          url,
          date: postToEdit.perImageDates?.[idx] || postToEdit.date
        })));
      }
    }
  }, [isEditMode, coomer, postId]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const parseUrls = (text: string) => {
    const urlRegex = /https?:\/\/[^\s\n\t]+/gi;
    return text.match(urlRegex) || [];
  };

  const handleAddUrls = () => {
    const urls = parseUrls(input);
    if (urls.length === 0) return;
    
    const newItems = urls.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      url
    }));
    
    setStagedItems(prev => [...prev, ...newItems]);
    setInput('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    let processedCount = 0;
    const newItems: { id: string; url: string }[] = [];

    fileArray.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result as string
        });
        processedCount++;
        if (processedCount === fileArray.length) {
          setStagedItems(prev => [...prev, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const handleRemoveItem = (itemId: string) => {
    setStagedItems(prev => {
      const newItems = prev.filter(item => item.id !== itemId);
      if (activeIndex >= newItems.length && newItems.length > 0) {
        setActiveIndex(newItems.length - 1);
      }
      return newItems;
    });
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const width = el.clientWidth;
      if (width === 0) return;
      const idx = Math.round(el.scrollLeft / width);
      if (idx !== activeIndex && idx >= 0 && idx < stagedItems.length) {
        setActiveIndex(idx);
      }
    }
  };

  const handleDeletePost = useCallback(() => {
    if (!coomer || !postId) return;
    const instaPosts = (coomer.instagramPosts || []).filter(p => p.id !== postId);
    const ofPosts = (coomer.onlyFansPosts || []).filter(p => p.id !== postId);
    updateCoomer(coomer.id, {
      instagramPosts: instaPosts,
      onlyFansPosts: ofPosts
    });
    navigate(-1);
  }, [coomer, postId, updateCoomer, navigate]);

  const handleSave = useCallback((shouldNavigate = true) => {
    if (!coomer) return;

    const urls = stagedItems.map(item => item.url);
    const dates = stagedItems.map(item => item.date);
    
    if (urls.length === 0) {
      if (isEditMode) {
        handleDeletePost();
        return;
      }
      if (shouldNavigate) navigate(-1);
      return;
    }

    const field = platform === 'Instagram' ? 'instagramPosts' : 'onlyFansPosts';
    const existingPosts = (coomer as any)[field] || [];
    
    if (isEditMode) {
      const allPosts = [...(coomer.instagramPosts || []), ...(coomer.onlyFansPosts || [])];
      const postToEdit = allPosts.find(p => p.id === postId);
      
      const instaPosts = (coomer.instagramPosts || []).filter(p => p.id !== postId);
      const ofPosts = (coomer.onlyFansPosts || []).filter(p => p.id !== postId);
      
      const newPost: CoomerPost = {
        id: postId!,
        urls: urls,
        perImageDates: dates,
        date: dates[0] || Date.now(),
        type: mode,
        createdAt: postToEdit?.createdAt || Date.now()
      };

      if (platform === 'Instagram') {
        updateCoomer(coomer.id, {
          instagramPosts: [...instaPosts, newPost],
          onlyFansPosts: ofPosts
        });
      } else {
        updateCoomer(coomer.id, {
          instagramPosts: instaPosts,
          onlyFansPosts: [...ofPosts, newPost]
        });
      }
    } else {
      const newPosts: CoomerPost[] = [];
      if (mode === 'Single') {
        stagedItems.forEach(item => {
          newPosts.push({
            id: Math.random().toString(36).substr(2, 9),
            urls: [item.url],
            date: item.date || Date.now(),
            type: 'Single',
            createdAt: Date.now()
          });
        });
      } else {
        newPosts.push({
          id: Math.random().toString(36).substr(2, 9),
          urls: urls,
          perImageDates: dates,
          date: dates[0] || Date.now(),
          type: 'Multiple',
          createdAt: Date.now()
        });
      }
      
      updateCoomer(coomer.id, {
        [field]: [...existingPosts, ...newPosts]
      });
    }

    if (shouldNavigate) {
      navigate(-1);
    } else {
      setStagedItems([]);
      setActiveIndex(0);
      setInput('');
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, [coomer, platform, mode, stagedItems, updateCoomer, navigate, isEditMode, postId, handleDeletePost]);

  useEffect(() => {
    const trigger = () => handleSave(true);
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleSave]);

  if (!coomer) return null;

  const btnBase = "flex-1 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all duration-300 ease-out active:scale-[0.98]";
  const btnInactive = "bg-white/5 text-[var(--text-muted)] border border-[var(--border)]";
  
  const getPlatformClass = (p: 'Instagram' | 'OnlyFans') => {
    if (platform !== p) return btnInactive;
    return p === 'Instagram' 
      ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
      : "bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]";
  };

  const getModeClass = (m: 'Single' | 'Multiple') => {
    if (mode !== m) return btnInactive;
    return "bg-neutral-600 text-white shadow-md border-neutral-500";
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col p-4 animate-slide-in gap-8 pb-20">
      {/* Platform Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] px-1">Platform</label>
        <div className="flex gap-2">
          {(['Instagram', 'OnlyFans'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`${btnBase} ${getPlatformClass(p)}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Link Input */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <label className={`text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]`}>Paste Links</label>
        </div>
        <InputBar 
          label="Paste Links" 
          value={input} 
          onChange={setInput} 
          onPasteCapture={setInput}
          placeholder={`Paste ${platform} link(s) here...`} 
          showPaste
          rightElement={
            <button 
              type="button" 
              onClick={input.trim() ? handleAddUrls : () => fileInputRef.current?.click()} 
              className="w-10 h-10 flex items-center justify-center text-[var(--text-primary)] shrink-0 active:scale-75 transition-transform tap-highlight-none"
            >
              {input.trim() ? <Icons.Check /> : <Icons.Plus />}
            </button>
          }
        />
        <input 
          type="file" 
          multiple 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*" 
        />
        
        {/* Mode Selection moved under Paste Links */}
        <div className="flex flex-col gap-3 mt-2">
          <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] px-1">Mode</label>
          <div className="flex gap-2">
            {(['Single', 'Multiple'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`${btnBase} ${getModeClass(m)}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staged Media Preview */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1 min-h-[40px]">
          <AnimatePresence mode="wait">
            {showDateSelector ? (
              <motion.div
                key="date-selector"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex-1"
              >
                <DateSelector 
                  value={stagedItems[activeIndex]?.date}
                  onSave={handleConfirmDateSelector}
                  onCancel={handleCancelDateSelector}
                />
              </motion.div>
            ) : (
              <motion.div
                key="header-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex items-center justify-between w-full"
              >
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Assets Staged</label>
                <div className="flex items-center gap-2">
                  {stagedItems.length > 0 && (
                    <button 
                      type="button"
                      onClick={handleOpenDateSelector}
                      className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] active:scale-75 transition-transform"
                      title="Assign Date"
                    >
                      <Icons.Calendar size={16} />
                    </button>
                  )}
                  {stagedItems.length > 0 && (
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-slide-in">
                      {activeIndex + 1} / {stagedItems.length}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative w-full aspect-[4/3] bg-neutral-900 border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl group flex flex-col">
          {stagedItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
              <div className="mb-4 scale-150"><Icons.Upload /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">No assets staged</span>
            </div>
          ) : (
            <>
              {/* Control Buttons Overlay */}
              {stagedItems.length > 0 && !showDateSelector && (
                <>
                  <button 
                    onClick={() => handleRemoveItem(stagedItems[activeIndex].id)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-75 transition-all shadow-xl z-20"
                  >
                    <Icons.X size={20} />
                  </button>
                </>
              )}

              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar gpu-accelerated overscroll-x-contain"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {stagedItems.map((item, i) => {
                  const isNear = Math.abs(i - activeIndex) <= 1;
                  return (
                    <div key={item.id} className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center bg-black/20">
                      {isNear && item.url ? (
                        <img 
                          src={item.url} 
                          className="max-w-full max-h-full object-contain select-none pointer-events-none animate-slide-in"
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-white/10 animate-spin" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Links Button */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={stagedItems.length === 0 || showDateSelector}
          onClick={() => handleSave(false)}
          className={`w-full ${btnBase} bg-blue-600 text-white shadow-md ${stagedItems.length === 0 || showDateSelector ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-blue-500'}`}
        >
          {isEditMode ? 'Update Media' : 'Save Staged Media'}
        </button>
        
        {isEditMode && (
          <button
            type="button"
            onClick={handleDeletePost}
            className={`w-full ${btnBase} bg-red-600/20 text-red-500 border border-red-500/30 mt-2`}
          >
            Delete Media
          </button>
        )}
      </div>
    </div>
  );
};
