import { DEFAULT_FORMATTER_PRESETS } from './formatter';
import {
  UserConfig,
  ALL_TORRENT_PROVIDERS,
  AIOSTREAMS_DEFAULT_EXCLUDED_QUALITIES,
  DEFAULT_PRIMARY_SORT_ORDER,
  DEFAULT_RESOLUTION_SORT_ORDER,
  normalizeQualityName,
  normalizeResolutionName,
} from '../types/magnetio';

export const DEFAULT_USER_CONFIG: UserConfig = {
  version: 1,
  addonName: 'Magnetio',
  debrid: {
    realdebrid: {
      id: 'realdebrid',
      name: 'Real-Debrid',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    alldebrid: {
      id: 'alldebrid',
      name: 'AllDebrid',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    premiumize: {
      id: 'premiumize',
      name: 'Premiumize',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    torbox: {
      id: 'torbox',
      name: 'TorBox',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    debridlink: {
      id: 'debridlink',
      name: 'Debrid-Link',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    offcloud: {
      id: 'offcloud',
      name: 'Offcloud',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    pikpak: {
      id: 'pikpak',
      name: 'PikPak',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    easydebrid: {
      id: 'easydebrid',
      name: 'EasyDebrid',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    debrider: {
      id: 'debrider',
      name: 'Debrider',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    seedr: {
      id: 'seedr',
      name: 'Seedr',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    putio: {
      id: 'putio',
      name: 'put.io',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
    torrin: {
      id: 'torrin',
      name: 'Torrin',
      enabled: false,
      apiKey: '',
      cachedOnly: true,
    },
  },
  indexers: {
    enablePublicScrapers: true,
    enableProwlarr: false,
    prowlarrUrl: '',
    prowlarrApiKey: '',
    enableJackett: false,
    jackettUrl: '',
    jackettApiKey: '',
  },
  filters: {
    providers: ALL_TORRENT_PROVIDERS.map((p) => p.id),
    resolutions: ['4K', '1080p', '720p', '480p'],
    maxStreamsPerResolution: 0, // 0 = No limit (returns all results, exactly like Torrentio & Comet)
    sortOrder: 'quality_then_seeders',
    primarySortOrder: [...DEFAULT_PRIMARY_SORT_ORDER],
    resolutionSortOrder: [...DEFAULT_RESOLUTION_SORT_ORDER],
    priorityLanguage: 'none',
    excludeResolutions: [],
    excludeQuality: [...AIOSTREAMS_DEFAULT_EXCLUDED_QUALITIES],
    videoSizeLimitGb: null,
    minSizeGb: 0,
    maxSizeGb: 0, // 0 = No limit (allows all high-bitrate 70GB+ REMUX releases)
    excludedKeywords: ['CAM', 'TELESYNC', 'TS', 'HDCAM'],
    filterAdult: true,
    enableAnime: true,
    preferredLanguages: ['en'],
    selectedDebrid: 'none',
    debridApiKey: '',
    dontShowDownloadLinks: false,
    showP2PForUncached: true,
    cometUrl: 'https://comet.feels.legal',
  },
  formatter: {
    nameTemplate: '{stream.resolution::exists["{stream.resolution}"||""]}',
    descriptionTemplate:
      '{stream.title::exists["{stream.title} "||""]} {stream.seasonEpisode::exists["{stream.seasonEpisode::join(\' \')} "||""]} {stream.resolution::exists["{stream.resolution}"||""]}\n{stream.quality::exists["{stream.quality} "||""]} {stream.encode::exists["{stream.encode} "||""]} {stream.visualTags::exists["{stream.visualTags::join(\' | \')} "||""]}{stream.audioChannels::exists["{stream.audioChannels::join(\' | \')}"||""]}',
  },
};

/**
 * Encodes UserConfig into a URL-safe Base64 string
 */
export function encodeConfig(config: UserConfig): string {
  try {
    const jsonStr = JSON.stringify(config);
    // Standard Base64 then URL safe conversion
    if (typeof window !== 'undefined') {
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else {
      const buffer = Buffer.from(jsonStr, 'utf-8');
      return buffer.toString('base64url');
    }
  } catch (err) {
    console.error('Error encoding config:', err);
    return '';
  }
}

/**
 * Decodes URL-safe Base64 string back into UserConfig
 */
export function decodeConfig(token: string): UserConfig {
  try {
    if (!token) return { ...DEFAULT_USER_CONFIG };
    // Restore padding and standard characters
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    let jsonStr = '';
    if (typeof window !== 'undefined') {
      jsonStr = decodeURIComponent(escape(atob(base64)));
    } else {
      jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_USER_CONFIG };
    }

    const mergedFilters = {
      ...DEFAULT_USER_CONFIG.filters,
      ...(parsed.filters || {}),
      primarySortOrder:
        Array.isArray(parsed.filters?.primarySortOrder) && parsed.filters.primarySortOrder.length > 0
          ? parsed.filters.primarySortOrder
          : [...DEFAULT_PRIMARY_SORT_ORDER],
      resolutionSortOrder:
        Array.isArray(parsed.filters?.resolutionSortOrder) && parsed.filters.resolutionSortOrder.length > 0
          ? parsed.filters.resolutionSortOrder
          : [...DEFAULT_RESOLUTION_SORT_ORDER],
      excludeResolutions: (
        parsed.filters?.excludeResolutions || DEFAULT_USER_CONFIG.filters.excludeResolutions || []
      ).map((r: string) => normalizeResolutionName(r)),
      excludeQuality: (
        parsed.filters?.excludeQuality || DEFAULT_USER_CONFIG.filters.excludeQuality
      ).map((q: string) => normalizeQualityName(q)),
    };

    const mergedDebrid = {
      ...DEFAULT_USER_CONFIG.debrid,
      ...(parsed.debrid || {}),
    };

    // Ensure selectedDebrid and debrid map stay synchronized
    const activeDebridId = mergedFilters.selectedDebrid;
    if (activeDebridId && activeDebridId !== 'none' && mergedDebrid[activeDebridId]) {
      mergedDebrid[activeDebridId] = {
        ...mergedDebrid[activeDebridId],
        enabled: true,
        apiKey: mergedFilters.debridApiKey || mergedDebrid[activeDebridId].apiKey || '',
      };
    }

    return {
      ...DEFAULT_USER_CONFIG,
      ...parsed,
      addonName: typeof parsed.addonName === 'string' && parsed.addonName.trim() ? parsed.addonName.trim() : DEFAULT_USER_CONFIG.addonName,
      debrid: mergedDebrid,
      indexers: {
        ...DEFAULT_USER_CONFIG.indexers,
        ...(parsed.indexers || {}),
      },
      filters: mergedFilters,
      formatter: {
        ...DEFAULT_USER_CONFIG.formatter,
        ...(parsed.formatter || {}),
      },
    };
  } catch (err) {
    console.warn('Failed to parse config token, fallback to default:', err);
    return { ...DEFAULT_USER_CONFIG };
  }
}
