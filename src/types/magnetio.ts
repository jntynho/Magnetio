export type Resolution = '4K' | '1080p' | '720p' | '480p';

export type SortOrder =
  | 'quality_then_seeders'
  | 'quality_then_size'
  | 'seeders'
  | 'size'
  | 'cached_first'
  | 'resolution'
  | 'custom_primary';

export type PrimarySortCriterionId =
  | 'cached'
  | 'resolution'
  | 'quality'
  | 'language'
  | 'seeders'
  | 'size'
  | 'features'
  | 'provider';

export interface PrimarySortCriterion {
  id: PrimarySortCriterionId;
  label: string;
  description: string;
  badge?: string;
}

export const ALL_PRIMARY_SORT_CRITERIA: PrimarySortCriterion[] = [
  {
    id: 'cached',
    label: 'Cached Status (Debrid)',
    description: 'Instant playback cached streams at the top before uncached/P2P',
    badge: 'Instant Play',
  },
  {
    id: 'resolution',
    label: 'Resolution Priority',
    description: 'Prioritize by resolution (4K 2160p > 1440p > 1080p > 720p...)',
    badge: '4K / 1080p',
  },
  {
    id: 'quality',
    label: 'Visual Quality & Encode',
    description: 'Prioritize release encode type (BluRay REMUX > BluRay > WEB-DL > WEBRip...)',
    badge: 'REMUX / WEB-DL',
  },
  {
    id: 'language',
    label: 'Priority Language',
    description: 'Streams containing your chosen audio language track first',
    badge: 'Audio Track',
  },
  {
    id: 'seeders',
    label: 'Seeders & Peers',
    description: 'Sort by highest number of active torrent peers and seeders',
    badge: 'P2P Health',
  },
  {
    id: 'size',
    label: 'File Size (Bitrate)',
    description: 'Larger files with higher audio/video bitrate given priority',
    badge: 'High Bitrate',
  },
  {
    id: 'features',
    label: 'Audio & Visual Tags',
    description: 'HDR, Dolby Vision, Dolby Atmos, and multi-channel audio prioritized',
    badge: 'HDR / Atmos',
  },
  {
    id: 'provider',
    label: 'Provider & Indexer',
    description: 'Prioritize reliable indexers and verified scrapers',
    badge: 'Sources',
  },
];

export const DEFAULT_PRIMARY_SORT_ORDER: PrimarySortCriterionId[] = [
  'cached',
  'resolution',
  'quality',
  'language',
  'seeders',
  'size',
  'features',
  'provider',
];

export const DEFAULT_RESOLUTION_SORT_ORDER: string[] = [
  '2160p',
  '1440p',
  '1080p',
  '720p',
  '480p',
  '360p',
  '240p',
  'Unknown',
];

export interface TorrentProviderItem {
  id: string;
  name: string;
  category: 'Movies' | 'Series' | 'General' | 'Anime' | 'DMM' | 'Indexer' | 'Scraper' | 'Regional';
  source?: 'Torrentio' | 'Comet' | 'Both';
  description?: string;
}

