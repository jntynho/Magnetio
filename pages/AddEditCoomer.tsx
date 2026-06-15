
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';

import { InputBar } from '../components/InputBar';
import { formatTitle, formatName } from '../utils/format';

export const AddEditCoomer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, addCoomer, updateCoomer, permDeleteCoomer, coomerDraft, setCoomerDraft, isHydrated, addNotification } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const isSaving = useRef(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { accentColor } = state.settings;

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');
  const existingCoomer = id ? state.coomers.find(c => c.id === id) : null;

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');

  useEffect(() => {
    if (!isHydrated || initialized.current) return;

    if (coomerDraft && coomerDraft.id === (id || null)) {
      setName(coomerDraft.name || '');
      setImageUrl(coomerDraft.imageUrl || '');
      setOriginalImageUrl(coomerDraft.originalImageUrl || '');
      initialized.current = true;
    } else if (existingCoomer) {
      setName(existingCoomer.name || '');
      setImageUrl(existingCoomer.imageUrl || '');
      setOriginalImageUrl(existingCoomer.originalImageUrl || existingCoomer.imageUrl || '');
      initialized.current = true;
    } else if (!id) {
      setName('');
      setImageUrl('');
      setOriginalImageUrl('');
      initialized.current = true;
    }
  }, [id, existingCoomer, coomerDraft, isHydrated]);

  const draftRef = useRef({
    id: id || null,
    name,
    imageUrl,
    originalImageUrl,
  });

  useEffect(() => {
    draftRef.current = {
      id: id || null,
      name,
      imageUrl,
      originalImageUrl,
    };
  }, [name, imageUrl, originalImageUrl, id]);

  useEffect(() => {
    return () => {
      if (!isSaving.current) {
        setCoomerDraft(null);
      }
    };
  }, [setCoomerDraft]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImageUrl(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const isDuplicate = state.coomers.some(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== id);
    if (isDuplicate) {
      addNotification(`Coomer "${trimmedName}" already exists!`, 'error');
      return;
    }
    
    isSaving.current = true;
    const data = { 
      name: trimmedName, 
      imageUrl: originalImageUrl || imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}`,
      originalImageUrl: originalImageUrl || imageUrl,
      isDeleted: false
    };
    
    let targetId = id;
    if (id) {
      updateCoomer(id, data);
    } else {
      targetId = addCoomer(data);
    }
    
    setCoomerDraft(null);
    const stateFrom = (location.state as any)?.from;
    
    if (stateFrom) {
      navigate(stateFrom, { replace: true, state: { ...((location.state as any) || {}), newlyAddedCoomerId: targetId } });
    } else {
      navigate('/manage-coomers', { replace: true });
    }
  }, [name, imageUrl, originalImageUrl, id, addCoomer, updateCoomer, navigate, setCoomerDraft, location.state, state.coomers, addNotification]);

  const handlePermanentDelete = () => {
    if (!id) return;
    permDeleteCoomer(id);
    setCoomerDraft(null);
    navigate(-1);
  };

  useEffect(() => {
    const onSaveTrigger = () => handleSave();
    window.addEventListener('vault-save-trigger', onSaveTrigger);
    return () => window.removeEventListener('vault-save-trigger', onSaveTrigger);
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
      <div className="max-w-2xl mx-auto flex flex-col gap-6 px-4 pt-4 pb-4 w-full relative animate-pulse">
        <div className="flex flex-col gap-y-4">
          <div className="h-14 bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full w-full px-6 flex flex-col justify-center gap-1">
             <div className="h-2.5 w-16 bg-[var(--border)] rounded-full opacity-50" />
             <div className="h-4 w-1/3 bg-[var(--border)] rounded-full opacity-25" />
          </div>
          <div className="h-14 bg-[var(--surface)] border border-[var(--border)] opacity-30 rounded-full w-full px-6 flex flex-col justify-center gap-1">
             <div className="h-2.5 w-24 bg-[var(--border)] rounded-full opacity-50" />
             <div className="h-4 w-1/2 bg-[var(--border)] rounded-full opacity-25" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 relative">
          <div className="w-32 h-32 rounded-full border-[4px] border-[var(--border)] bg-[var(--border)] opacity-10" />
          <div className="h-2 w-12 bg-[var(--border)] rounded-full opacity-50 mt-4" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto flex flex-col gap-6 px-4 pt-4 pb-4 w-full relative"
    >
      <div className="flex flex-col gap-y-4">
        <InputBar 
          label="Person Name"
          value={name} 
          onChange={(val) => setName(formatName(val))} 
          placeholder="Registry Entry Name..." 
          showPaste
        />
        <InputBar 
          label="Person Image URL"
          value={originalImageUrl} 
          onChange={(val) => {
            setOriginalImageUrl(val);
            setImageUrl(val);
          }} 
          placeholder="Asset URL address..." 
          showPaste
          rightElement={
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center text-[var(--accent)] transition-all active:scale-75"
              title="Upload image"
            >
              <Icons.Plus />
            </button>
          }
        />
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      </div>

      <div className="flex flex-col items-center justify-center py-6 relative">
        <div 
          className="w-32 h-32 rounded-full border-[4px] overflow-hidden bg-neutral-800 shadow-2xl relative ring-4 ring-black/20"
          style={{ borderColor: state.settings.circleBorderColor }}
        >
          {originalImageUrl || imageUrl ? (
            <img 
              src={originalImageUrl || imageUrl} 
              className="w-full h-full object-cover" 
              alt={name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <Icons.User />
            </div>
          )}
        </div>
        
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-4">Preview</span>
        
        {id && (
          <div className="w-full mt-8 relative h-12">
            <div 
              className={`absolute inset-0 flex gap-3 transition-all duration-300 ease-[var(--ease-spring)] will-change-transform ${isConfirmingDelete ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}
            >
              <button 
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 py-3 rounded-full font-black uppercase tracking-widest text-[10px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] shadow-md active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={handlePermanentDelete}
                className="flex-1 py-3 rounded-full font-black uppercase tracking-widest text-[10px] text-white/80 shadow-md active:scale-95 transition-transform"
                style={{ backgroundColor: `${accentColor}cc` }}
              >
                Delete
              </button>
            </div>

            <button 
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className={`absolute inset-0 w-full py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] text-[var(--surface)] shadow-md ${isConfirmingDelete ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
              style={{ backgroundColor: state.settings.buttonColor }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
