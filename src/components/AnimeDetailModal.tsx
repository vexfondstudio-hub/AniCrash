import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Play,
  Bookmark,
  Star,
  Clock,
  BadgeCheck,
  Disc3,
  BookOpen,
  MessagesSquare,
  Send,
  Radio,
  Trash2,
  ThumbsUp,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Anime, WatchProgress, WatchlistStatus, Comment, UserProfile } from '../types';

const CustomWatchlistSelector: React.FC<{
  value: string;
  onChange: (val: WatchlistStatus | '') => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { value: WatchlistStatus | ''; label: string }[] = [
    { value: '', label: 'В закладки...' },
    { value: 'favorites', label: 'Избранное' },
    { value: 'watching', label: 'Смотрю' },
    { value: 'planned', label: 'В планах' },
    { value: 'completed', label: 'Просмотрено' },
  ];

  const currentLabel = options.find((o) => o.value === value)?.label || 'В закладки...';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer whitespace-nowrap text-xs sm:text-sm font-bold ${
          isOpen ? 'bg-zinc-800 border-rose-500 shadow-lg' : 'bg-zinc-900/90 border-zinc-700 hover:bg-zinc-800'
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${value ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
        <span className={value ? 'text-white' : 'text-zinc-400'}>{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                value === opt.value
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
import { getCommentsForAnime, addComment, deleteComment, likeComment, isCommentLiked } from '../services/commentService';
import { AnimeExternalLinks } from './AnimeExternalLinks';

interface AnimeDetailModalProps {
  anime: Anime;
  isFavorite: boolean;
  watchlistStatus?: WatchlistStatus;
  progress?: WatchProgress;
  currentUser?: UserProfile;
  onClose: () => void;
  onPlayEpisode: (anime: Anime, episodeNum: number) => void;
  onUpdateWatchlist: (animeId: string, status: WatchlistStatus) => void;
  onRemoveFavorite: (animeId: string) => void;
  onStartWatchParty?: (anime: Anime, episodeNum: number) => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime,
  isFavorite,
  watchlistStatus,
  progress,
  currentUser,
  onClose,
  onPlayEpisode,
  onUpdateWatchlist,
  onRemoveFavorite,
  onStartWatchParty,
}) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'about' | 'comments'>('episodes');
  const [comments, setComments] = useState<Comment[]>(() => {
    return getCommentsForAnime(anime.id);
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(10);
  const [newCommentAuthor, setNewCommentAuthor] = useState(currentUser?.username || '');

  useEffect(() => {
    setComments(getCommentsForAnime(anime.id));
    if (currentUser?.username) {
      setNewCommentAuthor(currentUser.username);
    }
  }, [anime.id, currentUser?.username]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const authorName = currentUser?.username || newCommentAuthor.trim() || 'Анонимный Отаку';
    const authorAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';

    const created = addComment(anime.id, newCommentText, newCommentRating, {
      username: authorName,
      avatar: authorAvatar,
    });

    setComments([created, ...comments]);
    setNewCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    const currentUserName = currentUser?.username || newCommentAuthor;
    const ok = deleteComment(anime.id, commentId, currentUserName);
    if (ok) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  const handleLikeComment = (commentId: string) => {
    const newLikes = likeComment(anime.id, commentId);
    setComments(
      comments.map((c) => (c.id === commentId ? { ...c, likes: newLikes } : c))
    );
  };

  const resumeEpisodeNumber = progress ? progress.episodeNumber : 1;

  return (
    <div
      id="anime-detail-modal-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        id="anime-detail-modal-content"
        className="relative w-full h-full sm:h-auto sm:max-w-5xl bg-zinc-950 border-0 sm:border border-white/5 rounded-t-3xl sm:rounded-[32px] overflow-hidden shadow-2xl text-zinc-200 sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 cursor-pointer shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 scrollbar-none">
          {/* Hero Header with Banner */}
          <div className="relative h-[40vh] sm:h-[450px] w-full overflow-hidden bg-zinc-900 flex flex-col justify-end">
            <img
              src={anime.banner || anime.poster}
              alt={anime.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            {/* Play Button Overlay on Hero - Desktop only */}
            <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
              <button
                onClick={() => onPlayEpisode(anime, resumeEpisodeNumber)}
                className="pointer-events-auto w-24 h-24 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group/hero-play"
              >
                <Play className="w-10 h-10 fill-current ml-1.5 group-hover/hero-play:scale-110 transition-transform" />
              </button>
            </div>

            {/* Zero ads & quality tags in top corner */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 border border-emerald-500/50">
                <BadgeCheck className="w-3.5 h-3.5" />
                БЕЗ РЕКЛАМЫ
              </div>
              <div className="px-3 py-1.5 rounded-full bg-zinc-950/60 text-zinc-300 text-[10px] font-bold border border-white/5 backdrop-blur-md uppercase tracking-widest">
                Full HD 1080p
              </div>
            </div>

            {/* Title & Info Overlay on Hero - For Mobile readability */}
            <div className="sm:hidden absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-zinc-950 to-transparent">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase">
                  {anime.type}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-bold">
                  {anime.year}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-amber-400 text-[10px] font-black">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {anime.rating.toFixed(1)}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none mb-1">
                {anime.title}
              </h1>
            </div>
          </div>

          {/* Desktop/Tablet Info Overlay */}
          <div className="hidden sm:block relative z-20 px-10 -mt-32">
            <div className="flex gap-10">
              <div className="w-64 shrink-0">
                <div className="aspect-[2/3] rounded-[32px] overflow-hidden shadow-2xl border-4 border-zinc-950 ring-1 ring-white/10">
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1 pt-36">
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20">
                    {anime.type}
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-300 text-[11px] font-black border border-white/5 uppercase tracking-[0.2em]">
                    {anime.year}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 text-amber-400 text-[11px] font-black border border-white/5 uppercase tracking-[0.2em]">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {anime.rating.toFixed(1)}
                  </div>
                </div>
                
                <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.85] mb-4">
                  {anime.title}
                </h1>
                <p className="text-xl text-zinc-400 font-medium uppercase tracking-[0.3em] opacity-80">
                  {anime.englishTitle}
                </p>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="px-6 sm:px-10 py-10">
            {/* Mobile Actions */}
            <div className="sm:hidden flex flex-col gap-3 mb-10">
              <button
                onClick={() => onPlayEpisode(anime, resumeEpisodeNumber)}
                className="w-full py-4 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <Play className="w-5 h-5 fill-current" />
                СМОТРЕТЬ СЕЙЧАС
              </button>
              <div className="flex items-center gap-3">
                <CustomWatchlistSelector
                  value={watchlistStatus || (isFavorite ? 'favorites' : '')}
                  onChange={(val) => {
                    if (!val) onRemoveFavorite(anime.id);
                    else onUpdateWatchlist(anime.id, val);
                  }}
                />
                <button
                   onClick={() => onRemoveFavorite(anime.id)}
                   className={`flex-1 p-4 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                     isFavorite
                       ? 'bg-rose-500/10 border-rose-500/50 text-rose-500'
                       : 'bg-zinc-900 border-zinc-800 text-white'
                   }`}
                >
                  <Star className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Desktop Tabs Wrapper */}
            <div className="sm:mt-10">
              {/* Watch & Favorite Actions (Desktop) */}
              <div className="hidden sm:flex items-center gap-4 mb-12">
                <button
                  onClick={() => onPlayEpisode(anime, resumeEpisodeNumber)}
                  className="px-10 py-5 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-4 hover:bg-rose-50 transition-all active:scale-95 shadow-2xl shadow-white/10"
                >
                  <Play className="w-6 h-6 fill-current" />
                  СМОТРЕТЬ {progress ? `СЕРИЮ ${progress.episodeNumber}` : 'ОНЛАЙН'}
                </button>
                <CustomWatchlistSelector
                  value={watchlistStatus || (isFavorite ? 'favorites' : '')}
                  onChange={(val) => {
                    if (!val) onRemoveFavorite(anime.id);
                    else onUpdateWatchlist(anime.id, val);
                  }}
                />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 pt-3 sm:pt-4 border-b border-zinc-800 text-xs sm:text-sm font-semibold overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`pb-2.5 sm:pb-3 transition-colors border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'episodes'
                  ? 'border-rose-500 text-rose-400 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Серии ({anime.episodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`pb-2.5 sm:pb-3 transition-colors border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'about'
                  ? 'border-rose-500 text-rose-400 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>О тайтле & Сюжет</span>
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2.5 sm:pb-3 transition-colors border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'comments'
                  ? 'border-rose-500 text-rose-400 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessagesSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Отзывы ({comments.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 pb-8">
          {/* TAB 1: EPISODES */}
          {activeTab === 'episodes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>
                  Доступные озвучки:{' '}
                  <strong className="text-zinc-200">{anime.voiceovers.join(', ')}</strong>
                </span>
                <span className="text-emerald-400 font-medium">Мгновенный запуск каждой серии</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1 scrollbar-none">
                {(() => {
                  const [visibleCount, setVisibleCount] = useState(50);
                  
                  // Logic to show ALL episodes if it's a long series like One Piece
                  const allEpisodes = useMemo(() => {
                    const eps = [...anime.episodes];
                    if (eps.length < anime.episodesCount) {
                      const existingNumbers = new Set(eps.map(e => e.number));
                      for (let i = 1; i <= anime.episodesCount; i++) {
                        if (!existingNumbers.has(i)) {
                          eps.push({
                            id: `${anime.id}-ep-${i}`,
                            number: i,
                            title: `Серия ${i}`,
                            duration: 1440,
                            videoUrl: anime.episodes[0]?.videoUrl || '',
                            thumbnail: anime.episodes[0]?.thumbnail || anime.poster,
                            hls_1080: anime.episodes[0]?.hls_1080,
                            hls_720: anime.episodes[0]?.hls_720,
                            hls_480: anime.episodes[0]?.hls_480,
                          });
                        }
                      }
                    }
                    return eps.sort((a, b) => b.number - a.number);
                  }, [anime]);

                  const visibleEpisodes = allEpisodes.slice(0, visibleCount);

                  return (
                    <>
                      {visibleEpisodes.map((ep) => {
                        const isCurrent = progress?.episodeNumber === ep.number;
                        return (
                          <div
                            key={ep.id}
                            onClick={() => onPlayEpisode(anime, ep.number)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                              isCurrent
                                ? 'bg-rose-500/10 border-rose-500/50 hover:bg-rose-500/20'
                                : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                              <img
                                src={ep.thumbnail}
                                alt={ep.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-rose-600/70 transition-colors">
                                <Play className="w-4 h-4 fill-white text-white" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-bold ${
                                    isCurrent ? 'text-rose-400' : 'text-zinc-300'
                                  }`}
                                >
                                  Серия {ep.number}
                                </span>
                                <span className="text-[11px] text-zinc-500">24 мин.</span>
                              </div>
                              <p className="text-sm font-semibold text-white truncate mt-0.5">
                                {ep.title}
                              </p>
                              <p className="text-[11px] text-emerald-400/80">Без рекламы</p>
                            </div>
                          </div>
                        );
                      })}
                      {visibleCount < allEpisodes.length && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisibleCount(prev => prev + 100);
                          }}
                          className="col-span-full py-4 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                          Показать ещё эпизоды (+100)
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-bold text-white text-base mb-2">Описание</h3>
                <p className="text-zinc-300 leading-relaxed">{anime.description}</p>
              </div>

              {/* Tags & Genres */}
              <div>
                <h4 className="font-bold text-white text-sm mb-2">Жанры</h4>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-2">Тематические теги</h4>
                <div className="flex flex-wrap gap-2">
                  {anime.tags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs font-medium text-rose-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Characters */}
              <div>
                <h4 className="font-bold text-white text-sm mb-3">Главные персонажи</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {anime.characters.map((char) => (
                    <div
                      key={char.name}
                      className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3"
                    >
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{char.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{char.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Database Links */}
              <AnimeExternalLinks anime={anime} />
            </div>
          )}

          {/* TAB 3: COMMENTS & REVIEWS */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Add Comment Form */}
              <form
                onSubmit={handleAddComment}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Оставить отзыв о тайтле
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Ваша оценка:</span>
                    <select
                      value={newCommentRating}
                      onChange={(e) => setNewCommentRating(Number(e.target.value))}
                      className="bg-zinc-800 text-amber-400 font-bold px-2 py-1 rounded-lg border border-zinc-700"
                    >
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          {r} / 10
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Ваше имя или никнейм (необязательно)"
                  value={newCommentAuthor}
                  onChange={(e) => setNewCommentAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
                />

                <textarea
                  rows={2}
                  placeholder="Поделитесь впечатлениями от просмотра (без спойлеров)..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Опубликовать отзыв</span>
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const isOwn = currentUser?.username === comment.userName || newCommentAuthor === comment.userName;
                    return (
                      <div
                        key={comment.id}
                        className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-start gap-3"
                      >
                        <img
                          src={comment.avatar}
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-zinc-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{comment.userName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                {comment.rating}
                              </span>
                            </div>
                            <span className="text-zinc-500 text-[10px]">{comment.createdAt}</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{comment.text}</p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleLikeComment(comment.id)}
                              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                isCommentLiked(comment.id)
                                  ? 'text-rose-400'
                                  : 'text-zinc-400 hover:text-rose-400'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${isCommentLiked(comment.id) ? 'fill-rose-400' : ''}`} />
                              <span>{comment.likes || 0}</span>
                            </button>
                            {isOwn && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="flex items-center gap-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Удалить отзыв"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Удалить</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 space-y-1">
                    <p className="text-xs font-semibold text-zinc-300">
                      Отзывов пока нет
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Будьте первым, кто поделится своим мнением об этом тайтле!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
</div>
  );
};
