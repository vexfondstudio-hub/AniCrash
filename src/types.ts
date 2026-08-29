export type AnimeType = 'TV Сериал' | 'ТВ' | 'Фильм' | 'OVA' | 'Спешл';
export type AnimeStatus = 'Онгоинг' | 'Завершён' | 'Анонс';

export type WatchlistStatus = 'favorites' | 'watching' | 'planned' | 'completed' | 'on_hold';

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: number; // in seconds
  videoUrl: string;
  hls_1080?: string;
  hls_720?: string;
  hls_480?: string;
  thumbnail: string;
  introStart?: number;
  introEnd?: number;
}

export interface Character {
  name: string;
  role: string;
  avatar: string;
}

export interface Anime {
  id: string;
  title: string;
  englishTitle: string;
  originalTitle: string;
  slug: string;
  description: string;
  poster: string;
  banner: string;
  rating: number;
  votesCount: number;
  year: number;
  season: string;
  type: AnimeType;
  status: AnimeStatus;
  genres: string[];
  episodesCount: number;
  currentEpisodes: number;
  durationPerEp: string;
  studio: string;
  ageRating: string;
  voiceovers: string[];
  episodes: Episode[];
  characters: Character[];
  tags: string[];
  featured?: boolean;
  trendingRank?: number;
}

export interface WatchProgress {
  animeId: string;
  episodeNumber: number;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatchedAt: number;
}

export interface FavoriteEntry {
  animeId: string;
  status: WatchlistStatus;
  addedAt: number;
  userRating?: number;
}

export interface Comment {
  id: string;
  animeId: string;
  userName: string;
  avatar: string;
  rating: number;
  text: string;
  createdAt: string;
  likes: number;
}

export interface RecommendationResult {
  anime: Anime;
  matchScore: number;
  matchedGenres: string[];
  reason: string;
  basisAnimeTitle?: string;
}

export type ViewMode =
  | 'home'
  | 'catalog'
  | 'favorites'
  | 'history'
  | 'recommendations'
  | 'watch-party'
  | 'profile';

export type ProfileAura =
  | 'none'
  | 'neon-rose'
  | 'cyber-cyan'
  | 'golden-shonen'
  | 'sakura-blossom'
  | 'void-purple'
  | 'emerald-ghost';

export type AccentTheme = 'rose' | 'cyan' | 'purple' | 'amber' | 'emerald' | 'sakura';

export interface UserProfile {
  username: string;
  avatar: string;
  aura: ProfileAura;
  title: string;
  statusQuote: string;
  bannerUrl: string;
  accentTheme: AccentTheme;
  pinnedAnimeId?: string;
  pinnedAnimeReview?: string;
  pinnedAnimeRating?: number;
  soundEffects: boolean;
  joinedDate: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password?: string;
  createdAt: number;
  isGuest?: boolean;
  profile: UserProfile;
  favorites: FavoriteEntry[];
  watchHistory: WatchProgress[];
}

export interface AuthResponse {
  success: boolean;
  user?: UserAccount;
  error?: string;
}

export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  aura: ProfileAura;
  isHost: boolean;
  isPlaying: boolean;
  currentTime: number;
  lastPing: number;
  status: 'watching' | 'paused' | 'buffering' | 'ready';
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderAura?: ProfileAura;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomReaction {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
  xOffset: number; // 10% to 90%
}

export interface WatchPartyRoom {
  id: string;
  name: string;
  animeId: string;
  episodeNumber: number;
  currentTime: number;
  isPlaying: boolean;
  hostId: string;
  hostName: string;
  members: RoomMember[];
  createdAt: number;
}
