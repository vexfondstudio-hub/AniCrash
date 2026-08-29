import React, { useState } from 'react';
import { Compass, Swords, Eye, Coffee, Wand2 } from 'lucide-react';
import { Anime, RecommendationResult, WatchProgress } from '../types';
import { AnimeCard } from './AnimeCard';
import { Icons8Icon } from './Icons8Icon';

interface RecommendationsSectionProps {
  recommendations: RecommendationResult[];
  watchHistory: WatchProgress[];
  isFavorite: (id: string) => boolean;
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
  onToggleFavorite: (anime: Anime, e: React.MouseEvent) => void;
}

const MOODS = [
  { id: 'all', label: 'Все рекомендации', icon8: 'compass', icon: Compass },
  { id: 'action', label: 'Адреналин и битвы', icon8: 'sword', icon: Swords, genre: 'Экшен' },
  { id: 'mind', label: 'Сломать мозг', icon8: 'brain', icon: Eye, genre: 'Триллер' },
  { id: 'chill', label: 'Уют и романтика', icon8: 'spa', icon: Coffee, genre: 'Романтика' },
  { id: 'epic', label: 'Фэнтези и магия', icon8: 'magic-wand', icon: Wand2, genre: 'Фэнтези' },
];

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations,
  watchHistory,
  isFavorite,
  onSelectAnime,
  onPlayAnime,
  onToggleFavorite,
}) => {
  const [selectedMood, setSelectedMood] = useState<string>('all');

  const filtered = recommendations.filter((rec) => {
    if (selectedMood === 'all') return true;
    const currentMood = MOODS.find((m) => m.id === selectedMood);
    if (!currentMood?.genre) return true;
    return rec.anime.genres.includes(currentMood.genre);
  });

  const hasHistory = watchHistory.length > 0;

  return (
    <section id="recommendations-section" className="my-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              {hasHistory ? 'Алгоритм AniCrash' : 'Персональная подборка'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {hasHistory ? 'Рекомендации на основе ваших просмотров' : 'Вам может понравиться'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {hasHistory
              ? `Рассчитано по ${watchHistory.length} тайтлам из истории и закладок`
              : 'Смотрите серии и добавляйте тайтлы в избранное, чтобы система точнее подбирала похожее'}
          </p>
        </div>
      </div>

      {/* Mood Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          const isActive = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-zinc-900/70 hover:bg-zinc-800/80 text-zinc-300 border-zinc-800'
              }`}
            >
              <Icons8Icon name={mood.icon8} size={18} alt={mood.label} />
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recommendations Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((rec) => (
            <AnimeCard
              key={rec.anime.id}
              anime={rec.anime}
              isFavorite={isFavorite(rec.anime.id)}
              onSelect={onSelectAnime}
              onPlay={onPlayAnime}
              onToggleFavorite={onToggleFavorite}
              matchScore={rec.matchScore}
              reason={rec.reason}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-6">
          <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">В этой категории пока нет подходящих рекомендаций</p>
          <button
            onClick={() => setSelectedMood('all')}
            className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Сбросить фильтр настроения
          </button>
        </div>
      )}
    </section>
  );
};