export const ALL_TORRENT_PROVIDERS: TorrentProviderItem[] = [
  // Core & High-Priority (Both Torrentio & Comet)
  { id: 'yts', name: 'YTS', category: 'Movies', source: 'Both', description: 'Best for high-compression 720p/1080p movies' },
  { id: 'eztv', name: 'EZTV', category: 'Series', source: 'Both', description: 'Specialized for TV series & daily episodes' },
  { id: 'rarbg', name: 'RARBG', category: 'General', source: 'Both', description: 'High quality scene & p2p release archives' },
  { id: '1337x', name: '1337x', category: 'General', source: 'Both', description: 'General tracker with verified torrents' },
  { id: 'thepiratebay', name: 'The Pirate Bay', category: 'General', source: 'Both', description: 'Classic general torrent indexer' },
  { id: 'kickasstorrents', name: 'KickassTorrents', category: 'General', source: 'Both', description: 'Broad torrent database' },
  { id: 'torrentgalaxy', name: 'TorrentGalaxy', category: 'General', source: 'Both', description: 'Modern releases with verified uploaders' },
  { id: 'magnetdl', name: 'MagnetDL', category: 'General', source: 'Torrentio', description: 'Clean magnet links directory' },
  { id: 'ext', name: 'EXT', category: 'General', source: 'Torrentio', description: 'General verified torrent indexer' },

  // Comet Scrapers & Debrid Aggregators
  { id: 'torrentsdb', name: 'TorrentsDB Scraper', category: 'Scraper', source: 'Comet', description: 'Live multi-tracker aggregator (RARBG, 1337x, EZTV, YTS, TGx)' },
  { id: 'comet', name: 'Comet Scraper', category: 'Scraper', source: 'Comet', description: 'Fast multi-source torrent & debrid search engine' },
  { id: 'torrentio', name: 'Torrentio Scraper', category: 'Scraper', source: 'Comet', description: 'Torrentio upstream scrape integration' },
  { id: 'zilean', name: 'Zilean / DMM Hashes', category: 'DMM', source: 'Comet', description: 'Debrid Media Manager instant cache & hashes' },
  { id: 'dmm', name: 'Debrid Media Manager (DMM)', category: 'DMM', source: 'Comet', description: 'Community cached hashes & media releases' },
  { id: 'mediafusion', name: 'MediaFusion Scraper', category: 'Scraper', source: 'Comet', description: 'Multi-source scraper with movies & shows' },
  { id: 'bitsearch', name: 'BitSearch', category: 'General', source: 'Comet', description: 'Ultra-fast torrent search engine' },
  { id: 'limetorrents', name: 'Limetorrents', category: 'General', source: 'Comet', description: 'General torrent directory with active peers' },
  { id: 'torlock', name: 'Torlock', category: 'General', source: 'Comet', description: 'Verified torrents only' },
  { id: 'solidtorrents', name: 'SolidTorrents', category: 'General', source: 'Comet', description: 'Clean, ad-free DHT search indexer' },
  { id: 'torbox', name: 'TorBox Search', category: 'Scraper', source: 'Comet', description: 'TorBox cloud scraper & indexed torrents' },
  { id: 'bitmagnet', name: 'Bitmagnet DHT', category: 'Scraper', source: 'Comet', description: 'Decentralized DHT swarm indexer' },
  { id: 'jackett', name: 'Jackett Scrapers', category: 'Indexer', source: 'Comet', description: 'Local & self-hosted indexers aggregator' },
  { id: 'prowlarr', name: 'Prowlarr Indexers', category: 'Indexer', source: 'Comet', description: 'Advanced indexer manager proxy' },
  { id: 'debridio', name: 'Debridio', category: 'Scraper', source: 'Comet', description: 'Debrid-focused caching crawler' },
  { id: 'stremthru', name: 'StremThru', category: 'Scraper', source: 'Comet', description: 'High performance link routing proxy' },
  { id: 'peerflix', name: 'PeerFlix', category: 'Scraper', source: 'Comet', description: 'P2P streaming engine scraper' },

  // Anime Providers (Torrentio & Comet)
  { id: 'nyaasi', name: 'Nyaa', category: 'Anime', source: 'Both', description: 'Premier anime & East Asian media' },
  { id: 'tokyotosho', name: 'Tokyo Toshokan', category: 'Anime', source: 'Both', description: 'Anime, raw releases & Japanese media' },
  { id: 'anidex', name: 'AniDex', category: 'Anime', source: 'Both', description: 'Anime torrents & raw subtitles' },
  { id: 'animetosho', name: 'AnimeTosho', category: 'Anime', source: 'Comet', description: 'Automated anime DDL & torrent mirror' },
  { id: 'seadex', name: 'SeaDex', category: 'Anime', source: 'Comet', description: 'Best release index for anime connoisseurs' },
  { id: 'horriblesubs', name: 'HorribleSubs', category: 'Anime', source: 'Torrentio', description: 'Anime batch & seasonal releases archive' },
  { id: 'nekobt', name: 'nekoBT', category: 'Anime', source: 'Both', description: 'Private & curated anime torrents' },

  // Regional & Language-Specific Indexers (Torrentio)
  { id: 'rutor', name: 'Rutor', category: 'Regional', source: 'Torrentio', description: 'Russian & multi-language releases' },
  { id: 'rutracker', name: 'Rutracker', category: 'Regional', source: 'Torrentio', description: 'Extensive lossless audio & multi-dub tracker' },
  { id: 'comando', name: 'Comando', category: 'Regional', source: 'Torrentio', description: 'Portuguese & Brazilian dual-audio releases' },
  { id: 'bludv', name: 'BluDV', category: 'Regional', source: 'Torrentio', description: 'Brazilian 1080p/4K releases' },
  { id: 'micoleaodublado', name: 'MicoLeaoDublado', category: 'Regional', source: 'Torrentio', description: 'Portuguese dubbed movies and shows' },
  { id: 'torrent9', name: 'Torrent9', category: 'Regional', source: 'Torrentio', description: 'French releases and VF/VOSTFR movies' },
  { id: 'cpasbien', name: 'Cpasbien', category: 'Regional', source: 'Torrentio', description: 'Popular French torrents directory' },
  { id: 'ilcorsaronero', name: 'ilCorSaRoNeRo', category: 'Regional', source: 'Torrentio', description: 'Italian torrents and dual-audio tracker' },
  { id: 'mejortorrent', name: 'MejorTorrent', category: 'Regional', source: 'Torrentio', description: 'Spanish releases and latino dubs' },
  { id: 'wolfmax4k', name: 'Wolfmax4k', category: 'Regional', source: 'Torrentio', description: 'High-bitrate 4K HDR/DV Spanish releases' },
  { id: 'cinecalidad', name: 'Cinecalidad', category: 'Regional', source: 'Torrentio', description: 'Latino 1080p/4K movie releases' },
  { id: 'besttorrents', name: 'BestTorrents', category: 'Regional', source: 'Torrentio', description: 'General verified p2p releases' },
];

