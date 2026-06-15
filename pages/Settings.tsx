
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, SettingsView } from '../AppContext';
import { Icons } from '../constants';
import { ThemeMode, DisplaySize, ManagementView, LinkItem } from '../types';


const TelegramGroup: React.FC<{ children?: React.ReactNode; title?: string }> = ({ children, title }) => (
  <div className="mb-6">
    {title && (
      <h2 className="px-5 mb-2 text-[13px] font-semibold text-[var(--accent)] uppercase tracking-tight opacity-90">
        {title}
      </h2>
    )}
    <div className="bg-[var(--surface)] overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
      {children}
    </div>
  </div>
);

const TelegramItem: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  isDestructive?: boolean;
}> = ({ icon, iconBg, title, description, rightElement, onClick, isDestructive }) => (
  <div
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-[var(--text-primary)]/[0.05] transition-colors text-left border-b border-[var(--border)] last:border-none outline-none tap-highlight-none ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
      style={{ backgroundColor: iconBg }}
    >
      <div className="w-5 h-5 text-white flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-[15px] font-medium leading-tight truncate ${isDestructive ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
        {title}
      </div>
      {description && (
        <div className={`text-[13px] mt-0.5 truncate opacity-60 ${isDestructive ? 'text-rose-500/80' : 'text-[var(--text-muted)]'}`}>
          {description}
        </div>
      )}
    </div>
    <div className="shrink-0 flex items-center gap-2">
      {rightElement}
      {!rightElement && <div className="opacity-20"><Icons.ChevronRight /></div>}
    </div>
  </div>
);

const TelegramSelectionItem: React.FC<{
  label: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className="w-full flex items-center justify-between px-5 py-4 active:bg-[var(--text-primary)]/[0.05] transition-colors border-b border-[var(--border)] last:border-none outline-none tap-highlight-none cursor-pointer"
  >
    <span className={`text-[15px] transition-colors duration-200 ${isSelected ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-primary)] font-medium opacity-90'}`}>
      {label}
    </span>
    {isSelected && (
      <div className="text-[var(--accent)] flex items-center justify-center animate-slide-forward">
        <Icons.Check />
      </div>
    )}
  </div>
);

