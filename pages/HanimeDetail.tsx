import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { motion } from 'motion/react';
import { EpisodeList } from '../components/EpisodeList';

export const HanimeDetail: React.FC = () => {
  const { id } = useParams();
  const { state, deleteHanime } = useApp();
  const navigate = useNavigate();
  const hanime = state.hanime.find(h => h.id === id);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(true);
  const [showToggle, setShowToggle] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | 'auto'>('auto');
  const [mainImgLoaded, setMainImgLoaded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current && isClamped && !isExpanded) {
      const el = textRef.current;
      const isOverflowing = el.scrollHeight > el.clientHeight;
      setShowToggle(isOverflowing);
      if (isOverflowing && collapsedHeight === 'auto') {
        setCollapsedHeight(el.clientHeight);
      }
    }
  }, [hanime?.description, isClamped, isExpanded, collapsedHeight]);

  const toggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      setIsClamped(false);
    }
  };

  if (!hanime) return <div>Not found</div>;

  return (
    <div className="max-w-2xl mx-auto animate-slide-in pb-10">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-8">
        <div className="flex gap-4 mb-6">
          <div className="w-24 aspect-[5/7] flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-[var(--border)] relative bg-[var(--surface)]">
            {!mainImgLoaded && (
              <div className="absolute inset-0 bg-white/[0.03] overflow-hidden z-0">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
            )}
            {hanime.coverImage && (
              <img 
                src={hanime.coverImage} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${mainImgLoaded ? 'opacity-100' : 'opacity-0'}`} 
                alt={hanime.title} 
                referrerPolicy="no-referrer" 
                onLoad={() => setMainImgLoaded(true)}
              />
            )}
          </div>
          <div className="flex flex-col justify-start pt-1">
            <h1 
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-pink-100 to-rose-300 leading-tight mb-2"
              style={{ fontFamily: "'Manga', 'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive", letterSpacing: '0.5px' }}
            >
              {hanime.title}
            </h1>
            <div className="flex items-center gap-2 text-white mt-1.5">
              <Icons.Calendar size={16} className="shrink-0" />
              <span className="text-[13px] font-bold uppercase tracking-[0.08em] leading-none pt-[2px]">
                {hanime.assignedDate ? new Date(hanime.assignedDate).toLocaleDateString('en-CA') : 'No date'}
              </span>
              <span className="text-[var(--text-muted)] opacity-50 text-[12px] pt-[1px] ml-1">|</span>
              <span className={`text-[11px] font-black uppercase tracking-[0.15em] leading-none pt-[2px] ml-1 ${hanime.censorship === 'CENSORED' ? 'text-red-400' : 'text-green-400'}`}>
                {hanime.censorship || 'UNCENSORED'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-[var(--accent)] font-bold text-sm uppercase tracking-wider">Description</h2>
          <div className="relative">
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? "auto" : collapsedHeight }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => {
                if (!isExpanded) setIsClamped(true);
              }}
              className="overflow-hidden"
            >
              <p 
                ref={textRef}
                className={`text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap ${isClamped ? 'line-clamp-3' : ''}`}
              >
                {hanime.description || 'No description provided.'}
              </p>
            </motion.div>
            {showToggle && (
              <button 
                onClick={toggleExpand}
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--accent)] mt-2 opacity-70 hover:opacity-100 transition-opacity"
              >
                {isExpanded ? 'Show Less' : 'Read More'}
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <Icons.ChevronDown size={14} />
                </motion.div>
              </button>
            )}
          </div>
        </div>
        
        <div className="h-[1px] bg-[var(--border)] w-full mt-8" />
      </div>

      <div className="flex flex-col w-full gap-6 px-4">
        <EpisodeList episodes={hanime.episodes} />
      </div>
    </div>
  );
};