export interface LanguageItem {
  code: string;
  label: string;
  nativeLabel?: string;
  isSpecial?: boolean;
}

export const ALL_AIOSTREAMS_LANGUAGES: LanguageItem[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'Arabic' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar' },
  { code: 'ro', label: 'Romanian', nativeLabel: 'Română' },
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi' },
  { code: 'no', label: 'Norwegian', nativeLabel: 'Norsk' },
  { code: 'multi', label: 'Multi-Audio / Dual Audio', nativeLabel: 'Multi', isSpecial: true },
  { code: 'unknown', label: 'Unknown / Undetermined', nativeLabel: 'Undetected', isSpecial: true },
];

export const PRIORITY_LANGUAGES = ALL_AIOSTREAMS_LANGUAGES;

export interface ResolutionOption {
  id: string;
  label: string;
  description?: string;
}

export const EXCLUDE_RESOLUTIONS_LIST: ResolutionOption[] = [
  { id: '2160p', label: '2160p', description: '4K Ultra High Definition (3840x2160)' },
  { id: '1440p', label: '1440p', description: '2K Quad High Definition (2560x1440)' },
  { id: '1080p', label: '1080p', description: 'Full High Definition (1920x1080)' },
  { id: '720p', label: '720p', description: 'Standard High Definition (1280x720)' },
  { id: '480p', label: '480p', description: 'Enhanced Definition (854x480 / DVD)' },
  { id: '360p', label: '360p', description: 'Standard Definition low bitrate' },
  { id: '240p', label: '240p', description: 'Very low resolution mobile video' },
  { id: 'Unknown', label: 'Unknown', description: 'Streams with unidentified resolution' },
];