const Toggle: React.FC<{ 
  isActive: boolean; 
  onToggle: () => void 
}> = ({ isActive, onToggle }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 cursor-pointer ${isActive ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
  >
    <div 
      className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${isActive ? 'translate-x-6' : 'translate-x-0'}`} 
    />
  </div>
);

const VIEW_LEVELS: Record<string, number> = {
  'main': 0,
  'theme': 1,
  'header': 1,
  'cover': 1,
  'display': 1,
  'integrations': 1,
  'data': 1,
  'statistics': 1,
  'statistics-detail': 2
};

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    state, updateSettings, 
    importData, runSystemCheck, 
    settingsView, setSettingsView,
    addNotification
  } = useApp();
  const { settings } = state;
  const [transitionDir, setTransitionDir] = useState<'forward' | 'backward'>('forward');
  const prevViewRef = React.useRef<SettingsView>('main');

  const statDetailConfig = (location.state as any)?.statDetailConfig || null;

  const navigateTo = useCallback((view: SettingsView, extraState?: any) => {
    setTransitionDir('forward');
    navigate('/settings', { state: { settingsView: view, ...extraState } });
  }, [navigate]);

  useEffect(() => {
    const prevLevel = VIEW_LEVELS[prevViewRef.current] || 0;
    const currentLevel = VIEW_LEVELS[settingsView] || 0;
    if (currentLevel < prevLevel) {
      setTransitionDir('backward');
    } else if (currentLevel > prevLevel) {
      setTransitionDir('forward');
    }
    prevViewRef.current = settingsView;
  }, [settingsView]);

  const animationClass = transitionDir === 'forward' ? 'animate-slide-forward' : 'animate-slide-backward';

  const themes: ThemeMode[] = ['Dark', 'Grey', 'Amoled', 'Blue', 'Light'];
  const pageSizes = [10, 20, 30, 50];
  const accentColors = ['#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#f97316'];
  const strongAccentColors = ['#2563eb', '#9333ea', '#db2777', '#dc2626', '#16a34a', '#d97706', '#0891b2', '#ea580c'];
  const circleColors = ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080', '#606060', '#404040', '#000000'];

  const renderContent = () => {
    switch (settingsView) {
      case 'main':
        return (
          <>
            <TelegramGroup title="General">
              <TelegramItem 
                icon={<Icons.Palette />} iconBg="#3b82f6"
                title="Appearance" description="Themes and accent colors"
                onClick={() => navigateTo('theme')}
              />
              <TelegramItem 
                icon={<Icons.Eye />} iconBg="#ec4899"
                title="Content Display" description="Blur and button styles"
                onClick={() => navigateTo('cover')}
              />
              <TelegramItem 
                icon={<Icons.Type />} iconBg="#94a3b8"
                title="Display Options" description="Text scaling and page limits"
                onClick={() => navigateTo('display')}
              />
              <TelegramItem 
                icon={<Icons.Radio />} iconBg="#8b5cf6"
                title="Debrid Services" description="Torbox API and other external services"
                onClick={() => navigateTo('integrations')}
              />
            </TelegramGroup>

            <TelegramGroup title="Database & Storage">
              <TelegramItem 
                icon={<Icons.DataIcon />} iconBg="#22c55e"
                title="Data Management" description="Backup and recovery"
                onClick={() => navigateTo('data')}
              />
              <TelegramItem 
                icon={<Icons.ChartIcon />} iconBg="#f59e0b"
                title="Statistics" description="Image usage and storage stats"
                onClick={() => navigateTo('statistics')}
              />
            </TelegramGroup>
          </>
        );

      case 'theme':
        return (
          <>
            <TelegramGroup title="Color Theme">
              {themes.map(t => (
                <TelegramSelectionItem key={t} label={t} isSelected={settings.theme === t} onClick={() => updateSettings({ theme: t })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Accent Color">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {strongAccentColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ accentColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.accentColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
                      />
                      {settings.accentColor === color && <div className="text-white scale-[0.5] drop-shadow-md"><Icons.Check /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Circle Colour">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {circleColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ circleBorderColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0 border border-white/10"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.circleBorderColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ 
                          borderColor: ['#ffffff', '#e0e0e0', '#c0c0c0'].includes(color) ? '#a3a3a3' : (color === '#000000' ? '#525252' : color), 
                          boxShadow: !['#ffffff', '#e0e0e0', '#c0c0c0', '#000000'].includes(color) ? `0 0 8px ${color}40` : 'none' 
                        }}
                      />
                      {settings.circleBorderColor === color && (
                        <div className={`scale-[0.5] drop-shadow-md ${['#ffffff', '#e0e0e0'].includes(color) ? 'text-black' : 'text-white'}`}>
                          <Icons.Check />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Button Colour">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {strongAccentColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ buttonColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.buttonColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
                      />
                      {settings.buttonColor === color && <div className="text-white scale-[0.5] drop-shadow-md"><Icons.Check /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>
          </>
        );

      case 'cover':
        return (
          <>
            <TelegramGroup title="Card Visuals">
              <div className="px-5 py-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[14px] font-medium">Blur Intensity</span>
                  <span id="blur-intensity-preview" className="text-[13px] font-bold text-[var(--accent)]">{settings.blurIntensity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  defaultValue={settings.blurIntensity} 
                  onChange={(e) => {
                    const val = String(e.target.value);
                    const previewEl = document.getElementById('blur-intensity-preview');
                    if (previewEl) previewEl.textContent = val + '%';
                  }}
                  onMouseUp={(e) => updateSettings({ blurIntensity: parseInt((e.target as HTMLInputElement).value) })}
                  onTouchEnd={(e) => updateSettings({ blurIntensity: parseInt((e.target as HTMLInputElement).value) })}
                  className="w-full accent-[var(--accent)] h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]"
                />
              </div>
            </TelegramGroup>

            <TelegramGroup title="Privacy">
              <TelegramItem 
                icon={<Icons.Eye />} iconBg="#ec4899"
                title="Blur Image Covers" description="Apply blur to all image covers"
                rightElement={<Toggle isActive={settings.blurCovers} onToggle={() => updateSettings({ blurCovers: !settings.blurCovers })} />}
              />
            </TelegramGroup>

            <TelegramGroup title="Actor Name Color">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {strongAccentColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ actorNameColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.actorNameColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
                      />
                      {settings.actorNameColor === color && <div className="text-white scale-[0.5] drop-shadow-md"><Icons.Check /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Button Style">
              <TelegramSelectionItem label="Glass (Minimal)" isSelected={settings.buttonStyle === 'Glass'} onClick={() => updateSettings({ buttonStyle: 'Glass' })} />
              <TelegramSelectionItem label="Vibrant Colors" isSelected={settings.buttonStyle === 'ColorGlass'} onClick={() => updateSettings({ buttonStyle: 'ColorGlass' })} />
              <TelegramSelectionItem label="Solid Colors" isSelected={settings.buttonStyle === 'SolidColors'} onClick={() => updateSettings({ buttonStyle: 'SolidColors' })} />
            </TelegramGroup>
          </>
        );

      case 'display':
        return (
          <>
            <TelegramGroup title="Actors Studios View">
              {(['List', 'Card'] as ManagementView[]).map(v => (
                <TelegramSelectionItem key={v} label={v} isSelected={settings.managementView === v} onClick={() => updateSettings({ managementView: v })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Visibility & Preview">
              <TelegramItem 
                icon={<Icons.Check />} iconBg="#3b82f6"
                title="Actor Checkmark" description="Show verification icon"
                rightElement={<Toggle isActive={settings.showActorCheckmark} onToggle={() => updateSettings({ showActorCheckmark: !settings.showActorCheckmark })} />}
              />
              <TelegramItem 
                icon={<Icons.GalleryIcon />} iconBg="#10b981"
                title="Gallery Cover Preview" description="Allow slide preview on stationary"
                rightElement={<Toggle isActive={settings.enableGalleryPreview} onToggle={() => updateSettings({ enableGalleryPreview: !settings.enableGalleryPreview })} />}
              />
            </TelegramGroup>

            <TelegramGroup title="Title Scaling">
              {(['Small', 'Medium', 'Large'] as DisplaySize[]).map(s => (
                <TelegramSelectionItem key={s} label={s} isSelected={settings.titleSize === s} onClick={() => updateSettings({ titleSize: s })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Metadata Scaling">
              {(['Small', 'Medium', 'Large'] as DisplaySize[]).map(s => (
                <TelegramSelectionItem key={s} label={s} isSelected={settings.metadataSize === s} onClick={() => updateSettings({ metadataSize: s })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Pagination">
              {pageSizes.map(ps => (
                <TelegramSelectionItem key={ps} label={`${ps} items per page`} isSelected={settings.itemsPerPage === ps} onClick={() => updateSettings({ itemsPerPage: ps })} />
              ))}
            </TelegramGroup>
          </>
        );

      case 'statistics': {
        const stats = {
          linksCovers: { local: 0, url: 0 },
          linksGallery: { local: 0, url: 0 },
          actors: { local: 0, url: 0 },
          studios: { local: 0, url: 0 },
          hanimeCovers: { local: 0, url: 0 },
          hanimeSecondary: { local: 0, url: 0 },
          coomerProfiles: { local: 0, url: 0 },
          coomerPosts: { local: 0, url: 0 },
          totalLocal: 0,
          totalUrl: 0,
          total: 0
        };

        const processImage = (img: string | undefined, category: keyof typeof stats) => {
          if (!img) return;
          if (img.startsWith('data:image/')) {
            (stats[category] as any).local++;
            stats.totalLocal++;
            stats.total++;
          } else if (img.startsWith('http')) {
            (stats[category] as any).url++;
            stats.totalUrl++;
            stats.total++;
          }
        };

        state.links.forEach(l => {
          processImage(l.coverImage, 'linksCovers');
          l.galleryUrls?.forEach(img => processImage(img, 'linksGallery'));
        });

        state.actors.forEach(a => processImage(a.imageUrl, 'actors'));
        state.studios.forEach(t => processImage(t.imageUrl, 'studios'));
        
        state.hanime.forEach(h => {
          processImage(h.coverImage, 'hanimeCovers');
          h.secondaryCovers?.forEach(img => processImage(img, 'hanimeSecondary'));
        });

        state.coomers.forEach(c => {
          processImage(c.imageUrl, 'coomerProfiles');
          c.instagramPosts?.forEach(p => p.urls.forEach(img => processImage(img, 'coomerPosts')));
          c.onlyFansPosts?.forEach(p => p.urls.forEach(img => processImage(img, 'coomerPosts')));
          c.instagramLinks?.forEach(img => processImage(img, 'coomerPosts'));
          c.onlyFansLinks?.forEach(img => processImage(img, 'coomerPosts'));
        });

        const openDetail = (category: string, type: 'local' | 'url', title: string) => {
          const config = { category, type, title };
          navigateTo('statistics-detail', { statDetailConfig: config });
        };

        const StatRow = ({ label, categoryKey, local, url }: { label: string, categoryKey: string, local: number, url: number }) => {
          if (local === 0 && url === 0) return null;
          return (
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] last:border-none">
              <span className="text-[14px] font-medium text-[var(--text-primary)]">{label}</span>
              <div className="flex items-center gap-2 text-[12px]">
                {local > 0 && (
                  <button 
                    onClick={() => openDetail(categoryKey, 'local', `${label} (Local)`)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] font-bold active:scale-95 transition-transform"
                  >
                    {local} Local
                  </button>
                )}
                {url > 0 && (
                  <button 
                    onClick={() => openDetail(categoryKey, 'url', `${label} (URL)`)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold active:scale-95 transition-transform"
                  >
                    {url} URL
                  </button>
                )}
              </div>
            </div>
          );
        };

        return (
          <>
            <TelegramGroup title="Overview">
              <div className="px-5 py-6 flex flex-col items-center justify-center gap-2">
                <div className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                  {stats.total}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Total Images
                </div>
                
                <div className="w-full h-2 bg-[var(--border)] rounded-full mt-4 overflow-hidden flex">
                  <div 
                    className="h-full bg-[var(--accent)] transition-all" 
                    style={{ width: `${stats.total > 0 ? (stats.totalLocal / stats.total) * 100 : 0}%` }} 
                  />
                  <div 
                    className="h-full bg-emerald-500 transition-all" 
                    style={{ width: `${stats.total > 0 ? (stats.totalUrl / stats.total) * 100 : 0}%` }} 
                  />
                </div>
                
                <div className="w-full flex justify-between mt-2 text-[12px] font-medium">
                  <span className="text-[var(--accent)]">{stats.totalLocal} Local</span>
                  <span className="text-emerald-500">{stats.totalUrl} URL</span>
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Detailed Breakdown">
              <StatRow label="Link Covers" categoryKey="linksCovers" local={stats.linksCovers.local} url={stats.linksCovers.url} />
              <StatRow label="Link Galleries" categoryKey="linksGallery" local={stats.linksGallery.local} url={stats.linksGallery.url} />
              <StatRow label="Actors" categoryKey="actors" local={stats.actors.local} url={stats.actors.url} />
              <StatRow label="Studios" categoryKey="studios" local={stats.studios.local} url={stats.studios.url} />
              <StatRow label="Hanime Covers" categoryKey="hanimeCovers" local={stats.hanimeCovers.local} url={stats.hanimeCovers.url} />
              <StatRow label="Hanime Secondary" categoryKey="hanimeSecondary" local={stats.hanimeSecondary.local} url={stats.hanimeSecondary.url} />
              <StatRow label="Coomer Profiles" categoryKey="coomerProfiles" local={stats.coomerProfiles.local} url={stats.coomerProfiles.url} />
              <StatRow label="Coomer Posts" categoryKey="coomerPosts" local={stats.coomerPosts.local} url={stats.coomerPosts.url} />
              
              {stats.total === 0 && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--text-muted)]">
                  No images found in the database.
                </div>
              )}
            </TelegramGroup>
          </>
        );
      }

      case 'statistics-detail': {
        if (!statDetailConfig) {
          setTimeout(() => setSettingsView('statistics'), 0);
          return null;
        }
        const { category, type, title } = statDetailConfig;
        
        const isType = (img: string | undefined) => {
          if (!img) return false;
          if (type === 'local') return img.startsWith('data:image/');
          return img.startsWith('http');
        };

        const assets: { id: string, url: string, label: string, editRoute: string }[] = [];

        if (category === 'linksCovers') {
          state.links.forEach(l => { if (isType(l.coverImage)) assets.push({ id: l.id, url: l.coverImage, label: l.title, editRoute: `/edit/${l.id}` }); });
        } else if (category === 'linksGallery') {
          state.links.forEach(l => {
            l.galleryUrls?.forEach((u, i) => {
              if (isType(u)) assets.push({ id: `${l.id}-gal-${i}`, url: u, label: l.title, editRoute: `/edit/${l.id}` });
            });
          });
        } else if (category === 'actors') {
          state.actors.forEach(a => { if (isType(a.imageUrl)) assets.push({ id: a.id, url: a.imageUrl, label: a.name, editRoute: `/manage-actors/edit/${a.id}` }); });
        } else if (category === 'studios') {
          state.studios.forEach(t => { if (isType(t.imageUrl)) assets.push({ id: t.id, url: t.imageUrl, label: t.name, editRoute: `/manage-studios/edit/${t.id}` }); });
        } else if (category === 'hanimeCovers') {
          state.hanime.forEach(h => { if (isType(h.coverImage)) assets.push({ id: h.id, url: h.coverImage, label: h.title, editRoute: `/manage-hanime/edit/${h.id}` }); });
        } else if (category === 'hanimeSecondary') {
          state.hanime.forEach(h => {
            h.secondaryCovers?.forEach((u, i) => {
              if (isType(u)) assets.push({ id: `${h.id}-sec-${i}`, url: u, label: h.title, editRoute: `/manage-hanime/edit/${h.id}` });
            });
          });
        } else if (category === 'coomerProfiles') {
          state.coomers.forEach(c => { if (isType(c.imageUrl)) assets.push({ id: c.id, url: c.imageUrl, label: c.name, editRoute: `/manage-coomers/edit/${c.id}` }); });
        } else if (category === 'coomerPosts') {
          state.coomers.forEach(c => {
            let postIdx = 0;
            const addPostUrls = (urls: string[] | undefined) => {
              urls?.forEach(u => {
                if (isType(u)) assets.push({ id: `${c.id}-post-${postIdx++}`, url: u, label: c.name, editRoute: `/coomer/${c.id}` });
              });
            };
            c.instagramPosts?.forEach(p => addPostUrls(p.urls));
            c.onlyFansPosts?.forEach(p => addPostUrls(p.urls));
            addPostUrls(c.instagramLinks);
            addPostUrls(c.onlyFansLinks);
          });
        }

        return (
          <div className="flex flex-col gap-4 px-2 pb-10">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">{title}</h2>
              <span className="text-[12px] font-bold text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded-md border border-[var(--border)]">{assets.length} items</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => navigate(asset.editRoute)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] cursor-pointer group active:scale-95 transition-transform"
                >
                  <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-[10px] font-bold text-white truncate">{asset.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'data':
        return (
          <>
            <TelegramGroup title="Backup Actions">
              <TelegramItem 
                icon={<Icons.Download />} iconBg="#3b82f6"
                title="Export Backup" description="Save your database as a JSON file"
                onClick={() => {
                  const data = JSON.stringify(state, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `Vault_Backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
              />
              <TelegramItem 
                icon={<Icons.Upload />} iconBg="#22c55e"
                title="Import Backup" description="Restore from a JSON file"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file'; input.accept = '.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (importData(ev.target?.result as string)) addNotification('Import Successful', 'success');
                        else addNotification('Import Failed: Invalid JSON', 'error');
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              />
            </TelegramGroup>
          </>
        );

      case 'integrations':
        return (
          <>
            <TelegramGroup title="Real Debrid">
              <TelegramItem 
                icon={<img src="https://www.google.com/s2/favicons?domain=real-debrid.com&sz=128" alt="Real Debrid" className="w-full h-full scale-[1.6] object-contain rounded-full" />} iconBg="#ffffff"
                title="Real Debrid" description="Use Real Debrid for secure streaming"
                rightElement={<Toggle isActive={settings.enableRealDebrid !== false} onToggle={() => updateSettings({ enableRealDebrid: settings.enableRealDebrid === false ? true : false })} />}
              />
              <div className="px-5 py-4 border-t border-[var(--border)]">
                <label className="block text-[13px] font-medium text-[var(--accent)] mb-2 uppercase tracking-wide">
                  API Key
                </label>
                <input
                  type="password"
                  defaultValue={settings.realDebridApiKey || ''}
                  onBlur={(e) => updateSettings({ realDebridApiKey: e.target.value })}
                  placeholder="Paste your Real Debrid API key here..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                />
              </div>
            </TelegramGroup>
            
            <TelegramGroup title="Torbox">
              <TelegramItem 
                icon={<img src="https://www.google.com/s2/favicons?domain=torbox.app&sz=128" alt="Torbox" className="w-full h-full scale-[1.6] object-contain rounded-full" />} iconBg="#ffffff"
                title="Torbox" description="Use Torbox for secure streaming"
                rightElement={<Toggle isActive={settings.enableTorbox !== false} onToggle={() => updateSettings({ enableTorbox: settings.enableTorbox === false ? true : false })} />}
              />
              <div className="px-5 py-4 border-t border-[var(--border)]">
                <label className="block text-[13px] font-medium text-[var(--accent)] mb-2 uppercase tracking-wide">
                  API Key
                </label>
                <input
                  type="password"
                  defaultValue={settings.torboxApiKey || ''}
                  onBlur={(e) => updateSettings({ torboxApiKey: e.target.value })}
                  placeholder="Paste your Torbox API key here..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                />
              </div>
            </TelegramGroup>
          </>
        );



      default:
        return null;
    }
  };

  return (
    <div key={settingsView} className={`w-full flex flex-col pb-32 ${animationClass} px-2 pt-2 gpu-accelerated contain-layout`}>
      {renderContent()}
    </div>
  );
};
