import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  BadgeCheck,
  ChevronRight,
  TrendingUp,
  Award,
  Disc3,
  Swords,
  Zap,
  Wand2,
  Cpu,
  Eye,
  Coffee,
  Compass,
  Sparkles,
  Smile,
  Flame,
  Film,
  History as HistoryIcon,
} from 'lucide-react';
import {
  Anime,
  ViewMode,
  WatchProgress,
  FavoriteEntry,
  WatchlistStatus,
  UserProfile,
} from './types';
import { ANIME_DATABASE } from './data/animeData';
import { DEFAULT_PROFILE } from './data/profilePresets';
import { getRecommendations } from './utils/recommendations';
import { ensureAnimeEpisodes } from './services/animeApi';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AnimeCard } from './components/AnimeCard';
import { VideoPlayer } from './components/VideoPlayer';
import { CatalogFilters, SortOption } from './components/CatalogFilters';
import { RecommendationsSection } from './components/RecommendationsSection';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
import { WatchPartyView } from './components/WatchPartyView';
import { ProfileView } from './components/ProfileView';
import { QuickSearchModal } from './components/QuickSearchModal';
import { AnimeRouletteModal } from './components/AnimeRouletteModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { EnhancedImage } from './components/EnhancedImage';
import { SiteAssemblyLoader } from './components/SiteAssemblyLoader';
import {
  getCurrentUserAccount,
  logoutUserAccount,
  saveAccountProfile,
  updateUserAccountData,
  UserAccount,
} from './services/authService';

const STORAGE_FAVORITES = 'anicrash_favorites_v2';
const STORAGE_HISTORY = 'anicrash_history_v2';
const STORAGE_PROFILE = 'anicrash_profile_v2';