export function normalizeResolutionName(res: string): string {
  const r = (res || '').toLowerCase().trim();
  if (r === '4k' || r === '2160p' || r === '2160' || r === 'uhd') return '2160p';
  if (r === '1440p' || r === '1440' || r === '2k' || r === 'qhd') return '1440p';
  if (r === '1080p' || r === '1080' || r === 'fhd') return '1080p';
  if (r === '720p' || r === '720' || r === 'hd') return '720p';
  if (r === '480p' || r === '480' || r === 'sd') return '480p';
  if (r === '360p' || r === '360') return '360p';
  if (r === '240p' || r === '240') return '240p';
  if (r === 'unknown' || r === 'other' || !r) return 'Unknown';
  const found = EXCLUDE_RESOLUTIONS_LIST.find((opt) => opt.id.toLowerCase() === r);
  return found ? found.id : res;
}

export const AIOSTREAMS_RESOLUTION_REGEX: Record<string, RegExp> = {
  '2160p': /\b(2160p?|4k|uhd)\b/i,
  '1440p': /\b(1440p?|2k|qhd)\b/i,
  '1080p': /\b(1080p?|1080i|fhd)\b/i,
  '720p': /\b(720p?|hd)\b/i,
  '480p': /\b(480p?|sd)\b/i,
  '360p': /\b360p?\b/i,
  '240p': /\b240p?\b/i,
  'Unknown': /\b(unknown|other)\b/i,
};

export interface QualityOption {
  id: string;
  label: string;
  shortLabel?: string;
  category: 'Lossless / Remux' | 'Web & High Def' | 'Broadcast / TV' | 'Cam / Screener' | 'Other';
  description: string;
}

export const EXCLUDE_QUALITIES_LIST: QualityOption[] = [
  {
    id: 'BluRay REMUX',
    label: 'BluRay REMUX',
    category: 'Lossless / Remux',
    description: 'Lossless direct 1:1 uncompressed audio & video stream copy of Blu-ray disc',
  },
  {
    id: 'BluRay',
    label: 'BluRay',
    category: 'Lossless / Remux',
    description: 'High definition rip or re-encode directly from Blu-ray disc (BD/BRRip)',
  },
  {
    id: 'WEB-DL',
    label: 'WEB-DL',
    category: 'Web & High Def',
    description: 'Direct untouched digital file downloaded from streaming platforms',
  },
  {
    id: 'WEBRip',
    label: 'WEBRip',
    category: 'Web & High Def',
    description: 'Digital release captured and re-encoded from an online web stream',
  },
  {
    id: 'HDRip',
    label: 'HDRip',
    category: 'Web & High Def',
    description: 'High definition capture/encode from high quality digital source',
  },
  {
    id: 'HC HD-Rip',
    label: 'HC HD-Rip',
    category: 'Web & High Def',
    description: 'High definition digital rip with hardcoded foreign subtitles on video',
  },
  {
    id: 'DVD REMUX',
    label: 'DVD REMUX',
    category: 'Broadcast / TV',
    description: 'Lossless direct untouched 1:1 stream copy of retail DVD disc',
  },
  {
    id: 'DVDRip',
    label: 'DVDRip',
    category: 'Broadcast / TV',
    description: 'Compressed standard definition encode ripped from retail DVD',
  },
  {
    id: 'HDTV',
    label: 'HDTV',
    category: 'Broadcast / TV',
    description: 'High definition capture from digital broadcast or cable television stream',
  },
  {
    id: 'CAM',
    label: 'CAM',
    category: 'Cam / Screener',
    description: 'Low quality bootleg recorded with a video camera inside a movie theater',
  },
  {
    id: 'TS',
    label: 'TS',
    shortLabel: 'TeleSync',
    category: 'Cam / Screener',
    description: 'Bootleg theater recording with a direct audio connection feed',
  },
  {
    id: 'TC',
    label: 'TC',
    shortLabel: 'TeleCine',
    category: 'Cam / Screener',
    description: 'Early copy digitized directly from an analog 35mm film reel projector',
  },
  {
    id: 'SCR',
    label: 'SCR',
    shortLabel: 'Screener',
    category: 'Cam / Screener',
    description: 'Pre-release promotional screener disc with review watermarks or ticker',
  },
  {
    id: 'Unknown',
    label: 'Unknown',
    category: 'Other',
    description: 'Streams with unrecognized or generic video source tags',
  },
];

