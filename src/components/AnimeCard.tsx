import React from 'react';
import { Play, Star, Bookmark, Check, Clock } from 'lucide-react';
import { Anime, WatchProgress } from '../types';
import { EnhancedImage } from './EnhancedImage';

interface AnimeCardProps {
  anime: Anime;
  isFavorite: boolean;
  progress?: WatchProgress;
  onSelect: (anime: Anime) => void;
  onPlay: (anime: Anime, episodeNum?: number) => void;
  onToggleFavorite: (anime: Anime, e: React.MouseEvent) => void;
  rankBadge?: number;
  matchScore?: number;
  reason?: string;
}

export const AnimeCard: React.FC<AnimeCardProps> = React.memo(({
  anime,
  isFavorite,
  progress,
  onSelect,
  onPlay,
  onToggleFavorite,
  rankBadge,
  matchScore,
  reason,
}) => {
  const percentWatched =
    progress && progress.duration > 0
      ? Math.round((progress.currentTime / progress.duration) * 100)
      : 0;

  return (
    <div
      id={`anime-card-${anime.id}`}
      className="group relative flex flex-col rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-rose-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/20 overflow-hidden cursor-pointer active:scale-[0.98]"
      onClick={() => onSelect(anime)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        <EnhancedImage
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          enhanceLevel="ultra"
          containerClassName="h-full w-full"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity" />

      {/* Top Badges: Rating & Rank */}
      <div className="absolute top-2 inset-x-2 sm:top-3 sm:inset-x-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-[10px] sm:text-[11px] font-black border border-amber-400/20 shadow-lg">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
            {anime.rating.toFixed(1)}
          </span>
          {rankBadge && (
            <span className="px-2 sm:px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] sm:text-[11px] font-black shadow-lg shadow-rose-600/40 border border-rose-500/30">
              #{rankBadge}
            </span>
          )}
        </div>

        {/* Favorite Toggle Button */}
        <button
          id={`fav-btn-${anime.id}`}
          onClick={(e) => onToggleFavorite(anime, e)}
          className={`pointer-events-auto p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 border cursor-pointer ${
            isFavorite
              ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/40'
              : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/90 border-white/10'
          }`}
          title={isFavorite ? 'Удалить из закладок' : 'Добавить в закладки'}
        >
          <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
      </div>

        {/* Match score badge (if from recommendation system) */}
        {matchScore && (
          <div className="absolute top-9 sm:top-11 left-2 sm:left-2.5 pointer-events-none">
            <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] sm:text-[11px] font-bold backdrop-blur-md border border-emerald-400/30 shadow">
              {matchScore}%
            </span>
          </div>
        )}

        {/* Hover Quick Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
          <button
            id={`play-quick-btn-${anime.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(anime, progress?.episodeNumber || 1);
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/50 transition-transform active:scale-95 cursor-pointer"
            title="Смотреть прямо сейчас"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white translate-x-0.5" />
          </button>
        </div>

        {/* Bottom Episode & Type Pill */}
        <div className="absolute bottom-2 inset-x-2 sm:bottom-2.5 sm:inset-x-2.5 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-300 font-medium">
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/5 truncate max-w-[55%]">
            {anime.year} • {anime.type}
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/5 text-rose-300">
            {anime.status === 'Онгоинг' ? `${anime.currentEpisodes} сер.` : `${anime.episodesCount} сер.`}
          </span>
        </div>

        {/* Watch Progress Bar on Card */}
        {progress && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${percentWatched}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info Section */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors">
            {anime.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 mt-0.5 font-normal">
            {anime.englishTitle || anime.originalTitle}
          </p>

          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
            {anime.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
              >
                {genre}
              </span>
            ))}
            {anime.genres.length > 2 && (
              <span className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded text-zinc-500">
                +{anime.genres.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Watched info or reason */}
        {reason ? (
          <p className="text-[10px] sm:text-[11px] text-rose-400/90 line-clamp-1 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-zinc-800/60 font-medium">
            {reason}
          </p>
        ) : progress ? (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-zinc-800/60">
            <Clock className="w-3 h-3 text-rose-400" />
            <span>Серия {progress.episodeNumber} ({percentWatched}%)</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-zinc-800/60">
            <span className="truncate max-w-[60%]">{anime.studio}</span>
            <span className="text-emerald-400 font-semibold shrink-0">Без рекламы</span>
          </div>
        )}
      </div>
    </div>
  );
});
