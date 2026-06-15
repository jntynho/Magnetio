
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { InputBar } from '../components/InputBar';
import { CoverPreview } from '../components/CoverPreview';
import { Icons } from '../constants';

export const EditEpisode: React.FC = () => {
  const { hanimeId, episodeId } = useParams();
  const { state, updateHanime, hanimeDraft, setHanimeDraft } = useApp();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState('');
  const [cover, setCover] = useState('');
  
  const hanime = hanimeDraft || state.hanime.find(h => h.id === hanimeId);
  const episode = hanime?.episodes.find(e => e.id === episodeId);

  useEffect(() => {
    if (episode) {
      setUrl(episode.url);
      setCover(episode.coverImage);
    }
  }, [episode]);

  const handleSave = () => {
    if (!hanime) return;
    
    const updatedEpisodes = hanime.episodes.map(ep => 
      ep.id === episodeId ? { ...ep, url, coverImage: cover } : ep
    );
    
    if (hanimeDraft) {
      setHanimeDraft({
        ...hanimeDraft,
        episodes: updatedEpisodes
      });
      navigate('/manage-hanime/episodes', { replace: true });
    } else {
      updateHanime(hanime.id, { episodes: updatedEpisodes });
      navigate(`/manage-hanime/edit/${hanimeId}`, { replace: true });
    }
  };

  useEffect(() => {
    const trigger = () => handleSave();
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleSave]);

  const handleCancel = () => {
    if (hanimeDraft) {
      navigate('/manage-hanime/episodes', { replace: true });
    } else {
      navigate(`/manage-hanime/edit/${hanimeId}`, { replace: true });
    }
  };

  if (!episode) return <div>Episode not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4"
    >
      <div className="flex flex-col gap-y-4 mb-6">
        <InputBar label="Episode URL" value={url} onChange={setUrl} placeholder="Episode URL..." showPaste />
        <InputBar label="Cover Image URL" value={cover} onChange={setCover} placeholder="Cover Image URL..." showPaste />
      </div>
      
      <div className="relative -mt-6 mb-12 w-full mx-auto">
        <CoverPreview 
          url={cover} 
          ratio={'16:9'} 
          objectFit="contain"
          offset={50} 
          onOffsetChange={() => {}} 
          onAutoSelect={() => {}} 
          isProcessing={false}
        />
      </div>
      <div className="flex gap-4">
        <button onClick={handleSave} className="flex-1 h-12 rounded-full text-white font-bold" style={{ backgroundColor: state.settings.buttonColor }}>Save</button>
        <button onClick={handleCancel} className="flex-1 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-bold">Cancel</button>
      </div>
    </motion.div>
  );
};
