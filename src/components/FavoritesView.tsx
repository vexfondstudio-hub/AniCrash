import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Tv2, Clock, CheckCheck, Trash2 } from 'lucide-react';
import { Anime, FavoriteEntry, WatchlistStatus, WatchProgress } from '../types';
import { AnimeCard } from './AnimeCard';

interface FavoritesViewProps {
  favorites: FavoriteEntry[];
  allAnime: Anime[];
  watchHistory: WatchProgress[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
  onToggleFavorite: (anime: Anime, e: React.MouseEvent) => void;
  onGoToCatalog: () => void;
}

const TABS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'Все закладки', icon: Bookmark },
  { id: 'favorites', label: 'Избранное', icon: BookmarkCheck },
  { id: 'watching', label: 'Смотрю сейчас', icon: Tv2 },
  { id: 'planned', label: 'В планах', icon: Clock },
  { id: 'completed', label: 'Просмотрено', icon: CheckCheck },
];

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  allAnime,
  watchHistory,
  onSelectAnime,
  onPlayAnime,
  onToggleFavorite,
  onGoToCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredEntries = favorites.filter((fav) => {
    if (activeTab === 'all') return true;
    return fav.status === activeTab;
  });

  const animeList = filteredEntries
    .map((fav) => allAnime.find((a) => a.id === fav.animeId))
    .filter((a): a is Anime => a !== undefined);

  // Tab counts
  const getCount = (tabId: string) => {
    if (tabId === 'all') return favorites.length;
    return favorites.filter((f) => f.status === tabId).length;
  };

  return (
    <div id="favorites-view-container" className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <BookmarkCheck className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Личный кабинет
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Мои закладки и избранное
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Ваш персональный трекер аниме. Сохраняется автоматически в браузере.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = getCount(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {animeList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {animeList.map((anime) => {
            const progress = watchHistory.find((w) => w.animeId === anime.id);
            return (
              <AnimeCard
                key={anime.id}
                anime={anime}
                isFavorite={true}
                progress={progress}
                onSelect={onSelectAnime}
                onPlay={onPlayAnime}
                onToggleFavorite={onToggleFavorite}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 max-w-md mx-auto my-8">
          <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Здесь пока пусто</h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Добавляйте интересные аниме в избранное или в список «В планах», чтобы не потерять и
            получать точные персональные рекомендации.
          </p>
          <button
            onClick={onGoToCatalog}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 active:scale-95"
          >
            Перейти в каталог аниме
          </button>
        </div>
      )}
    </div>
  );
};
