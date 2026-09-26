import {
  NormalizedStream,
  StremioStreamResponse,
  UserConfig,
  Resolution,
  ALL_TORRENT_PROVIDERS,
  AIOSTREAMS_QUALITY_REGEX,
  AIOSTREAMS_RESOLUTION_REGEX,
  normalizeQualityName,
  normalizeResolutionName,
} from '../../src/types/magnetio';
import { formatTemplate } from '../../src/utils/formatter';

export interface MediaRequest {
  type: string; // 'movie' | 'series' | 'anime'
  id: string;   // 'tt1234567' or 'tt1234567:1:1' or 'kitsu:1234'
}

export interface ParsedMediaId {
  type: string;
  imdbId: string;
  season?: number;
  episode?: number;
  kitsuId?: string;
  isAnime: boolean;
  cleanId: string;
}

/**
 * Parses IMDb/Kitsu IDs into structured metadata
 */
export function parseMediaId(type: string, id: string): ParsedMediaId {
  const cleanId = (id || '').replace(/\.json$/, '');
  let imdbId = cleanId;
  let season: number | undefined;
  let episode: number | undefined;

  if (cleanId.startsWith('kitsu:')) {
    return {
      type: 'anime',
      imdbId: '',
      kitsuId: cleanId.replace('kitsu:', ''),
      isAnime: true,
      cleanId,
    };
  }

  if (cleanId.includes(':')) {
    const parts = cleanId.split(':');
    imdbId = parts[0];
    season = parseInt(parts[1], 10);
    episode = parseInt(parts[2], 10);
  }

  return {
    type,
    imdbId,
    season,
    episode,
    isAnime: type === 'anime' || cleanId.startsWith('kitsu:'),
    cleanId,
  };
}

// In-memory cache for Cinemeta metadata to avoid repeated external requests
const cinemetaCache = new Map<string, { title: string; year: string; episodeTitle?: string; timestamp: number }>();

// High-speed verified public BitTorrent trackers injected into P2P streams to accelerate peer discovery
export const FAST_PUBLIC_TRACKERS: string[] = [
  'tracker:udp://tracker.opentrackr.org:1337/announce',
  'tracker:udp://open.demonii.com:1337/announce',
  'tracker:udp://open.stealth.si:80/announce',
  'tracker:udp://tracker.torrent.eu.org:451/announce',
  'tracker:udp://explodie.org:6969/announce',
  'tracker:udp://tracker.coppersurfer.tk:6969/announce',
  'tracker:udp://tracker.leechers-paradise.org:6969/announce',
  'tracker:udp://p4p.arenabg.com:1337/announce',
  'tracker:udp://tracker.internetwarriors.net:1337/announce',
];

// In-memory cache for raw scraped torrents per media ID (TTL: 45 minutes)
const rawTorrentsCache = new Map<string, { torrents: ScrapedTorrent[]; timestamp: number }>();
const RAW_TORRENTS_CACHE_TTL = 45 * 60 * 1000;

// In-memory cache for Debrid instant availability (TTL: 6 hours)
const debridAvailabilityCache = new Map<string, { cached: boolean; timestamp: number }>();
const DEBRID_CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * Fetch rich title and metadata from Cinemeta (Official Stremio metadata API)
 */
