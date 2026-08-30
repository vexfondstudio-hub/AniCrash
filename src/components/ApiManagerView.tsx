import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  Sparkles,
  Tv,
  ListPlus,
  Activity,
  Check,
  Film,
  Calendar,
  Layers,
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Anime, AnimeType, AnimeStatus, Episode, Character } from '../types';
import { GENRES_LIST } from '../data/animeData';
import { EnhancedImage } from './EnhancedImage';
import { searchOnlineAnime } from '../services/animeApi';

interface ApiManagerViewProps {
  onBackToHome: () => void;
  animeDatabase: Anime[];
  onUpdateDatabase: (updated: Anime[]) => void;
}

interface ServerStats {
  status: string;
  mode: string;
  uptimeSeconds: number;
  cacheEntries: number;
  memoryUsageMB: number;
  maxConcurrentSupport: string;
  storage?: string;
}

export const ApiManagerView: React.FC<ApiManagerViewProps> = ({
  onBackToHome,
  animeDatabase,
  onUpdateDatabase,
}) => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [animeList, setAnimeList] = useState<Anime[]>(animeDatabase);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageType, setStorageType] = useState<'postgresql' | 'json-file'>('json-file');

  // AniLibria Import State
  const [anilibriaQuery, setAnilibriaQuery] = useState('');
  const [anilibriaResults, setAnilibriaResults] = useState<Anime[]>([]);
  const [isSearchingAnilibria, setIsSearchingAnilibria] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formEnglishTitle, setFormEnglishTitle] = useState('');
  const [formOriginalTitle, setFormOriginalTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPoster, setFormPoster] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formRating, setFormRating] = useState<number>(9.0);
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formSeason, setFormSeason] = useState('осень');
  const [formType, setFormType] = useState<AnimeType>('TV Сериал');
  const [formStatus, setFormStatus] = useState<AnimeStatus>('Онгоинг');
  const [formStudio, setFormStudio] = useState('AniCrash Studio');
  const [formAgeRating, setFormAgeRating] = useState('16+');
  const [formGenres, setFormGenres] = useState<string[]>([]);
  const [formEpisodes, setFormEpisodes] = useState<Episode[]>([]);
  const [formVoiceovers, setFormVoiceovers] = useState<string[]>(['AniLibria', 'Kodik']);

  // Helper State for adding genres and episodes
  const [selectedGenreToAdd, setSelectedGenreToAdd] = useState('');
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpVideoUrl, setNewEpVideoUrl] = useState('');
  const [newEpNum, setNewEpNum] = useState<number>(1);
  const [newEpVoiceoverStudios, setNewEpVoiceoverStudios] = useState<string>('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/server-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch server stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAnimeList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/custom-anime');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.anime)) {
          setAnimeList(data.anime);
          onUpdateDatabase(data.anime);
          if (data.storage) {
            setStorageType(data.storage);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch custom anime list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAnimeList();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAnilibriaSearch = async () => {
    if (!anilibriaQuery.trim()) {
      showStatus('Введите поисковый запрос для AniLibria', 'error');
      return;
    }
    setIsSearchingAnilibria(true);
    try {
      const results = await searchOnlineAnime(anilibriaQuery.trim());
      setAnilibriaResults(results);
      if (results.length === 0) {
        showStatus('Ничего не найдено в базе AniLibria', 'error');
      } else {
        showStatus(`Найдено тайтлов в AniLibria: ${results.length}`, 'success');
      }
    } catch (err) {
      console.error('AniLibria search error:', err);
      showStatus('Ошибка при поиске в AniLibria', 'error');
    } finally {
      setIsSearchingAnilibria(false);
    }
  };

  const handleImportAnime = async (anime: Anime) => {
    setIsImporting(anime.id);
    try {
      // Ensure we have some base details and episodes
      const res = await fetch('/api/custom-anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...anime,
          isCustom: true,
          tags: [...(anime.tags || []), 'imported', 'anilibria']
        }),
      });
      if (res.ok) {
        showStatus(`Тайтл «${anime.title}» успешно импортирован в базу!`, 'success');
        await fetchAnimeList();
      } else {
        showStatus('Не удалось импортировать релиз', 'error');
      }
    } catch (err) {
      console.error('Import error:', err);
      showStatus('Ошибка сети при импорте', 'error');
    } finally {
      setIsImporting(null);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormTitle('');
    setFormEnglishTitle('');
    setFormOriginalTitle('');
    setFormDescription('');
    setFormPoster('');
    setFormBanner('');
    setFormRating(9.0);
    setFormYear(new Date().getFullYear());
    setFormSeason('осень');
    setFormType('TV Сериал');
    setFormStatus('Онгоинг');
    setFormStudio('AniCrash Studio');
    setFormAgeRating('16+');
    setFormGenres([]);
    setFormEpisodes([]);
    setFormVoiceovers(['AniLibria', 'Kodik']);
    setNewEpTitle('');
    setNewEpVideoUrl('');
    setNewEpNum(1);
    setNewEpVoiceoverStudios('');
  };

  const handleEditClick = (anime: Anime) => {
    setIsEditing(true);
    setEditingId(anime.id);
    setFormTitle(anime.title);
    setFormEnglishTitle(anime.englishTitle);
    setFormOriginalTitle(anime.originalTitle);
    setFormDescription(anime.description);
    setFormPoster(anime.poster);
    setFormBanner(anime.banner);
    setFormRating(anime.rating);
    setFormYear(anime.year);
    setFormSeason(anime.season);
    setFormType(anime.type);
    setFormStatus(anime.status);
    setFormStudio(anime.studio);
    setFormAgeRating(anime.ageRating);
    setFormGenres(anime.genres || []);
    setFormEpisodes(anime.episodes || []);
    setFormVoiceovers(anime.voiceovers || ['AniLibria', 'Kodik']);
    setNewEpNum((anime.episodes?.length || 0) + 1);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleAddGenre = () => {
    if (selectedGenreToAdd && !formGenres.includes(selectedGenreToAdd)) {
      setFormGenres([...formGenres, selectedGenreToAdd]);
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setFormGenres(formGenres.filter((g) => g !== genre));
  };

  const handleAddEpisode = () => {
    if (!newEpVideoUrl) {
      showStatus('Ссылка на видео для серии обязательна', 'error');
      return;
    }

    const voiceoverMap: Record<string, string> = {};
    if (newEpVoiceoverStudios) {
      // Expect format: "StudioA: urlA, StudioB: urlB" or similar
      const parts = newEpVoiceoverStudios.split(',');
      parts.forEach((p) => {
        const [studioName, url] = p.split(':');
        if (studioName && url) {
          voiceoverMap[studioName.trim()] = url.trim();
        }
      });
    }

    // Default main voiceover to Kodik or AniLibria if none provided
    if (Object.keys(voiceoverMap).length === 0) {
      voiceoverMap['Стандартный Плеер'] = newEpVideoUrl;
    }

    const newEp: Episode = {
      id: `ep-${editingId || 'new'}-${newEpNum}`,
      number: newEpNum,
      title: newEpTitle || `Серия ${newEpNum}`,
      duration: 1440,
      videoUrl: newEpVideoUrl,
      thumbnail: formPoster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      voiceoverUrls: voiceoverMap
    };

    setFormEpisodes([...formEpisodes, newEp].sort((a, b) => a.number - b.number));
    setNewEpNum(newEpNum + 1);
    setNewEpTitle('');
    setNewEpVideoUrl('');
    setNewEpVoiceoverStudios('');
    showStatus(`Серия ${newEpNum} добавлена локально в черновик списка`);
  };

  const handleRemoveEpisode = (index: number) => {
    setFormEpisodes(formEpisodes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showStatus('Заголовок аниме обязателен', 'error');
      return;
    }

    const id = editingId || `custom-${Date.now()}`;
    const slug = formTitle.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/(^-|-$)/g, '');

    const animePayload = {
      id,
      slug,
      title: formTitle,
      englishTitle: formEnglishTitle || formTitle,
      originalTitle: formOriginalTitle || formTitle,
      description: formDescription,
      poster: formPoster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      banner: formBanner || formPoster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
      rating: Number(formRating),
      year: Number(formYear),
      season: formSeason,
      type: formType,
      status: formStatus,
      genres: formGenres.length > 0 ? formGenres : ['Аниме'],
      studio: formStudio,
      ageRating: formAgeRating,
      episodesCount: formEpisodes.length || 12,
      currentEpisodes: formEpisodes.length || 1,
      durationPerEp: '24 мин.',
      voiceovers: formVoiceovers,
      episodes: formEpisodes,
      characters: [],
      tags: ['custom', 'user-added'],
      isCustom: true
    };

    try {
      const res = await fetch('/api/custom-anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animePayload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showStatus(`Аниме "${formTitle}" успешно ${editingId ? 'обновлено' : 'добавлено'} в Ваше API!`);
          resetForm();
          fetchAnimeList();
        } else {
          showStatus(data.error || 'Ошибка при сохранении в API', 'error');
        }
      } else {
        showStatus('Ошибка сервера при отправке запроса', 'error');
      }
    } catch (err) {
      console.error('Submit custom anime failed:', err);
      showStatus('Ошибка сети при сохранении аниме', 'error');
    }
  };

  const handleDelete = async (idToDelete: string, titleToDelete: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить "${titleToDelete}" из Вашей базы API?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/custom-anime/${idToDelete}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showStatus(`Аниме "${titleToDelete}" удалено из API!`);
          fetchAnimeList();
        } else {
          showStatus(data.error || 'Ошибка удаления', 'error');
        }
      } else {
        showStatus('Ошибка сервера при удалении', 'error');
      }
    } catch (err) {
      console.error('Delete custom anime failed:', err);
      showStatus('Не удалось подключиться к серверу', 'error');
    }
  };

  const filteredAnime = animeList.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.englishTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> На главную
          </button>
          <div className="flex items-center gap-2.5">
            <Database className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Панель управления API</h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Ваш собственный автономный API-сервер (аналог AniLibria & Kodik). Данные автоматически сохраняются в{' '}
            <span className="text-rose-400 font-semibold">{storageType === 'postgresql' ? 'Supabase PostgreSQL' : 'Локальный JSON'}</span>.
          </p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchAnimeList();
            showStatus('Данные API и статистика обновлены');
          }}
          className="h-9 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${(loadingStats || loadingList) ? 'animate-spin' : ''}`} />
          Обновить API
        </button>
      </div>

      {/* Telemetry & Server Stats Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Storage Mode */}
        <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/15">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Режим Хранилища</span>
            <div className="text-base font-extrabold text-white">
              {storageType === 'postgresql' ? 'Supabase Postgres' : 'Local JSON Database'}
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              {storageType === 'postgresql' ? 'Облачная БД активна' : 'Файл custom_anime_db.json'}
            </div>
          </div>
        </div>

        {/* Card 2: Server Uptime */}
        <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
            <Server className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Аптайм Сервера</span>
            <div className="text-base font-extrabold text-white">
              {stats ? `${Math.floor(stats.uptimeSeconds / 60)} мин. ${stats.uptimeSeconds % 60} сек.` : 'Подключение...'}
            </div>
            <div className="text-xs text-zinc-400 font-medium">Стабильность кластера: 100%</div>
          </div>
        </div>

        {/* Card 3: Memory & Cache */}
        <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Память и Кэш</span>
            <div className="text-base font-extrabold text-white">
              {stats ? `${stats.memoryUsageMB} MB / LRU` : 'Загрузка...'}
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {stats?.cacheEntries || 0} кэш-записей
            </div>
          </div>
        </div>

        {/* Card 4: Database Size */}
        <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/15">
            <Tv className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Всего релизов в API</span>
            <div className="text-base font-extrabold text-white">{animeList.length} релизов</div>
            <div className="text-xs text-zinc-400 font-medium">Готовы к стримингу</div>
          </div>
        </div>
      </div>

      {/* SECTION: SMART IMPORT FROM ANILIBRIA (antLibra) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/50 border border-rose-500/10 shadow-2xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">Умный импорт из базы AniLibria (antLibra)</h2>
            <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Мгновенный импорт любого тайтла напрямую с серверов озвучки со всеми сериями и метаданными</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Введите название для поиска (например, Наруто, Клинок, Магическая битва)..."
            value={anilibriaQuery}
            onChange={(e) => setAnilibriaQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAnilibriaSearch(); }}
            className="flex-1 h-11 px-4 rounded-xl bg-zinc-900 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors"
          />
          <button
            onClick={handleAnilibriaSearch}
            disabled={isSearchingAnilibria}
            className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 disabled:opacity-60 text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-500/10 cursor-pointer"
          >
            {isSearchingAnilibria ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Найти в AniLibria
          </button>
        </div>

        {anilibriaResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {anilibriaResults.map((item) => {
              const isAlreadyAdded = animeList.some(a => String(a.id) === String(item.id) || a.slug === item.slug);
              return (
                <div key={`import-${item.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-800 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.poster} alt={item.title} className="w-10 h-14 rounded-lg object-cover shrink-0 border border-zinc-800" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={item.title}>{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{item.englishTitle || item.title} • {item.episodesCount} сер.</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                          {item.year}
                        </span>
                        <span className="text-[9px] text-zinc-500 truncate max-w-[120px]">
                          {item.studio}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleImportAnime(item)}
                    disabled={isImporting === item.id || isAlreadyAdded}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isAlreadyAdded
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white border border-zinc-700/60 hover:border-rose-500/20'
                    }`}
                  >
                    {isImporting === item.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Импорт...
                      </>
                    ) : isAlreadyAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Добавлено
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Импорт
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main UI Split: Form on Left, Searchable list on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: ADD / EDIT RELEASE FORM */}
        <div className="lg:col-span-7 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-extrabold text-white">
                {isEditing ? `Редактировать Релиз: ${formTitle}` : 'Добавить Новый Релиз в Базу'}
              </h2>
            </div>
            {isEditing && (
              <button
                onClick={resetForm}
                className="p-1 px-2.5 rounded-lg text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                Отмена <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Название (RU) *</label>
                <input
                  type="text"
                  required
                  placeholder="Магическая Битва"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Название (EN)</label>
                <input
                  type="text"
                  placeholder="Jujutsu Kaisen"
                  value={formEnglishTitle}
                  onChange={(e) => setFormEnglishTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Poster and Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Ссылка на Постер (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formPoster}
                  onChange={(e) => setFormPoster(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Ссылка на Баннер (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">Описание релиза</label>
              <textarea
                rows={3}
                placeholder="Расскажите о сюжете аниме..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-900 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors resize-y min-h-[80px]"
              />
            </div>

            {/* Metadata selections */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Тип</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as AnimeType)}
                  className="w-full h-10 px-2 rounded-xl bg-zinc-900 text-xs text-white border border-zinc-800 focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="TV Сериал">TV Сериал</option>
                  <option value="Фильм">Фильм</option>
                  <option value="OVA">OVA</option>
                  <option value="Спешл">Спешл</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Статус</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AnimeStatus)}
                  className="w-full h-10 px-2 rounded-xl bg-zinc-900 text-xs text-white border border-zinc-800 focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="Онгоинг">Онгоинг</option>
                  <option value="Завершён">Завершён</option>
                  <option value="Анонс">Анонс</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Рейтинг (0-10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formRating}
                  onChange={(e) => setFormRating(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white border border-zinc-800 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Год выпуска</label>
                <input
                  type="number"
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white border border-zinc-800 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Studio, Season, Age rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Студия</label>
                <input
                  type="text"
                  placeholder="MAPPA, ufotable..."
                  value={formStudio}
                  onChange={(e) => setFormStudio(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white border border-zinc-800 focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Сезон</label>
                <select
                  value={formSeason}
                  onChange={(e) => setFormSeason(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl bg-zinc-900 text-xs text-white border border-zinc-800 focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="весна">весна</option>
                  <option value="лето">лето</option>
                  <option value="осень">осень</option>
                  <option value="зима">зима</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Возрастной рейтинг</label>
                <input
                  type="text"
                  placeholder="16+, 18+..."
                  value={formAgeRating}
                  onChange={(e) => setFormAgeRating(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 text-sm text-white border border-zinc-800 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Genres Manager */}
            <div className="space-y-2 border-t border-zinc-800/60 pt-3">
              <label className="text-xs font-bold text-zinc-400 flex items-center justify-between">
                <span>Жанры релиза</span>
                <span className="text-[10px] text-zinc-500">Минимум 1 жанр</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedGenreToAdd}
                  onChange={(e) => setSelectedGenreToAdd(e.target.value)}
                  className="flex-1 h-10 px-2 rounded-xl bg-zinc-900 text-xs text-white border border-zinc-800 focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Выберите жанр...</option>
                  {GENRES_LIST.filter((g) => g !== 'Все жанры').map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddGenre}
                  className="h-10 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4 text-rose-500" /> Добавить
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="text-rose-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {formGenres.length === 0 && (
                  <span className="text-xs text-zinc-500 italic">Жанры не выбраны. Будет добавлен жанр "Аниме".</span>
                )}
              </div>
            </div>

            {/* Episode Builder Section */}
            <div className="space-y-3 border-t border-zinc-800/60 pt-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-cyan-400" /> Редактор Серий и Видео Ссылок (M3U8 / MP4)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Загрузите ссылки на видеостримы Вашего аниме. Плеер автоматически подключит их по протоколу HLS или MP4.
              </p>

              {/* Episode Add Fields */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold">Номер серии</label>
                    <input
                      type="number"
                      value={newEpNum}
                      onChange={(e) => setNewEpNum(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg bg-zinc-950 text-xs text-white border border-zinc-800"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold">Название серии (Необязательно)</label>
                    <input
                      type="text"
                      placeholder="Начало пути"
                      value={newEpTitle}
                      onChange={(e) => setNewEpTitle(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-zinc-950 text-xs text-white border border-zinc-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold">Прямая ссылка на видео (HLS .m3u8 или .mp4 URL) *</label>
                  <input
                    type="url"
                    placeholder="https://example.com/stream/ep1.m3u8"
                    value={newEpVideoUrl}
                    onChange={(e) => setNewEpVideoUrl(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-zinc-950 text-xs text-white border border-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
                    <span>Мульти-озвучка (Доп. плееры, Необязательно)</span>
                    <span className="text-[9px] text-zinc-500">Студия:Ссылка, Студия2:Ссылка</span>
                  </label>
                  <input
                    type="text"
                    placeholder="AniLibria:https://..., CyberDub:https://..."
                    value={newEpVoiceoverStudios}
                    onChange={(e) => setNewEpVoiceoverStudios(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-zinc-950 text-xs text-white border border-zinc-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddEpisode}
                  className="w-full h-9 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Добавить серию в список
                </button>
              </div>

              {/* Draft Episodes Table */}
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar border border-zinc-800 rounded-xl bg-zinc-950/40">
                {formEpisodes.map((ep, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 px-3 text-xs border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-400 min-w-[20px] text-center">#{ep.number}</span>
                      <span className="text-zinc-300 font-medium truncate max-w-[150px] sm:max-w-[250px]">
                        {ep.title}
                      </span>
                      {ep.videoUrl && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono truncate max-w-[120px]">
                          {ep.videoUrl.split('/').pop()}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEpisode(idx)}
                      className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {formEpisodes.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-500 italic">Список серий пуст. Будут применены автоматические парсеры.</div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/15 cursor-pointer transition-all select-none active:scale-98"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Обновить релиз в Вашем API' : 'Опубликовать релиз в Ваше API'}
            </button>
          </form>
        </div>

        {/* RIGHT: LIVE API SEARCH & DATA TABLE */}
        <div className="lg:col-span-5 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl flex flex-col h-[740px]">
          <div className="space-y-4 pb-4 border-b border-zinc-800">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-500" />
              <span>База Данных Вашего API ({filteredAnime.length})</span>
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по названию в API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-3 pr-10 rounded-xl bg-zinc-900 text-xs text-white placeholder-zinc-500 border border-zinc-800 focus:border-rose-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-zinc-600 text-xs">
                {searchQuery ? `${filteredAnime.length} совп.` : ''}
              </span>
            </div>
          </div>

          {/* List of Anime */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-4 space-y-3">
            {filteredAnime.map((anime) => (
              <div
                key={anime.id}
                className="p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-850 hover:border-zinc-800 transition-all flex gap-3.5"
              >
                {/* Poster image thumbnail */}
                <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800 relative">
                  <EnhancedImage
                    src={anime.poster}
                    alt={anime.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                  {anime.isCustom && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] bg-rose-600 font-bold text-white uppercase leading-none">
                      Кастом
                    </span>
                  )}
                </div>

                {/* Details and Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-white hover:text-rose-400 transition-colors truncate">
                      {anime.title}
                    </h3>
                    <div className="text-[10px] text-zinc-400 font-bold truncate">
                      {anime.englishTitle}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {anime.year}</span>
                      <span className="px-1 rounded bg-zinc-850">{anime.type}</span>
                      <span className="text-cyan-400 font-bold">{anime.episodes?.length || 0} сер.</span>
                    </div>
                  </div>

                  {/* Edit/Delete Actions */}
                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-zinc-850">
                    <button
                      onClick={() => handleEditClick(anime)}
                      className="p-1 px-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit className="w-3 h-3 text-cyan-400" /> Изменить
                    </button>
                    {anime.isCustom && (
                      <button
                        onClick={() => handleDelete(anime.id, anime.title)}
                        className="p-1 px-2.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" /> Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredAnime.length === 0 && (
              <div className="p-8 text-center text-zinc-500 italic text-xs">
                Релизов по запросу не найдено. Начните добавлять кастомные релизы!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-scale-up max-w-sm ${
            statusMessage.type === 'success'
              ? 'bg-zinc-950 text-emerald-400 border-emerald-500/20 shadow-emerald-950/20'
              : 'bg-zinc-950 text-rose-400 border-rose-500/20 shadow-rose-950/20'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg ${
              statusMessage.type === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}
          >
            <Info className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