export const AIOSTREAMS_DEFAULT_EXCLUDED_QUALITIES = ['CAM', 'SCR', 'TS', 'TC'];

/**
 * Normalizes any legacy or case-variant quality string to the standard AIOStreams quality ID.
 */
export function normalizeQualityName(raw: string): string {
  if (!raw) return 'Unknown';
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  if (lower === 'ts' || lower === 'telesync' || lower === 'hdts' || lower === 'pdvd') return 'TS';
  if (lower === 'tc' || lower === 'telecine' || lower === 'hdtc') return 'TC';
  if (lower === 'cam' || lower === 'hdcam') return 'CAM';
  if (lower === 'scr' || lower === 'screener' || lower === 'dvdscr') return 'SCR';
  if (lower.includes('bluray remux') || lower.includes('bd remux') || lower.includes('uhd remux') || (lower.includes('remux') && !lower.includes('dvd'))) {
    return 'BluRay REMUX';
  }
  if (lower === 'dvd remux' || (lower.includes('dvd') && lower.includes('remux'))) return 'DVD REMUX';
  if (lower.includes('bluray') || lower.includes('bdrip') || lower.includes('brrip')) return 'BluRay';
  if (lower.includes('hc') && (lower.includes('hdrip') || lower.includes('rip'))) return 'HC HD-Rip';
  if (lower === 'web-dl' || lower === 'webdl') return 'WEB-DL';
  if (lower === 'webrip') return 'WEBRip';
  if (lower === 'hdrip') return 'HDRip';
  if (lower === 'dvdrip' || lower === 'dvd') return 'DVDRip';
  if (lower === 'hdtv' || lower === 'pdtv' || lower === 'dsr' || lower.includes('tvrip')) return 'HDTV';
  if (lower === 'unknown') return 'Unknown';

  const matched = EXCLUDE_QUALITIES_LIST.find((q) => q.id.toLowerCase() === lower || (q.shortLabel && q.shortLabel.toLowerCase() === lower));
  return matched ? matched.id : clean;
}

export const AIOSTREAMS_QUALITY_REGEX: Record<string, RegExp> = {
  'BluRay REMUX': /(?<!dvd.*)(bd|br|b|uhd)?remux(?!.*dvd)/i,
  'BluRay': /(?<!remux.*)((bd|blu[ .-_]?ray)([ .-_]?rip)?|br[ .-_]?rip)(?!.*remux)/i,
  'WEB-DL': /web[ .-_]?(dl)?(?![ .-_]?(rip|DLRip|cam))/i,
  'WEBRip': /web[ .-_]?rip/i,
  'HDRip': /hd[ .-_]?rip|web[ .-_]?dl[ .-_]?rip/i,
  'HC HD-Rip': /hc|hd[ .-_]?rip/i,
  'DVD REMUX': /(hd[ .-_]?)?dvd.*remux|remux.*(hd[ .-_]?)?dvd/i,
  'DVDRip': /dvd[ .-_]?(rip|mux|r|full|5|9)?/i,
  'HDTV': /(hd|pd)tv|tv[ .-_]?rip|hdtv[ .-_]?rip|dsr(ip)?|sat[ .-_]?rip/i,
  'CAM': /cam|hdcam|cam[ .-_]?rip/i,
  'TS': /telesync|ts|hd[ .-_]?ts|pdvd|predvd(rip)?/i,
  'TC': /telecine|tc|hd[ .-_]?tc/i,
  'SCR': /((dvd|bd|web|hd)?[ .-_]?)?(scr(eener)?)/i,
};

