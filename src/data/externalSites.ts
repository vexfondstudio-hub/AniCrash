export interface ExternalSite {
  id: string;
  name: string;
  russianName: string;
  category: 'database' | 'streaming' | 'community' | 'dubbing';
  categoryLabel: string;
  description: string;
  websiteUrl: string;
  searchUrlTemplate: (query: string, englishTitle?: string) => string;
  bestIcon: {
    type: 'icons8' | 'svg' | 'url';
    iconName: string; // for icons8
    directUrl?: string;
    style?: 'fluency' | 'color' | '3d-fluency' | 'isometric';
    bgColor: string;
    glowColor: string;
  };
  features: string[];
  badge?: string;
}

export const EXTERNAL_SITES: ExternalSite[] = [
  {
    id: 'shikimori',
    name: 'Shikimori',
    russianName: 'Шикимори',
    category: 'database',
    categoryLabel: 'Главная база RU',
    description: 'Крупнейшая русскоязычная база аниме и манги с подробной статистикой, списками и сообществом.',
    websiteUrl: 'https://shikimori.one',
    searchUrlTemplate: (query: string) => `https://shikimori.one/animes?search=${encodeURIComponent(query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'opened-folder',
      style: 'fluency',
      bgColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      glowColor: 'hover:border-emerald-500/60 shadow-emerald-500/10',
    },
    features: ['Подробные рейтинги в СНГ', 'Франшизы и хронология', 'Связанная манга и ранобэ'],
    badge: 'Топ в RU',
  },
  {
    id: 'myanimelist',
    name: 'MyAnimeList',
    russianName: 'MAL',
    category: 'database',
    categoryLabel: 'Мировой каталог',
    description: 'Самая известная международная база данных аниме и манги с глобальным мировым рейтингом.',
    websiteUrl: 'https://myanimelist.net',
    searchUrlTemplate: (query: string, englishTitle?: string) =>
      `https://myanimelist.net/anime.php?q=${encodeURIComponent(englishTitle || query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'bookmark-ribbon',
      style: 'fluency',
      bgColor: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
      glowColor: 'hover:border-blue-500/60 shadow-blue-500/10',
    },
    features: ['Глобальный Score #1', 'Форумы и обзоры со всего мира', 'Статистика популярности'],
    badge: 'Global #1',
  },
  {
    id: 'anilist',
    name: 'AniList',
    russianName: 'АниЛист',
    category: 'database',
    categoryLabel: 'Современный трекер',
    description: 'Современная платформа для трекинга серий, открытый API и эстетичный интерфейс.',
    websiteUrl: 'https://anilist.co',
    searchUrlTemplate: (query: string, englishTitle?: string) =>
      `https://anilist.co/search/anime?search=${encodeURIComponent(englishTitle || query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'layers',
      style: 'fluency',
      bgColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      glowColor: 'hover:border-cyan-500/60 shadow-cyan-500/10',
    },
    features: ['Красивый трекинг серий', 'Детальные диаграммы жанров', 'Интерактивные списки'],
    badge: 'Modern UI',
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    russianName: 'Кранчиролл',
    category: 'streaming',
    categoryLabel: 'Официальный стриминг',
    description: 'Официальный мировой дистрибьютор аниме с лицензионными симулькастами.',
    websiteUrl: 'https://www.crunchyroll.com',
    searchUrlTemplate: (query: string, englishTitle?: string) =>
      `https://www.crunchyroll.com/search?q=${encodeURIComponent(englishTitle || query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'video-playlist',
      style: 'fluency',
      bgColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      glowColor: 'hover:border-orange-500/60 shadow-orange-500/10',
    },
    features: ['Лицензионный контент', 'Anime Awards', 'Оригинальные субтитры'],
    badge: 'Official',
  },
  {
    id: 'kitsu',
    name: 'Kitsu',
    russianName: 'Китсу',
    category: 'database',
    categoryLabel: 'Умный поиск',
    description: 'Удобная платформа с рекомендациями, трекингом и реакциями на серии.',
    websiteUrl: 'https://kitsu.app',
    searchUrlTemplate: (query: string, englishTitle?: string) =>
      `https://kitsu.app/anime?text=${encodeURIComponent(englishTitle || query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'search-in-list',
      style: 'fluency',
      bgColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      glowColor: 'hover:border-rose-500/60 shadow-rose-500/10',
    },
    features: ['Социальный фид', 'Реакции на серии', 'Алгоритмы подбора'],
    badge: 'Discovery',
  },
  {
    id: 'worldart',
    name: 'World-Art',
    russianName: 'Ворлд-Арт',
    category: 'database',
    categoryLabel: 'Энциклопедия & Хроники',
    description: 'Легендарный русскоязычный архив с глубоким анализом и хронологией классических тайтлов.',
    websiteUrl: 'http://www.world-art.ru/animation/',
    searchUrlTemplate: (query: string) =>
      `http://www.world-art.ru/search.php?name=${encodeURIComponent(query)}&global_sector=animation`,
    bestIcon: {
      type: 'icons8',
      iconName: 'globe',
      style: 'fluency',
      bgColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      glowColor: 'hover:border-indigo-500/60 shadow-indigo-500/10',
    },
    features: ['Полная хронология саг', 'Справочники сейю и студий', 'Культовые рецензии'],
    badge: 'Classic',
  },
  {
    id: 'kinopoisk',
    name: 'Кинопоиск',
    russianName: 'Кинопоиск',
    category: 'database',
    categoryLabel: 'Рейтинг фильмов',
    description: 'Крупнейший русскоязычный сервис о кино и сериалах с оценками миллионов зрителей.',
    websiteUrl: 'https://www.kinopoisk.ru',
    searchUrlTemplate: (query: string) =>
      `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'movie-projector',
      style: 'fluency',
      bgColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      glowColor: 'hover:border-amber-500/60 shadow-amber-500/10',
    },
    features: ['Оценки критиков и зрителей', 'Трейлеры и факты', 'Русские дубляжи'],
    badge: 'Cinema',
  },
  {
    id: 'anilibria',
    name: 'AniLibria',
    russianName: 'АниЛибрия',
    category: 'dubbing',
    categoryLabel: 'Озвучка & Студия',
    description: 'Популярный проект качественной русской озвучки и перевода аниме.',
    websiteUrl: 'https://anilibria.tv',
    searchUrlTemplate: (query: string) =>
      `https://anilibria.tv/pages/catalog.php?search=${encodeURIComponent(query)}`,
    bestIcon: {
      type: 'icons8',
      iconName: 'microphone',
      style: 'fluency',
      bgColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      glowColor: 'hover:border-red-500/60 shadow-red-500/10',
    },
    features: ['Многоголосый дубляж', 'Быстрый релиз серий', 'Качественный звук'],
    badge: 'Voiceover',
  },
  {
    id: 'reddit',
    name: 'Reddit r/anime',
    russianName: 'Реддит Аниме',
    category: 'community',
    categoryLabel: 'Глобальные обсуждения',
    description: 'Главное мировое сообщество для обсуждения онгоингов, теорий и мемов.',
    websiteUrl: 'https://reddit.com/r/anime',
    searchUrlTemplate: (query: string, englishTitle?: string) =>
      `https://www.reddit.com/r/anime/search/?q=${encodeURIComponent(englishTitle || query)}&restrict_sr=1`,
    bestIcon: {
      type: 'icons8',
      iconName: 'chat-message',
      style: 'fluency',
      bgColor: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
      glowColor: 'hover:border-orange-500/60 shadow-orange-500/10',
    },
    features: ['Еженедельные эпизод-треды', 'Голосования за лучший опенинг', 'Инсайды и теории'],
    badge: 'Discussions',
  },
];
