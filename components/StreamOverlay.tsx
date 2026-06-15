import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import Artplayer from 'artplayer';
import { motion } from 'motion/react';

interface TorboxTorrent {
  id: number;
  hash: string;
  name: string;
  download_state: string;
  files: { id: number; name: string; size: number }[];
}

interface StreamOverlayProps {
  magnet: string;
  torboxApiKey?: string;
  realDebridApiKey?: string;
  itemTitle?: string;
  itemActors?: string[];
  itemTags?: string[];
  onClose: () => void;
}

export const isVideo = (name: string) => /\.(mp4|mkv|webm|avi|mov)$/i.test(name);

export const scoreFile = (name: string, itemTitle?: string, itemActors?: string[], itemTags?: string[]) => {
  let score = 0;
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  
  if (itemTitle) {
    const titleParts = itemTitle.toLowerCase().split(/[ \-]+/);
    titleParts.forEach(part => {
        if (part.length > 2 && normalizedName.includes(part.replace(/[^a-z0-9]/g, ' '))) score += 10;
    });
  }
  
  if (itemActors) {
    itemActors.forEach(actor => {
      const parts = actor.toLowerCase().split(/[ \-]+/);
      parts.forEach(part => {
        if (part.length > 2 && normalizedName.includes(part.replace(/[^a-z0-9]/g, ' '))) score += 15;
      });
    });
  }
  
  if (itemTags) {
     itemTags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        if (normalizedTag.length > 2 && normalizedName.includes(normalizedTag)) {
           score += 5;
        }
     });
  }
  
  return score;
};

export const getBestFile = (videoFiles: any[], itemTitle?: string, itemActors?: string[], itemTags?: string[]) => {
   if (!videoFiles || videoFiles.length === 0) return null;
   if (videoFiles.length === 1) return videoFiles[0];
   
   let maxScore = -1;
   let bestMatchFiles = [];
   
   for (const f of videoFiles) {
       const fileName = f.name || f.path || '';
       const score = scoreFile(fileName, itemTitle, itemActors, itemTags);
       if (score > maxScore) {
           maxScore = score;
           bestMatchFiles = [f];
       } else if (score === maxScore) {
           bestMatchFiles.push(f);
       }
   }
   
   // If no meaningful match, or tied, return the largest file among the top scorers
   return bestMatchFiles.sort((a, b) => (b.size || b.bytes || 0) - (a.size || a.bytes || 0))[0];
};

