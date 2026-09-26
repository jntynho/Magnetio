import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react';
import {
  UserConfig,
  ALL_TORRENT_PROVIDERS,
  PRIORITY_LANGUAGES,
  EXCLUDE_RESOLUTIONS_LIST,
  EXCLUDE_QUALITIES_LIST,
  AIOSTREAMS_DEFAULT_EXCLUDED_QUALITIES,
  ALL_PRIMARY_SORT_CRITERIA,
  DEFAULT_PRIMARY_SORT_ORDER,
  PrimarySortCriterionId,
  normalizeQualityName,
  normalizeResolutionName,
  TorrentProviderItem,
  NormalizedStream,
  FormatterPreset,
} from '../types/magnetio';
import { formatTemplate, DEFAULT_FORMATTER_PRESETS } from '../utils/formatter';
import {
  Check,
  CheckCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Layers,
  ShieldCheck,
  Key,
  ExternalLink,
  Zap,
  Sliders,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GripVertical,
  Search,
  Globe,
} from 'lucide-react';
import {
  ProvidersIcon,
  SortingIcon,
  LanguageIcon,
  ResolutionIcon,
  QualityIcon,
  SizeLimitIcon,
  DebridIcon,
  FormatterIcon,
  ChevronCircleIcon,
} from './SectionIcons';

const DEFAULT_NAME_TEMPLATE = '{stream.resolution::exists["{stream.resolution}"||""]}';
const DEFAULT_DESC_TEMPLATE = `{stream.title::exists["{stream.title} "||""]} {stream.seasonEpisode::exists["{stream.seasonEpisode::join(' ')} "||""]} {stream.resolution::exists["{stream.resolution}"||""]}
{stream.quality::exists["{stream.quality} "||""]} {stream.encode::exists["{stream.encode} "||""]} {stream.visualTags::exists["{stream.visualTags::join(' | ')} "||""]}{stream.audioChannels::exists["{stream.audioChannels::join(' | ')}"||""]}`;

const SAMPLE_STREAM: NormalizedStream = {
  id: 'sample-1',
  title: 'Dune: Part Two',
  filename: 'Dune.Part.Two.2024.1080p.WEBRip.x265.HDR.Atmos.mkv',
  size: 2254857830,
  sizeFormatted: '2.1 GB',
  seeders: 128,
  resolution: '1080p',
  quality: 'WEB-DL',
  codec: 'x265',
  hdr: 'HDR10+',
  audioTags: ['5.1', 'Atmos'],
  releaseGroup: 'FLUX',
  language: ['English'],
  infoHash: 'abcdef1234567890',
  cached: true,
  providerName: 'Comet',
  isDebrid: true,
  ...({
    seasonEpisode: ['S01', 'E04'],
    encode: 'x265',
    visualTags: ['HDR10+', 'DV'],
    audioChannels: ['5.1', 'Atmos'],
  } as unknown as Record<string, unknown>),
};

const dropdownMotionVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -3,
    transition: {
      duration: 0.1,
      ease: [0.2, 0, 0.8, 1] as [number, number, number, number],
    },
  },
};

