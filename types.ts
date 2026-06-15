
export type ThemeMode = 'Dark' | 'Grey' | 'Amoled' | 'Blue' | 'Light';
export type DisplaySize = 'Small' | 'Medium' | 'Large';
export type CardStyle = 'Grid' | 'FullWidth';
export type AspectRatio = '16:9' | '3:2' | '5:7' | 'Adaptive';
export type SortOrder = 'Newest' | 'Oldest' | 'DateDesc' | 'DateAsc';
export type ButtonStyle = 'Glass' | 'ColorGlass' | 'SolidColors';
export type ManagementView = 'Card' | 'List';

export interface Actor {
  id: string;
  name: string;
  imageUrl: string;
  originalImageUrl?: string;
  isDeleted: boolean;
  createdAt?: number;
}

export interface CoomerPost {
  id: string;
  urls: string[];
  type: 'Single' | 'Multiple';
  createdAt: number;
  date?: number; // Main date for sorting (usually the date of the first image)
  perImageDates?: (number | undefined)[]; // Optional dates for each image in a Multiple post
}

export interface Coomer {
  id: string;
  name: string;
  imageUrl: string;
  originalImageUrl?: string;
  isDeleted: boolean;
  createdAt?: number;
  instagramPosts?: CoomerPost[];
  onlyFansPosts?: CoomerPost[];
  // Keep legacy fields for compatibility if needed, but we'll migrate them
  instagramLinks?: string[];
  onlyFansLinks?: string[];
}

export interface Studio {
  id: string;
  name: string;
  imageUrl?: string;
  originalImageUrl?: string;
  isDeleted: boolean;
  createdAt?: number;
}

export interface LinkItem {
  id: string;
  title: string;
  urlHD?: string;
  url4K?: string;
  magnet?: string;
  magnet4K?: string;
  coverImage: string;
  coverOffset?: number; 
  aspectRatio?: AspectRatio;
  galleryUrls?: string[];
  actorIds: string[];
  studioIds: string[];
  assignedDate?: number;
  isDeleted: boolean;
  deletedAt?: number;
  createdAt?: number;
}

export interface AppSettings {
  theme: ThemeMode;
  accentColor: string;
  actorNameColor: string;
  circleBorderColor: string;
  torboxApiKey?: string;
  enableTorbox?: boolean;
  realDebridApiKey?: string;
  enableRealDebrid?: boolean;
  titleSize: DisplaySize;
  metadataSize: DisplaySize;
  cardStyle: CardStyle;
  managementView: ManagementView;
  showActors: boolean;
  showStudios: boolean;
  showActorCheckmark: boolean;
  enableGalleryPreview: boolean;
  sortOrder: SortOrder;
  itemsPerPage: number;
  blurIntensity: number;
  blurCovers: boolean;
  buttonStyle: ButtonStyle;
  buttonColor: string;
  galleryBgColor: string;
  headerOpacity: number;
  headerTheme: ThemeMode | 'Default';
}

export interface HanimeEpisode {
  id: string;
  url: string;
  coverImage: string;
  episodeNumber: number;
}

export interface HanimeItem {
  id: string;
  title: string;
  coverImage: string;
  coverOffset?: number;
  secondaryCovers?: string[];
  description?: string;
  assignedDate?: number;
  censorship?: 'UNCENSORED' | 'CENSORED';
  episodes: HanimeEpisode[];
  isDeleted: boolean;
  createdAt?: number;
}

export interface AppState {
  links: LinkItem[];
  trashLinks: LinkItem[];
  hanime: HanimeItem[];
  actors: Actor[];
  coomers: Coomer[];
  studios: Studio[];
  settings: AppSettings;
  coomerActiveTab?: 'instagram' | 'onlyfans';
}