export const StreamOverlay: React.FC<StreamOverlayProps> = ({ 
  magnet, torboxApiKey, realDebridApiKey, 
  itemTitle, itemActors, itemTags,
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Starting stream...");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);

  const guessedQuality = React.useMemo(() => {
    const textToSearch = ((itemTitle || "") + " " + magnet).toLowerCase();
    const qualityMatch = textToSearch.match(/\b(2160p|4k|1080p|720p|480p)\b/i);
    if (qualityMatch) {
       let matched = qualityMatch[1].toUpperCase();
       if (matched === "4K") matched = "2160p";
       return matched;
    }
    return "Original";
  }, [itemTitle, magnet]);

  const handleOpenWith = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!streamUrl) return;

    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');

    if (isAndroid) {
      try {
        const urlObj = new URL(streamUrl);
        const scheme = urlObj.protocol.replace(':', '');
        const pathAndQuery = urlObj.host + urlObj.pathname + urlObj.search;
        const intentUrl = `intent://${pathAndQuery}#Intent;scheme=${scheme};type=video/*;action=android.intent.action.VIEW;end;`;
        window.location.href = intentUrl;
        return;
      } catch (err) {
        console.error("URL formatting error", err);
      }
    }
    
    // Fallback for iOS or desktop
    window.open(streamUrl, '_blank');
  };

  const handleCopy = async () => {

    if (!streamUrl) return;
    try {
      await navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let player: Artplayer | null = null;
    let wrapperDiv: HTMLDivElement | null = null;

    if (streamUrl && containerRef.current) {
      wrapperDiv = document.createElement('div');
      wrapperDiv.style.width = '100%';
      wrapperDiv.style.height = '100%';
      containerRef.current.appendChild(wrapperDiv);
      
      try {
        player = new Artplayer({
          container: wrapperDiv,
          url: streamUrl,
          // @ts-ignore
          title: 'Torbox Stream',
          volume: 1,
          autoplay: true,
          pip: false,
          autoSize: true,
          autoMini: true,
          screenshot: true,
          setting: false,
          loop: false,
          flip: false,
          playbackRate: false,
          aspectRatio: false,
          fullscreen: true,
          fullscreenWeb: false,
          subtitleOffset: false,
          miniProgressBar: true,
          mutex: true,
          backdrop: true,
          playsInline: true,
          autoPlayback: true,
          airplay: true,
          theme: '#3b82f6',
          // @ts-ignore
          controls: [
            {
              name: 'copy-link',
              position: 'right',
              index: 44,
              html: `
                <div class="art-control-copy">
                  <div class="copy-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div class="check-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              `,
              tooltip: 'Copy Stream Link',
              click: function (art: any, event: any) {
                if (streamUrl) {
                  navigator.clipboard.writeText(streamUrl).then(() => {
                    const btn = (art && art.template && art.template.$player)
                      ? art.template.$player.querySelector('.art-control-copy')
                      : document.querySelector('.art-control-copy');
                    if (btn) {
                      btn.classList.add('copied');
                      setTimeout(() => {
                        if (btn) btn.classList.remove('copied');
                      }, 2000);
                    }
                  }).catch(err => {
                    console.error("Clipboard copy error:", err);
                  });
                }
              }
            },
            {
              name: 'open-external',
              position: 'right',
              index: 45,
              html: `
                <div class="art-control-open">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              `,
              tooltip: 'Open with External Player',
              click: function (art: any, event: any) {
                if (!streamUrl) return;
                const ua = navigator.userAgent.toLowerCase();
                const isAndroid = ua.includes('android');

                if (isAndroid) {
                  try {
                    const urlObj = new URL(streamUrl);
                    const scheme = urlObj.protocol.replace(':', '');
                    const pathAndQuery = urlObj.host + urlObj.pathname + urlObj.search;
                    const intentUrl = `intent://${pathAndQuery}#Intent;scheme=${scheme};type=video/*;action=android.intent.action.VIEW;end;`;
                    window.location.href = intentUrl;
                    return;
                  } catch (err) {
                    console.error("URL formatting error", err);
                  }
                }
                
                // Fallback for iOS or desktop
                window.open(streamUrl, '_blank');
              }
            }
          ],
        });
        playerRef.current = player;

        player.on('control', (state: boolean) => {
          setShowControls(state);
        });

        player.on('error', (err: any) => {
          console.error("Artplayer streaming error:", err);
          setError("Unable to play the video via built-in player automatically. The video format (like MKV) or audio codec might be unsupported over HTTP. Please copy the link and play it in VLC.");
        });
      } catch (e) {
        console.error("Error initializing Artplayer", e);
      }
    }

    return () => {
      if (player) {
        try {
          player.destroy(false);
        } catch(e) {}
        playerRef.current = null;
      }
      if (wrapperDiv && containerRef.current) {
        try {
          containerRef.current.removeChild(wrapperDiv);
        } catch(e) {}
      }
    };
  }, [streamUrl]);

  useEffect(() => {
    // Safety timeout for fetch
    const fetchWithTimeout = async (resource: string, options: any = {}) => {
      const { timeout = 15000 } = options;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(resource, {
          ...options,
          signal: controller.signal  
        });
        clearTimeout(id);
        return response;
      } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
          throw new Error("Request timed out. Please check your internet connection.");
        }
        if (err.message === 'Failed to fetch') {
          throw new Error("Network Error: Failed to fetch. Please check if your API keys are correct, or if an AdBlocker is interfering.");
        }
        throw err;
      }
    };

    const resolveStream = async () => {
      try {
        if (!torboxApiKey?.trim() && !realDebridApiKey?.trim()) {
          throw new Error("No API Key provided. Please set Torbox or Real Debrid API Key in Settings.");
        }

        const magnetHashMatch = magnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
        const hash = magnetHashMatch ? magnetHashMatch[1].toLowerCase() : null;
        if (!hash) {
          throw new Error("Invalid Magnet Link.");
        }

        setStatusText("Searching in Cache...");

        // Race the caching checks
        const checkPromises = [];

        if (torboxApiKey) {
          checkPromises.push(
            (async () => {
              try {
                const res = await fetchWithTimeout(`/api/torbox/torrents/checkcached?hash=${hash}&format=list`, {
                  headers: { Authorization: `Bearer ${torboxApiKey}` },
                  timeout: 5000
                });
                const data = await res.json();
                if (data.success && data.data && data.data.length > 0) return { provider: 'torbox' };
              } catch(e) {}
              return null;
            })()
          );
        }

        if (realDebridApiKey) {
          checkPromises.push(
            (async () => {
              try {
                const res = await fetchWithTimeout(`/api/rd/torrents/instantAvailability/${hash}`, {
                  headers: { Authorization: `Bearer ${realDebridApiKey}` },
                  timeout: 5000
                });
                const data = await res.json();
                if (data && data[hash] && data[hash].rd && data[hash].rd.length > 0) return { provider: 'rd' };
              } catch(e) {}
              return null;
            })()
          );
        }

        const results = await Promise.all(checkPromises);
        const cachedProvider = results.find(r => r !== null)?.provider;

        // Priority: Cached provider -> Real Debrid (if configured) -> Torbox
        const providerToUse = cachedProvider || (realDebridApiKey ? 'rd' : 'torbox');

        if (providerToUse === 'torbox') {
          setStatusText("Adding to Torbox...");
          const formData = new FormData();
          formData.append("magnet", magnet);
          const createRes = await fetchWithTimeout("/api/torbox/torrents/createtorrent", {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${torboxApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ magnet, seed: 1, allow_zip: false })
          });
          
          let createData = await createRes.json().catch(() => null);
          
          if (!createRes.ok || !createData?.success) {
            const formRes = await fetchWithTimeout("/api/torbox/torrents/createtorrent", {
              method: "POST",
              headers: { "Authorization": `Bearer ${torboxApiKey}` },
              body: formData
            });
            const formResData = await formRes.json().catch(() => null);
            if (!formRes.ok || !formResData?.success) {
              const errDetail = typeof formResData?.detail === 'string' ? formResData.detail : formResData?.detail ? JSON.stringify(formResData.detail) : null;
              const fallbackMsg = formRes.status === 429 ? "Rate limit exceeded (Too many requests/torrents)." 
                : formRes.status === 401 ? "Unauthorized. Check API Key." 
                : formRes.status === 403 ? "Forbidden. You may have hit your plan limit."
                : `Error ${formRes.status}: Failed to add magnet to Torbox.`;
              throw new Error(errDetail || formResData?.error || fallbackMsg);
            }
            createData = formResData;
          }

          const torrentId = createData.data?.torrent_id;
          const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
          
          setStatusText("Waiting for file readiness (Torbox)...");
          let isPolling = true;
          let delay = 1000;

          while (isPolling) {
             try {
               const listRes = await fetchWithTimeout("/api/torbox/torrents/mylist?bypass_cache=true", {
                 headers: { "Authorization": `Bearer ${torboxApiKey}` }
               });
               const listData = await listRes.json();
               if (!listRes.ok || !listData?.success) {
                  const errDetail = typeof listData?.detail === 'string' ? listData.detail : JSON.stringify(listData?.detail);
                  throw new Error(errDetail || "Failed to fetch Torbox list.");
               }
               
               let torrent = listData.data?.find((t: any) => {
                 const tHash = (t.hash || t.info_hash || t.torrent_hash || '').toLowerCase();
                 const targetHash = hash ? hash.toLowerCase() : '';
                 const tId = t.id !== undefined && t.id !== null ? String(t.id) : '';
                 const targetIdStr = torrentId !== undefined && torrentId !== null ? String(torrentId) : '';
                 
                 return (targetHash && tHash === targetHash) || (targetIdStr && tId === targetIdStr);
               });
               if (!torrent && createData?.data?.name) {
                 torrent = listData.data?.find((t: any) => t.name === createData.data.name);
               }
               
               if (torrent) {
                 if (torrent.download_state === "finished" || torrent.download_state === "cached" || torrent.download_state === "completed") {
                   isPolling = false;
                   setStatusText("Fetching video link...");
                   
                   let bestFile = null;
                   if (torrent.files && torrent.files.length > 0) {
                      const videoFiles = torrent.files.filter((f: any) => isVideo(f.name));
                      if (videoFiles.length > 0) {
                        bestFile = getBestFile(videoFiles, itemTitle, itemActors, itemTags);
                      } else {
                        bestFile = torrent.files[0];
                      }
                   }
                   const fileId = bestFile ? bestFile.id : 1; 

                   let dlData;
                   let reqDlRes;
                   try {
                     reqDlRes = await fetchWithTimeout(`/api/torbox-dl?token=${torboxApiKey}&torrent_id=${torrent.id}&file_id=${fileId}`);
                     dlData = await reqDlRes.json().catch(() => null);
                   } catch (e: any) {
                     console.error("GET requestdl error", e);
                   }
                   
                   if (!reqDlRes || !reqDlRes.ok || !dlData?.success || !dlData?.data) {
                     const getErrorDetail = typeof dlData?.detail === 'string' ? dlData.detail : (dlData?.detail ? JSON.stringify(dlData.detail) : "Unknown GET error");
                     console.error("GET requestdl failed with:", getErrorDetail, dlData);
                     throw new Error(getErrorDetail || "Failed to request torbox link");
                   }

                   if (dlData?.data) {
                      setStreamUrl(dlData.data);
                      setLoading(false);
                   } else {
                      throw new Error("No URL returned from torbox");
                   }
                 } else if (["download_error", "error", "failed"].includes(torrent.download_state)) {
                   isPolling = false;
                   throw new Error(`Failed to download on Torbox (Status: ${torrent.download_state})`);
                 } else {
                   setStatusText(`Downloading... (${torrent.download_state})`);
                   delay = Math.min(3000, delay + 500);
                 }
               }
             } catch (pollErr: any) {
               if (pollErr.message && pollErr.message.includes("Request timed out")) {
                   console.warn("Torbox Polling timed out, retrying...");
               } else {
                   console.error("Torbox Polling error", pollErr);
               }
               if (pollErr.name === 'AbortError') break;
               
               if (pollErr.message && pollErr.message.includes("Request timed out")) {
                   setStatusText("Polling timed out, retrying...");
               } else {
                   isPolling = false;
                   setError(pollErr.message || "Failed to poll Torbox");
                   setLoading(false);
               }
             }
             if (isPolling) await sleep(delay);
          }

        } else if (providerToUse === 'rd') {
           setStatusText("Adding to Real Debrid...");
           const rdForm = new URLSearchParams();
           rdForm.append("magnet", magnet);
           const addRes = await fetchWithTimeout("/api/rd/torrents/addMagnet", {
             method: "POST",
             headers: { 
                 Authorization: `Bearer ${realDebridApiKey}`,
                 "Content-Type": "application/x-www-form-urlencoded"
             },
             body: rdForm
           });
           const addData = await addRes.json();
           if (!addRes.ok || !addData.id) {
               const errorMsg = typeof addData.error === 'string' ? addData.error : JSON.stringify(addData.error);
               throw new Error(errorMsg || "Failed to add magnet to Real Debrid");
           }
           const torrentId = addData.id;
           
           setStatusText("Waiting for file readiness (Real Debrid)...");
           let isPolling = true;
           let delay = 1000;

           while (isPolling) {
              try {
                 const infoRes = await fetchWithTimeout(`/api/rd/torrents/info/${torrentId}`, {
                    headers: { Authorization: `Bearer ${realDebridApiKey}` }
                 });
                 const infoData = await infoRes.json();
                 
                 if (infoData.status === "waiting_files_selection") {
                     const videoFiles = infoData.files.filter((f: any) => isVideo(f.path));
                     let bestFile = null;
                     if (videoFiles.length > 0) {
                         bestFile = getBestFile(videoFiles, itemTitle, itemActors, itemTags);
                     } else {
                         bestFile = infoData.files[0];
                     }
                     const filesToSelect = bestFile ? bestFile.id.toString() : "all";
                     
                     const selForm = new URLSearchParams();
                     selForm.append("files", filesToSelect);
                     await fetchWithTimeout(`/api/rd/torrents/selectFiles/${torrentId}`, {
                         method: "POST",
                         headers: { 
                             Authorization: `Bearer ${realDebridApiKey}`,
                             "Content-Type": "application/x-www-form-urlencoded"
                         },
                         body: selForm
                     });
                     delay = 500;
                 } else if (infoData.status === "downloaded") {
                     isPolling = false;
                     setStatusText("Generating streaming link...");
                     
                     const link = infoData.links[0]; 
                     if (!link) throw new Error("No download links available from Real Debrid");

                     const unrestrictForm = new URLSearchParams();
                     unrestrictForm.append("link", link);
                     const unres = await fetchWithTimeout(`/api/rd/unrestrict/link`, {
                         method: "POST",
                         headers: { 
                             Authorization: `Bearer ${realDebridApiKey}`,
                             "Content-Type": "application/x-www-form-urlencoded"
                         },
                         body: unrestrictForm
                     });
                     const unresData = await unres.json();
                     if (unresData.download) {
                         setStreamUrl(unresData.download);
                         setLoading(false);
                     } else {
                         throw new Error("Could not Unrestrict link in Real Debrid");
                     }
                 } else if (["magnet_error", "virus", "error", "dead"].includes(infoData.status)) {
                     isPolling = false;
                     throw new Error(`Failed to download on Real Debrid (Status: ${infoData.status})`);
                 } else {
                     setStatusText(`Downloading... (${infoData.status})`);
                     delay = Math.min(3000, delay + 500);
                 }
              } catch(pollErr: any) {
                  if (pollErr.message && pollErr.message.includes("Request timed out")) {
                      console.warn("RD Polling timed out, retrying...");
                  } else {
                      console.error("RD Polling error", pollErr);
                  }
                  if (pollErr.name === 'AbortError') break;
                  
                  if (pollErr.message && pollErr.message.includes("Request timed out")) {
                      // It's a timeout, just log and let it retry next tick
                      setStatusText("Polling timed out, retrying...");
                  } else {
                      isPolling = false;
                      setError(pollErr.message || "Failed to poll Real Debrid");
                      setLoading(false);
                  }
              }
              if (isPolling) {
                 const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
                 await sleep(delay);
              }
           }
        }

      } catch (err: any) {
         setError(err.message || "An unknown error occurred");
         setLoading(false);
      }
    };

    resolveStream();
  }, [magnet, torboxApiKey, realDebridApiKey]);

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute inset-0 z-[50] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <style>{`
        /* Custom Artplayer UI styling for popup menus */
        .artplayer-app {
          background-color: var(--bg) !important;
        }
        .art-video-player {
          background-color: transparent !important;
        }
        .art-selector-list {
           background: rgba(20, 20, 20, 0.9) !important;
           backdrop-filter: blur(8px) !important;
           border-radius: 8px !important;
           border: 1px solid rgba(255,255,255,0.1) !important;
           box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
           animation: art-scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
           transform-origin: bottom center;
           padding: 4px !important;
        }
        .art-selector-list .art-selector-item {
           border-radius: 6px !important;
           margin: 2px !important;
           transition: background 0.2s;
           font-weight: 500 !important;
           font-size: 13px !important;
        }
        .art-selector-list .art-selector-item:hover {
           background: rgba(255,255,255,0.15) !important;
           color: white !important;
        }
        @keyframes art-scale-up {
           0% { transform: scale(0.95) translateY(10px); opacity: 0; }
           100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Copied copy-link and open-external control custom styles */
        .art-control-copy {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 100%;
          cursor: pointer;
        }
        /* Override Artplayer's global styling rules that force fills on control bar SVGs */
        .art-control-copy svg,
        .art-control-open svg,
        .art-control-copy svg *,
        .art-control-open svg * {
          fill: none !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        }
        .art-control-copy .copy-icon svg,
        .art-control-open svg {
          stroke: currentColor !important;
        }
        .art-control-copy .check-icon svg {
          stroke: #10b981 !important;
        }
        .art-control-copy .copy-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .art-control-copy .check-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.5);
          opacity: 0;
          pointer-events: none;
        }
        .art-control-copy.copied .copy-icon {
          transform: scale(0.3) rotate(90deg);
          opacity: 0;
        }
        .art-control-copy.copied .check-icon {
          transform: scale(1);
          opacity: 1;
        }
        .art-control-open {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 100%;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .art-control-open:active {
          transform: scale(0.85);
        }
      `}</style>

      <div className={`absolute top-4 right-4 z-[60] transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors duration-300"
          title="Close Player"
        >
          <Icons.X size={20} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 text-white max-w-[80%] text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shadow-[0_0_10px_var(--accent)]" />
          <div className="text-xs font-medium tracking-wide animate-pulse">{statusText}</div>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-4 bg-neutral-900/90 border border-white/10 p-6 rounded-2xl max-w-[90%] md:max-w-md text-center shadow-2xl text-white">
          <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <Icons.AlertTriangle size={24} />
          </div>
          <div className="font-bold text-[15px] text-rose-400">Stream playback failed</div>
          <p className="text-[12px] text-gray-300 leading-relaxed">{error}</p>
          
          {streamUrl && (
            <div className="w-full mt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/5"
              >
                {copied ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-emerald-400 flex items-center gap-2 justify-center">
                    <Icons.Check />
                    <span>Stream link copied successfully!</span>
                  </motion.div>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                    <span>Copy stream link for VLC</span>
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      )}

      {streamUrl && !loading && !error && (
        <div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center [&>.artplayer-app]:w-full [&>.artplayer-app]:h-full"
        >
        </div>
      )}
    </div>
  );
};