export default function App() {
  const [isLoadingAssembly, setIsLoadingAssembly] = useState<boolean>(true);

  // Authentication session state
  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(() => {
    return getCurrentUserAccount();
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('register');

  // Local state persistence (Real user actions only - no fake entries)
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Deduplicate by animeId
          const unique = new Map();
          parsed.forEach(f => {
            if (f && f.animeId) unique.set(f.animeId, f);
          });
          return Array.from(unique.values());
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [watchHistory, setWatchHistory] = useState<WatchProgress[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Deduplicate by animeId
          const unique = new Map();
          parsed.forEach(h => {
            if (h && h.animeId) unique.set(h.animeId, h);
          });
          return Array.from(unique.values());
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const activeAcc = getCurrentUserAccount();
    if (activeAcc) return activeAcc.profile;
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PROFILE;
  });

  // Handle profile updates
  const handleUpdateProfile = useCallback((updated: UserProfile) => {
    setUserProfile(updated);
    if (currentAccount) {
      saveAccountProfile(currentAccount.id, updated);
      const refreshed = getCurrentUserAccount();
      if (refreshed) setCurrentAccount(refreshed);
    }
  }, [currentAccount]);

  const handleLoginSuccess = useCallback((account: UserAccount) => {
    setCurrentAccount(account);
    setUserProfile(account.profile);

    // If account has existing favorites, load them; else save current guest favorites into new account
    if (account.favorites && account.favorites.length > 0) {
      setFavorites(account.favorites);
    } else if (favorites.length > 0) {
      updateUserAccountData(account.id, { favorites });
    }

    // If account has existing watch history, load it; else save current guest history
    if (account.watchHistory && account.watchHistory.length > 0) {
      setWatchHistory(account.watchHistory);
    } else if (watchHistory.length > 0) {
      updateUserAccountData(account.id, { watchHistory });
    }

    setAuthModalOpen(false);
  }, [favorites, watchHistory]);

  const handleLogout = useCallback(() => {
    logoutUserAccount();
    setCurrentAccount(null);
    setUserProfile(DEFAULT_PROFILE);
  }, []);

  const handleOpenAuth = useCallback((mode: 'login' | 'register' = 'register') => {
    setAuthModalInitialMode(mode);
    setAuthModalOpen(true);
  }, []);

  // Save to localStorage and sync with logged-in user account
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
      if (currentAccount && !currentAccount.isGuest) {
        updateUserAccountData(currentAccount.id, { favorites });
      }
    } catch (e) {
      console.error(e);
    }
  }, [favorites, currentAccount?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(watchHistory));
      if (currentAccount && !currentAccount.isGuest) {
        updateUserAccountData(currentAccount.id, { watchHistory });
      }
    } catch (e) {
      console.error(e);
    }
  }, [watchHistory, currentAccount?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(userProfile));
      if (currentAccount && !currentAccount.isGuest) {
        updateUserAccountData(currentAccount.id, { profile: userProfile });
      }
    } catch (e) {
      console.error(e);
    }
  }, [userProfile, currentAccount?.id]);

  // Views & Navigation
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activePlayingAnime, setActivePlayingAnime] = useState<Anime | null>(null);
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState<number>(1);
  const [activeResumeTime, setActiveResumeTime] = useState<number>(0);
  const [watchPartyTarget, setWatchPartyTarget] = useState<{ animeId?: string; episode?: number }>({});

  // Modals
  const [selectedAnimeModal, setSelectedAnimeModal] = useState<Anime | null>(null);
  const [quickSearchOpen, setQuickSearchOpen] = useState<boolean>(false);
  const [rouletteOpen, setRouletteOpen] = useState<boolean>(false);

  useEffect(() => {
    // Custom database logic removed per user request
  }, []);

  // Combined anime database (ANIME_DATABASE)
  const completeAnimeDatabase = useMemo(() => {
    return ANIME_DATABASE;
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedGenre, setSelectedGenre] = useState('Все жанры');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');

  // Load more state for catalog
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(20);

  // Reset load more when filters change
  useEffect(() => {
    setCatalogVisibleCount(20);
  }, [debouncedSearchQuery, selectedGenre, selectedStatus, selectedType, selectedSort]);

  // Featured Anime for banner
  const featuredAnime = useMemo(() => {
    const featured = completeAnimeDatabase.filter((a) => a.featured);
    return featured.length > 0 ? featured : completeAnimeDatabase.slice(0, 4);
  }, [completeAnimeDatabase]);

  // Recommendations calculated dynamically based on history and favorites
  const recommendations = useMemo(() => {
    return getRecommendations(watchHistory, favorites);
  }, [watchHistory, favorites]);

  // Filtered Anime List for Catalog
  const filteredCatalog = useMemo(() => {
    return completeAnimeDatabase.filter((anime) => {
      // Search
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        const matchTitle =
          anime.title.toLowerCase().includes(q) ||
          anime.englishTitle.toLowerCase().includes(q) ||
          anime.originalTitle.toLowerCase().includes(q) ||
          anime.studio.toLowerCase().includes(q) ||
          anime.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle) return false;
      }

      // Genre
      if (selectedGenre !== 'Все жанры' && !anime.genres.includes(selectedGenre)) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && anime.status !== selectedStatus) {
        return false;
      }

      // Type
      if (selectedType !== 'all' && anime.type !== selectedType) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (selectedSort === 'rating') return b.rating - a.rating;
      if (selectedSort === 'year') return b.year - a.year;
      if (selectedSort === 'title') return a.title.localeCompare(b.title);
      // 'popular'
      return (a.trendingRank || 99) - (b.trendingRank || 99);
    });
  }, [searchQuery, selectedGenre, selectedStatus, selectedType, selectedSort]);

  // Real dynamic genre counts calculation from the anime database
  const genreShowcaseItems = useMemo(() => {
    const formatTitlesCount = (count: number): string => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod100 >= 11 && mod100 <= 19) {
        return `${count} тайтлов`;
      }
      if (mod10 === 1) {
        return `${count} тайтл`;
      }
      if (mod10 >= 2 && mod10 <= 4) {
        return `${count} тайтла`;
      }
      return `${count} тайтлов`;
    };

    const genresConfig = [
      { name: 'Экшен', icon: Swords },
      { name: 'Сёнен', icon: Zap },
      { name: 'Фэнтези', icon: Wand2 },
      { name: 'Приключения', icon: Compass },
      { name: 'Драма', icon: Sparkles },
      { name: 'Комедия', icon: Smile },
      { name: 'Фантастика', icon: Cpu },
      { name: 'Сверхъестественное', icon: Flame },
      { name: 'Киберпанк', icon: Film },
      { name: 'Триллер', icon: Eye },
      { name: 'Романтика', icon: Coffee },
    ];

    return genresConfig
      .map((item) => {
        const realCount = completeAnimeDatabase.filter((a) =>
          a.genres?.some((g) => g.toLowerCase() === item.name.toLowerCase())
        ).length;

        return {
          name: item.name,
          count: formatTitlesCount(realCount),
          realCount,
          icon: item.icon,
        };
      })
      .filter((item) => item.realCount > 0)
      .slice(0, 6);
  }, [completeAnimeDatabase]);

  // Favorite helpers
  const isFavorite = useCallback((animeId: string) => {
    return favorites.some((f) => f.animeId === animeId);
  }, [favorites]);

  const getWatchlistStatus = useCallback((animeId: string) => {
    return favorites.find((f) => f.animeId === animeId)?.status;
  }, [favorites]);

  const handleToggleFavorite = useCallback((anime: Anime, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.some((f) => f.animeId === anime.id);
      if (exists) {
        return prev.filter((f) => f.animeId !== anime.id);
      }
      return [...prev, { animeId: anime.id, status: 'favorites', addedAt: Date.now() }];
    });
  }, []);

  const handleUpdateWatchlist = useCallback((animeId: string, status: WatchlistStatus) => {
    setFavorites((prev) => {
      const existing = prev.filter((f) => f.animeId !== animeId);
      return [...existing, { animeId, status, addedAt: Date.now() }];
    });
  }, []);

  const handleRemoveFavorite = useCallback((animeId: string) => {
    setFavorites((prev) => prev.filter((f) => f.animeId !== animeId));
  }, []);

  // Watch & Play
  const handlePlayAnime = useCallback(async (anime: Anime, episodeNum?: number, resumeTime?: number) => {
    const resolvedAnime = await ensureAnimeEpisodes(anime);
    
    // Calculate target episode and time
    const existingProgress = watchHistory.find((w) => w.animeId === resolvedAnime.id);
    const targetEpisode = episodeNum || existingProgress?.episodeNumber || 1;
    const targetTime =
      resumeTime !== undefined
        ? resumeTime
        : existingProgress?.episodeNumber === targetEpisode
        ? existingProgress.currentTime
        : 0;

    // Set player state
    setActivePlayingAnime(resolvedAnime);
    setActiveEpisodeNumber(targetEpisode);
    setActiveResumeTime(targetTime);
  }, [watchHistory]);

  const handleProgressUpdate = useCallback((progress: WatchProgress) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((w) => w.animeId !== progress.animeId);
      return [progress, ...filtered];
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setWatchHistory([]);
  }, []);

  const handleStartWatchParty = useCallback((anime: Anime, episodeNum: number = 1) => {
    setActivePlayingAnime(null);
    setSelectedAnimeModal(null);
    setWatchPartyTarget({ animeId: anime.id, episode: episodeNum });
    setCurrentView('watch-party');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Hotkey for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-rose-600 selection:text-white relative">
      {isLoadingAssembly && (
        <SiteAssemblyLoader onComplete={() => setIsLoadingAssembly(false)} />
      )}

      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <div className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <Navbar
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            favoritesCount={favorites.length}
            historyCount={watchHistory.length}
            onOpenSearch={() => setQuickSearchOpen(true)}
            onOpenRoulette={() => setRouletteOpen(true)}
            onOpenCustomModal={() => {}}
            currentUser={userProfile}
            isAuthenticated={!!currentAccount}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 pt-2 pb-24 sm:pb-20 lg:pb-16">
        {/* VIEW: HOME */}
        {currentView === 'home' && (
          <div className="space-y-8 sm:space-y-12">
            {/* Hero Carousel */}
            <HeroBanner
              featuredAnime={featuredAnime}
              isFavorite={isFavorite}
              onPlay={(anime) => handlePlayAnime(anime, 1)}
              onSelect={(anime) => setSelectedAnimeModal(anime)}
              onToggleFavorite={handleToggleFavorite}
            />

            {/* Zero-Ads Guarantee Bar */}
            <div
              id="zero-ads-banner"
              className="relative p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900/80 to-zinc-900/40 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 shadow-xl"
            >
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="font-bold text-xs xs:text-sm sm:text-base text-white">
                      AniCrash: Плеер без рекламы
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] xs:text-[10px] font-bold border border-emerald-500/30">
                      0% РЕКЛАМЫ
                    </span>
                  </div>
                  <p className="text-[11px] xs:text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Смотрите серии напрямую без всплывающих окон, казино и рекламных интеграций. Плавная перемотка и быстрый HLS-стриминг.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
                <button
                  onClick={() => setQuickSearchOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Найти аниме
                </button>
              </div>
            </div>

            {/* Continue Watching Section (if history exists) */}
            {watchHistory.length > 0 && (
              <section id="continue-watching-section">
                <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <HistoryIcon className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg xs:text-xl md:text-2xl font-black text-white tracking-tight">
                      Продолжить просмотр
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('history')}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Вся история</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {watchHistory.slice(0, 3).map((prog) => {
                    const anime = completeAnimeDatabase.find((a) => a.id === prog.animeId);
                    if (!anime) return null;
                    const percent =
                      prog.duration > 0
                        ? Math.min(100, Math.round((prog.currentTime / prog.duration) * 100))
                        : 0;

                    return (
                      <div
                        key={anime.id}
                        onClick={() => handlePlayAnime(anime, prog.episodeNumber, prog.currentTime)}
                        className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-rose-500/40 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0">
                          <EnhancedImage
                            src={anime.poster}
                            alt={anime.title}
                            enhanceLevel="standard"
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-rose-600/70 transition-colors">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white translate-x-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 block">
                            Серия {prog.episodeNumber} ({percent}%)
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5 group-hover:text-rose-400 transition-colors">
                            {anime.title}
                          </h4>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Smart Recommendations Section */}
            <RecommendationsSection
              recommendations={recommendations}
              watchHistory={watchHistory}
              isFavorite={isFavorite}
              onSelectAnime={(anime) => setSelectedAnimeModal(anime)}
              onPlayAnime={(anime) => handlePlayAnime(anime)}
              onToggleFavorite={handleToggleFavorite}
            />

            {/* Top Trending Anime Section */}
            <section id="trending-section">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Сейчас смотрят
                    </span>
                  </div>
                  <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-white tracking-tight">
                    Популярные тайтлы
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedSort('popular');
                    setCurrentView('catalog');
                  }}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Смотреть все</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 xs:gap-3 sm:gap-4">
                {ANIME_DATABASE.slice(0, 12).map((anime, idx) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    isFavorite={isFavorite(anime.id)}
                    progress={watchHistory.find((w) => w.animeId === anime.id)}
                    onSelect={(a) => setSelectedAnimeModal(a)}
                    onPlay={(a) => handlePlayAnime(a)}
                    onToggleFavorite={handleToggleFavorite}
                    rankBadge={idx < 6 ? idx + 1 : undefined}
                  />
                ))}
              </div>
            </section>

            {/* Genre Quick Showcase Section */}
            <section id="genre-showcase-section" className="pt-2 sm:pt-4">
              <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <Award className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg xs:text-xl md:text-2xl font-black text-white tracking-tight">
                    Жанры и категории
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Каталог</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {genreShowcaseItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setSelectedGenre(item.name);
                        setCurrentView('catalog');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-3 sm:p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 hover:border-rose-500/50 text-left transition-all group cursor-pointer active:scale-98 select-none"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800/90 group-hover:bg-rose-500/20 border border-zinc-700/50 group-hover:border-rose-500/30 flex items-center justify-center mb-2.5 sm:mb-3 transition-colors">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-rose-400 transition-colors" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-rose-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">{item.count}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* VIEW: CATALOG & GENRES */}
        {currentView === 'catalog' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <Disc3 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Каталог аниме
                </span>
              </div>
              <h1 className="text-xl xs:text-2xl md:text-3xl font-black text-white tracking-tight">
                Все тайтлы на AniCrash
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Фильтруйте по жанрам, ищите любые сериалы и смотрите в Full HD без рекламы.
              </p>
            </div>

            {/* Filters bar */}
            <CatalogFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              selectedType={selectedType}
              onSelectType={setSelectedType}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
              totalCount={filteredCatalog.length}
              onResetFilters={() => {
                setSearchQuery('');
                setSelectedGenre('Все жанры');
                setSelectedStatus('all');
                setSelectedType('all');
                setSelectedSort('popular');
              }}
            />

            {/* Catalog Grid */}
            {filteredCatalog.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
                  {filteredCatalog.slice(0, catalogVisibleCount).map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      anime={anime}
                      isFavorite={isFavorite(anime.id)}
                      progress={watchHistory.find((w) => w.animeId === anime.id)}
                      onSelect={(a) => setSelectedAnimeModal(a)}
                      onPlay={(a) => handlePlayAnime(a)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
                
                {catalogVisibleCount < filteredCatalog.length && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setCatalogVisibleCount(prev => prev + 20)}
                      className="px-8 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white transition-all shadow-xl cursor-pointer"
                    >
                      Загрузить еще аниме
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-4 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 max-w-md mx-auto my-6 sm:my-8">
                <Disc3 className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Ничего не найдено</h3>
                <p className="text-xs text-zinc-400 mb-5 sm:mb-6 leading-relaxed">
                  Попробуйте изменить параметры поиска или найти тайтл через глобальный поиск по каталогу.
                </p>
                <div className="flex justify-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('Все жанры');
                      setSelectedStatus('all');
                      setSelectedType('all');
                    }}
                    className="px-3.5 sm:px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Сбросить фильтры
                  </button>
                  <button
                    onClick={() => setQuickSearchOpen(true)}
                    className="px-3.5 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Онлайн поиск
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: RECOMMENDATIONS */}
        {currentView === 'recommendations' && (
          <div className="space-y-6">
            <RecommendationsSection
              recommendations={recommendations}
              watchHistory={watchHistory}
              isFavorite={isFavorite}
              onSelectAnime={(anime) => setSelectedAnimeModal(anime)}
              onPlayAnime={(anime) => handlePlayAnime(anime)}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {/* VIEW: FAVORITES & BOOKMARKS */}
        {currentView === 'favorites' && (
          <FavoritesView
            favorites={favorites}
            allAnime={completeAnimeDatabase}
            watchHistory={watchHistory}
            onSelectAnime={(anime) => setSelectedAnimeModal(anime)}
            onPlayAnime={(anime) => handlePlayAnime(anime)}
            onToggleFavorite={handleToggleFavorite}
            onGoToCatalog={() => setCurrentView('catalog')}
          />
        )}

        {/* VIEW: HISTORY */}
        {currentView === 'history' && (
          <HistoryView
            watchHistory={watchHistory}
            allAnime={completeAnimeDatabase}
            onPlayAnime={handlePlayAnime}
            onSelectAnime={(anime) => setSelectedAnimeModal(anime)}
            onClearHistory={handleClearHistory}
            onGoToCatalog={() => setCurrentView('catalog')}
          />
        )}

        {/* VIEW: WATCH PARTY (С ДРУЗЬЯМИ) */}
        {currentView === 'watch-party' && (
          <WatchPartyView
            allAnime={completeAnimeDatabase}
            currentUser={userProfile}
            initialAnimeId={watchPartyTarget.animeId}
            initialEpisode={watchPartyTarget.episode}
            onPlayInSoloPlayer={(anime, epNum, time) => {
              handlePlayAnime(anime, epNum, time);
            }}
            onProgressUpdate={handleProgressUpdate}
          />
        )}

        {/* VIEW: CUSTOM USER PROFILE */}
        {currentView === 'profile' && (
          <ProfileView
            profile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            allAnime={completeAnimeDatabase}
            watchHistory={watchHistory}
            favorites={favorites}
            onPlayAnime={(anime) => handlePlayAnime(anime)}
            currentUserAccount={currentAccount}
            isAuthenticated={!!currentAccount}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectGenre={(genre) => {
          setSelectedGenre(genre);
          setCurrentView('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Fullscreen Video Player Modal */}
      {activePlayingAnime && (
        <VideoPlayer
          anime={activePlayingAnime}
          initialEpisodeNumber={activeEpisodeNumber}
          initialTime={activeResumeTime}
          onClose={() => setActivePlayingAnime(null)}
          onProgressUpdate={handleProgressUpdate}
          onStartWatchParty={handleStartWatchParty}
        />
      )}

      {/* Anime Detail Modal */}
      {selectedAnimeModal && (
        <AnimeDetailModal
          anime={selectedAnimeModal}
          isFavorite={isFavorite(selectedAnimeModal.id)}
          watchlistStatus={getWatchlistStatus(selectedAnimeModal.id)}
          progress={watchHistory.find((w) => w.animeId === selectedAnimeModal.id)}
          currentUser={userProfile}
          onClose={() => setSelectedAnimeModal(null)}
          onPlayEpisode={(anime, epNum) => {
            setSelectedAnimeModal(null);
            handlePlayAnime(anime, epNum);
          }}
          onUpdateWatchlist={handleUpdateWatchlist}
          onRemoveFavorite={handleRemoveFavorite}
          onStartWatchParty={handleStartWatchParty}
        />
      )}

      {/* Quick Search Modal */}
      {quickSearchOpen && (
        <QuickSearchModal
          onClose={() => setQuickSearchOpen(false)}
          onSelectAnime={(anime) => {
            setQuickSearchOpen(false);
            setSelectedAnimeModal(anime);
          }}
          onPlayAnime={(anime) => {
            setQuickSearchOpen(false);
            handlePlayAnime(anime);
          }}
        />
      )}

      {/* Anime Roulette Modal */}
      <AnimeRouletteModal
        isOpen={rouletteOpen}
        onClose={() => setRouletteOpen(false)}
        animeList={completeAnimeDatabase}
        onSelect={(anime) => setSelectedAnimeModal(anime)}
      />

      {/* User Authentication Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={true}
          initialMode={authModalInitialMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