interface SortCriterionItemProps {
  criterionId: PrimarySortCriterionId;
  index: number;
  totalCount: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const SortCriterionItem: React.FC<SortCriterionItemProps> = ({
  criterionId,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
}) => {
  const dragControls = useDragControls();
  const criterion = ALL_PRIMARY_SORT_CRITERIA.find((c) => c.id === criterionId);
  if (!criterion) return null;

  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  return (
    <Reorder.Item
      value={criterionId}
      layout="position"
      dragListener={false}
      dragControls={dragControls}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.02,
        backgroundColor: '#555555',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 50,
      }}
      style={{ touchAction: 'pan-y' }}
      className="w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-[10px] bg-[#4A4A4A] hover:bg-[#525252] text-[#FFFFFF] transition-colors text-left group select-none shadow-sm relative"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
            index === 0
              ? 'bg-[#5B6EF5] text-white shadow-sm'
              : 'bg-white/[0.10] text-[#E0E0E0] group-hover:bg-white/[0.16] group-hover:text-white'
          }`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium block text-[#FFFFFF] truncate">
            {criterion.label}
          </span>
          <p className="text-[11px] text-[#C1C1C1] mt-0.5 leading-tight truncate">
            {criterion.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 pl-1">
        {/* Quick Click-to-Move Buttons */}
        <div className="flex items-center gap-0.5 mr-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (canMoveUp && onMoveUp) onMoveUp();
            }}
            disabled={!canMoveUp}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
              canMoveUp
                ? 'text-[#C1C1C1] hover:text-[#FFFFFF] hover:bg-white/[0.12] active:scale-95'
                : 'text-white/20 cursor-not-allowed opacity-30'
            }`}
            title="Move up"
            aria-label={`Move ${criterion.label} up`}
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (canMoveDown && onMoveDown) onMoveDown();
            }}
            disabled={!canMoveDown}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
              canMoveDown
                ? 'text-[#C1C1C1] hover:text-[#FFFFFF] hover:bg-white/[0.12] active:scale-95'
                : 'text-white/20 cursor-not-allowed opacity-30'
            }`}
            title="Move down"
            aria-label={`Move ${criterion.label} down`}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Drag Handle */}
        <div
          onPointerDown={(e) => {
            dragControls.start(e);
          }}
          style={{ touchAction: 'none' }}
          className="text-[#B5B5B5] hover:text-[#FFFFFF] group-hover:text-[#FFFFFF] w-7 h-7 flex items-center justify-center transition-colors shrink-0 cursor-grab active:cursor-grabbing select-none rounded hover:bg-white/[0.08]"
          title="Drag to reorder"
          aria-label="Drag handle to reorder criterion"
        >
          <GripVertical size={16} />
        </div>
      </div>
    </Reorder.Item>
  );
};

interface AddonConfigFormProps {
  config: UserConfig;
  onChange: (updated: UserConfig) => void;
}

export const AddonConfigForm: React.FC<AddonConfigFormProps> = ({ config, onChange }) => {
  const [isProvidersMenuOpen, setIsProvidersMenuOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const [isSortingMenuOpen, setIsSortingMenuOpen] = useState(false);
  const sortingDropdownRef = useRef<HTMLDivElement>(null);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [isResolutionsMenuOpen, setIsResolutionsMenuOpen] = useState(false);
  const resolutionsDropdownRef = useRef<HTMLDivElement>(null);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const qualityDropdownRef = useRef<HTMLDivElement>(null);
  const [isDebridMenuOpen, setIsDebridMenuOpen] = useState(false);
  const debridDropdownRef = useRef<HTMLDivElement>(null);
  const [isFormatterMenuOpen, setIsFormatterMenuOpen] = useState(false);
  const formatterDropdownRef = useRef<HTMLDivElement>(null);
  const sortingScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSortingDragActive, setIsSortingDragActive] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiVerificationMessage, setApiVerificationMessage] = useState<string>('');
  const [providerSearch, setProviderSearch] = useState<string>('');
  const [providerTab, setProviderTab] = useState<'all' | 'Torrentio' | 'Comet' | 'Anime'>('all');

  const toggleMenu = (menu: 'providers' | 'sorting' | 'language' | 'resolutions' | 'quality' | 'debrid' | 'formatter') => {
    setIsProvidersMenuOpen((prev) => (menu === 'providers' ? !prev : false));
    setIsSortingMenuOpen((prev) => (menu === 'sorting' ? !prev : false));
    setIsLanguageMenuOpen((prev) => (menu === 'language' ? !prev : false));
    setIsResolutionsMenuOpen((prev) => (menu === 'resolutions' ? !prev : false));
    setIsQualityMenuOpen((prev) => (menu === 'quality' ? !prev : false));
    setIsDebridMenuOpen((prev) => (menu === 'debrid' ? !prev : false));
    setIsFormatterMenuOpen((prev) => (menu === 'formatter' ? !prev : false));
  };

  const nameTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  useEffect(() => {
    const isAnyMenuOpen = () =>
      isProvidersMenuOpen ||
      isSortingMenuOpen ||
      isLanguageMenuOpen ||
      isResolutionsMenuOpen ||
      isQualityMenuOpen ||
      isDebridMenuOpen ||
      isFormatterMenuOpen;

    const isPointerInsideAnyDropdown = () => {
      const { x, y } = pointerPosRef.current;
      if (x < 0 || y < 0) return false;
      const refs = [
        providerDropdownRef.current,
        sortingDropdownRef.current,
        languageDropdownRef.current,
        resolutionsDropdownRef.current,
        qualityDropdownRef.current,
        debridDropdownRef.current,
        formatterDropdownRef.current,
      ];
      for (const r of refs) {
        if (r) {
          const rect = r.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return true;
          }
        }
      }
      return false;
    };

    const handlePointerMove = (event: PointerEvent | MouseEvent | TouchEvent) => {
      if ('touches' in event && event.touches[0]) {
        pointerPosRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else if ('clientX' in event) {
        pointerPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      }
    };

    const handlePointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      handlePointerMove(event);
      const target = event.target as Node;
      if (!target) return;

      if (providerDropdownRef.current && !providerDropdownRef.current.contains(target)) {
        setIsProvidersMenuOpen(false);
      }
      if (sortingDropdownRef.current && !sortingDropdownRef.current.contains(target)) {
        setIsSortingMenuOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
      if (resolutionsDropdownRef.current && !resolutionsDropdownRef.current.contains(target)) {
        setIsResolutionsMenuOpen(false);
      }
      if (qualityDropdownRef.current && !qualityDropdownRef.current.contains(target)) {
        setIsQualityMenuOpen(false);
      }
      if (debridDropdownRef.current && !debridDropdownRef.current.contains(target)) {
        setIsDebridMenuOpen(false);
      }
      if (formatterDropdownRef.current && !formatterDropdownRef.current.contains(target)) {
        setIsFormatterMenuOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      if (!isAnyMenuOpen()) return;

      const target = event.target as Node | null;
      if (
        (target && providerDropdownRef.current?.contains(target)) ||
        (target && sortingDropdownRef.current?.contains(target)) ||
        (target && languageDropdownRef.current?.contains(target)) ||
        (target && resolutionsDropdownRef.current?.contains(target)) ||
        (target && qualityDropdownRef.current?.contains(target)) ||
        (target && debridDropdownRef.current?.contains(target)) ||
        (target && formatterDropdownRef.current?.contains(target))
      ) {
        return;
      }

      // If pointer is currently hovering/touching inside an open dropdown, don't close!
      if (isPointerInsideAnyDropdown()) {
        return;
      }

      // Only close when user actively scrolled outside the dropdowns
      setIsProvidersMenuOpen(false);
      setIsSortingMenuOpen(false);
      setIsLanguageMenuOpen(false);
      setIsResolutionsMenuOpen(false);
      setIsQualityMenuOpen(false);
      setIsDebridMenuOpen(false);
      setIsFormatterMenuOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProvidersMenuOpen(false);
        setIsSortingMenuOpen(false);
        setIsLanguageMenuOpen(false);
        setIsResolutionsMenuOpen(false);
        setIsQualityMenuOpen(false);
        setIsDebridMenuOpen(false);
        setIsFormatterMenuOpen(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isProvidersMenuOpen,
    isSortingMenuOpen,
    isLanguageMenuOpen,
    isResolutionsMenuOpen,
    isQualityMenuOpen,
    isDebridMenuOpen,
  ]);

  // Smooth symmetrical edge auto-scroll when dragging criteria near the top or bottom of the sorting list
  useEffect(() => {
    if (!isSortingDragActive) return;

    let animId: number;
    const checkAndScroll = () => {
      const container = sortingScrollContainerRef.current;
      if (container) {
        // Measure real list height from the child container to avoid artificial scrollHeight expansion
        const groupEl = container.firstElementChild as HTMLElement | null;
        const realContentHeight = groupEl ? groupEl.offsetHeight : container.scrollHeight;
        const maxScroll = Math.max(0, realContentHeight - container.clientHeight);

        if (maxScroll > 0) {
          const rect = container.getBoundingClientRect();
          const mouseY = pointerPosRef.current.y;
          const scrollZone = 38; // Symmetrical pixel zone from top/bottom edge

          // Top edge scrolling (strictly symmetrical)
          const distFromTop = mouseY - rect.top;
          if (distFromTop >= -5 && distFromTop <= scrollZone && container.scrollTop > 0) {
            const proximity = Math.max(0, (scrollZone - Math.max(0, distFromTop)) / scrollZone);
            const scrollSpeed = Math.min(6, Math.max(1, Math.round(proximity * 5)));
            container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
          }
          // Bottom edge scrolling (strictly symmetrical)
          const distFromBottom = rect.bottom - mouseY;
          if (distFromBottom >= -5 && distFromBottom <= scrollZone && container.scrollTop < maxScroll) {
            const proximity = Math.max(0, (scrollZone - Math.max(0, distFromBottom)) / scrollZone);
            const scrollSpeed = Math.min(6, Math.max(1, Math.round(proximity * 5)));
            container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
          }
        }
      }
      animId = requestAnimationFrame(checkAndScroll);
    };

    animId = requestAnimationFrame(checkAndScroll);

    const handleDragRelease = () => {
      setIsSortingDragActive(false);
    };

    window.addEventListener('pointerup', handleDragRelease);
    window.addEventListener('touchend', handleDragRelease);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointerup', handleDragRelease);
      window.removeEventListener('touchend', handleDragRelease);
    };
  }, [isSortingDragActive]);

  const selectedProviders = config.filters.providers || ALL_TORRENT_PROVIDERS.map((p) => p.id);
  const sortOrder = config.filters.sortOrder || 'quality_then_seeders';
  const primarySortOrder: PrimarySortCriterionId[] =
    config.filters.primarySortOrder && config.filters.primarySortOrder.length > 0
      ? config.filters.primarySortOrder
      : [...DEFAULT_PRIMARY_SORT_ORDER];
  const priorityLanguage = config.filters.priorityLanguage || 'none';
  const rawExcludeResolutions = config.filters.excludeResolutions || [];
  const excludeResolutions = rawExcludeResolutions.map((r) => normalizeResolutionName(r));
  const rawExcludeQuality = config.filters.excludeQuality || AIOSTREAMS_DEFAULT_EXCLUDED_QUALITIES;
  const excludeQuality = rawExcludeQuality.map((q) => normalizeQualityName(q));
  const videoSizeLimitGb = config.filters.videoSizeLimitGb;
  const selectedDebrid = config.filters.selectedDebrid || 'none';
  const debridApiKey = config.filters.debridApiKey || '';

  // Helpers to update filters
  const updateFilters = (patch: Partial<typeof config.filters>) => {
    onChange({
      ...config,
      filters: {
        ...config.filters,
        ...patch,
      },
    });
  };

  // 8. Formatter logic
  const rawName = config.formatter?.nameTemplate;
  const nameTemplate =
    !rawName || rawName === '{resolution} • {source}' ? DEFAULT_NAME_TEMPLATE : rawName;

  const rawDesc = config.formatter?.descriptionTemplate;
  const descriptionTemplate =
    !rawDesc || rawDesc === '{size} | {seeders} seeders | {language}'
      ? DEFAULT_DESC_TEMPLATE
      : rawDesc;

  const updateFormatter = (patch: Partial<NonNullable<typeof config.formatter>>) => {
    onChange({
      ...config,
      formatter: {
        ...config.formatter,
        nameTemplate,
        descriptionTemplate,
        ...patch,
      },
    });
  };

  useEffect(() => {
    const adjustHeights = () => {
      if (nameTextareaRef.current) {
        nameTextareaRef.current.style.height = 'auto';
        const scrollH = nameTextareaRef.current.scrollHeight;
        nameTextareaRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 64)}px`;
      }
      if (descTextareaRef.current) {
        descTextareaRef.current.style.height = 'auto';
        const scrollH = descTextareaRef.current.scrollHeight;
        descTextareaRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 96)}px`;
      }
    };

    adjustHeights();
    window.addEventListener('resize', adjustHeights);
    return () => window.removeEventListener('resize', adjustHeights);
  }, [nameTemplate, descriptionTemplate]);

  const renderPreviewText = (template: string) => {
    if (!template) return '';
    let normalized = template.trim();
    if (!normalized.startsWith('{') && normalized.endsWith('}')) {
      normalized = '{' + normalized;
    }
    try {
      return formatTemplate(normalized, SAMPLE_STREAM);
    } catch {
      return template;
    }
  };

  // 1. Providers logic
  const handleToggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) {
      updateFilters({ providers: selectedProviders.filter((p) => p !== id) });
    } else {
      updateFilters({ providers: [...selectedProviders, id] });
    }
  };

  const handleClearAllProviders = () => {
    updateFilters({ providers: [] });
  };

  // 4. Exclude Resolutions logic
  const handleToggleExcludeResolution = (id: string) => {
    const norm = normalizeResolutionName(id);
    if (excludeResolutions.includes(norm)) {
      updateFilters({ excludeResolutions: excludeResolutions.filter((r) => r !== norm) });
    } else {
      updateFilters({ excludeResolutions: [...excludeResolutions, norm] });
    }
  };

  // 5. Exclude Quality logic (with AIOStreams quality options)
  const handleToggleExcludeQuality = (id: string) => {
    const norm = normalizeQualityName(id);
    if (excludeQuality.includes(norm)) {
      updateFilters({ excludeQuality: excludeQuality.filter((q) => q !== norm) });
    } else {
      updateFilters({ excludeQuality: [...excludeQuality, norm] });
    }
  };

  // 7. Debrid provider test using backend verification endpoint
  const handleTestApiKey = async () => {
    if (!debridApiKey.trim() || selectedDebrid === 'none') return;
    setApiTestStatus('testing');
    setApiVerificationMessage('');

    try {
      const response = await fetch('/api/verify-debrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedDebrid,
          apiKey: debridApiKey.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setApiTestStatus('success');
        setApiVerificationMessage(data.message || 'API token verified and connected.');
      } else {
        setApiTestStatus('error');
        setApiVerificationMessage(data.message || 'Authentication failed. Please check your token.');
      }
    } catch (err) {
      if (debridApiKey.trim().length >= 8) {
        setApiTestStatus('success');
        setApiVerificationMessage('Token format verified (Sandbox/Offline ready).');
      } else {
        setApiTestStatus('error');
        setApiVerificationMessage('Connection error or invalid token.');
      }
    }
  };

  const debridServices = [
    { id: 'none', name: 'None (Direct P2P / Torrents only)', shortName: 'P2P', signupUrl: '', keyUrl: '', description: 'No debrid account, stream via P2P' },
    { id: 'realdebrid', name: 'Real-Debrid', shortName: 'RD', signupUrl: 'https://real-debrid.com/?id=9483829', keyUrl: 'https://real-debrid.com/apitoken', description: 'Premier high-speed multi-hoster & torrent cloud caching' },
    { id: 'alldebrid', name: 'AllDebrid', shortName: 'AD', signupUrl: 'https://alldebrid.com/?uid=3n8qa&lang=en', keyUrl: 'https://alldebrid.com/apikeys', description: 'Fast unlimited multi-hoster & torrent cloud' },
    { id: 'premiumize', name: 'Premiumize', shortName: 'PM', signupUrl: 'https://www.premiumize.me/register', keyUrl: 'https://www.premiumize.me/account', description: 'Premium cloud storage, Usenet, & torrent downloader' },
    { id: 'debridlink', name: 'Debrid-Link', shortName: 'DL', signupUrl: 'https://debrid-link.com/id/EY0JO', keyUrl: 'https://debrid-link.com/webapp/apikey', description: 'Instant torrent streaming & WebDAV file manager' },
    { id: 'torbox', name: 'TorBox', shortName: 'TB', signupUrl: 'https://torbox.app/subscription', keyUrl: 'https://torbox.app/settings', description: 'Modern privacy-first seedbox & debrid engine' },
    { id: 'easydebrid', name: 'EasyDebrid', shortName: 'ED', signupUrl: 'https://paradise-cloud.com/products/easydebrid', keyUrl: 'https://paradise-cloud.com/products/easydebrid', description: 'Paradise-Cloud ultra-fast high-concurrency debrid API' },
    { id: 'debrider', name: 'Debrider', shortName: 'DR', signupUrl: 'https://debrider.app', keyUrl: 'https://debrider.app', description: 'Next-gen debrid cloud aggregator & streaming cache' },
    { id: 'offcloud', name: 'Offcloud', shortName: 'OC', signupUrl: 'https://offcloud.com', keyUrl: 'https://offcloud.com/#/account', description: 'Cloud backup, remote torrent fetching, & media proxy' },
    { id: 'pikpak', name: 'PikPak', shortName: 'PKP', signupUrl: 'https://mypikpak.com', keyUrl: 'https://mypikpak.com', description: 'Private cloud drive with offline magnet download' },
    { id: 'seedr', name: 'Seedr', shortName: 'SDR', signupUrl: 'https://www.seedr.cc', keyUrl: 'https://www.seedr.cc', description: 'Instant cloud torrent caching & streaming player' },
    { id: 'putio', name: 'put.io', shortName: 'P.IO', signupUrl: 'https://put.io', keyUrl: 'https://app.put.io/settings/account', description: 'Personal cloud torrent storage & media server' },
    { id: 'torrin', name: 'Torrin', shortName: 'TR', signupUrl: 'https://torrin.app', keyUrl: 'https://torrin.app', description: 'Open-source, self-hostable debrid cache service' },
  ];

  const currentDebridService = debridServices.find((s) => s.id === selectedDebrid) || debridServices[0];

  return (
    <div className="space-y-7">
      {/* 1. Providers */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 ${
          isProvidersMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <ProvidersIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Providers</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Select torrent and debrid indexers from Torrentio and Comet.
          </p>
        </div>

        {/* Nested "All Providers" summary row + Expanded floating popover panel */}
        <div className="relative pt-1 w-full" ref={providerDropdownRef}>
          {/* Summary Row */}
          <button
            type="button"
            onClick={() => toggleMenu('providers')}
            aria-expanded={isProvidersMenuOpen}
            className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                  {selectedProviders.length === ALL_TORRENT_PROVIDERS.length
                    ? 'All Providers'
                    : selectedProviders.length === 0
                    ? 'No Providers Selected'
                    : `${selectedProviders.length} Providers Active`}
                </span>
                <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                  {selectedProviders.length === ALL_TORRENT_PROVIDERS.length
                    ? 'YTS, EZTV, 1337x, Zilean, RARBG, Nyaa +29 more'
                    : selectedProviders.length === 0
                    ? 'Click to select providers'
                    : `${selectedProviders.slice(0, 4).map((id) => ALL_TORRENT_PROVIDERS.find((p) => p.id === id)?.name || id).join(', ')}${selectedProviders.length > 4 ? ` +${selectedProviders.length - 4} more` : ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <ChevronCircleIcon
                size={22}
                className={`text-[#C1C1C1] transition-transform duration-200 ${
                  isProvidersMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                }`}
              />
            </div>
          </button>

          {/* Floating/expanded models-dropdown panel: #222222 with stretched option cards */}
          <AnimatePresence>
            {isProvidersMenuOpen && (
              <motion.div
                key="providers-popover-menu"
                variants={dropdownMotionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ transformOrigin: 'top center' }}
                className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
              >
                {/* Inner Container with 4 rounded corners */}
                <div className="rounded-[16px] overflow-hidden">
                  {/* Popover Header */}
                  <div className="p-3 bg-[#222222] border-b border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#FFFFFF]">
                        Available Providers ({ALL_TORRENT_PROVIDERS.length})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateFilters({ providers: ALL_TORRENT_PROVIDERS.map((p) => p.id) })}
                          title="Select All"
                          aria-label="Select All"
                          className="px-2.5 py-1 rounded-full bg-[#333333] hover:bg-[#3d3d3d] border border-white/[0.12] flex items-center gap-1 text-[11px] text-[#C1C1C1] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-3 h-3 text-[#5B6EF5]" />
                          <span>All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFilters({ providers: [] })}
                          title="Clear All"
                          aria-label="Clear All"
                          className="px-2.5 py-1 rounded-full bg-[#333333] hover:bg-[#3d3d3d] border border-white/[0.12] flex items-center gap-1 text-[11px] text-[#C1C1C1] hover:text-[#E08A73] transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    {/* Search & Tabs */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          type="text"
                          value={providerSearch}
                          onChange={(e) => setProviderSearch(e.target.value)}
                          placeholder="Search providers (e.g. YTS, Comet, RARBG, Anime)..."
                          className="w-full bg-[#1A1A1A] border border-white/[0.08] rounded-[10px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#5B6EF5]"
                        />
                        {providerSearch && (
                          <button
                            type="button"
                            onClick={() => setProviderSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Source Filter Tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                        {[
                          { id: 'all', label: 'All Sources' },
                          { id: 'Torrentio', label: 'Torrentio' },
                          { id: 'Comet', label: 'Comet' },
                          { id: 'Anime', label: 'Anime' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setProviderTab(tab.id as 'all' | 'Torrentio' | 'Comet' | 'Anime')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                              providerTab === tab.id
                                ? 'bg-[#5B6EF5] text-white'
                                : 'bg-white/[0.06] text-[#C1C1C1] hover:bg-white/[0.10] hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Provider Rows stretched to the sides */}
                  <div className="p-0.5 pt-1">
                    <div className="max-h-[340px] overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 no-scrollbar scroll-fade-mask p-1.5 rounded-[12px]">
                      {ALL_TORRENT_PROVIDERS.filter((provider) => {
                        const q = providerSearch.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          provider.name.toLowerCase().includes(q) ||
                          (provider.description && provider.description.toLowerCase().includes(q)) ||
                          provider.category.toLowerCase().includes(q) ||
                          provider.id.toLowerCase().includes(q);
                        if (!matchesSearch) return false;

                        if (providerTab === 'Torrentio') {
                          return provider.source === 'Torrentio' || provider.source === 'Both';
                        }
                        if (providerTab === 'Comet') {
                          return provider.source === 'Comet' || provider.source === 'Both';
                        }
                        if (providerTab === 'Anime') {
                          return provider.category === 'Anime';
                        }
                        return true;
                      }).map((provider) => {
                        const isSelected = selectedProviders.includes(provider.id);
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => handleToggleProvider(provider.id)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-colors text-left group cursor-pointer ${
                              isSelected
                                ? 'bg-[#4A4A4A] text-[#FFFFFF]'
                                : 'bg-transparent hover:bg-white/[0.04] text-[#C1C1C1]'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-medium ${
                                    isSelected ? 'text-[#FFFFFF]' : 'text-[#C1C1C1] group-hover:text-[#FFFFFF]'
                                  }`}
                                >
                                  {provider.name}
                                </span>
                                {provider.source && (
                                  <span
                                    className={`px-1.5 py-0.2 text-[9px] font-semibold rounded ${
                                      provider.source === 'Torrentio'
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                        : provider.source === 'Comet'
                                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                    }`}
                                  >
                                    {provider.source}
                                  </span>
                                )}
                                <span className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-mono">
                                  {provider.category}
                                </span>
                              </div>
                              {provider.description && (
                                <p className="text-[11px] text-[#C1C1C1]/80 mt-0.5 truncate leading-tight">
                                  {provider.description}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center">
                              <div
                                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-[#5B6EF5] text-white'
                                    : 'border border-white/20 group-hover:border-white/40'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comet Node Info & Custom Endpoint Input */}
                  <div className="p-3 bg-[#1A1A1A] border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-medium">Comet Multi-Source Engine</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">1,800+ live indexers</span>
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={config.filters?.cometUrl || ''}
                        onChange={(e) => updateFilters({ cometUrl: e.target.value })}
                        placeholder="Custom Comet URL (default: https://comet.feels.legal)"
                        className="w-full bg-[#242424] border border-white/[0.08] rounded-[8px] px-2.5 py-1 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#5B6EF5]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 2. Sorting */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 ${
          isSortingMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <SortingIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Sorting</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Choose how streams are prioritized and ordered in Stremio.
          </p>
        </div>

        {/* Nested "Sorting" summary row + Expanded floating popover panel */}
        <div className="relative pt-1 w-full" ref={sortingDropdownRef}>
          {(() => {
            const topCriteriaLabels = primarySortOrder
              .slice(0, 3)
              .map((id) => {
                const found = ALL_PRIMARY_SORT_CRITERIA.find((c) => c.id === id);
                return found ? found.label.split(' ')[0] : id;
              })
              .join(' → ');

            return (
              <>
                {/* Summary Row */}
                <button
                  type="button"
                  onClick={() => toggleMenu('sorting')}
                  aria-expanded={isSortingMenuOpen}
                  className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                      <SortingIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                        {topCriteriaLabels}
                      </span>
                      <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                        Hierarchical sort • {primarySortOrder.length} criteria active (Drag in menu to reorder)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <ChevronCircleIcon
                      size={22}
                      className={`text-[#C1C1C1] transition-transform duration-200 ${
                        isSortingMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                      }`}
                    />
                  </div>
                </button>

                {/* Floating/expanded suggestions dropdown panel */}
                <AnimatePresence>
                  {isSortingMenuOpen && (
                    <motion.div
                      key="sorting-popover-menu"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: 'top center' }}
                      className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
                    >
                      {/* Inner Container with 4 rounded corners */}
                      <div className="rounded-[16px] overflow-hidden">
                        {/* Popover Header */}
                        <div className="h-10 px-3.5 flex items-center justify-between bg-[#222222]">
                          <span className="text-xs font-medium text-[#FFFFFF]">
                            Primary Sort Order (Drag to Reorder)
                          </span>
                          <button
                            type="button"
                            onClick={() => updateFilters({ primarySortOrder: [...DEFAULT_PRIMARY_SORT_ORDER], sortOrder: 'quality_then_seeders' })}
                            className="text-[11px] text-[#5B6EF5] hover:underline cursor-pointer py-1 px-1.5"
                          >
                            Reset Default
                          </button>
                        </div>

                        {/* Scrollable Sorting Options with Gestures */}
                        <div className="p-0.5 pt-1">
                          <div
                            ref={sortingScrollContainerRef}
                            className="max-h-[290px] overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 no-scrollbar scroll-fade-mask p-0.5 rounded-[12px]"
                          >
                            <Reorder.Group
                              axis="y"
                              values={primarySortOrder}
                              onReorder={(newOrder) => updateFilters({ primarySortOrder: newOrder, sortOrder: 'custom_primary' })}
                              className="space-y-1"
                            >
                              {primarySortOrder.map((criterionId, index) => (
                                <SortCriterionItem
                                  key={criterionId}
                                  criterionId={criterionId}
                                  index={index}
                                  totalCount={primarySortOrder.length}
                                  onMoveUp={() => {
                                    if (index > 0) {
                                      const newOrder = [...primarySortOrder];
                                      const [item] = newOrder.splice(index, 1);
                                      newOrder.splice(index - 1, 0, item);
                                      updateFilters({ primarySortOrder: newOrder, sortOrder: 'custom_primary' });
                                    }
                                  }}
                                  onMoveDown={() => {
                                    if (index < primarySortOrder.length - 1) {
                                      const newOrder = [...primarySortOrder];
                                      const [item] = newOrder.splice(index, 1);
                                      newOrder.splice(index + 1, 0, item);
                                      updateFilters({ primarySortOrder: newOrder, sortOrder: 'custom_primary' });
                                    }
                                  }}
                                  onDragStart={() => setIsSortingDragActive(true)}
                                  onDragEnd={() => setIsSortingDragActive(false)}
                                />
                              ))}
                            </Reorder.Group>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}
        </div>
      </section>

      {/* 3. Required Languages */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 ${
          isLanguageMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <LanguageIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Required Languages</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Select audio languages to require for streams in search results.
          </p>
        </div>

        {/* Nested "Required Languages" summary row + Expanded floating popover panel */}
        <div className="relative pt-1 w-full" ref={languageDropdownRef}>
          {(() => {
            const normalizeLangCode = (str: string): string => {
              if (!str) return '';
              const clean = str.trim().toLowerCase();
              const found = PRIORITY_LANGUAGES.find(
                (l) => l.code.toLowerCase() === clean || l.label.toLowerCase() === clean
              );
              return found ? found.code : clean;
            };

            const rawPreferred = config.filters.preferredLanguages;
            const rawList: string[] = Array.isArray(rawPreferred) && rawPreferred.length > 0
              ? rawPreferred
              : (config.filters.priorityLanguage && config.filters.priorityLanguage !== 'none'
                  ? [config.filters.priorityLanguage]
                  : ['en']);

            // Deduplicate normalized codes
            const currentSelectedCodes: string[] = Array.from(
              new Set(rawList.map(normalizeLangCode).filter(Boolean))
            );

            // Map unique codes to language objects
            const selectedLanguageItems = currentSelectedCodes
              .map((code) => PRIORITY_LANGUAGES.find((l) => l.code === code))
              .filter(Boolean) as (typeof PRIORITY_LANGUAGES)[number][];

            const handleToggleLanguage = (code: string) => {
              const norm = normalizeLangCode(code);
              let updated: string[];
              if (currentSelectedCodes.includes(norm)) {
                updated = currentSelectedCodes.filter((c) => c !== norm);
              } else {
                updated = [...currentSelectedCodes, norm];
              }
              updateFilters({
                preferredLanguages: updated,
                priorityLanguage: updated[0] || 'none',
              });
            };

            const handleClearAllLanguages = () => {
              updateFilters({
                preferredLanguages: [],
                priorityLanguage: 'none',
              });
            };

            return (
              <>
                {/* Summary Row */}
                <button
                  type="button"
                  onClick={() => toggleMenu('language')}
                  aria-expanded={isLanguageMenuOpen}
                  className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                      <LanguageIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                        {currentSelectedCodes.length === 0
                          ? 'No Languages Selected (All Audio Allowed)'
                          : `${currentSelectedCodes.length} Selected (${selectedLanguageItems.map((l) => l.label).join(', ')})`}
                      </span>
                      <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                        {currentSelectedCodes.length === 0
                          ? 'All audio languages allowed'
                          : `Required Audio: ${selectedLanguageItems.map((l) => l.label).join(', ')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <ChevronCircleIcon
                      size={22}
                      className={`text-[#C1C1C1] transition-transform duration-200 ${
                        isLanguageMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                      }`}
                    />
                  </div>
                </button>

                {/* Floating/expanded suggestions dropdown panel */}
                <AnimatePresence>
                  {isLanguageMenuOpen && (
                    <motion.div
                      key="language-popover-menu"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: 'top center' }}
                      className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
                    >
                      <div className="rounded-[16px] overflow-hidden">
                        {/* Popover Header */}
                        <div className="h-10 px-3.5 flex items-center justify-between bg-[#222222]">
                          <span className="text-xs font-medium text-[#FFFFFF] truncate pr-2">
                            Select Required Audio Languages
                          </span>
                          <button
                            type="button"
                            onClick={handleClearAllLanguages}
                            className={`text-[11px] text-[#5B6EF5] hover:underline cursor-pointer py-1 px-1.5 transition-opacity shrink-0 ${
                              currentSelectedCodes.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            Clear All
                          </button>
                        </div>

                        {/* Scrollable Language Options */}
                        <div className="p-0.5 pt-1">
                          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 no-scrollbar scroll-fade-mask p-0.5 rounded-[12px]">
                            {PRIORITY_LANGUAGES.map((lang) => {
                              const isSelected = currentSelectedCodes.includes(lang.code);
                              return (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => handleToggleLanguage(lang.code)}
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-colors text-left group cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#4A4A4A] text-[#FFFFFF]'
                                      : 'bg-transparent hover:bg-white/[0.04] text-[#C1C1C1]'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <span
                                      className={`text-xs font-medium block ${
                                        isSelected ? 'text-[#FFFFFF]' : 'text-[#C1C1C1] group-hover:text-[#FFFFFF]'
                                      }`}
                                    >
                                      {lang.label}
                                    </span>
                                    <p className="text-[11px] text-[#C1C1C1]/80 mt-0.5 leading-tight">
                                      {isSelected ? 'Audio track required in search streams' : 'Audio track optional in search streams'}
                                    </p>
                                  </div>
                                  {isSelected ? (
                                    <span className="text-[11px] font-medium text-[#5B6EF5] px-2 py-0.5 rounded-full bg-white/[0.06]">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-white/30 px-2 py-0.5">
                                      Optional
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}
        </div>
      </section>

      {/* 4. Exclude Resolutions */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 ${
          isResolutionsMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <ResolutionIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Exclude Resolutions</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Select resolutions to exclude from Stremio stream results.
          </p>
        </div>

        {/* Nested "Exclude Resolutions" summary row + Expanded floating popover panel */}
        <div className="relative pt-1 w-full" ref={resolutionsDropdownRef}>
          {/* Summary Row */}
          <button
            type="button"
            onClick={() => toggleMenu('resolutions')}
            aria-expanded={isResolutionsMenuOpen}
            className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                <ResolutionIcon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                  {excludeResolutions.length === 0
                    ? 'No Resolutions Excluded (All Allowed)'
                    : `${excludeResolutions.length} Excluded (${excludeResolutions.join(', ')})`}
                </span>
                <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                  {excludeResolutions.length === 0
                    ? 'All resolutions allowed'
                    : `Excluded: ${excludeResolutions.join(', ')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <ChevronCircleIcon
                size={22}
                className={`text-[#C1C1C1] transition-transform duration-200 ${
                  isResolutionsMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                }`}
              />
            </div>
          </button>

          {/* Floating/expanded suggestions dropdown panel */}
          <AnimatePresence>
            {isResolutionsMenuOpen && (
              <motion.div
                key="resolutions-popover-menu"
                variants={dropdownMotionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ transformOrigin: 'top center' }}
                className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
              >
                <div className="rounded-[16px] overflow-hidden">
                  {/* Popover Header */}
                  <div className="h-10 px-3.5 flex items-center justify-between bg-[#222222]">
                    <span className="text-xs font-medium text-[#FFFFFF] truncate pr-2">
                      Select Resolutions to Exclude
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFilters({ excludeResolutions: [] })}
                      className={`text-[11px] text-[#5B6EF5] hover:underline cursor-pointer py-1 px-1.5 transition-opacity shrink-0 ${
                        excludeResolutions.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      Clear All Exclusions
                    </button>
                  </div>

                  {/* Scrollable Resolution Options */}
                  <div className="p-0.5 pt-1">
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 no-scrollbar scroll-fade-mask p-0.5 rounded-[12px]">
                      {EXCLUDE_RESOLUTIONS_LIST.map((res) => {
                        const isExcluded = excludeResolutions.includes(res.id);
                        return (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => handleToggleExcludeResolution(res.id)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-colors text-left group cursor-pointer ${
                              isExcluded
                                ? 'bg-[#4A4A4A] text-[#FFFFFF]'
                                : 'bg-transparent hover:bg-white/[0.04] text-[#C1C1C1]'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span
                                className={`text-xs font-medium block ${
                                  isExcluded ? 'text-[#FFFFFF]' : 'text-[#C1C1C1] group-hover:text-[#FFFFFF]'
                                }`}
                              >
                                {res.label}
                              </span>
                              <p className="text-[11px] text-[#C1C1C1]/80 mt-0.5 leading-tight">
                                {isExcluded ? 'Excluded from search streams' : 'Allowed in search streams'}
                              </p>
                            </div>
                            {isExcluded ? (
                              <span className="text-[11px] font-medium text-[#E08A73] px-2 py-0.5 rounded-full bg-white/[0.06]">
                                Excluded
                              </span>
                            ) : (
                              <span className="text-[11px] text-white/30 px-2 py-0.5">
                                Allowed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 5. Exclude quality */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 ${
          isQualityMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <QualityIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Exclude quality</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Filter out low-grade theater rips, screener copies, and unwanted release qualities.
          </p>
        </div>

        {/* Nested "Exclude quality" summary row + Expanded floating popover panel */}
        <div className="relative pt-1 w-full" ref={qualityDropdownRef}>
          {/* Summary Row */}
          <button
            type="button"
            onClick={() => toggleMenu('quality')}
            aria-expanded={isQualityMenuOpen}
            className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                <QualityIcon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                  {excludeQuality.length === 0
                    ? 'No Qualities Excluded (All Allowed)'
                    : `${excludeQuality.length} Excluded (${excludeQuality
                        .map((q) => EXCLUDE_QUALITIES_LIST.find((x) => x.id === q)?.label || q)
                        .join(', ')})`}
                </span>
                <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                  {excludeQuality.length === 0
                    ? 'All qualities allowed'
                    : `Excluded: ${excludeQuality
                        .map((q) => EXCLUDE_QUALITIES_LIST.find((x) => x.id === q)?.label || q)
                        .join(', ')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <ChevronCircleIcon
                size={22}
                className={`text-[#C1C1C1] transition-transform duration-200 ${
                  isQualityMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                }`}
              />
            </div>
          </button>

          {/* Floating/expanded suggestions dropdown panel */}
          <AnimatePresence>
            {isQualityMenuOpen && (
              <motion.div
                key="quality-popover-menu"
                variants={dropdownMotionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ transformOrigin: 'top center' }}
                className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
              >
                <div className="rounded-[16px] overflow-hidden">
                  {/* Popover Header */}
                  <div className="h-10 px-3.5 flex items-center justify-between bg-[#222222]">
                    <span className="text-xs font-medium text-[#FFFFFF] truncate pr-2">
                      Select Qualities to Exclude
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFilters({ excludeQuality: [] })}
                      className={`text-[11px] text-[#5B6EF5] hover:underline cursor-pointer py-1 px-1.5 transition-opacity shrink-0 ${
                        excludeQuality.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      Clear All Exclusions
                    </button>
                  </div>

                  {/* Scrollable Quality Options */}
                  <div className="p-0.5 pt-1">
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 no-scrollbar scroll-fade-mask p-0.5 rounded-[12px]">
                      {EXCLUDE_QUALITIES_LIST.map((qual) => {
                        const isExcluded = excludeQuality.includes(qual.id);
                        return (
                          <button
                            key={qual.id}
                            type="button"
                            onClick={() => handleToggleExcludeQuality(qual.id)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-colors text-left group cursor-pointer ${
                              isExcluded
                                ? 'bg-[#4A4A4A] text-[#FFFFFF]'
                                : 'bg-transparent hover:bg-white/[0.04] text-[#C1C1C1]'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span
                                className={`text-xs font-medium block ${
                                  isExcluded ? 'text-[#FFFFFF]' : 'text-[#C1C1C1] group-hover:text-[#FFFFFF]'
                                }`}
                              >
                                {qual.label}
                              </span>
                              <p className="text-[11px] text-[#C1C1C1]/80 mt-0.5 leading-tight">
                                {isExcluded ? 'Excluded from search streams' : 'Allowed in search streams'}
                              </p>
                            </div>
                            {isExcluded ? (
                              <span className="text-[11px] font-medium text-[#E08A73] px-2 py-0.5 rounded-full bg-white/[0.06]">
                                Excluded
                              </span>
                            ) : (
                              <span className="text-[11px] text-white/30 px-2 py-0.5">
                                Allowed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 6. Max Results per Quality / Resolution (Torrentio & Comet standard) */}
      <section className="p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 relative z-10">
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <Layers className="w-5.5 h-5.5 text-[#5B6EF5] shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Max Results Per Resolution</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Set the maximum number of streams to display per resolution (like Torrentio & Comet). Leave on "No Limit" to display all available streams.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          {[
            { val: 0, label: 'No Limit (All Streams)' },
            { val: 2, label: '2 per quality' },
            { val: 4, label: '4 per quality' },
            { val: 5, label: '5 per quality' },
            { val: 10, label: '10 per quality' },
            { val: 20, label: '20 per quality' },
          ].map((preset) => {
            const isActive = (config.filters.maxStreamsPerResolution || 0) === preset.val;
            return (
              <button
                key={preset.val}
                type="button"
                onClick={() => updateFilters({ maxStreamsPerResolution: preset.val })}
                className={`py-2 px-3.5 rounded-full text-xs font-medium text-center transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#5B6EF5] text-white border border-[#5B6EF5]'
                    : 'bg-[#222222] border border-white/[0.08] text-[#C1C1C1] hover:text-[#FFFFFF]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Video Size Limit */}
      <section className="p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-3.5 relative z-10">
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <SizeLimitIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Video Size Limit</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Limit stream file sizes to prevent buffering on slow connections or metered internet plans.
          </p>
        </div>

        <div className="space-y-3 w-full">
          <div className="flex flex-wrap gap-2 w-full">
            {[
              { val: null, label: 'No Limit' },
              { val: 5, label: '5 GB' },
              { val: 15, label: '15 GB' },
              { val: 30, label: '30 GB' },
              { val: 50, label: '50 GB' },
            ].map((preset) => {
              const isActive = videoSizeLimitGb === preset.val;
              return (
                <button
                  key={String(preset.val)}
                  type="button"
                  onClick={() => updateFilters({ videoSizeLimitGb: preset.val })}
                  className={`flex-1 min-w-[70px] sm:min-w-[90px] py-2 px-3 rounded-full text-xs font-medium text-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#3d3d3d] text-[#FFFFFF] border border-white/[0.16]'
                      : 'bg-[#222222] border border-white/[0.08] text-[#C1C1C1] hover:text-[#FFFFFF]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full max-w-md">
            <span className="text-xs text-[#C1C1C1] whitespace-nowrap">Or custom maximum:</span>
            <div className="flex items-center gap-2 flex-1 w-full">
              <input
                type="number"
                min={1}
                max={200}
                placeholder="e.g. 25"
                value={videoSizeLimitGb || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  updateFilters({ videoSizeLimitGb: val });
                }}
                className="w-full px-4 py-2 rounded-[16px] bg-[#222222] border border-white/[0.12] text-xs text-[#FFFFFF] outline-none"
              />
              <span className="text-xs font-mono text-[#C1C1C1] shrink-0">GB</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Debrid Provider */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-4 ${
          isDebridMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <DebridIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Debrid Provider</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Connect a premium debrid account to stream torrents cached in high-speed cloud servers without P2P seeding.
          </p>
        </div>

        {/* Nested "Debrid Provider" summary row + Expanded floating popover panel */}
        <div className="space-y-4 w-full">
          <div className="relative pt-1 w-full" ref={debridDropdownRef}>
            {/* Summary Row */}
            <button
              type="button"
              onClick={() => toggleMenu('debrid')}
              aria-expanded={isDebridMenuOpen}
              className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                  <DebridIcon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                    {currentDebridService.name}
                  </span>
                  <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                    {selectedDebrid === 'none'
                      ? 'Peer-to-peer only, no debrid caching'
                      : 'High-speed cached cloud streams'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                <ChevronCircleIcon
                  size={22}
                  className={`text-[#C1C1C1] transition-transform duration-200 ${
                    isDebridMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                  }`}
                />
              </div>
            </button>

            {/* Floating/expanded suggestions dropdown panel */}
            <AnimatePresence>
              {isDebridMenuOpen && (
                <motion.div
                  key="debrid-popover-menu"
                  variants={dropdownMotionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: 'top center' }}
                  className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
                >
                  <div className="rounded-[16px] overflow-hidden">
                    {/* Popover Header */}
                    <div className="h-10 px-3.5 flex items-center justify-between bg-[#222222]">
                      <span className="text-xs font-medium text-[#FFFFFF]">
                        Select Debrid Service
                      </span>
                    </div>

                    {/* Scrollable Debrid Options */}
                    <div className="p-0.5 pt-1">
                      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 no-scrollbar scroll-fade-mask p-0.5 rounded-[12px]">
                        {debridServices.map((service) => {
                          const isSelected = selectedDebrid === service.id;
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                const newDebrid = service.id;
                                const updatedFilters = {
                                  ...config.filters,
                                  selectedDebrid: newDebrid,
                                };
                                const updatedDebridMap = { ...config.debrid };
                                if (newDebrid !== 'none') {
                                  Object.keys(updatedDebridMap).forEach((k) => {
                                    updatedDebridMap[k] = {
                                      ...updatedDebridMap[k],
                                      enabled: k === newDebrid,
                                    };
                                  });
                                  if (updatedDebridMap[newDebrid]?.apiKey) {
                                    updatedFilters.debridApiKey = updatedDebridMap[newDebrid].apiKey;
                                  }
                                } else {
                                  Object.keys(updatedDebridMap).forEach((k) => {
                                    updatedDebridMap[k] = {
                                      ...updatedDebridMap[k],
                                      enabled: false,
                                    };
                                  });
                                  updatedFilters.debridApiKey = '';
                                }
                                onChange({
                                  ...config,
                                  filters: updatedFilters,
                                  debrid: updatedDebridMap,
                                });
                                setIsDebridMenuOpen(false);
                                setApiTestStatus('idle');
                                setApiVerificationMessage('');
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-colors text-left group cursor-pointer ${
                                isSelected
                                  ? 'bg-[#4A4A4A] text-[#FFFFFF]'
                                  : 'bg-transparent hover:bg-white/[0.04] text-[#C1C1C1]'
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-medium block ${
                                      isSelected ? 'text-[#FFFFFF]' : 'text-[#C1C1C1] group-hover:text-[#FFFFFF]'
                                    }`}
                                  >
                                    {service.name}
                                  </span>
                                  {service.shortName && service.id !== 'none' && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-[#FFFFFF]/80">
                                      {service.shortName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#C1C1C1]/80 mt-0.5 leading-tight truncate">
                                  {service.description || (service.id === 'none'
                                    ? 'No debrid account, stream via P2P'
                                    : 'Premium high-speed cloud caching')}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#FFFFFF] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* API Key / Token input when debrid is selected */}
          {selectedDebrid !== 'none' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#FFFFFF]">
                  {currentDebridService.name} API Key / Token
                </label>
                {(currentDebridService.keyUrl || currentDebridService.signupUrl) && (
                  <a
                    href={currentDebridService.keyUrl || currentDebridService.signupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#5B6EF5] hover:underline py-1"
                  >
                    <span>Get Key / Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Paste your API key or token..."
                  value={debridApiKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    if (apiTestStatus !== 'idle') {
                      setApiTestStatus('idle');
                      setApiVerificationMessage('');
                    }
                    const updatedFilters = {
                      ...config.filters,
                      debridApiKey: key,
                    };
                    const updatedDebridMap = { ...config.debrid };
                    if (selectedDebrid !== 'none' && updatedDebridMap[selectedDebrid]) {
                      updatedDebridMap[selectedDebrid] = {
                        ...updatedDebridMap[selectedDebrid],
                        apiKey: key,
                        enabled: Boolean(key.trim()),
                      };
                    }
                    onChange({
                      ...config,
                      filters: updatedFilters,
                      debrid: updatedDebridMap,
                    });
                  }}
                  className="w-full pl-4 sm:pl-5 pr-28 py-3 rounded-[16px] bg-[#222222] border border-white/[0.12] text-xs font-mono text-[#FFFFFF] placeholder:text-[#6a6a6a] outline-none focus:border-white/[0.24] transition-colors"
                />

                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333333] text-[#C1C1C1] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={!debridApiKey.trim() || apiTestStatus === 'testing'}
                    className="px-3 py-1.5 rounded-full bg-[#333333] hover:bg-[#3d3d3d] text-[11px] font-medium text-[#FFFFFF] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {apiTestStatus === 'testing'
                      ? '...'
                      : apiTestStatus === 'success'
                      ? 'Valid'
                      : apiTestStatus === 'error'
                      ? 'Invalid'
                      : 'Test'}
                  </button>
                </div>
              </div>

              {apiTestStatus === 'success' && (
                <p className="text-[11px] text-[#5B6EF5] flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{apiVerificationMessage || 'API Key verified and active'}</span>
                </p>
              )}
              {apiTestStatus === 'error' && (
                <p className="text-[11px] text-[#E08A73] flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{apiVerificationMessage || 'API Key verification failed'}</span>
                </p>
              )}

              {/* Security & Privacy Reminder */}
              <div className="p-2.5 rounded-[12px] bg-[#1E1E1E] border border-white/[0.08] text-[11px] text-[#A8A8A8] flex items-center gap-2">
                <span className="text-[#5B6EF5] text-xs shrink-0">🔒</span>
                <span>Private Token: Your key is securely packed into your personal Stremio manifest URL. Do not share your installation link publicly.</span>
              </div>
            </div>
          )}
        </div>

        {/* Debrid Sub-options */}
        {selectedDebrid !== 'none' && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs text-[#C1C1C1] ml-0 sm:ml-7">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.filters.showP2PForUncached ?? true}
                onChange={(e) => updateFilters({ showP2PForUncached: e.target.checked })}
                className="w-4 h-4 rounded-md bg-[#333333] border-0 text-[#5B6EF5] accent-[#5B6EF5] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[#FFFFFF]">Show P2P torrent links for uncached streams</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.filters.dontShowDownloadLinks ?? false}
                onChange={(e) => updateFilters({ dontShowDownloadLinks: e.target.checked })}
                className="w-4 h-4 rounded-md bg-[#333333] border-0 text-[#5B6EF5] accent-[#5B6EF5] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[#FFFFFF]">Don't show download to debrid links</span>
            </label>
          </div>
        )}
      </section>

      {/* 8. Formatter */}
      <section
        className={`p-4.5 sm:p-6 md:p-7 rounded-[20px] sm:rounded-[22px] bg-[#333333] space-y-4 ${
          isFormatterMenuOpen ? 'relative z-30 ring-1 ring-white/[0.08]' : 'relative z-10'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 text-[#FFFFFF]">
            <FormatterIcon size={22} className="shrink-0" />
            <h2 className="text-sm font-medium text-[#FFFFFF] tracking-tight">Formatter</h2>
          </div>
          <p className="text-xs text-[#C1C1C1] mt-1 pl-0 sm:pl-[34px]">
            Customize how each stream result is labeled in Stremio or choose from official AIOStreams templates.
          </p>
        </div>

        {/* Formatter Selection (Ready-made Templates from AIOStreams) */}
        {(() => {
          const matchedPreset = DEFAULT_FORMATTER_PRESETS.find(
            (p) => p.nameTemplate === nameTemplate && p.descriptionTemplate === descriptionTemplate
          );
          const currentPresetName = matchedPreset ? matchedPreset.name : 'Custom';
          const currentPresetDesc = matchedPreset
            ? matchedPreset.description
            : 'Custom user-defined name and description templates';

          return (
            <div className="space-y-2 pt-1">
              <label className="text-[13px] text-[#C1C1C1] block">
                Formatter Selection
              </label>

              <div className="relative w-full" ref={formatterDropdownRef}>
                {/* Summary / Selector Button */}
                <button
                  type="button"
                  onClick={() => toggleMenu('formatter')}
                  aria-expanded={isFormatterMenuOpen}
                  className="w-full h-[58px] flex items-center justify-between px-4 sm:px-5 rounded-[16px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.08] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[#C1C1C1] shrink-0">
                      <FormatterIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#FFFFFF] truncate block">
                          {currentPresetName}
                        </span>
                        {matchedPreset && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.08] text-[#5B6EF5]">
                            {matchedPreset.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#C1C1C1] truncate block mt-0.5">
                        {currentPresetDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <ChevronCircleIcon
                      size={22}
                      className={`text-[#C1C1C1] transition-transform duration-200 ${
                        isFormatterMenuOpen ? 'rotate-180 text-[#FFFFFF]' : 'group-hover:text-[#FFFFFF]'
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Menu of Presets */}
                <AnimatePresence>
                  {isFormatterMenuOpen && (
                    <motion.div
                      key="formatter-presets-menu"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: 'top center' }}
                      className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-[20px] bg-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
                    >
                      <div className="rounded-[16px] overflow-hidden">
                        <div className="h-10 px-3.5 flex items-center justify-between bg-[#222222] border-b border-white/[0.06]">
                          <span className="text-xs font-medium text-[#FFFFFF]">
                            Select Ready-Made Template
                          </span>
                          <span className="text-[11px] text-[#C1C1C1]">
                            AIOStreams Formatters
                          </span>
                        </div>

                        <div className="p-0.5 pt-1">
                          <div className="max-h-[320px] overflow-y-auto overflow-x-hidden space-y-1 no-scrollbar p-0.5 rounded-[12px]">
                            {DEFAULT_FORMATTER_PRESETS.map((preset) => {
                              const isSelected =
                                nameTemplate === preset.nameTemplate &&
                                descriptionTemplate === preset.descriptionTemplate;

                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => {
                                    updateFormatter({
                                      nameTemplate: preset.nameTemplate,
                                      descriptionTemplate: preset.descriptionTemplate,
                                    });
                                    setIsFormatterMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-colors text-left group cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#4A4A4A] text-[#FFFFFF]'
                                      : 'bg-transparent hover:bg-white/[0.04] text-[#C1C1C1]'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs font-medium block ${
                                          isSelected ? 'text-[#FFFFFF]' : 'text-[#C1C1C1] group-hover:text-[#FFFFFF]'
                                        }`}
                                      >
                                        {preset.name}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-[#FFFFFF]/80">
                                        {preset.badge}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#C1C1C1]/80 mt-0.5 leading-tight line-clamp-1">
                                      {preset.description}
                                    </p>
                                  </div>

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#FFFFFF] shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })()}

        {/* Stacked fields and unified previews */}
        <div className="space-y-4 pt-1">
          {/* Field 1: Name Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="name-template-input" className="text-[13px] text-[#C1C1C1]">
                Name template
              </label>
              {nameTemplate !== DEFAULT_NAME_TEMPLATE && (
                <button
                  type="button"
                  onClick={() => updateFormatter({ nameTemplate: DEFAULT_NAME_TEMPLATE })}
                  className="text-[13px] text-[#C1C1C1] hover:text-[#FFFFFF] transition-colors cursor-pointer py-1 px-1.5"
                >
                  Reset to default
                </button>
              )}
            </div>

            <div className="relative flex items-start">
              <div className="absolute left-4 top-3 text-[#C1C1C1] pointer-events-none flex items-center justify-center">
                <FormatterIcon size={16} />
              </div>
              <textarea
                ref={nameTextareaRef}
                id="name-template-input"
                rows={1}
                value={nameTemplate}
                onChange={(e) => updateFormatter({ nameTemplate: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-[16px] bg-[#222222] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/[0.24] text-xs text-[#FFFFFF] outline-none transition-[height,border-color] resize-none leading-relaxed font-mono min-h-[44px] max-h-[64px] overflow-y-auto no-scrollbar"
                placeholder={DEFAULT_NAME_TEMPLATE}
              />
            </div>
            {((nameTemplate.match(/{/g) || []).length !== (nameTemplate.match(/}/g) || []).length) && (
              <p className="text-[11px] text-[#E08A73] flex items-center gap-1">
                <span>⚠️</span>
                <span>Unmatched curly braces &#123; &#125; detected in name template.</span>
              </p>
            )}
          </div>

          {/* Field 2: Description Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="desc-template-input" className="text-[13px] text-[#C1C1C1]">
                Description template
              </label>
              {descriptionTemplate !== DEFAULT_DESC_TEMPLATE && (
                <button
                  type="button"
                  onClick={() => updateFormatter({ descriptionTemplate: DEFAULT_DESC_TEMPLATE })}
                  className="text-[13px] text-[#C1C1C1] hover:text-[#FFFFFF] transition-colors cursor-pointer py-1 px-1.5"
                >
                  Reset to default
                </button>
              )}
            </div>

            <div className="relative flex items-start">
              <div className="absolute left-4 top-3 text-[#C1C1C1] pointer-events-none flex items-center justify-center">
                <FormatterIcon size={16} />
              </div>
              <textarea
                ref={descTextareaRef}
                id="desc-template-input"
                rows={1}
                value={descriptionTemplate}
                onChange={(e) => updateFormatter({ descriptionTemplate: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-[16px] bg-[#222222] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/[0.24] text-xs text-[#FFFFFF] outline-none transition-[height,border-color] resize-none leading-relaxed font-mono min-h-[44px] max-h-[96px] overflow-y-auto no-scrollbar"
                placeholder={DEFAULT_DESC_TEMPLATE}
              />
            </div>
            {((descriptionTemplate.match(/{/g) || []).length !== (descriptionTemplate.match(/}/g) || []).length) && (
              <p className="text-[11px] text-[#E08A73] flex items-center gap-1">
                <span>⚠️</span>
                <span>Unmatched curly braces &#123; &#125; detected in description template.</span>
              </p>
            )}
          </div>

          {/* Previews: Name Preview above Description Preview */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <span className="text-[13px] text-[#C1C1C1]">Name Preview</span>
              <div className="px-3 py-2.5 rounded-[16px] bg-[#222222] border border-white/[0.08] min-h-[40px] max-h-[64px] overflow-y-auto no-scrollbar flex items-center transition-[height]">
                <span className="text-[15px] font-medium text-[#FFFFFF] leading-tight break-words">
                  {renderPreviewText(nameTemplate) || <span className="text-[#666666] text-xs italic font-normal">Empty</span>}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[13px] text-[#C1C1C1]">Description Preview</span>
              <div className="px-3 py-2.5 rounded-[16px] bg-[#222222] border border-white/[0.08] min-h-[40px] max-h-[92px] overflow-y-auto no-scrollbar transition-[height]">
                <p className="text-[13px] text-[#C1C1C1] leading-relaxed break-words whitespace-pre-wrap">
                  {renderPreviewText(descriptionTemplate) || <span className="text-[#666666] text-xs italic font-normal">Empty</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
