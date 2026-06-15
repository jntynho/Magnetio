import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../constants';
import { isPixeldrainUrl, transformPixeldrainUrl } from '../utils/pixeldrain';
import { isHstreamUrl, extractHstreamUrl } from '../utils/hstream';
import { VideoOverlay } from './VideoOverlay';
import { useApp } from '../AppContext';

interface Episode {
  id: string;
  episodeNumber: number;
  url: string;
  coverImage?: string;
}

interface EpisodeListProps {
  episodes: Episode[];
}

export const EpisodeList: React.FC<EpisodeListProps> = ({ episodes }) => {
  const [loadedEpisodes, setLoadedEpisodes] = useState<Record<string, boolean>>({});
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [directVideoUrl, setDirectVideoUrl] = useState<any>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const { state } = useApp();
  const { accentColor = '#3b82f6' } = state.settings;

  if (episodes.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--text-muted)] text-sm uppercase tracking-widest">
        No episodes available.
      </div>
    );
  }

  const handlePlay = async (ep: Episode) => {
    setExtracting(ep.id);
    try {
      if (isPixeldrainUrl(ep.url)) {
        setDirectVideoUrl(transformPixeldrainUrl(ep.url));
        setPlayingEpisodeId(ep.id);
      } else if (isHstreamUrl(ep.url)) {
        const streamData = await extractHstreamUrl(ep.url);
        setDirectVideoUrl(streamData);
        setPlayingEpisodeId(ep.id);
      } else {
        window.open(ep.url, '_blank');
      }
    } catch (e) {
      console.error(e);
      window.open(ep.url, '_blank');
    } finally {
      setExtracting(null);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {episodes.map((ep, index) => (
        <motion.div 
          key={ep.id} 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -50px 0px" }}
          transition={{ 
            duration: 0.4, 
            delay: index < 8 ? index * 0.05 : 0, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          className="flex flex-col w-full overflow-hidden gpu-accelerated group"
        >
          <div className="relative w-full overflow-hidden bg-[var(--surface)] aspect-video rounded-2xl border border-[var(--border)] shadow-md">
            {!loadedEpisodes[ep.id] && (
              <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center z-0">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              </div>
            )}
            
            <AnimatePresence>
              {playingEpisodeId === ep.id ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-black/95"
                >
                  {directVideoUrl && (
                    <VideoOverlay 
                      url={directVideoUrl} 
                      accentColor={accentColor} 
                      onClose={() => {
                        setPlayingEpisodeId(null);
                        setDirectVideoUrl(null);
                      }} 
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0"
                >
                  {ep.coverImage && (
                    <img 
                      src={ep.coverImage} 
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${loadedEpisodes[ep.id] ? 'opacity-100' : 'opacity-0'}`} 
                      alt={`Episode ${ep.episodeNumber}`} 
                      referrerPolicy="no-referrer" 
                      loading={index < 3 ? "eager" : "lazy"}
                      onLoad={() => setLoadedEpisodes(prev => ({ ...prev, [ep.id]: true }))}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/30 transition-colors duration-300" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => handlePlay(ep)}
                      disabled={extracting === ep.id}
                      className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-sm shadow-xl border border-white/10 transition-transform duration-300 transform scale-90 group-hover:scale-100 disabled:opacity-50"
                      style={{ color: accentColor }}
                    >
                      {extracting === ep.id ? (
                        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
                      ) : (
                        <Icons.Play size={32} className="ml-1" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="py-3 w-full">
            <div className="flex flex-col items-start">
              <h3 className="font-bold leading-tight tracking-tight text-left truncate w-full text-[1rem]" style={{ color: accentColor }}>
                Episode {ep.episodeNumber}
              </h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