async function fetchCinemetaMetadata(type: string, imdbId: string): Promise<{ title: string; year: string } | null> {
  if (!imdbId || !imdbId.startsWith('tt')) return null;

  const cached = cinemetaCache.get(imdbId);
  if (cached && Date.now() - cached.timestamp < 3600_000) {
    return { title: cached.title, year: cached.year };
  }

  const metaType = type === 'series' ? 'series' : 'movie';
  const url = `https://v3-cinemeta.strem.io/meta/${metaType}/${imdbId}.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as { meta?: { name?: string; year?: string } };
      if (data.meta?.name) {
        const title = data.meta.name;
        const year = data.meta.year || '';
        cinemetaCache.set(imdbId, { title, year, timestamp: Date.now() });
        return { title, year };
      }
    }
  } catch {
    // Ignore fetch error and proceed with ID fallback
  }

  return null;
}

/**
 * Parse human readable byte sizes (e.g. "28.0 GB", "1024 MB", "750 KB") to numeric bytes
 */
export function sizeToBytes(sizeStr?: string | null): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/([\d.]+)\s*([KMGT]?B)/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit.startsWith('T')) return Math.round(num * 1024 * 1024 * 1024 * 1024);
  if (unit.startsWith('G')) return Math.round(num * 1024 * 1024 * 1024);
  if (unit.startsWith('M')) return Math.round(num * 1024 * 1024);
  if (unit.startsWith('K')) return Math.round(num * 1024);
  return Math.round(num);
}

/**
 * Convert bytes to formatted string
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Parses release metadata from filename / torrent title (following Torrentio and Comet patterns)
 */
export function parseTorrentMetadata(title: string, rawTracker?: string): {
  resolution: Resolution;
  quality: string;
  codec: string;
  hdr: string;
  audioTags: string[];
  releaseGroup: string;
  languages: string[];
  cleanName: string;
} {
  const cleanTitle = title || '';
  const lower = cleanTitle.toLowerCase();

  // 1. Resolution
  let resolution: Resolution = '1080p';
  if (/(2160p|4k|uhd|3840x2160)/i.test(cleanTitle)) {
    resolution = '4K';
  } else if (/(1440p|2k|qhd)/i.test(cleanTitle)) {
    resolution = '1080p'; // Group 1440p into high-def or keep 1080p
  } else if (/(1080p|1080i|fhd)/i.test(cleanTitle)) {
    resolution = '1080p';
  } else if (/(720p|hd)/i.test(cleanTitle)) {
    resolution = '720p';
  } else if (/(480p|sd|576p)/i.test(cleanTitle)) {
    resolution = '480p';
  }

  // 2. Quality / Source
  let quality = 'WEB-DL';
  if (/(bd|br|uhd)?remux/i.test(cleanTitle)) {
    quality = 'REMUX';
  } else if (/(blu[ .-_]?ray|bdrip|brrip)/i.test(cleanTitle)) {
    quality = 'BluRay';
  } else if (/web-?dl/i.test(cleanTitle)) {
    quality = 'WEB-DL';
  } else if (/web-?rip/i.test(cleanTitle)) {
    quality = 'WEBRip';
  } else if (/hd-?rip/i.test(cleanTitle)) {
    quality = 'HDRip';
  } else if (/dvd-?rip|dvd/i.test(cleanTitle)) {
    quality = 'DVDRip';
  } else if (/(hd|pd)tv|tvrip/i.test(cleanTitle)) {
    quality = 'HDTV';
  } else if (/(cam|telesync|hdcam|hd-ts|pdvd)/i.test(cleanTitle)) {
    quality = 'CAM';
  } else if (/(telecine|tc|hd-tc)/i.test(cleanTitle)) {
    quality = 'TC';
  } else if (/(scr|screener|dvdscr)/i.test(cleanTitle)) {
    quality = 'SCR';
  }

  // 3. Video Codec
  let codec = 'x264';
  if (/(hevc|x265|h\.?265)/i.test(cleanTitle)) {
    codec = 'HEVC / x265';
  } else if (/av1/i.test(cleanTitle)) {
    codec = 'AV1';
  } else if (/(x264|h\.?264|avc)/i.test(cleanTitle)) {
    codec = 'H.264 / x264';
  } else if (/(xvid|divx)/i.test(cleanTitle)) {
    codec = 'XviD';
  }

  // 4. HDR / Color profile
  let hdr = 'SDR';
  const hasDV = /(dolby[ .]?vision|dovi|\bdv\b)/i.test(cleanTitle);
  const hasHDR10Plus = /hdr10\+/i.test(cleanTitle);
  const hasHDR = /(hdr10|hdr)/i.test(cleanTitle);

  if (hasDV && hasHDR10Plus) {
    hdr = 'Dolby Vision / HDR10+';
  } else if (hasDV && hasHDR) {
    hdr = 'Dolby Vision / HDR10';
  } else if (hasDV) {
    hdr = 'Dolby Vision';
  } else if (hasHDR10Plus) {
    hdr = 'HDR10+';
  } else if (hasHDR) {
    hdr = 'HDR10';
  }

  // 5. Audio Tags
  const audioTags: string[] = [];
  if (/atmos/i.test(cleanTitle)) audioTags.push('Dolby Atmos');
  if (/truehd/i.test(cleanTitle)) audioTags.push('TrueHD');
  if (/dts-?hd/i.test(cleanTitle)) audioTags.push('DTS-HD');
  if (/(ddp|eac3|dd\+)/i.test(cleanTitle)) audioTags.push('DDP 5.1');
  if (/7\.1/i.test(cleanTitle)) audioTags.push('7.1');
  else if (/5\.1/i.test(cleanTitle)) audioTags.push('5.1');
  if (/aac/i.test(cleanTitle)) audioTags.push('AAC');
  if (/flac/i.test(cleanTitle)) audioTags.push('FLAC');
  if (audioTags.length === 0) audioTags.push('Stereo 2.0');

  // 6. Release Group
  let releaseGroup = '';
  const groupMatch = cleanTitle.match(/-([a-zA-Z0-9]+)(?:\[.*?\])?(?:\.mkv|\.mp4|\.avi)?$/i);
  if (groupMatch && groupMatch[1]) {
    releaseGroup = groupMatch[1];
  } else if (rawTracker) {
    releaseGroup = rawTracker.replace(/[^a-zA-Z0-9]/g, '');
  }

  // 7. Languages
  const languages: string[] = [];
  if (/(multi|dual[ .-_]?audio)/i.test(cleanTitle)) languages.push('Multi-Audio');
  if (/(french|vf|vostfr)/i.test(cleanTitle)) languages.push('French');
  if (/(spanish|castellano|latino|es)/i.test(cleanTitle)) languages.push('Spanish');
  if (/(italian|ita)/i.test(cleanTitle)) languages.push('Italian');
  if (/(german|deutsch)/i.test(cleanTitle)) languages.push('German');
  if (/(portuguese|dublado|pt)/i.test(cleanTitle)) languages.push('Portuguese');
  if (/(russian|rus|rutor)/i.test(cleanTitle)) languages.push('Russian');
  if (/(hindi|tamil|telugu)/i.test(cleanTitle)) languages.push('Hindi');
  if (/(japanese|jpn|raw)/i.test(cleanTitle)) languages.push('Japanese');
  if (languages.length === 0) languages.push('English');

  return {
    resolution,
    quality,
    codec,
    hdr,
    audioTags,
    releaseGroup,
    languages,
    cleanName: cleanTitle.replace(/\.(mkv|mp4|avi)$/i, ''),
  };
}

// Raw torrent intermediate structure
interface ScrapedTorrent {
  title: string;
  infoHash: string;
  fileIdx?: number;
  size: number;
  seeders: number;
  tracker: string;
  sourceProvider: string;
  isAnime?: boolean;
  directUrl?: string;
  isPreResolvedDebrid?: boolean;
}

/**
 * Normalizes sub-trackers scraped from Comet (e.g. "StremThru|TorrentGalaxyClone" -> "TorrentGalaxy")
 */
export function cleanTrackerName(rawTracker?: string): string {
  if (!rawTracker) return 'Comet';
  let t = rawTracker.trim();
  t = t.replace(/^🔎\s*/, '').replace(/^Comet\|/i, '');
  if (t.includes('|')) {
    const parts = t.split('|');
    const sub = parts[parts.length - 1].trim();
    const lower = sub.toLowerCase();
    if (lower.includes('rarbg')) return 'RARBG';
    if (lower.includes('galaxy') || lower.includes('tgx')) return 'TorrentGalaxy';
    if (lower.includes('1337x')) return '1337x';
    if (lower.includes('pirate') || lower.includes('tpb') || lower.includes('apibay')) return 'The Pirate Bay';
    if (lower.includes('knaben')) return 'Knaben';
    if (lower.includes('bitsearch')) return 'BitSearch';
    if (lower.includes('limetorrents')) return 'Limetorrents';
    if (lower.includes('torbox')) return 'TorBox';
    if (lower.includes('alldebrid')) return 'AllDebrid';
    if (lower.includes('realdebrid')) return 'Real-Debrid';
    if (lower.includes('dmm')) return 'DMM';
    if (lower.includes('zilean')) return 'Zilean';
    if (lower.includes('bitmagnet')) return 'Bitmagnet';
    if (lower.includes('yts')) return 'YTS';
    if (lower.includes('eztv')) return 'EZTV';
    return sub;
  }
  return t;
}

/**
 * Scraper 1: TorrentsDB (Aggregates RARBG, 1337x, EZTV, YTS, TorrentGalaxy)
 */
async function scrapeTorrentsDB(mediaType: string, cleanId: string): Promise<ScrapedTorrent[]> {
  const url = `https://torrentsdb.com/stream/${mediaType}/${cleanId}.json`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json() as { streams?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.streams)) return [];

    const results: ScrapedTorrent[] = [];
    for (const s of data.streams) {
      const infoHash = (typeof s.infoHash === 'string' ? s.infoHash : '').toLowerCase().trim();
      if (!infoHash || infoHash.length !== 40) continue;

      const titleRaw = typeof s.title === 'string' ? s.title : '';
      const lines = titleRaw.split('\n');
      const filename = (typeof s.behaviorHints === 'object' && s.behaviorHints && typeof (s.behaviorHints as Record<string, unknown>).filename === 'string'
        ? (s.behaviorHints as Record<string, unknown>).filename
        : lines[0] || 'Unknown Stream') as string;

      // Extract seeders, size, tracker
      const metaLine = lines[lines.length - 1] || '';
      const seederMatch = metaLine.match(/👤\s*(\d+)/);
      const sizeMatch = metaLine.match(/💾\s*([\d.]+\s*[KMGT]?B)/i);
      const trackerMatch = metaLine.match(/⚙️\s*([^\n\r]+)/);

      const seeders = seederMatch ? parseInt(seederMatch[1], 10) : 10;
      const size = sizeMatch ? sizeToBytes(sizeMatch[1]) : 1024 * 1024 * 1024;
      const tracker = trackerMatch ? trackerMatch[1].trim() : 'TorrentsDB';

      results.push({
        title: filename,
        infoHash,
        fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : 0,
        size,
        seeders,
        tracker,
        sourceProvider: tracker || 'TorrentsDB',
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Scraper 2: ThePirateBay (apibay.org)
 */
async function scrapeApibay(
  imdbId: string,
  mediaTitle: string,
  year: string,
  season?: number,
  episode?: number,
  isSeries?: boolean
): Promise<ScrapedTorrent[]> {
  try {
    const pad2 = (n: number) => String(n).padStart(2, '0');
    let query = imdbId;

    if (isSeries && season !== undefined && episode !== undefined) {
      query = `${mediaTitle} S${pad2(season)}E${pad2(episode)}`;
    }

    const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const items = await res.json() as Array<Record<string, unknown>>;
    if (!Array.isArray(items) || items.length === 0 || items[0]?.name === 'No results returned') {
      return [];
    }

    const results: ScrapedTorrent[] = [];
    for (const item of items) {
      const infoHash = (typeof item.info_hash === 'string' ? item.info_hash : '').toLowerCase().trim();
      if (!infoHash || infoHash.length !== 40) continue;

      const title = typeof item.name === 'string' ? item.name : 'Unknown';
      const seeders = parseInt(String(item.seeders || '0'), 10) || 0;
      const size = parseInt(String(item.size || '0'), 10) || 1024 * 1024 * 1024;

      results.push({
        title,
        infoHash,
        fileIdx: 0,
        size,
        seeders,
        tracker: 'The Pirate Bay',
        sourceProvider: 'The Pirate Bay',
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Scraper 3: EZTV API for TV Series
 */
async function scrapeEZTV(imdbId: string, season?: number, episode?: number): Promise<ScrapedTorrent[]> {
  if (!imdbId || season === undefined || episode === undefined) return [];
  const cleanNum = imdbId.replace('tt', '');
  const url = `https://eztvx.to/api/get-torrents?imdb_id=${cleanNum}&limit=100`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json() as { torrents?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.torrents)) return [];

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const targetTag = `s${pad2(season)}e${pad2(episode)}`;
    const results: ScrapedTorrent[] = [];

    for (const t of data.torrents) {
      const title = String(t.title || '');
      const lower = title.toLowerCase();
      const sNum = parseInt(String(t.season || '0'), 10);
      const eNum = parseInt(String(t.episode || '0'), 10);

      const isMatch = (sNum === season && eNum === episode) || lower.includes(targetTag);
      if (!isMatch) continue;

      const infoHash = String(t.hash || '').toLowerCase().trim();
      if (!infoHash || infoHash.length !== 40) continue;

      const seeders = parseInt(String(t.seeds || '0'), 10) || 1;
      const size = parseInt(String(t.size_bytes || '0'), 10) || 1024 * 1024 * 1024;

      results.push({
        title,
        infoHash,
        fileIdx: 0,
        size,
        seeders,
        tracker: 'EZTV',
        sourceProvider: 'EZTV',
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Scraper 4: YTS API for Movies
 */
async function scrapeYTS(imdbId: string): Promise<ScrapedTorrent[]> {
  if (!imdbId || !imdbId.startsWith('tt')) return [];
  const mirrors = ['https://yts.lt', 'https://yts.mx', 'https://yts.am'];

  for (const mirror of mirrors) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${mirror}/api/v2/list_movies.json?query_term=${imdbId}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json() as { data?: { movies?: Array<{ title?: string; year?: number; torrents?: Array<Record<string, unknown>> }> } };
      const movie = data.data?.movies?.[0];
      if (!movie || !Array.isArray(movie.torrents)) continue;

      const results: ScrapedTorrent[] = [];
      for (const tor of movie.torrents) {
        const hash = String(tor.hash || '').toLowerCase().trim();
        if (!hash || hash.length !== 40) continue;

        const qual = String(tor.quality || '1080p');
        const torType = String(tor.type || 'bluray');
        const title = `${movie.title || 'Movie'}.${movie.year || ''}.${qual}.${torType}.YTS.mp4`;
        const seeders = parseInt(String(tor.seeds || '0'), 10) || 10;
        const size = parseInt(String(tor.size_bytes || '0'), 10) || sizeToBytes(String(tor.size || ''));

        results.push({
          title,
          infoHash: hash,
          fileIdx: 0,
          size,
          seeders,
          tracker: 'YTS',
          sourceProvider: 'YTS',
        });
      }

      if (results.length > 0) return results;
    } catch {
      continue;
    }
  }

  return [];
}

/**
 * Scraper 5: AnimeTosho for Anime
 */
async function scrapeAnimeTosho(query: string): Promise<ScrapedTorrent[]> {
  if (!query || query.length < 3) return [];
  const url = `https://feed.animetosho.org/json?only_tor=1&q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const items = await res.json() as Array<Record<string, unknown>>;
    if (!Array.isArray(items)) return [];

    const results: ScrapedTorrent[] = [];
    for (const item of items) {
      const infoHash = String(item.info_hash || '').toLowerCase().trim();
      if (!infoHash || infoHash.length !== 40) continue;

      const title = String(item.title || 'Anime Release');
      const seeders = parseInt(String(item.seeders || '0'), 10) || 5;
      const size = parseInt(String(item.total_size || '0'), 10) || 1024 * 1024 * 1024;

      results.push({
        title,
        infoHash,
        fileIdx: 0,
        size,
        seeders,
        tracker: 'AnimeTosho',
        sourceProvider: 'AnimeTosho',
        isAnime: true,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Scraper 6: Comet High-Performance Multi-Source Scraper
 * Aggregates StremThru, Zilean, DMM, Bitmagnet, Torrentio, TorBox, PeerFlix, etc.
 * Supports both P2P torrents and instant Debrid streams.
 */
export async function scrapeComet(
  mediaType: string,
  cleanId: string,
  debridService?: string,
  debridApiKey?: string,
  customCometUrl?: string
): Promise<ScrapedTorrent[]> {
  const mirrors: string[] = [];
  if (customCometUrl && customCometUrl.trim()) {
    mirrors.push(customCometUrl.trim());
  }
  // Public high-capacity Comet nodes
  mirrors.push('https://comet.feels.legal');
  mirrors.push('https://comet.fastforward.cloud');

  const hasDebrid = Boolean(debridService && debridService !== 'none' && debridApiKey);

  // Configure Comet request settings
  const cometSettings = {
    enableTorrent: true,
    ...(hasDebrid ? { debridServices: [{ service: debridService, apiKey: debridApiKey }] } : {}),
    maxResultsPerResolution: 0, // No artificial cap: get all discovered releases
    cachedOnly: false,
    removeTrash: false,
    resultFormat: ['all'],
  };
  const b64 = Buffer.from(JSON.stringify(cometSettings)).toString('base64');

  for (const baseUrl of mirrors) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const candidateUrls = [
      `${cleanBase}/${b64}/stream/${mediaType}/${cleanId}.json`,
      `${cleanBase}/stream/${mediaType}/${cleanId}.json`,
    ];

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const data = await res.json() as { streams?: Array<Record<string, unknown>> };
        if (!Array.isArray(data.streams) || data.streams.length === 0) continue;

        const results: ScrapedTorrent[] = [];
        for (const s of data.streams) {
          const name = String(s.name || '');
          if (name.includes('⛔️') || name.includes('Disabled')) continue;

          const desc = String(s.description || s.title || '');
          const infoHash = String(s.infoHash || '').toLowerCase().trim();
          const directUrl = typeof s.url === 'string' && s.url.startsWith('http') ? s.url : undefined;

          if (!infoHash && !directUrl) continue;
          if (infoHash && infoHash.length !== 40 && !directUrl) continue;

          // Extract clean filename
          let filename = '';
          if (typeof s.behaviorHints === 'object' && s.behaviorHints && typeof (s.behaviorHints as Record<string, unknown>).filename === 'string') {
            filename = String((s.behaviorHints as Record<string, unknown>).filename);
          }
          if (!filename) {
            const pageMatch = desc.match(/📄\s*([^\n\r]+)/);
            if (pageMatch && pageMatch[1]) {
              filename = pageMatch[1].trim();
            } else {
              filename = desc.split('\n')[0] || name || 'Stream';
            }
          }

          // Extract sub-tracker name from 🔎
          const trackerMatch = desc.match(/🔎\s*([^\n\r]+)/);
          const rawTracker = trackerMatch ? trackerMatch[1].trim() : 'Comet';
          const tracker = cleanTrackerName(rawTracker);

          // Extract exact size
          let size = 0;
          if (typeof s.behaviorHints === 'object' && s.behaviorHints && typeof (s.behaviorHints as Record<string, unknown>).videoSize === 'number') {
            size = Number((s.behaviorHints as Record<string, unknown>).videoSize);
          }
          if (!size || size <= 0) {
            const sizeMatch = desc.match(/💾\s*([\d.]+\s*[KMGT]?B)/i);
            if (sizeMatch && sizeMatch[1]) {
              size = sizeToBytes(sizeMatch[1]);
            } else {
              size = 1024 * 1024 * 1024;
            }
          }

          // Extract or estimate seeders
          let seeders = typeof s.seeders === 'number' ? s.seeders : 0;
          if (!seeders) {
            const seederMatch = desc.match(/👤\s*(\d+)/);
            if (seederMatch && seederMatch[1]) {
              seeders = parseInt(seederMatch[1], 10);
            } else {
              seeders = filename.toLowerCase().includes('remux') ? 45 : 25;
            }
          }

          const isDirectDebrid = Boolean(directUrl || name.includes('[RD+]') || name.includes('[TB+]') || name.includes('[AD+]'));

          results.push({
            title: filename,
            infoHash: infoHash || (directUrl ? `debrid-${Math.random().toString(36).slice(2, 10)}` : ''),
            fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : 0,
            size,
            seeders,
            tracker,
            sourceProvider: tracker,
            directUrl,
            isPreResolvedDebrid: isDirectDebrid,
          });
        }

        if (results.length > 0) {
          return results;
        }
      } catch {
        continue;
      }
    }
  }

  return [];
}

/**
 * Check Instant Availability with Debrid providers (Real-Debrid, TorBox, AllDebrid, etc.)
 * Enhanced with 6-hour memory cache to reduce repetitive external API calls to 0ms
 */
async function checkDebridCache(
  hashes: string[],
  debridService: string,
  apiKey: string
): Promise<Set<string>> {
  const cachedSet = new Set<string>();
  if (!apiKey || !debridService || debridService === 'none' || hashes.length === 0) {
    return cachedSet;
  }

  const cleanKey = apiKey.trim();
  const now = Date.now();
  const hashesToQuery: string[] = [];

  // Check in-memory cache first
  for (const h of hashes) {
    const lower = h.toLowerCase().trim();
    if (!lower || lower.length !== 40) continue;
    const cacheKey = `${debridService}:${lower}`;
    const cachedEntry = debridAvailabilityCache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.timestamp < DEBRID_CACHE_TTL) {
      if (cachedEntry.cached) {
        cachedSet.add(lower);
      }
    } else {
      hashesToQuery.push(lower);
    }
  }

  if (hashesToQuery.length === 0) {
    return cachedSet;
  }

  try {
    if (debridService === 'realdebrid') {
      // Real-Debrid allows batch check up to 40 hashes
      const batch = hashesToQuery.slice(0, 40);
      const url = `https://api.real-debrid.com/rest/1.0/torrents/instantAvailability/${batch.join('/')}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json() as Record<string, { rd?: unknown[] }>;
        for (const [hash, info] of Object.entries(data)) {
          const lowerHash = hash.toLowerCase();
          const isInstant = Boolean(info && Array.isArray(info.rd) && info.rd.length > 0);
          if (isInstant) {
            cachedSet.add(lowerHash);
          }
          debridAvailabilityCache.set(`${debridService}:${lowerHash}`, { cached: isInstant, timestamp: now });
        }
      }
    } else if (debridService === 'torbox') {
      // TorBox checkcached endpoint
      const hashStr = hashesToQuery.slice(0, 30).join(',');
      const url = `https://api.torbox.app/v1/api/torrents/checkcached?hash=${hashStr}&format=list`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json() as { data?: Array<{ hash?: string }> };
        const foundHashes = new Set<string>();
        if (Array.isArray(data.data)) {
          for (const item of data.data) {
            if (item.hash) {
              const lower = item.hash.toLowerCase();
              cachedSet.add(lower);
              foundHashes.add(lower);
              debridAvailabilityCache.set(`${debridService}:${lower}`, { cached: true, timestamp: now });
            }
          }
        }
        for (const h of hashesToQuery.slice(0, 30)) {
          if (!foundHashes.has(h)) {
            debridAvailabilityCache.set(`${debridService}:${h}`, { cached: false, timestamp: now });
          }
        }
      }
    } else if (debridService === 'alldebrid') {
      // AllDebrid instant magnet check
      const queryParams = hashesToQuery.slice(0, 30).map((h) => `magnets[]=${h}`).join('&');
      const url = `https://api.alldebrid.com/v4/magnet/instant?agent=magnetio&apikey=${cleanKey}&${queryParams}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json() as { data?: { magnets?: Array<{ hash?: string; instant?: boolean }> } };
        if (Array.isArray(data.data?.magnets)) {
          for (const m of data.data.magnets) {
            if (m.hash) {
              const lower = m.hash.toLowerCase();
              const isInstant = Boolean(m.instant);
              if (isInstant) cachedSet.add(lower);
              debridAvailabilityCache.set(`${debridService}:${lower}`, { cached: isInstant, timestamp: now });
            }
          }
        }
      }
    }
  } catch {
    // If availability check fails, keep set with cached items
  }

  return cachedSet;
}

/**
 * Filter streams based on user's FilterConfig
 */
export function applyFilters(streams: NormalizedStream[], config: UserConfig): NormalizedStream[] {
  const { filters } = config;
  const minBytes = (filters.minSizeGb && filters.minSizeGb > 0) ? filters.minSizeGb * 1024 * 1024 * 1024 : 0;
  const maxBytes = filters.videoSizeLimitGb
    ? filters.videoSizeLimitGb * 1024 * 1024 * 1024
    : (filters.maxSizeGb && filters.maxSizeGb > 0 ? filters.maxSizeGb * 1024 * 1024 * 1024 : Number.MAX_SAFE_INTEGER);

  const excluded = (filters.excludedKeywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean);
  const excludeResNormalized = (filters.excludeResolutions || []).map((r) => normalizeResolutionName(r));
  const excludeQualNormalized = (filters.excludeQuality || []).map((q) => normalizeQualityName(q));
  const allowedProviders = filters.providers || [];
  const isFilteringProviders = allowedProviders.length > 0 && allowedProviders.length < ALL_TORRENT_PROVIDERS.length;

  return streams.filter((stream) => {
    // 0. Provider check (only if user explicitly unchecked some providers)
    if (isFilteringProviders && !stream.isDebrid) {
      const pName = (stream.providerName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const releaseGrp = (stream.releaseGroup || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matched = allowedProviders.some((ap) => {
        const cleanAp = ap.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanAp === 'rarbg') return pName.includes('rarbg') || pName.includes('rargb') || releaseGrp.includes('rarbg');
        if (cleanAp === 'thepiratebay') return pName.includes('pirate') || pName.includes('tpb') || pName.includes('apibay');
        if (cleanAp === 'torrentgalaxy') return pName.includes('galaxy') || pName.includes('tgx') || releaseGrp.includes('tgx');
        if (cleanAp === 'kickasstorrents') return pName.includes('kickass') || pName.includes('kat');
        if (cleanAp === 'nyaasi') return pName.includes('nyaa') || pName.includes('anime');
        if (cleanAp === 'torrentsdb' || cleanAp === 'comet' || cleanAp === 'stremthru' || cleanAp === 'zilean' || cleanAp === 'dmm' || cleanAp === 'bitmagnet') return true;
        return pName.includes(cleanAp) || cleanAp.includes(pName) || releaseGrp.includes(cleanAp);
      });
      if (!matched) {
        return false;
      }
    }

    // 0.1 Debrid P2P & download links preference
    const debridActive = config.filters.selectedDebrid && config.filters.selectedDebrid !== 'none';
    if (debridActive) {
      // If user disabled P2P for uncached, filter out uncached non-debrid torrents
      if (config.filters.showP2PForUncached === false && !stream.cached) {
        return false;
      }
      // If user enabled dontShowDownloadLinks, filter out uncached debrid download queues
      if (config.filters.dontShowDownloadLinks && stream.isDebrid && !stream.cached) {
        return false;
      }
    }

    // 1. Exclude Resolutions check
    if (excludeResNormalized.length > 0) {
      const streamResNorm = normalizeResolutionName(stream.resolution || '');
      if (excludeResNormalized.includes(streamResNorm)) {
        return false;
      }

      const filename = stream.filename || '';
      for (const er of excludeResNormalized) {
        const regex = AIOSTREAMS_RESOLUTION_REGEX[er];
        if (regex && regex.test(filename)) {
          return false;
        }
      }
    }

    // 2. Exclude Quality check
    if (excludeQualNormalized.length > 0) {
      const streamQualNorm = normalizeQualityName(stream.quality || '');
      if (excludeQualNormalized.includes(streamQualNorm)) {
        return false;
      }

      const filename = stream.filename || '';
      for (const eq of excludeQualNormalized) {
        const regex = AIOSTREAMS_QUALITY_REGEX[eq];
        if (regex && regex.test(filename)) {
          return false;
        }
      }
    }

    // 3. Resolution whitelist check (only if user explicitly selected a restricted subset)
    if (filters.resolutions && filters.resolutions.length > 0 && filters.resolutions.length < 5) {
      const streamResNorm = normalizeResolutionName(stream.resolution || '');
      const allowedResNorm = filters.resolutions.map((r) => normalizeResolutionName(r));
      if (!allowedResNorm.includes(streamResNorm)) {
        return false;
      }
    }

    // 4. Size bounds
    if (stream.size < minBytes || stream.size > maxBytes) {
      return false;
    }

    // 5. Excluded keywords with word boundary check
    const lowerFilename = (stream.filename + ' ' + stream.quality).toLowerCase();
    for (const word of excluded) {
      if (!word) continue;
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${word.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}([^a-zA-Z0-9]|$)`, 'i');
      if (regex.test(lowerFilename)) {
        return false;
      }
    }

    return true;
  });
}

const QUALITY_SCORE_MAP: Record<string, number> = {
  'BluRay REMUX': 140,
  'DVD REMUX': 130,
  'BluRay': 120,
  'WEB-DL': 110,
  'WEBRip': 100,
  'HDRip': 90,
  'HC HD-Rip': 80,
  'HDTV': 70,
  'DVDRip': 60,
  'TC': 50,
  'TS': 40,
  'CAM': 30,
  'SCR': 20,
  'Unknown': 10,
};

function getFeatureScore(stream: NormalizedStream): number {
  let score = 0;
  const hdr = (stream.hdr || '').toLowerCase();
  if (hdr.includes('vision') || hdr.includes('dv')) score += 40;
  else if (hdr.includes('hdr10+')) score += 30;
  else if (hdr.includes('hdr')) score += 20;

  const audio = (stream.audioTags || []).join(' ').toLowerCase();
  if (audio.includes('atmos')) score += 25;
  if (audio.includes('truehd') || audio.includes('dts-hd') || audio.includes('flac')) score += 15;
  if (audio.includes('ddp5.1') || audio.includes('5.1') || audio.includes('7.1')) score += 10;

  return score;
}

/**
 * Sort streams based on user's Primary Sort Order (AIOStreams sorting engine)
 */
export function applySorting(streams: NormalizedStream[], config: UserConfig): NormalizedStream[] {
  const { priorityLanguage, primarySortOrder, resolutionSortOrder } = config.filters;

  const resOrder = resolutionSortOrder && resolutionSortOrder.length > 0
    ? resolutionSortOrder
    : ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', 'Unknown'];

  const getResScore = (res: string): number => {
    const norm = normalizeResolutionName(res);
    const idx = resOrder.indexOf(norm);
    if (idx !== -1) {
      return resOrder.length - idx;
    }
    if (norm === '2160p') return 8;
    if (norm === '1440p') return 7;
    if (norm === '1080p') return 6;
    if (norm === '720p') return 5;
    if (norm === '480p') return 4;
    if (norm === '360p') return 3;
    if (norm === '240p') return 2;
    return 1;
  };

  const getQualScore = (qual: string): number => {
    const norm = normalizeQualityName(qual);
    return QUALITY_SCORE_MAP[norm] || 10;
  };

  const criteria = primarySortOrder && primarySortOrder.length > 0
    ? primarySortOrder
    : ['cached', 'resolution', 'quality', 'language', 'seeders', 'size', 'features', 'provider'];

  return [...streams].sort((a, b) => {
    for (const criterion of criteria) {
      if (criterion === 'cached') {
        if (a.cached !== b.cached) {
          return a.cached ? -1 : 1;
        }
      } else if (criterion === 'resolution') {
        const rScoreA = getResScore(a.resolution);
        const rScoreB = getResScore(b.resolution);
        if (rScoreA !== rScoreB) {
          return rScoreB - rScoreA;
        }
      } else if (criterion === 'quality') {
        const qScoreA = getQualScore(a.quality);
        const qScoreB = getQualScore(b.quality);
        if (qScoreA !== qScoreB) {
          return qScoreB - qScoreA;
        }
      } else if (criterion === 'language') {
        if (priorityLanguage && priorityLanguage !== 'none') {
          const hasLangA = (a.language || []).some((l) => l.toLowerCase().includes(priorityLanguage.toLowerCase()));
          const hasLangB = (b.language || []).some((l) => l.toLowerCase().includes(priorityLanguage.toLowerCase()));
          if (hasLangA !== hasLangB) {
            return hasLangA ? -1 : 1;
          }
        }
      } else if (criterion === 'seeders') {
        if (b.seeders !== a.seeders) {
          return b.seeders - a.seeders;
        }
      } else if (criterion === 'size') {
        if (b.size !== a.size) {
          return b.size - a.size;
        }
      } else if (criterion === 'features') {
        const fScoreA = getFeatureScore(a);
        const fScoreB = getFeatureScore(b);
        if (fScoreA !== fScoreB) {
          return fScoreB - fScoreA;
        }
      } else if (criterion === 'provider') {
        if (a.isDebrid !== b.isDebrid) {
          return a.isDebrid ? -1 : 1;
        }
      }
    }

    if (b.seeders !== a.seeders) return b.seeders - a.seeders;
    return b.size - a.size;
  });
}

/**
 * Torrentio & Comet Duplicate Filtering System:
 * Filters out duplicate torrents by canonical infoHash (40-char hex, case-insensitive).
 * When the same torrent infoHash is returned by multiple providers (e.g. Torrentio, Comet, TorrentsDB):
 * - Keeps the stream with the highest seeder count (max(existing.seeders, incoming.seeders))
 * - Preserves Debrid cached status / direct stream URL if either provider resolved it
 * - Preserves accurate file size and specific file index (fileIdx)
 * - Combines source provider badges (e.g. "1337x • Comet")
 * - Ensures each torrent infoHash appears exactly once in the final results
 */
export function deduplicateStreams(streams: NormalizedStream[]): NormalizedStream[] {
  if (!Array.isArray(streams) || streams.length === 0) return [];

  const uniqueTorrents = new Map<string, NormalizedStream>();
  const nonTorrentStreams: NormalizedStream[] = [];

  for (const stream of streams) {
    const hash = (stream.infoHash || '').toLowerCase().trim();

    // If stream has no valid infoHash (e.g. external HTTP stream), keep as is
    if (!hash || hash.length !== 40) {
      nonTorrentStreams.push(stream);
      continue;
    }

    const existing = uniqueTorrents.get(hash);
    if (!existing) {
      uniqueTorrents.set(hash, { ...stream });
      continue;
    }

    // Torrentio / Comet duplicate resolution:
    // 1. Highest seeders wins
    const maxSeeders = Math.max(existing.seeders || 0, stream.seeders || 0);

    // 2. Cache / Debrid priority (if any source has cached debrid link, retain it)
    const isCached = existing.cached || stream.cached;
    const isDebrid = existing.isDebrid || stream.isDebrid;
    const bestUrl = existing.url || stream.url;

    // 3. Best size representation
    const bestSize = Math.max(existing.size || 0, stream.size || 0);

    // 4. File index (prefer valid non-zero file index)
    const bestFileIdx = (typeof stream.fileIdx === 'number' && stream.fileIdx > 0)
      ? stream.fileIdx
      : (existing.fileIdx || 0);

    // 5. Providers / Source badges
    const existingProviders = (existing.providerName || '').split(/[•+|]/).map((p) => p.trim()).filter(Boolean);
    const incomingProviders = (stream.providerName || '').split(/[•+|]/).map((p) => p.trim()).filter(Boolean);
    const combinedProviders = Array.from(new Set([...existingProviders, ...incomingProviders]));
    const consolidatedProvider = combinedProviders.length > 0
      ? combinedProviders.slice(0, 2).join(' • ')
      : existing.providerName;

    // 6. Merge audio tags if available
    const mergedAudioTags = Array.from(new Set([...(existing.audioTags || []), ...(stream.audioTags || [])]));

    uniqueTorrents.set(hash, {
      ...existing,
      filename: (bestUrl && !existing.url && stream.url) ? stream.filename : existing.filename,
      cached: isCached,
      isDebrid: isDebrid,
      url: bestUrl,
      seeders: maxSeeders,
      size: bestSize,
      sizeFormatted: formatBytes(bestSize),
      fileIdx: bestFileIdx,
      providerName: isDebrid ? existing.providerName : consolidatedProvider,
      audioTags: mergedAudioTags,
      behaviorHints: {
        ...existing.behaviorHints,
        videoSize: bestSize,
        ...(bestFileIdx ? { fileIdx: bestFileIdx } : {}),
      },
    });
  }

  return Array.from(uniqueTorrents.values()).concat(nonTorrentStreams);
}

const DEBRID_NAME_MAP: Record<string, string> = {
  realdebrid: 'Real-Debrid',
  alldebrid: 'AllDebrid',
  premiumize: 'Premiumize',
  debridlink: 'Debrid-Link',
  torbox: 'TorBox',
  easydebrid: 'EasyDebrid',
  debrider: 'Debrider',
  offcloud: 'Offcloud',
  pikpak: 'PikPak',
  seedr: 'Seedr',
  putio: 'put.io',
  torrin: 'Torrin',
};

/**
 * Fetch and aggregate real streams from live indexers and scrapers
 */
export async function generateAggregatedStreams(
  mediaReq: MediaRequest,
  config: UserConfig,
  hostOrigin: string = '',
  configToken: string = ''
): Promise<NormalizedStream[]> {
  const parsed = parseMediaId(mediaReq.type, mediaReq.id);
  const selectedDebridKey = config.filters?.selectedDebrid || 'none';
  const debridObj = selectedDebridKey !== 'none' && config.debrid ? config.debrid[selectedDebridKey] : undefined;
  const debridApiKey = (config.filters?.debridApiKey || debridObj?.apiKey || '').trim();
  const hasDebrid = Boolean(selectedDebridKey !== 'none' && debridApiKey);
  const debridName = selectedDebridKey ? (DEBRID_NAME_MAP[selectedDebridKey] || selectedDebridKey) : 'Debrid';
  const isSeries = mediaReq.type === 'series' || Boolean(parsed.season);

  const cacheKey = `${mediaReq.type}:${parsed.cleanId}`;
  let rawTorrents: ScrapedTorrent[] = [];
  const cachedRaw = rawTorrentsCache.get(cacheKey);

  // Check 45-minute in-memory cache for ultra-fast instant response (<10ms)
  if (cachedRaw && Date.now() - cachedRaw.timestamp < RAW_TORRENTS_CACHE_TTL) {
    rawTorrents = cachedRaw.torrents;
  } else {
    // 1. Launch Cinemeta metadata resolver concurrently at T0
    const metaPromise = fetchCinemetaMetadata(mediaReq.type, parsed.imdbId);

    // 2. Launch ID-based scrapers immediately at T0 without waiting for Cinemeta
    const scraperPromises: Promise<ScrapedTorrent[]>[] = [
      scrapeTorrentsDB(mediaReq.type, parsed.cleanId),
      scrapeComet(mediaReq.type, parsed.cleanId, selectedDebridKey, debridApiKey, config.filters?.cometUrl),
    ];

    if (isSeries && parsed.imdbId) {
      scraperPromises.push(scrapeEZTV(parsed.imdbId, parsed.season, parsed.episode));
    }

    if (!isSeries && parsed.imdbId) {
      scraperPromises.push(scrapeYTS(parsed.imdbId));
    }

    // Scrapers requiring title wait for metaPromise to resolve and fire immediately
    scraperPromises.push(
      metaPromise.then((meta) => {
        const title = meta?.title || (parsed.imdbId ? parsed.imdbId.toUpperCase() : 'Media');
        const year = meta?.year || '';
        return scrapeApibay(parsed.imdbId, title, year, parsed.season, parsed.episode, isSeries);
      }).catch(() => [])
    );

    if (parsed.isAnime || parsed.cleanId.startsWith('kitsu:')) {
      scraperPromises.push(
        metaPromise.then((meta) => {
          const title = meta?.title || (parsed.imdbId ? parsed.imdbId.toUpperCase() : 'Anime');
          return scrapeAnimeTosho(title);
        }).catch(() => [])
      );
    }

    // Await all scrapers concurrently
    const settled = await Promise.allSettled(scraperPromises);
    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        rawTorrents.push(...res.value);
      }
    }

    // Cache the scraped torrents in memory
    if (rawTorrents.length > 0) {
      if (rawTorrentsCache.size > 500) {
        const oldest = rawTorrentsCache.keys().next().value;
        if (oldest) rawTorrentsCache.delete(oldest);
      }
      rawTorrentsCache.set(cacheKey, { torrents: rawTorrents, timestamp: Date.now() });
    }
  }

  // Resolve mediaTitle from Cinemeta or IMDb ID
  const meta = await fetchCinemetaMetadata(mediaReq.type, parsed.imdbId);
  const mediaTitle = meta?.title || (parsed.imdbId ? parsed.imdbId.toUpperCase() : 'Media');

  // 3. Batch check Debrid caching for collected infoHashes
  // In P2P mode (no Debrid key), bypass Debrid check completely (0ms latency!)
  const hashesToCheck = Array.from(new Set(rawTorrents.map((t) => t.infoHash).filter(Boolean)));
  const cachedHashes = hasDebrid
    ? await checkDebridCache(hashesToCheck, selectedDebridKey, debridApiKey)
    : new Set<string>();

  const baseOrigin = hostOrigin || 'http://127.0.0.1:3000';
  const tokenPrefix = configToken ? `/${configToken}` : '';

  // 4. Transform into NormalizedStream
  const normalizedList: NormalizedStream[] = rawTorrents.map((t, idx) => {
    const metaParsed = parseTorrentMetadata(t.title, t.tracker);
    const isCachedOnDebrid = cachedHashes.has(t.infoHash.toLowerCase()) || Boolean(t.isPreResolvedDebrid);
    const isDebridStream = hasDebrid && isCachedOnDebrid;

    const playUrl = isDebridStream
      ? (t.directUrl || `${baseOrigin}${tokenPrefix}/playback/${selectedDebridKey}/${t.infoHash}/${t.fileIdx || 0}`)
      : undefined;

    const providerDisplay = isDebridStream
      ? `${debridName} [${selectedDebridKey === 'realdebrid' ? 'RD+' : 'Cached'}]`
      : t.tracker;

    return {
      id: `stream-${t.infoHash}-${idx}`,
      title: mediaTitle,
      filename: t.title,
      size: t.size,
      sizeFormatted: formatBytes(t.size),
      seeders: t.seeders,
      resolution: metaParsed.resolution,
      quality: metaParsed.quality,
      codec: metaParsed.codec,
      hdr: metaParsed.hdr,
      audioTags: metaParsed.audioTags,
      releaseGroup: metaParsed.releaseGroup,
      language: metaParsed.languages,
      infoHash: t.infoHash,
      cached: isCachedOnDebrid,
      providerName: providerDisplay,
      isDebrid: isDebridStream,
      url: playUrl,
      fileIdx: t.fileIdx || 0,
      behaviorHints: {
        bingeGroup: `magnetio-${metaParsed.resolution.toLowerCase()}`,
        filename: t.title,
        videoSize: t.size,
      },
    };
  });

  return normalizedList;
}

/**
 * Primary stream resolution pipeline:
 * 1. Fetch / aggregate streams from real providers
 * 2. Deduplicate
 * 3. Filter (with dead torrent filtering for P2P mode)
 * 4. Sort
 * 5. Limit per resolution
 * 6. Format with User's Custom Formatter Template
 * 7. Inject high-performance DHT & Trackers for P2P streams
 */
export async function resolveAndFormatStreams(
  mediaReq: MediaRequest,
  config: UserConfig,
  hostOrigin: string = '',
  configToken: string = ''
): Promise<StremioStreamResponse[]> {
  const selectedDebridKey = config.filters?.selectedDebrid || 'none';
  const debridObj = selectedDebridKey !== 'none' && config.debrid ? config.debrid[selectedDebridKey] : undefined;
  const debridApiKey = (config.filters?.debridApiKey || debridObj?.apiKey || '').trim();
  const hasDebrid = Boolean(selectedDebridKey !== 'none' && debridApiKey);

  // Aggregate real streams from providers (uses multi-tier cache)
  const rawStreams = await generateAggregatedStreams(mediaReq, config, hostOrigin, configToken);

  // Deduplicate using standard Torrentio & Comet infoHash deduplication system
  const uniqueStreams = deduplicateStreams(rawStreams);

  // Filter
  let filteredStreams = applyFilters(uniqueStreams, config);

  // In P2P mode (no Debrid), filter out dead torrents (0 seeders) if active seeds exist
  if (!hasDebrid) {
    const hasHealthySeeds = filteredStreams.some((s) => (s.seeders || 0) > 0);
    if (hasHealthySeeds) {
      filteredStreams = filteredStreams.filter((s) => (s.seeders || 0) > 0);
    }
  }

  // Sort
  const sortedStreams = applySorting(filteredStreams, config);

  // Max streams per resolution limit (0 = Unlimited / All available streams, matching Torrentio & Comet)
  const maxPerRes =
    typeof config.filters?.maxStreamsPerResolution === 'number' && config.filters.maxStreamsPerResolution > 0
      ? config.filters.maxStreamsPerResolution
      : 0;

  let limitedStreams: NormalizedStream[] = [];
  if (maxPerRes === 0) {
    limitedStreams = sortedStreams;
  } else {
    const countByRes: Record<string, number> = {};
    for (const s of sortedStreams) {
      const current = countByRes[s.resolution] || 0;
      if (current < maxPerRes) {
        countByRes[s.resolution] = current + 1;
        limitedStreams.push(s);
      }
    }
  }

  // Format using Custom Formatter
  const nameTpl = config.formatter?.nameTemplate || '[Magnetio] {stream.resolution}';
  const descTpl = config.formatter?.descriptionTemplate || '{stream.filename}\n💾 {stream.size} • 👤 {stream.seeders} • ⚙️ {stream.provider}';

  return limitedStreams.map((stream) => {
    const formattedName = formatTemplate(nameTpl, stream);
    const formattedDesc = formatTemplate(descTpl, stream);

    const res: StremioStreamResponse = {
      name: formattedName,
      title: formattedDesc,
      behaviorHints: {
        bingeGroup: `magnetio-${stream.resolution.toLowerCase()}`,
        filename: stream.filename,
        videoSize: stream.size,
        notWebReady: false,
      },
    };

    if (stream.url) {
      // Debrid HTTP Stream: Use URL directly
      res.url = stream.url;
    } else {
      // Direct P2P Torrent Stream: Pass infoHash, file index, and inject fast public trackers
      res.infoHash = stream.infoHash;
      res.fileIdx = stream.fileIdx || 0;
      res.sources = [
        `dht:${stream.infoHash}`,
        ...FAST_PUBLIC_TRACKERS,
      ];
    }

    return res;
  });
}
