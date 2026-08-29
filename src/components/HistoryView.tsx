import React from 'react';
import { History, Play, Trash2, Clock, CheckCheck } from 'lucide-react';
import { Anime, WatchProgress } from '../types';
import { EnhancedImage } from './EnhancedImage';

interface HistoryViewProps {
  watchHistory: WatchProgress[];
  allAnime: Anime[];
  onPlayAnime: (anime: Anime, episodeNum?: number, resumeTime?: number) => void;
  onSelectAnime: (anime: Anime) => void;
  onClearHistory: () => void;
  onGoToCatalog: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  watchHistory,
  allAnime,
  onPlayAnime,
  onSelectAnime,
  onClearHistory,
  onGoToCatalog,
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const historyItems = watchHistory
    .map((prog) => {
      const anime = allAnime.find((a) => a.id === prog.animeId);
      return { anime, progress: prog };
    })
    .filter((item): item is { anime: Anime; progress: WatchProgress } => item.anime !== undefined);

  return (
    <div id="history-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Продолжить просмотр
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            История просмотров
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            AniCrash помнит каждую секунду. Никакой рекламы при возобновлении.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 border border-zinc-800 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить историю</span>
          </button>
        )}
      </div>

      {/* List */}
      {historyItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyItems.map(({ anime, progress }) => {
            const percent =
              progress.duration > 0
                ? Math.min(100, Math.round((progress.currentTime / progress.duration) * 100))
                : 0;

            const episode =
              anime.episodes.find((e) => e.number === progress.episodeNumber) || anime.episodes[0];

            return (
              <div
                key={anime.id}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-rose-500/40 transition-all flex flex-col sm:flex-row items-center gap-4 group"
              >
                {/* Thumbnail */}
                <div
                  className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-zinc-950 shrink-0 cursor-pointer"
                  onClick={() => onPlayAnime(anime, progress.episodeNumber, progress.currentTime)}
                >
                  <EnhancedImage
                    src={episode?.thumbnail || anime.banner || anime.poster}
                    alt={anime.title}
                    enhanceLevel="standard"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-rose-600/70 transition-colors">
                    <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-zinc-300">
                    {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
                  </span>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-rose-400">
                      Серия {progress.episodeNumber}: {episode?.title || 'Без названия'}
                    </span>
                    {progress.completed && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/30">
                        <CheckCheck className="w-3 h-3" /> Просмотрено
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectAnime(anime)}
                    className="text-base font-bold text-white hover:text-rose-400 transition-colors cursor-pointer truncate mt-0.5"
                  >
                    {anime.title}
                  </h3>

                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {anime.genres.slice(0, 3).join(' • ')}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-3 mb-3">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Осталось: {formatTime(Math.max(0, progress.duration - progress.currentTime))}
                    </span>
                    <button
                      onClick={() =>
                        onPlayAnime(anime, progress.episodeNumber, progress.currentTime)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Продолжить</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 max-w-md mx-auto my-8">
          <History className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">История просмотров пуста</h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Включите любую серию любого тайтла — AniCrash мгновенно начнёт сохранять ваш прогресс с
            точностью до секунды.
          </p>
          <button
            onClick={onGoToCatalog}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 active:scale-95"
          >
            Выбрать аниме для просмотра
          </button>
        </div>
      )}
    </div>
  );
};
