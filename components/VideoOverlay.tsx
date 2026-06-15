import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../constants';
import Artplayer from 'artplayer';
import * as dashjs from 'dashjs';

interface VideoOverlayProps {
  url: string | { url: string, qualities?: any[], subtitles?: any[] };
  title?: string;
  onClose: () => void;
  accentColor?: string;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({ url, title, onClose, accentColor = '#3b82f6' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showControls, setShowControls] = React.useState(true);

  const actualUrl = typeof url === 'string' ? url : url.url;
  const qualities = typeof url === 'string' ? undefined : url.qualities;
  const subtitles = typeof url === 'string' ? undefined : url.subtitles;

  const pixeldrainIdMatch = actualUrl.match(/pixeldrain\.com\/(?:api\/file|u)\/([a-zA-Z0-9]+)/);
  const pixeldrainId = pixeldrainIdMatch ? pixeldrainIdMatch[1] : null;
  const isHstream = actualUrl.includes('imoto-str') || actualUrl.includes('.mpd');
  const originalUrl = pixeldrainId ? `https://pixeldrain.com/u/${pixeldrainId}` : actualUrl;
  const providerName = pixeldrainId ? 'Pixeldrain' : isHstream ? 'Hstream' : 'المتصفح';

  useEffect(() => {
    let player: Artplayer | null = null;
    let wrapperDiv: HTMLDivElement | null = null;

    if (actualUrl && containerRef.current) {
      wrapperDiv = document.createElement('div');
      wrapperDiv.style.width = '100%';
      wrapperDiv.style.height = '100%';
      containerRef.current.appendChild(wrapperDiv);

      const customType = isHstream ? {
         mpd: function (video: any, link: string, p: any) {
             if (p.dash) {
                 try { p.dash.reset(); p.dash.destroy(); } catch(e) {}
             }
             const dash = dashjs.MediaPlayer().create();
             p.dash = dash;
             dash.updateSettings({
                 streaming: {
                     delay: {
                         liveDelay: 5
                     }
                 }
             });
             dash.initialize(video, link, false); // autoplay false on init, Artplayer handles play
             dash.on('error', (e: any) => {
                 console.error('Dash error', e); 
                 p.emit('error', e);
             });
         }
      } : undefined;
      
      const typeStr = isHstream ? 'mpd' : 'mp4';
      
      const defaultSub = subtitles && subtitles.length > 0 ? (subtitles.find((s: any) => s.default) || subtitles[0]) : null;
      
      let customSettings: any[] = [];
      if (qualities && qualities.length > 0) {
          customSettings.push({
              html: 'الجودة',
              selector: qualities.map((q: any) => ({
                  html: q.html,
                  url: q.url,
                  default: q.url === actualUrl || q.default
              })),
              onSelect: function(item: any, $dom: any, event: any) {
                  player?.switchQuality(item.url);
                  return item.html;
              }
          });
      }

      if (subtitles && subtitles.length > 0) {
          customSettings.push({
              html: 'الترجمة',
              selector: subtitles.map((s: any) => ({
                  html: s.html,
                  url: s.url,
                  default: s.default
              })),
              onSelect: function (item: any) {
                  player?.subtitle.switch(item.url, {
                      name: item.html,
                  });
                  return item.html;
              },
          });
      }

      try {
        player = new Artplayer({
          container: wrapperDiv,
          url: actualUrl,
          type: typeStr,
          customType: customType,
          title: title || 'Video Player',
          volume: 1,
          autoplay: true,
          pip: true,
          autoSize: true,
          autoMini: true,
          setting: true,
          settings: customSettings.length > 0 ? customSettings : undefined,
          loop: false,
          flip: true,
          playbackRate: true,
          aspectRatio: true,
          fullscreen: true,
          fullscreenWeb: true,
          subtitleOffset: true,
          miniProgressBar: true,
          mutex: true,
          backdrop: true,
          playsInline: true,
          autoPlayback: true,
          airplay: true,
          theme: accentColor,
          subtitle: defaultSub ? {
              url: defaultSub.url,
              type: 'vtt',
              style: {
                  color: '#fff',
                  fontSize: '24px',
                  textShadow: '0 0 5px #000',
              },
          } : undefined,
          moreVideoAttr: {
            crossOrigin: 'anonymous',
            // @ts-ignore
            controlsList: 'nodownload',
          },
        });
        playerRef.current = player;

        player.on('error', (err: any) => {
          console.error('Artplayer error:', err?.message || err?.type || String(err));
          setError('تعذر تشغيل الفيديو عبر المشغل المدمج. يمكنك محاولة فتحه في نافذة جديدة.');
        });

        player.on('control', (state: boolean) => {
          setShowControls(state);
        });
      } catch (e) {
        console.error("Error initializing Artplayer", e);
      }
    }

    return () => {
      if (player) {
        try {
          if ((player as any).dash) {
            (player as any).dash.reset();
            (player as any).dash.destroy();
          }
          player.destroy(false);
        } catch (e) {
          console.error("Error destroying artplayer", e);
        }
        playerRef.current = null;
      }
      if (wrapperDiv && containerRef.current) {
        try {
          containerRef.current.removeChild(wrapperDiv);
        } catch(e) {}
      }
    };
  }, [actualUrl, title, accentColor, JSON.stringify(qualities), JSON.stringify(subtitles), isHstream]);

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute inset-0 z-[150] flex flex-col items-center justify-center backdrop-blur-md overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <style>{`
        .artplayer-app {
          background-color: var(--bg) !important;
        }
        .art-video-player {
          background-color: transparent !important;
        }
      `}</style>
      <div className={`absolute top-4 left-4 z-[160] flex items-center gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors shadow"
          title="Close Player"
        >
          <Icons.X size={22} />
        </button>
        <a 
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xs font-semibold transition-colors shadow gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Icons.ExternalLink size={14} />
          فتح الرابط الأصلي
        </a>
      </div>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
        {error ? (
          <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl max-w-md mx-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icons.AlertTriangle className="text-red-500" size={32} />
            </div>
            <p className="text-white text-lg font-medium mb-6 leading-relaxed">{error}</p>
            <a 
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-white/90 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              <Icons.ExternalLink size={20} />
              مشاهدة على {providerName}
            </a>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="w-full h-full [&>.artplayer-app]:w-full [&>.artplayer-app]:h-full"
          />
        )}
      </div>
    </div>
  );
};

