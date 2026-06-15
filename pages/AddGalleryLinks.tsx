
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { InputBar } from '../components/InputBar';

export const AddGalleryLinks: React.FC = () => {
  const navigate = useNavigate();
  const { state, formDraft, setFormDraft, addNotification } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmingCover, setIsConfirmingCover] = useState(false);
  const [hasScrolledDeep, setHasScrolledDeep] = useState(false);
  const { blurIntensity, buttonStyle, accentColor } = state.settings;
  
  const [galleryUrls, setGalleryUrls] = useState<string[]>(formDraft?.galleryUrls || []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const parseUrls = (text: string) => {
    // Robust URL matching using regex to avoid splitting URLs that contain commas or spaces
    // This looks for anything starting with http and captures until the next space, newline, or typical URL end characters
    const urlRegex = /https?:\/\/[^\s\n\t]+/gi;
    return text.match(urlRegex) || [];
  };

  const handleAdd = () => {
    const urls = parseUrls(inputVal);
    if (urls.length === 0) return;
    
    const newUniqueUrls = urls.filter(u => !galleryUrls.includes(u));
    if (newUniqueUrls.length < urls.length && galleryUrls.length > 0) {
      addNotification(`${urls.length - newUniqueUrls.length} duplicate links were filtered out.`, "success");
    }

    if (newUniqueUrls.length === 0) return;
    setGalleryUrls(prev => [...prev, ...newUniqueUrls]);
    setInputVal('');
  };

  const handleDeleteActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryUrls.length === 0) return;
    const newUrls = [...galleryUrls];
    newUrls.splice(activeIndex, 1);
    setGalleryUrls(newUrls);
    if (activeIndex >= newUrls.length && newUrls.length > 0) {
      setActiveIndex(newUrls.length - 1);
    }
  };

  const performSetAsCover = () => {
    if (galleryUrls.length > 0 && formDraft) {
      const selectedUrl = galleryUrls[activeIndex];
      setFormDraft({ ...formDraft, coverImage: selectedUrl, galleryUrls });
      setIsConfirmingCover(false);
    }
  };

  const performClear = () => {
    setGalleryUrls([]);
    setActiveIndex(0);
    if (formDraft) {
      setFormDraft({ ...formDraft, galleryUrls: [] });
    }
    setIsClearing(false);
  };

  const handleFinalConfirm = useCallback(() => {
    if (formDraft) {
      setFormDraft({ ...formDraft, galleryUrls });
    }
    navigate(-1);
  }, [galleryUrls, formDraft, setFormDraft, navigate]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== activeIndex && idx >= 0 && idx < galleryUrls.length) {
        setActiveIndex(idx);
        if (idx >= 4) setHasScrolledDeep(true);
      }
    }
  };

  useEffect(() => {
    const trigger = () => handleFinalConfirm();
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleFinalConfirm]);

  const springBezier = "cubic-bezier(0.3, 1.4, 0.6, 1)";

  const getButtonStyle = (style: 'Glass' | 'ColorGlass' | 'SolidColors', btnId: string) => {
    const semanticColors: Record<string, { bg: string, border: string, glow: string }> = {
      trash: { bg: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(239, 68, 68, 0.5)' },
      cancel: { bg: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', border: 'rgba(255,255,255,0.3)', glow: 'rgba(0,0,0,0.3)' },
    };

    switch (style) {
      case 'ColorGlass': {
        const sc = semanticColors[btnId] || { bg: 'linear-gradient(135deg, #333 0%, #000 100%)', border: 'rgba(255,255,255,0.2)', glow: 'transparent' };
        return {
          className: "w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 border-2 relative overflow-visible transition-shadow duration-300",
          style: {
            background: sc.bg,
            borderColor: sc.border,
            boxShadow: `0 0 20px ${sc.glow}, inset 0 2px 4px rgba(255,255,255,0.3)`,
          }
        };
      }
      case 'SolidColors':
        return {
          className: "w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-2xl border border-white/20 relative overflow-hidden",
          style: {
            backgroundColor: 'currentColor'
          }
        };
      case 'Glass':
      default:
        return {
          className: "w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-xl border border-white/15 relative overflow-hidden",
          style: {
            backgroundColor: 'rgba(25, 25, 25, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }
        };
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col p-4 animate-slide-in h-full pt-4 gap-8">
      <div className="flex flex-col gap-4">
        <InputBar label="Asset Source(s)" value={inputVal} onChange={setInputVal} placeholder="Paste one or many links..." showPaste isTextArea />
        <button
          onClick={handleAdd}
          className={`w-full h-[48px] rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] text-[var(--surface)] shadow-lg flex items-center justify-center ${
            inputVal.trim() ? 'opacity-100' : 'opacity-30'
          }`}
          style={{ backgroundColor: inputVal.trim() ? state.settings.buttonColor : '#64748b' }}
        >
          Stage Source Link(s)
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Assets Staged</label>
          {galleryUrls.length > 0 && (
            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest transition-all">
              {activeIndex + 1} / {galleryUrls.length}
            </span>
          )}
        </div>
        
        <div className="relative w-full aspect-video bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg group">
          {galleryUrls.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">No assets staged</span>
            </div>
          ) : (
            <>
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar gpu-accelerated overscroll-x-contain"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {galleryUrls.map((url, i) => {
                  const shouldLoad = hasScrolledDeep || (i < 2) || (Math.abs(i - activeIndex) <= 1);
                  return (
                    <div key={url + i} className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center bg-black/20">
                      {shouldLoad && url ? (
                        <img 
                          src={url} 
                          className="max-w-full max-h-full object-contain select-none pointer-events-none"
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x338?text=Invalid+Source';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-white/10 animate-spin" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <button 
                onClick={handleDeleteActive}
                className={`absolute top-3 right-3 z-[30] w-9 h-9 rounded-full bg-black/40 backdrop-blur-[32px] border border-white/15 flex items-center justify-center text-white active:scale-75 transition-all shadow-md ${isClearing ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}
                title="Remove current asset"
              >
                <Icons.X />
              </button>

              <div 
                className="absolute inset-0 bg-black/70 flex items-center justify-center gap-6 z-[40] transition-opacity duration-300"
                style={{ 
                  opacity: isClearing ? 1 : 0,
                  pointerEvents: isClearing ? 'auto' : 'none',
                  backdropFilter: isClearing ? `blur(${blurIntensity/10}px)` : 'none'
                }}
              >
                <button 
                  onClick={() => setIsClearing(false)}
                  className={getButtonStyle(buttonStyle, 'cancel').className}
                  style={{
                    ...getButtonStyle(buttonStyle, 'cancel').style,
                    transform: isClearing ? 'translateY(0) scale(1.1)' : 'translateY(20px) scale(0.5)',
                    opacity: isClearing ? 1 : 0,
                    transition: `transform 450ms ${springBezier}, opacity 250ms ease-out`,
                  }}
                >
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <Icons.X />
                </button>
                <button 
                  onClick={performClear}
                  className={getButtonStyle(buttonStyle === 'ColorGlass' ? 'ColorGlass' : 'Glass', 'trash').className}
                  style={{
                    ...getButtonStyle(buttonStyle === 'ColorGlass' ? 'ColorGlass' : 'Glass', 'trash').style,
                    transform: isClearing ? 'translateY(0) scale(1.1)' : 'translateY(20px) scale(0.5)',
                    opacity: isClearing ? 1 : 0,
                    transition: `transform 450ms ${springBezier}, opacity 250ms ease-out`,
                    transitionDelay: '60ms',
                  }}
                >
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <div className="relative z-10 scale-110"><Icons.Trash /></div>
                </button>
              </div>
            </>
          )}
        </div>

        {galleryUrls.length > 0 && !isClearing && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsClearing(true)}
              className="w-full py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] bg-[var(--surface)] text-rose-500 border border-[var(--border)]"
            >
              Clear Staged Buffer
            </button>
            
            <div className="relative w-full h-11 overflow-hidden">
               <div className={`absolute inset-0 flex gap-3 transition-all duration-300 ease-[var(--ease-spring)] ${isConfirmingCover ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                  <button 
                    onClick={() => setIsConfirmingCover(false)}
                    className="flex-1 rounded-full font-black uppercase tracking-widest text-[10px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={performSetAsCover}
                    className="flex-1 rounded-full font-black uppercase tracking-widest text-[10px] text-white/80 active:scale-95 transition-transform"
                    style={{ backgroundColor: `${accentColor}cc` }}
                  >
                    Confirm
                  </button>
               </div>

               <button
                  onClick={() => setIsConfirmingCover(true)}
                  className={`w-full h-full rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] text-[var(--surface)] shadow-md ${isConfirmingCover ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                  style={{ backgroundColor: state.settings.buttonColor }}
                >
                  Set as cover
                </button>
            </div>
          </div>
        )}
      </div>

      <div className="pb-10" />
    </div>
  );
};
