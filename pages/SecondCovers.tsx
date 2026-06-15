import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { InputBar } from '../components/InputBar';

export const SecondCovers: React.FC = () => {
  const { hanimeDraft, setHanimeDraft, state } = useApp();
  const navigate = useNavigate();
  const [newUrl, setNewUrl] = useState('');
  const [activeCoverIndex, setActiveCoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!hanimeDraft) {
      navigate('/manage-hanime');
    }
  }, [hanimeDraft, navigate]);

  const handleSave = () => {
    if (hanimeDraft && hanimeDraft.id) {
      navigate(`/manage-hanime/edit/${hanimeDraft.id}`, { replace: true });
    } else {
      navigate('/manage-hanime/add', { replace: true });
    }
  };

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

  if (!hanimeDraft || !isReady) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6 px-4 pt-4 pb-4 w-full animate-pulse">
        <div className="flex flex-col gap-y-4">
          <div className="h-12 bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full w-full px-6 flex flex-col justify-center gap-1">
             <div className="h-2 w-16 bg-[var(--border)] rounded-full opacity-50" />
             <div className="h-3.5 w-1/3 bg-[var(--border)] rounded-full opacity-25" />
          </div>
          <div className="h-4 w-32 bg-[var(--border)] rounded-full opacity-20 ml-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="aspect-[5/7] bg-[var(--border)] opacity-10 rounded-2xl w-full" />
             ))}
          </div>
        </div>
      </div>
    );
  }

  const handleAddCover = () => {
    if (!newUrl.trim()) return;
    setHanimeDraft({
      ...hanimeDraft,
      secondaryCovers: [...hanimeDraft.secondaryCovers, newUrl.trim()]
    });
    setNewUrl('');
  };

  const handleRemoveCover = (index: number) => {
    const updated = [...hanimeDraft.secondaryCovers];
    updated.splice(index, 1);
    setHanimeDraft({
      ...hanimeDraft,
      secondaryCovers: updated
    });
    setActiveCoverIndex(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Input Field */}
        <InputBar 
          label="Add Secondary Cover URL"
          value={newUrl}
          onChange={setNewUrl}
          placeholder="Paste URL here..."
          showPaste
          rightElement={
            <AnimatePresence>
              {newUrl.trim() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  onClick={handleAddCover}
                  className="w-10 h-10 -mr-5 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0"
                  style={{ backgroundColor: state.settings.buttonColor }}
                >
                  <Icons.Check />
                </motion.button>
              )}
            </AnimatePresence>
          }
        />

        {/* List of Covers */}
        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] ml-4">
            Secondary Covers ({hanimeDraft.secondaryCovers.length})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {hanimeDraft.secondaryCovers.map((url, index) => (
                <motion.div
                  key={`${url}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setActiveCoverIndex(activeCoverIndex === index ? null : index)}
                  className="relative group aspect-[5/7] rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] cursor-pointer"
                >
                  <img 
                    src={url} 
                    alt={`Cover ${index + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <AnimatePresence>
                    {activeCoverIndex === index && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCover(index);
                          }}
                          className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
                        >
                          <Icons.Trash size={18} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