export type DebridServiceId =
  | 'realdebrid'
  | 'alldebrid'
  | 'premiumize'
  | 'debridlink'
  | 'torbox'
  | 'easydebrid'
  | 'debrider'
  | 'offcloud'
  | 'pikpak'
  | 'seedr'
  | 'putio'
  | 'torrin';

export interface DebridConfig {
  id: DebridServiceId | string;
  name: string;
  shortName?: string;
  enabled: boolean;
  apiKey: string;
  cachedOnly: boolean;
}

export interface IndexerConfig {
  enablePublicScrapers: boolean;
  enableProwlarr: boolean;
  prowlarrUrl?: string;
  prowlarrApiKey?: string;
  enableJackett: boolean;
  jackettUrl?: string;
  jackettApiKey?: string;
}

export interface FilterConfig {
  providers?: string[];
  resolutions: Resolution[];
  maxStreamsPerResolution: number;
  sortOrder: SortOrder;
  primarySortOrder?: PrimarySortCriterionId[];
  resolutionSortOrder?: string[];
  priorityLanguage?: string;
  excludeResolutions?: string[];
  excludeQuality?: string[];
  videoSizeLimitGb?: number | null;
  minSizeGb: number;
  maxSizeGb: number;
  excludedKeywords: string[];
  filterAdult: boolean;
  enableAnime: boolean;
  preferredLanguages: string[];
  selectedDebrid?: string;
  debridApiKey?: string;
  dontShowDownloadLinks?: boolean;
  showP2PForUncached?: boolean;
  cometUrl?: string;
}

export interface FormatterConfig {
  nameTemplate: string;
  descriptionTemplate: string;
}

export interface UserConfig {
  version: number;
  addonName?: string;
  debrid: Record<string, DebridConfig>;
  indexers: IndexerConfig;
  filters: FilterConfig;
  formatter: FormatterConfig;
}

export interface NormalizedStream {
  id: string;
  title: string;
  filename: string;
  size: number; // in bytes
  sizeFormatted: string; // e.g. "14.2 GB"
  seeders: number;
  resolution: Resolution;
  quality: string; // 'REMUX', 'WEB-DL', 'BluRay', 'HDRip', etc.
  codec: string; // 'x265', 'x264', 'AV1', 'HEVC', etc.
  hdr: string; // 'Dolby Vision', 'HDR10+', 'HDR', 'SDR'
  audioTags: string[]; // ['Atmos', 'DDP5.1', 'TrueHD', 'AAC2.0']
  releaseGroup: string; // 'FLUX', 'FraMeSToR', 'YTS', 'NTb'
  language: string[]; // ['English', 'French', etc.]
  infoHash: string;
  cached: boolean;
  providerName: string; // 'Real-Debrid', 'TorBox', 'DHT', etc.
  isDebrid: boolean;
  url?: string;
  fileIdx?: number;
  behaviorHints?: {
    bingeGroup?: string;
    filename?: string;
    videoSize?: number;
  };
}

export interface StremioStreamResponse {
  name: string;
  title: string;
  infoHash?: string;
  fileIdx?: number;
  sources?: string[];
  url?: string;
  behaviorHints?: {
    bingeGroup?: string;
    filename?: string;
    videoSize?: number;
    proxyHeaders?: Record<string, string>;
    notWebReady?: boolean;
  };
}

export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  resources: Array<string | { name: string; types: string[]; idPrefixes?: string[] }>;
  types: string[];
  idPrefixes: string[];
  catalogs?: Array<{ type: string; id: string; name: string }>;
  behaviorHints?: {
    configurable?: boolean;
    configurationRequired?: boolean;
  };
}

export interface FormatterPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  nameTemplate: string;
  descriptionTemplate: string;
}
