import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Icons, THEME_CONFIGS } from '../constants';

interface ScrapedScene {
  title: string;
  actors: string[];
  coverUrl: string;
  tag: string;
  date?: string;
  releaseDate?: number;
  imported?: boolean;
}

export const Scraper: React.FC = () => {
  const { state, addLink, addActor, addStudio, addNotification } = useApp();
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedScenes, setScrapedScenes] = useState<ScrapedScene[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const themeColors = THEME_CONFIGS[state.settings.theme] || THEME_CONFIGS.Dark;
  const accentColor = state.settings.accentColor || '#fbca27';

  const handleScrape = async () => {
    if (!url) {
      addNotification("Please enter a valid page URL first!", "error");
      return;
    }

    setIsScraping(true);
    setScrapedScenes([]);

    try {
      let endpoint = '';
      if (url.includes('sexmex')) endpoint = '/api/scrape/sexmex';
      else if (url.includes('mylf')) endpoint = '/api/scrape/mylf';
      else if (url.includes('mypervyfamily')) endpoint = '/api/scrape/mypervyfamily';
      else if (url.includes('bangbros')) endpoint = '/api/scrape/bangbros';
      else if (url.includes('naughtyamerica')) endpoint = '/api/scrape/naughtyamerica';
      else if (url.includes('teamskeet')) endpoint = '/api/scrape/teamskeet';
      else if (url.includes('realitykings')) endpoint = '/api/scrape/realitykings';
      else {
        addNotification("Unsupported URL. Please enter a SexMex, Mylf, MyPervyFamily, BangBros, Naughty America, TeamSkeet, or RealityKings model URL.", "error");
        setIsScraping(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error(`Server request error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.scenes) {
        setScrapedScenes(data.scenes);
        addNotification(`Extracted ${data.scenes.length} scenes successfully!`, "success");
      } else {
        addNotification(data.error || "Failed to extract scenes from the page.", "error");
      }
    } catch (e: any) {
      console.error(e);
      addNotification(`Extraction error: ${e.message}`, "error");
    } finally {
      setIsScraping(false);
    }
  };

  const handleDownloadAllCovers = async () => {
    if (scrapedScenes.length === 0) return;
    setIsDownloading(true);
    addNotification("Starting covers download...", "info");

    let count = 0;
    for (const scene of scrapedScenes) {
      if (!scene.coverUrl) continue;
      try {
        const fileName = `${(scene.title || 'cover').replace(/[\\/*?:"<>|]/g, '').substring(0, 50)}.jpg`;
        const downloadUrl = `/api/proxy-image?url=${encodeURIComponent(scene.coverUrl)}&filename=${encodeURIComponent(fileName)}`;
        
        // Fetch as blob to bypass browser multi-download restrictions and set custom names reliably
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
        }
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const safeName = (scene.title || 'cover')
          .replace(/[\\/*?:"<>|]/g, '')
          .substring(0, 100);
        
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        count++;

        // Add a bit more delay to let the browser process the download
        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        console.error('Error downloading cover:', err);
      }
    }

    setIsDownloading(false);
    addNotification(`Processed ${count} covers for download!`, "success");
  };

  const handleImportScene = (scene: ScrapedScene, index: number) => {
    try {
      // 1. Find or create studio dynamically (from scene.tag, fallback to 'SexMex')
      const studioName = scene.tag || 'SexMex';
      let targetStudio = state.studios.find(
        (s) => s.name.toLowerCase() === studioName.toLowerCase() && !s.isDeleted
      );
      let studioId = targetStudio?.id;
      if (!studioId) {
        studioId = addStudio({ name: studioName, imageUrl: '', originalImageUrl: '' });
        
        const updatedStudio = state.studios.find((s) => s.name.toLowerCase() === studioName.toLowerCase());
        if (updatedStudio) studioId = updatedStudio.id;
      }

      // 2. Map actors (find or create)
      const actorIds: string[] = [];
      for (const actorName of scene.actors) {
        let existingActor = state.actors.find(
          (a) => a.name.toLowerCase() === actorName.toLowerCase() && !a.isDeleted
        );
        let actorId = existingActor?.id;
        if (!actorId) {
          actorId = addActor({ name: actorName, imageUrl: '', originalImageUrl: '' });
          
          const updatedActor = state.actors.find((a) => a.name.toLowerCase() === actorName.toLowerCase());
          if (updatedActor) actorId = updatedActor.id;
        }
        if (actorId && !actorIds.includes(actorId)) {
          actorIds.push(actorId);
        }
      }

      // 3. Add Link item with dynamic assigned date if extracted successfully
      addLink({
        title: scene.title,
        coverImage: scene.coverUrl,
        actorIds: actorIds,
        studioIds: studioId ? [studioId] : [],
        assignedDate: scene.releaseDate || Date.now(),
      });

      // 4. Update scene imported state locally
      setScrapedScenes((prev) =>
        prev.map((s, idx) => (idx === index ? { ...s, imported: true } : s))
      );

      addNotification(`Imported "${scene.title}" successfully!`, "success");
    } catch (e: any) {
      console.error(e);
      addNotification(`Import failed: ${e.message}`, "error");
    }
  };

  const handleImportAll = () => {
    const toImport = scrapedScenes.filter(s => !s.imported);
    if (toImport.length === 0) {
      addNotification("All scenes have already been imported!", "success");
      return;
    }

    let successCount = 0;
    try {
      // Local caches to prevent recreating duplicates in the same loop before React state updates
      const localStudios = new Map<string, string>();
      const localActors = new Map<string, string>();

      // Process each scene dynamically
      toImport.forEach((scene) => {
        const studioName = scene.tag || 'SexMex';
        const studioKey = studioName.toLowerCase();
        
        let studioId = state.studios.find(
          (s) => s.name.toLowerCase() === studioKey && !s.isDeleted
        )?.id || localStudios.get(studioKey);
        
        if (!studioId) {
          studioId = addStudio({ name: studioName, imageUrl: '', originalImageUrl: '' });
          localStudios.set(studioKey, studioId);
        }

        const actorIds: string[] = [];
        for (const actorName of scene.actors) {
          const actorKey = actorName.toLowerCase();
          
          let actorId = state.actors.find(
            (a) => a.name.toLowerCase() === actorKey && !a.isDeleted
          )?.id || localActors.get(actorKey);
          
          if (!actorId) {
            actorId = addActor({ name: actorName, imageUrl: '', originalImageUrl: '' });
            localActors.set(actorKey, actorId);
          }
          if (actorId && !actorIds.includes(actorId)) {
            actorIds.push(actorId);
          }
        }

        addLink({
          title: scene.title,
          coverImage: scene.coverUrl,
          actorIds: actorIds,
          studioIds: studioId ? [studioId] : [],
          assignedDate: scene.releaseDate || Date.now(),
        });
        
        successCount++;
      });

      // Mark all scenes as imported
      setScrapedScenes((prev) =>
        prev.map((s) => ({ ...s, imported: true }))
      );

      addNotification(`Successfully imported all (${successCount}) scenes in bulk!`, "success");
    } catch (e: any) {
      console.error(e);
      addNotification(`Bulk import failed: ${e.message}`, "error");
    }
  };

  return (
    <div className="w-full pb-10" style={{ color: themeColors.textPrimary }}>
      {/* Input controls - beautiful, professional matching style like Torbox field in Settings */}
      <div className="mb-6">
        <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--accent)] uppercase tracking-tight opacity-90" style={{ color: accentColor }}>
              Target Profile URL
            </span>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter SexMex, Mylf, MyPervyFamily, BangBros, Naughty America, TeamSkeet, or RealityKings URL..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
            />

            <div className="flex justify-end">
              <button
                onClick={handleScrape}
                disabled={isScraping}
                className="w-full sm:w-auto h-11 px-6 rounded-xl text-black font-extrabold transition-all flex items-center justify-center gap-2 select-none active:scale-95 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {isScraping ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span>Run Scraper</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results header / actions */}
      {scrapedScenes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Found <strong className="text-white font-extrabold" style={{ color: accentColor }}>{scrapedScenes.length}</strong> videos ready for cataloging</span>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2.5">
            {scrapedScenes.some(s => !s.imported) && (
              <button
                onClick={handleImportAll}
                className="w-full sm:w-auto px-5 h-11 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-black hover:opacity-90 active:scale-95 text-xs shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                <Icons.Plus size={16} />
                <span>Import All ({scrapedScenes.filter(s => !s.imported).length})</span>
              </button>
            )}

            <button
              onClick={handleDownloadAllCovers}
              disabled={isDownloading}
              className="w-full sm:w-auto px-5 h-11 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white active:scale-95 disabled:opacity-50 text-xs shrink-0"
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent" />
              ) : (
                <Icons.Download size={16} />
              )}
              <span>Download All Covers ({scrapedScenes.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Scraped list */}
      {scrapedScenes.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {scrapedScenes.map((scene, idx) => (
            <div
              key={idx}
              className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-3.5 flex gap-4 items-stretch relative overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-200 group/item shadow-sm"
            >
              {/* Cover view with widescreen 16:9 ratio */}
              <div className="aspect-video w-[130px] md:w-[170px] shrink-0 bg-black/40 rounded-xl overflow-hidden relative border border-[var(--border)] group">
                {scene.coverUrl ? (
                  <img
                    src={scene.coverUrl}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs opacity-40">No Cover</div>
                )}
                {/* Image Proxy Download Hover Action */}
                <a
                  href={`/api/proxy-image?url=${encodeURIComponent(scene.coverUrl)}&filename=${encodeURIComponent(`${(scene.title || 'cover').replace(/[\\/*?:"<>|]/g, '').substring(0, 50)}.jpg`)}`}
                  download={`${scene.title || 'cover'}.jpg`}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Icons.Download size={18} />
                </a>
              </div>

              {/* Detail fields in vertical stretch for clean spacing */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-center gap-2 mb-1.5">
                    <span
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider leading-none uppercase"
                      style={{ backgroundColor: `${accentColor}1c`, color: accentColor }}
                    >
                      {scene.tag || 'Scene'}
                    </span>
                    <span className="text-[10px] font-mono opacity-40">#{idx + 1}</span>
                  </div>

                  <h3 className="font-extrabold text-xs md:text-sm leading-snug line-clamp-2 text-white mb-2" title={scene.title}>
                    {scene.title}
                  </h3>

                  {/* Metadata display: Date and Actors */}
                  <div className="flex flex-col gap-1.5">
                    {scene.date && (
                      <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-medium">
                        <Icons.Calendar size={12} className="shrink-0 text-gray-500" />
                        <span>Released: {scene.date}</span>
                      </div>
                    )}

                    {/* Actors List */}
                    <div className="flex flex-wrap gap-1 leading-none">
                      {scene.actors.map((actor, aIdx) => (
                        <span
                          key={aIdx}
                          className="bg-white/5 border border-white/10 hover:border-[var(--accent)]/30 rounded-full px-2 py-0.5 text-[9px] font-semibold text-gray-300 transition-colors"
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clean inline borderless action bar */}
                <div className="flex justify-end items-center mt-2 pt-2 border-t border-[var(--border)]/40">
                  {scene.imported ? (
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs py-1">
                      <span>Imported</span>
                      <Icons.Check size={14} />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleImportScene(scene, idx)}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 bg-white/5 hover:bg-[var(--accent)]/15 hover:text-white border border-white/10 active:scale-95"
                    >
                      <span>Import</span>
                      <Icons.Plus size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isScraping && (
          <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-2">
            <div className="p-3 bg-white/5 rounded-full mb-1">
              <Icons.Scraper size={32} className="opacity-40" />
            </div>
            <span className="font-extrabold text-sm text-[var(--text-secondary)]">No data crawled yet</span>
            <span className="text-xs text-[var(--text-muted)] opacity-80 max-w-sm">
              Provide a valid SexMex, Mylf, MyPervyFamily, BangBros, Naughty America, TeamSkeet, or RealityKings model profile page link above and execute the scraper to pull media files and metadata.
            </span>
          </div>
        )
      )}
    </div>
  );
};
