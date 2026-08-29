import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Crown,
  Palette,
  Camera,
  Check,
  Star,
  Clock,
  Bookmark,
  Disc3,
  Volume2,
  VolumeX,
  Sliders,
  CheckCheck,
  Play,
  Share2,
  BarChart3,
  Film,
  Tv,
  CheckCircle2,
  History,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  RotateCcw,
  Search,
  Flame,
  Layers,
  Save,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { UserProfile, Anime, WatchProgress, FavoriteEntry, UserAccount } from '../types';
import {
  AVATAR_PRESETS,
  BANNER_PRESETS,
  AURA_PRESETS,
  ACCENT_THEME_PRESETS,
  TITLE_PRESETS,
  ANIME_QUOTE_PRESETS,
} from '../data/profilePresets';
import { EnhancedImage } from './EnhancedImage';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  allAnime: Anime[];
  watchHistory: WatchProgress[];
  favorites: FavoriteEntry[];
  onPlayAnime: (anime: Anime) => void;
  currentUserAccount?: UserAccount | null;
  isAuthenticated: boolean;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

type TabType = 'appearance' | 'details' | 'showcase' | 'pinned' | 'stats';

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  allAnime,
  watchHistory,
  favorites,
  onPlayAnime,
  currentUserAccount,
  isAuthenticated,
  onOpenAuth,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [animeSearchQuery, setAnimeSearchQuery] = useState('');
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setDraftProfile(profile);
  }, [profile]);

  // Real stats calculation
  const totalWatchSeconds = useMemo(() => {
    return watchHistory.reduce((acc, curr) => acc + (Math.max(0, curr.currentTime) || 0), 0);
  }, [watchHistory]);

  const formattedWatchTime = useMemo(() => {
    if (totalWatchSeconds <= 0) return '0 мин';
    const hours = Math.floor(totalWatchSeconds / 3600);
    const mins = Math.floor((totalWatchSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  }, [totalWatchSeconds]);

  const totalEpisodesWatched = useMemo(() => {
    return watchHistory.filter((w) => w.completed || (w.currentTime && w.currentTime > 20)).length;
  }, [watchHistory]);

  const completedEpisodesCount = useMemo(() => {
    return watchHistory.filter((w) => w.completed).length;
  }, [watchHistory]);

  const uniqueAnimeCount = useMemo(() => {
    return new Set(watchHistory.map((w) => w.animeId)).size;
  }, [watchHistory]);

  const topGenres = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    watchHistory.forEach((w) => {
      const anime = allAnime.find((a) => a.id === w.animeId);
      anime?.genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    return Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  }, [watchHistory, allAnime]);

  const favoritesByFolder = useMemo(() => {
    const folders: Record<string, number> = {
      watching: 0,
      plan_to_watch: 0,
      completed: 0,
      dropped: 0,
    };
    favorites.forEach((f) => {
      folders[f.folder] = (folders[f.folder] || 0) + 1;
    });
    return folders;
  }, [favorites]);

  const pinnedAnime = useMemo(() => {
    return allAnime.find((a) => a.id === draftProfile.pinnedAnimeId) || allAnime[0];
  }, [allAnime, draftProfile.pinnedAnimeId]);

  const activeAura = useMemo(() => {
    return AURA_PRESETS.find((a) => a.id === draftProfile.aura) || AURA_PRESETS[0];
  }, [draftProfile.aura]);

  const activeTheme = useMemo(() => {
    return (
      ACCENT_THEME_PRESETS.find((t) => t.id === draftProfile.accentTheme) ||
      ACCENT_THEME_PRESETS[0]
    );
  }, [draftProfile.accentTheme]);

  const handleSave = () => {
    onUpdateProfile(draftProfile);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  const handleRandomizeStyle = () => {
    const randomAvatar = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
    const randomBanner = BANNER_PRESETS[Math.floor(Math.random() * BANNER_PRESETS.length)];
    const aurasWithoutNone = AURA_PRESETS.filter((a) => a.id !== 'none');
    const randomAura = aurasWithoutNone[Math.floor(Math.random() * aurasWithoutNone.length)];
    const randomTheme = ACCENT_THEME_PRESETS[Math.floor(Math.random() * ACCENT_THEME_PRESETS.length)];
    const randomTitle = TITLE_PRESETS[Math.floor(Math.random() * TITLE_PRESETS.length)];
    const randomQuote = ANIME_QUOTE_PRESETS[Math.floor(Math.random() * ANIME_QUOTE_PRESETS.length)];

    setDraftProfile((prev) => ({
      ...prev,
      avatar: randomAvatar.url,
      bannerUrl: randomBanner.url,
      aura: randomAura.id,
      accentTheme: randomTheme.id,
      title: randomTitle,
      statusQuote: randomQuote,
      pinnedAnimeId: randomAvatar.animeId,
    }));
  };

  const handleResetDraft = () => {
    setDraftProfile(profile);
  };

  const handleCopyProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDraftProfile((prev) => ({
            ...prev,
            avatar: event.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div id="profile-customizer" className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Palette className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Кастомизация профиля AniCrash
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Оформление аккаунта & Витрина
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Настройте ауру, аниме-аватар, акцентный стиль плеера и любимый тайтл на витрине.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyProfile}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Скопировано!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span>Поделиться</span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all transform active:scale-95 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Сохранить профиль</span>
          </button>
        </div>
      </div>

      {/* Save Toast Notification */}
      {showSavedNotification && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-slide-down shadow-2xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Настройки оформления профиля успешно применены и сохранены в ваш аккаунт!</span>
          </div>
          <button
            onClick={() => setShowSavedNotification(false)}
            className="text-xs text-emerald-400 hover:underline cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Account Authentication Status Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <ShieldCheck className={`w-5 h-5 ${isAuthenticated ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                {isAuthenticated
                  ? currentUserAccount?.email
                    ? `Аккаунт: ${currentUserAccount.email}`
                    : `Пользователь: ${draftProfile.username}`
                  : 'Гостевой режим'}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isAuthenticated
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                {isAuthenticated ? 'Авторизован' : 'Гость'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAuthenticated
                ? 'Ваш профиль, история и закладки надежно привязаны к этому аккаунту'
                : 'Создайте аккаунт, чтобы ваши закладки и прогресс сохранялись навсегда'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                <span>Войти</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Регистрация</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                <span>Сменить аккаунт</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Выйти</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* LIVE PROFILE HERO PREVIEW CARD */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800/90 bg-zinc-950 shadow-2xl">
        {/* Banner Cover Image */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-zinc-900">
          <EnhancedImage
            src={draftProfile.bannerUrl}
            alt="Profile Banner"
            enhanceLevel="ultra"
            containerClassName="w-full h-full"
            className="w-full h-full object-cover transition-all duration-700 brightness-75 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          {/* Theme Accent Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${activeTheme.badgeClass}`}>
              Тема: {activeTheme.name}
            </span>
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="relative px-5 sm:px-8 pb-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            {/* Avatar + Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Avatar with Aura */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-3 bg-zinc-900 transition-all duration-300 ${activeAura.className}`}
                >
                  <EnhancedImage
                    src={draftProfile.avatar}
                    alt={draftProfile.username}
                    enhanceLevel="ultra"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Aura Icon Tag */}
                {draftProfile.aura !== 'none' && (
                  <span
                    className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-zinc-900 text-white border border-zinc-700 shadow-md"
                    title={`Аура: ${activeAura.name}`}
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                  </span>
                )}
              </div>

              {/* Names & Titles */}
              <div className="space-y-1.5 pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {draftProfile.username || 'Без имени'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    <span>{draftProfile.title || 'Отаку'}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 font-medium italic max-w-xl line-clamp-2">
                  "{draftProfile.statusQuote || 'Смотрю аниме в 4K и без рекламы на AniCrash'}"
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    На сайте с: {draftProfile.joinedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Tv className="w-3.5 h-3.5" />
                    {totalEpisodesWatched} серий просмотрено
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Bookmark className="w-3.5 h-3.5" />
                    {favorites.length} в закладках
                  </span>
                </div>
              </div>
            </div>

            {/* Sound FX indicator */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDraftProfile((p) => ({ ...p, soundEffects: !p.soundEffects }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {draftProfile.soundEffects ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                )}
                <span>Звуки: {draftProfile.soundEffects ? 'Вкл' : 'Выкл'}</span>
              </button>
            </div>
          </div>

          {/* PINNED ANIME SHOWCASE PREVIEW */}
          {pinnedAnime && (
            <div className="mt-6 pt-5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Любимый тайтл на витрине
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">Закреплённый релиз</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <EnhancedImage
                    src={pinnedAnime.poster}
                    alt={pinnedAnime.title}
                    containerClassName="w-14 h-20 rounded-xl overflow-hidden border border-zinc-700 shrink-0 shadow-md"
                    className="w-full h-full object-cover"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {pinnedAnime.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{draftProfile.pinnedAnimeRating || 10}/10</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl line-clamp-2 italic">
                      "{draftProfile.pinnedAnimeReview || 'Шедевр анимации, обязательный к просмотру!'}"
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500">
                      <span>{pinnedAnime.year}</span>
                      <span>•</span>
                      <span>{pinnedAnime.studio}</span>
                      <span>•</span>
                      <span>{pinnedAnime.genres.slice(0, 3).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onPlayAnime(pinnedAnime)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-md shadow-rose-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Смотреть</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REWORKED TAB NAVIGATION & ACTION BAR                                      */}
      {/* ========================================================================= */}
      <div className="sticky top-20 z-30 p-2 sm:p-2.5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          {[
            { id: 'appearance', label: 'Аватар & Аура', icon: Camera, count: AVATAR_PRESETS.length },
            { id: 'showcase', label: 'Баннер & Тема', icon: Palette, count: BANNER_PRESETS.length },
            { id: 'pinned', label: 'Витрина тайтлов', icon: Star, count: allAnime.length },
            { id: 'details', label: 'Титул & Девиз', icon: Crown, count: TITLE_PRESETS.length },
            { id: 'stats', label: 'Статистика', icon: BarChart3, count: watchHistory.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700/80 ring-1 ring-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Action Buttons on Tab Bar */}
        <div className="flex items-center gap-2 justify-start sm:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800/80 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={handleRandomizeStyle}
            title="Случайный подбор аниме стиля"
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Случайный стиль</span>
          </button>

          <button
            type="button"
            onClick={handleResetDraft}
            title="Сбросить несохраненные изменения"
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Применить</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPEARANCE (REAL ANIME AVATARS & ENERGY AURAS)                      */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-8 animate-fade-in">
          {/* Energy Aura Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Энергетическая Аура Аватара
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Выберите анимированное свечение профиля, отражающее вашу силу и стиль.
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                Выбрано: <strong className="text-zinc-300">{activeAura.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AURA_PRESETS.map((aura) => {
                const isSelected = draftProfile.aura === aura.id;
                return (
                  <button
                    key={aura.id}
                    onClick={() => setDraftProfile((p) => ({ ...p, aura: aura.id }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-zinc-900 border-white/40 shadow-xl ring-1 ring-white/20'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl overflow-hidden border-2 bg-zinc-800 shrink-0 ${aura.className}`}
                      >
                        <EnhancedImage
                          src={draftProfile.avatar}
                          alt="Aura Preview"
                          enhanceLevel="ultra"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">{aura.name}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                          {aura.description}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-1 border-t border-zinc-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Активная аура</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real Anime Characters & Posters Collection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-rose-400" />
                  Реальные Аниме Аватары & Описания релизов
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Официальные постеры релизов AniLibria с рейтингом и полным описанием сюжета.
                </p>
              </div>

              {/* Search filter for presets */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск тайтла..."
                  value={animeSearchQuery}
                  onChange={(e) => setAnimeSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {AVATAR_PRESETS.filter(
                (item) =>
                  !animeSearchQuery.trim() ||
                  item.name.toLowerCase().includes(animeSearchQuery.toLowerCase()) ||
                  item.anime.toLowerCase().includes(animeSearchQuery.toLowerCase()) ||
                  item.description.toLowerCase().includes(animeSearchQuery.toLowerCase())
              ).map((item) => {
                const isSelected = draftProfile.avatar === item.url;
                const matchedAnime = allAnime.find((a) => a.id === item.animeId);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-zinc-900 border-rose-500/80 ring-2 ring-rose-500/30 shadow-2xl'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Real Poster Thumbnail */}
                      <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/80 shadow-md">
                        <EnhancedImage
                          src={item.url}
                          alt={item.name}
                          enhanceLevel="ultra"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating}</span>
                        </span>
                      </div>

                      {/* Info & Real Description */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                          <span className="text-[10px] text-zinc-500">{item.year}</span>
                        </div>

                        <div className="text-xs font-semibold text-rose-400 mt-0.5 truncate">
                          {item.anime}
                        </div>

                        <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {item.genres.map((g) => (
                            <span
                              key={g}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions on card */}
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/80 justify-between">
                      <button
                        type="button"
                        onClick={() => setDraftProfile((p) => ({ ...p, avatar: item.url }))}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Выбран как аватар</span>
                          </>
                        ) : (
                          <span>Выбрать аватар</span>
                        )}
                      </button>

                      {matchedAnime && (
                        <button
                          type="button"
                          onClick={() => onPlayAnime(matchedAnime)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>Смотреть тайтл</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Avatar Upload or URL */}
            <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-3 shadow-lg">
              <h4 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
                Загрузить собственный аватар
              </h4>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span>Загрузить фото с диска</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="w-full flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Вставьте ссылку на любой аниме арт..."
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
                  />
                  {customAvatarUrl && (
                    <button
                      onClick={() => {
                        setDraftProfile((p) => ({ ...p, avatar: customAvatarUrl }));
                        setCustomAvatarUrl('');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Применить
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BANNER & THEME (REAL ANIME COVERS & CONTRAST ACCENTS)              */}
      {/* ========================================================================= */}
      {activeTab === 'showcase' && (
        <div className="space-y-8 animate-fade-in">
          {/* Accent Theme Color */}
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-400" />
                Цветовая тема интерфейса AniCrash
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Адаптирует акцентные цвета кнопок, подсветок плеера и бейджей.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {ACCENT_THEME_PRESETS.map((theme) => {
                const isSelected = draftProfile.accentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setDraftProfile((p) => ({ ...p, accentTheme: theme.id }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 border-white/50 shadow-xl ring-1 ring-white/20'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className="w-full h-9 rounded-xl mb-2 flex items-center justify-center shadow"
                      style={{ backgroundColor: theme.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </div>
                    <div className="font-bold text-xs text-white truncate">{theme.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real Anime Banners Presets */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Официальные Баннеры Аниме Релизов
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Широкоформатные официальные арты студий A-1 Pictures, MAPPA, Madhouse, ufotable и Trigger.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {BANNER_PRESETS.map((banner) => {
                const isSelected = draftProfile.bannerUrl === banner.url;
                const matchedAnime = allAnime.find((a) => a.id === banner.animeId);

                return (
                  <div
                    key={banner.id}
                    className={`p-3 rounded-3xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-zinc-900 border-rose-500 ring-2 ring-rose-500/30 shadow-2xl'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="h-32 rounded-2xl overflow-hidden relative bg-zinc-800 border border-zinc-700/60">
                      <EnhancedImage
                        src={banner.preview}
                        alt={banner.name}
                        enhanceLevel="ultra"
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="font-bold text-xs text-white truncate">{banner.name}</div>
                        <div className="text-[10px] text-zinc-300">{banner.studio} • {banner.year}</div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600 text-white shadow-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 px-1 line-clamp-2">
                      {banner.description}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 justify-between">
                      <button
                        type="button"
                        onClick={() => setDraftProfile((p) => ({ ...p, bannerUrl: banner.url }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Установлен</span>
                          </>
                        ) : (
                          'Выбрать баннер'
                        )}
                      </button>

                      {matchedAnime && (
                        <button
                          type="button"
                          onClick={() => onPlayAnime(matchedAnime)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>Смотреть</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Banner Input */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="url"
                placeholder="Вставьте прямую ссылку на свой фон или баннер..."
                value={customBannerUrl}
                onChange={(e) => setCustomBannerUrl(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500 w-full"
              />
              {customBannerUrl && (
                <button
                  onClick={() => {
                    setDraftProfile((p) => ({ ...p, bannerUrl: customBannerUrl }));
                    setCustomBannerUrl('');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  Применить баннер
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PINNED ANIME SHOWCASE (AUTHENTIC MEDIA CATALOG & MINI-REVIEW)       */}
      {/* ========================================================================= */}
      {activeTab === 'pinned' && (
        <div className="space-y-6 animate-fade-in max-w-4xl">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Витрина любимого аниме в профиле
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Закрепите тайтл на главной карточке профиля, выставите оценку и оставьте отзыв.
            </p>
          </div>

          {/* Anime Grid Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Выберите тайтл из базы данных AniLibria ({allAnime.length} релизов)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-96 overflow-y-auto pr-1">
              {allAnime.map((anime) => {
                const isSelected = draftProfile.pinnedAnimeId === anime.id;
                return (
                  <button
                    key={anime.id}
                    type="button"
                    onClick={() => setDraftProfile((p) => ({ ...p, pinnedAnimeId: anime.id }))}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-zinc-900 border-amber-500/80 ring-2 ring-amber-500/30 shadow-xl'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <EnhancedImage
                      src={anime.poster}
                      alt={anime.title}
                      containerClassName="w-14 h-20 rounded-xl overflow-hidden border border-zinc-700 shrink-0"
                      className="w-full h-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate">{anime.title}</div>
                      <div className="text-[11px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{anime.rating} • {anime.year}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                        {anime.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Scale */}
          <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Ваша персональная оценка:
              </label>
              <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{draftProfile.pinnedAnimeRating || 10} / 10</span>
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => setDraftProfile((p) => ({ ...p, pinnedAnimeRating: star }))}
                  className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    (draftProfile.pinnedAnimeRating || 10) >= star
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>

          {/* Review Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Ваша мини-рецензия к тайтлу
              </label>
              <span className="text-[10px] text-zinc-500">
                {(draftProfile.pinnedAnimeReview || '').length} / 250 символов
              </span>
            </div>

            <textarea
              value={draftProfile.pinnedAnimeReview}
              maxLength={250}
              rows={3}
              onChange={(e) => setDraftProfile((p) => ({ ...p, pinnedAnimeReview: e.target.value }))}
              placeholder="Почему именно этот тайтл лучший? Чем запомнился сюжет или анимация?"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xs sm:text-sm resize-none focus:border-rose-500 outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DETAILS (NICKNAME, TITLES, STATUS QUOTES)                          */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="space-y-6 animate-fade-in max-w-2xl">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Никнейм отаку
            </label>
            <input
              type="text"
              value={draftProfile.username}
              maxLength={24}
              onChange={(e) => setDraftProfile((p) => ({ ...p, username: e.target.value }))}
              placeholder="Введите никнейм..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm font-semibold focus:border-rose-500 outline-none transition-colors"
            />
          </div>

          {/* Title Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Титул профиля
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TITLE_PRESETS.map((t) => {
                const isSelected = draftProfile.title === t;
                return (
                  <button
                    key={t}
                    onClick={() => setDraftProfile((p) => ({ ...p, title: t }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Quote */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Девиз / Цитата в профиле
              </label>
              <span className="text-[10px] text-zinc-500">
                {draftProfile.statusQuote.length} / 120 символов
              </span>
            </div>

            <textarea
              value={draftProfile.statusQuote}
              maxLength={120}
              rows={2}
              onChange={(e) => setDraftProfile((p) => ({ ...p, statusQuote: e.target.value }))}
              placeholder="Ваша любимая цитата из аниме..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs sm:text-sm resize-none focus:border-rose-500 outline-none transition-colors"
            />

            {/* Quick Quote Inserters */}
            <div className="pt-2">
              <span className="text-[11px] text-zinc-500 font-semibold block mb-1.5">
                Популярные цитаты (кликните, чтобы вставить):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ANIME_QUOTE_PRESETS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setDraftProfile((p) => ({ ...p, statusQuote: q }))}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STATS & ACTIVITY (REAL STATS & HISTORY)                            */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-fade-in max-w-4xl">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Точная статистика активности
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Все метрики формируются исключительно на основе ваших реальных просмотров и добавленных закладок.
            </p>
          </div>

          {/* 4 Real Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs font-medium">Время просмотра</span>
                <Clock className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-black text-white">{formattedWatchTime}</div>
              <div className="text-[11px] text-zinc-500">
                {totalWatchSeconds > 0 ? `${Math.round(totalWatchSeconds)} сек чистого времени` : '0 сек'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs font-medium">Серий просмотрено</span>
                <Tv className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-white">{totalEpisodesWatched}</div>
              <div className="text-[11px] text-zinc-500">
                {completedEpisodesCount > 0 ? `${completedEpisodesCount} досмотрено до конца` : 'Пока нет досмотренных'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs font-medium">Тайтлов в истории</span>
                <Film className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white">{uniqueAnimeCount}</div>
              <div className="text-[11px] text-zinc-500">
                {uniqueAnimeCount === 0 ? 'Начните смотреть аниме' : 'уникальных тайтлов'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs font-medium">Всего в закладках</span>
                <Bookmark className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white">{favorites.length}</div>
              <div className="text-[11px] text-zinc-500">
                {favorites.length === 0 ? 'Папки пусты' : 'в персональных списках'}
              </div>
            </div>
          </div>

          {/* Bookmarks Distribution */}
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Распределение по папкам закладок
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">Смотрю</span>
                <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  {favoritesByFolder.watching}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">В планах</span>
                <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  {favoritesByFolder.plan_to_watch}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">Просмотрено</span>
                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {favoritesByFolder.completed}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">Брошено</span>
                <span className="text-xs font-bold text-zinc-400 px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700">
                  {favoritesByFolder.dropped}
                </span>
              </div>
            </div>
          </div>

          {/* Real History Activity Log */}
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-zinc-400" />
                История просмотров ({watchHistory.length})
              </h4>
            </div>

            {watchHistory.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-500">
                История просмотров пуста. Выберите любое аниме на главной или в каталоге, чтобы запустить серию.
              </div>
            ) : (
              <div className="space-y-2.5">
                {watchHistory.map((item) => {
                  const anime = allAnime.find((a) => a.id === item.animeId);
                  if (!anime) return null;
                  const progressPct = item.duration
                    ? Math.min(100, Math.round((item.currentTime / item.duration) * 100))
                    : 0;

                  return (
                    <div
                      key={`${item.animeId}-${item.episodeNumber}`}
                      className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <EnhancedImage
                          src={anime.poster}
                          alt={anime.title}
                          containerClassName="w-10 h-14 rounded-xl overflow-hidden border border-zinc-800 shrink-0"
                          className="w-full h-full object-cover"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-white truncate">{anime.title}</h5>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Серия {item.episodeNumber} • {item.completed ? 'Просмотрено полностью' : `${Math.floor(item.currentTime / 60)} мин из ${Math.floor((item.duration || 1440) / 60)} мин`}
                          </p>
                          <div className="w-28 h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${item.completed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${item.completed ? 100 : progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onPlayAnime(anime)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                        <span>Смотреть</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
