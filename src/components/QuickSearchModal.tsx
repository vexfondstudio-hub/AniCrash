import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, Play, ArrowRight, Loader2, Globe } from 'lucide-react';
import { Anime } from '../types';
import { ANIME_DATABASE } from '../data/animeData';
import { searchOnlineAnime } from '../services/animeApi';

interface QuickSearchModalProps {
  onClose: () => void;
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  onClose,
  onSelectAnime,
  onPlayAnime,
}) => {
  const [query, setQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<Anime[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Local filtered results
  const localFiltered = query.trim()
    ? ANIME_DATABASE.filter((anime) => {
        const q = query.toLowerCase();
        return (
          anime.title.toLowerCase().includes(q) ||
          anime.englishTitle.toLowerCase().includes(q) ||
          anime.originalTitle.toLowerCase().includes(q) ||
          anime.genres.some((g) => g.toLowerCase().includes(q)) ||
          anime.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : ANIME_DATABASE.slice(0, 6);

  // Search online AniLibria API with debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchOnlineAnime(query.trim());
        // Filter out items that are already in local results
        const localIds = new Set(localFiltered.map((a) => a.id));
        const uniqueOnline = results.filter((a) => !localIds.has(a.id));
        setOnlineResults(uniqueOnline);
      } catch (err) {
        console.error('Online search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query, localFiltered]);

  return (
    <div
      id="quick-search-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-start justify-center p-2.5 sm:p-4 pt-10 sm:pt-24 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="quick-search-modal-content"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative p-3 sm:p-4 border-b border-zinc-800 flex items-center gap-2 sm:gap-3">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск аниме или жанра..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm sm:text-base md:text-lg outline-none font-medium"
          />
          {isSearchingOnline && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setOnlineResults([]);
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Закрыть
          </button>
        </div>

        {/* Popular Trending Tags if empty query */}
        {!query && (
          <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/30">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Популярные запросы:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Магическая битва', 'Solo Leveling', 'Фрирен', 'Киберпанк', 'Экшен', 'Сёнен', 'Клинок', 'Блич'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-2">
          {/* Section: Local / Instant Results */}
          <div className="px-3 py-1 flex items-center justify-between text-xs text-zinc-500">
            <span>{query ? `Каталог AniCrash (${localFiltered.length})` : 'Популярные тайтлы'}</span>
            <span className="text-emerald-400 font-semibold">100% без рекламы</span>
          </div>

          {localFiltered.map((anime) => (
            <div
              key={anime.id}
              onClick={() => {
                onSelectAnime(anime);
                onClose();
              }}
              className="p-2.5 rounded-2xl hover:bg-zinc-900/90 transition-all flex items-center justify-between gap-3 cursor-pointer group border border-transparent hover:border-zinc-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-11 h-14 rounded-xl object-cover shrink-0 border border-zinc-800"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors truncate">
                      {anime.title}
                    </h4>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {anime.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {anime.englishTitle} • {anime.episodesCount} серий
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {anime.genres.slice(0, 3).map((g) => (
                      <span key={g} className="text-[10px] text-zinc-500">
                        {g} •
                      </span>
                    ))}
                    <span className="text-[10px] text-rose-400 font-medium">
                      {anime.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAnime(anime);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white transition-all shadow cursor-pointer"
                  title="Смотреть серию"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </div>
          ))}

          {/* Section: Live Online Results from AniLibria API */}
          {onlineResults.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80">
                <span className="flex items-center gap-1.5 font-bold text-rose-400">
                  <Globe className="w-3.5 h-3.5" />
                  Найдено онлайн в базе AniLibria ({onlineResults.length})
                </span>
                <span className="text-zinc-500">Стриминг HLS</span>
              </div>

              {onlineResults.map((anime) => (
                <div
                  key={`online-${anime.id}`}
                  onClick={() => {
                    onSelectAnime(anime);
                    onClose();
                  }}
                  className="p-2.5 rounded-2xl hover:bg-zinc-900/90 transition-all flex items-center justify-between gap-3 cursor-pointer group border border-transparent hover:border-rose-900/40 bg-zinc-900/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="w-11 h-14 rounded-xl object-cover shrink-0 border border-zinc-800"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors truncate">
                          {anime.title}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                          Онлайн
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {anime.englishTitle} • {anime.episodes.length || anime.episodesCount} серий
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {anime.genres.slice(0, 3).map((g) => (
                          <span key={g} className="text-[10px] text-zinc-500">
                            {g} •
                          </span>
                        ))}
                        <span className="text-[10px] text-zinc-400">
                          {anime.year}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayAnime(anime);
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow cursor-pointer"
                      title="Смотреть онлайн"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {localFiltered.length === 0 && onlineResults.length === 0 && !isSearchingOnline && (
            <div className="text-center py-10 text-zinc-500 text-sm">
              По запросу «{query}» ничего не найдено.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
