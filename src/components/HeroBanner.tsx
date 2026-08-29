import React, { useState, useEffect } from 'react';
import { Play, Bookmark, Info, Star, BadgeCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Anime } from '../types';

interface HeroBannerProps {
  featuredAnime: Anime[];
  isFavorite: (animeId: string) => boolean;
  onPlay: (anime: Anime) => void;
  onSelect: (anime: Anime) => void;
  onToggleFavorite: (anime: Anime) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredAnime,
  isFavorite,
  onPlay,
  onSelect,
  onToggleFavorite,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance banner every 9 seconds
  useEffect(() => {
    if (featuredAnime.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredAnime.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [featuredAnime.length]);

  if (!featuredAnime.length) return null;
  const current = featuredAnime[currentIndex] || featuredAnime[0];
  const favorited = isFavorite(current.id);

  return (
    <div
      id="hero-banner-container"
      className="relative w-full min-h-[420px] xs:min-h-[460px] sm:min-h-[500px] md:h-[560px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 border border-zinc-800/80 bg-zinc-950 shadow-2xl flex flex-col justify-end"
    >
      {/* Background Banner Image */}
      <img
        src={current.banner || current.poster}
        alt={current.title}
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 transition-all duration-700 scale-105"
      />

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 sm:via-zinc-950/60 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 sm:via-zinc-950/70 to-transparent" />

      {/* Mobile Top Controls for Carousel */}
      {featuredAnime.length > 1 && (
        <div className="sm:hidden absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? featuredAnime.length - 1 : prev - 1))}
            className="p-1.5 text-zinc-300 hover:text-white"
            title="Предыдущее"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono px-1 text-zinc-300 font-bold">
            {currentIndex + 1}/{featuredAnime.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredAnime.length)}
            className="p-1.5 text-zinc-300 hover:text-white"
            title="Следующее"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col justify-end p-4 xs:p-6 sm:p-10 md:p-16 lg:p-20 max-w-4xl">
        {/* Zero-Ads Pill + Season */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] sm:text-[11px] font-black tracking-widest uppercase shadow-lg shadow-rose-600/50 border border-rose-500/50">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            В ТРЕНДЕ
          </div>
          <div className="px-3 py-1 rounded-full bg-zinc-900/90 text-zinc-300 text-[10px] sm:text-[11px] font-bold border border-zinc-800 backdrop-blur-md uppercase tracking-wider">
            {current.year} • {current.season}
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900/90 text-amber-400 text-[10px] sm:text-[11px] font-black border border-zinc-800 backdrop-blur-md">
            <Star className="w-3 h-3 fill-amber-400" />
            {current.rating.toFixed(1)}
          </div>
        </div>

        {/* Anime Title */}
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[0.95] mb-4 drop-shadow-2xl italic">
          {current.title}
        </h1>
        
        <div className="flex items-center gap-3 mb-4 opacity-80">
          <div className="w-12 h-[2px] bg-rose-600" />
          <p className="text-xs sm:text-sm md:text-lg text-zinc-300 font-bold uppercase tracking-[0.2em]">
            {current.studio}
          </p>
        </div>

        {/* Synopsis */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-400 line-clamp-2 sm:line-clamp-3 mb-6 sm:mb-10 font-medium max-w-2xl leading-relaxed">
          {current.description}
        </p>

        {/* Genres Chips */}
        <div className="flex flex-wrap gap-1 xs:gap-1.5 sm:gap-2 mb-3 xs:mb-4 sm:mb-8">
          {current.genres.slice(0, 4).map((g) => (
            <span
              key={g}
              className="text-[9px] xs:text-[10px] sm:text-xs px-2 xs:px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-zinc-900/80 text-zinc-300 border border-zinc-700/60 backdrop-blur"
            >
              {g}
            </span>
          ))}
          <span className="text-[9px] xs:text-[10px] sm:text-xs px-2 xs:px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-zinc-900/80 text-rose-400 border border-rose-500/30 backdrop-blur font-medium">
            {current.episodesCount} серий
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            id="hero-watch-now-btn"
            onClick={() => onPlay(current)}
            className="w-full sm:w-auto px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs xs:text-sm md:text-base flex items-center justify-center gap-2 sm:gap-2.5 shadow-xl shadow-rose-600/40 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            <span>Смотреть серию 1</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              id="hero-favorite-btn"
              onClick={() => onToggleFavorite(current)}
              className={`flex-1 sm:flex-initial px-3.5 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 border cursor-pointer ${
                favorited
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{favorited ? 'В избранном' : 'В закладки'}</span>
            </button>

            <button
              id="hero-details-btn"
              onClick={() => onSelect(current)}
              className="flex-1 sm:flex-initial px-3.5 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 font-semibold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              <span>О тайтле</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Carousel Navigation Arrows & Dots */}
      {featuredAnime.length > 1 && (
        <div className="hidden sm:flex absolute bottom-6 right-6 md:bottom-8 md:right-12 z-20 items-center gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? featuredAnime.length - 1 : prev - 1))}
            className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur transition-all cursor-pointer"
            title="Предыдущее"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-black/60 backdrop-blur border border-white/10">
            {featuredAnime.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-rose-500' : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredAnime.length)}
            className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur transition-all cursor-pointer"
            title="Следующее"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
