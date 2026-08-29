import { ProfileAura, AccentTheme, UserProfile } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  anime: string;
  animeId: string;
  description: string;
  rating: number;
  year: number;
  genres: string[];
}

export interface BannerPreset {
  id: string;
  name: string;
  url: string;
  preview: string;
  animeTitle: string;
  animeId: string;
  description: string;
  studio: string;
  year: number;
}

export interface AuraPreset {
  id: ProfileAura;
  name: string;
  className: string;
  glowColor: string;
  description: string;
}

export interface AccentThemePreset {
  id: AccentTheme;
  name: string;
  hex: string;
  badgeClass: string;
  buttonClass: string;
  borderClass: string;
  textClass: string;
  bgSubtle: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'solo-leveling-9600',
    name: 'Сон Джин-Ву',
    anime: 'Поднятие уровня в одиночку',
    animeId: '9600',
    url: 'https://anilibria.top/storage/releases/posters/9600/1RwzksvrU3kCWOcWELGVuMYINrwtM6pA.jpg',
    description: '«Слабейший охотник человечества» получает таинственную Систему прокачки и начинает путь к становлению абсолютным Теневым Монархом.',
    rating: 9.8,
    year: 2024,
    genres: ['Экшен', 'Приключения', 'Фэнтези'],
  },
  {
    id: 'jujutsu-kaisen-8789',
    name: 'Сатору Годзё / Юдзи Итадори',
    anime: 'Магическая битва',
    animeId: '8789',
    url: 'https://shikimori.io/system/animes/original/40748.jpg',
    description: 'В мире, где негативные эмоции порождают чудовищных Проклятий, маги Токийского колледжа ведут ожесточённую войну за спасение людей.',
    rating: 9.7,
    year: 2020,
    genres: ['Экшен', 'Сёнен', 'Сверхъестественное', 'Фэнтези'],
  },
  {
    id: 'frieren-9542',
    name: 'Фрирен',
    anime: 'Провожающая в последний путь Фрирен',
    animeId: '9542',
    url: 'https://shikimori.io/system/animes/original/52991.jpg',
    description: 'Бессмертная эльфийка-волшебница отправляется в новое путешествие по следам павших друзей-героев, чтобы познать природу человеческих сердец.',
    rating: 9.9,
    year: 2023,
    genres: ['Приключения', 'Драма', 'Фэнтези', 'Магия'],
  },
  {
    id: 'kimetsu-9406',
    name: 'Тандзиро & Незуко Камадо',
    anime: 'Клинок, Рассекающий Демонов',
    animeId: '9406',
    url: 'https://shikimori.io/system/animes/original/51019.jpg',
    description: 'Битва в тайной Деревне кузнецов, где создаются клинки Ничирин. Охотники против сильнейших демонов Высшей Луны.',
    rating: 9.3,
    year: 2023,
    genres: ['Экшен', 'Исторический', 'Демоны', 'Сёнен'],
  },
  {
    id: 'cyberpunk-9307',
    name: 'Дэвид Мартинес & Люси',
    anime: 'Киберпанк: Бегущие по краю',
    animeId: '9307',
    url: 'https://shikimori.io/system/animes/original/42310.jpg',
    description: 'Найт-Сити — беспощадный неоновый мегаполис технологий и аугментаций. Потеряв всё, юноша устанавливает военный Сандевистан и становится наёмником.',
    rating: 9.6,
    year: 2022,
    genres: ['Фантастика', 'Киберпанк'],
  },
  {
    id: 'spy-family-9161',
    name: 'Аня & Лойд Форджер',
    anime: 'Семья шпиона',
    animeId: '9161',
    url: 'https://shikimori.io/system/animes/original/50265.jpg',
    description: 'Элитный шпион Сумрак, наёмная убийца Йор и шестилетняя девочка-телепат Аня объединяются в фиктивную семью ради спасения мира.',
    rating: 8.5,
    year: 2022,
    genres: ['Комедия', 'Сёнен', 'Экшен'],
  },
  {
    id: 'oshi-no-ko-9420',
    name: 'Аква & Руби Хошино',
    anime: 'Звёздное дитя',
    animeId: '9420',
    url: 'https://shikimori.io/system/animes/original/52034.jpg',
    description: 'Переродившись детьми легендарного айдола Аи, близнецы погружаются в изнанку шоу-бизнеса, чтобы раскрыть роковые тайны прошлого.',
    rating: 9.5,
    year: 2023,
    genres: ['Драма', 'Музыка', 'Сейнен'],
  },
  {
    id: 'vinland-8424',
    name: 'Торфинн Карлсефни',
    anime: 'Сага о Винланде',
    animeId: '8424',
    url: 'https://shikimori.io/system/animes/original/37521.jpg',
    description: 'Эпоха викингов. Сын легендарного воина Торса ступает на путь мести и поисков далёкой земли мира, где нет войн и рабства.',
    rating: 9.8,
    year: 2019,
    genres: ['Драма', 'Сейнен', 'Исторический', 'Экшен'],
  },
  {
    id: 'summer-time-8674',
    name: 'Симпэй Адзиро',
    anime: 'Летнее время',
    animeId: '8674',
    url: 'https://shikimori.io/system/animes/original/47194.jpg',
    description: 'Возвращение на изолированный остров ради похорон подруги детства оборачивается пугающей петлей времени и битвой против сущностей-теней.',
    rating: 9.4,
    year: 2022,
    genres: ['Фантастика', 'Триллер', 'Мистика'],
  },
  {
    id: 'bocchi-9293',
    name: 'Хитори Гото (Боччи)',
    anime: 'Одинокий рокер!',
    animeId: '9293',
    url: 'https://shikimori.io/system/animes/original/47917.jpg',
    description: 'Стеснительная гитаристка-интроверт преодолевает социальную тревожность и зажигает сцену в составе рок-группы Kessoku Band.',
    rating: 8.0,
    year: 2022,
    genres: ['Комедия', 'Музыка', 'Повседневность'],
  },
  {
    id: 'one-piece-21',
    name: 'Манки Д. Луффи',
    anime: 'Ван-Пис',
    animeId: '21',
    url: 'https://shikimori.io/system/animes/original/21.jpg',
    description: 'Капитан Соломенной Шляпы ищет легендарное сокровище One Piece, чтобы стать Королём Пиратов.',
    rating: 8.9,
    year: 1999,
    genres: ['Сёнен', 'Приключения', 'Фэнтези', 'Комедия'],
  },
  {
    id: 'chainsaw-man-44511',
    name: 'Дэндзи & Почита',
    anime: 'Человек-бензопила',
    animeId: '44511',
    url: 'https://shikimori.io/system/animes/original/44511.jpg',
    description: 'Юноша сливается с демоном-бензопилой и вступает в ряды Бюро Общественной Безопасности охотников на демонов.',
    rating: 8.6,
    year: 2022,
    genres: ['Экшен', 'Сёнен', 'Сверхъестественное'],
  },
];

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'solo-banner',
    name: 'Врата Подземелья Теневого Монарха',
    url: 'https://anilibria.top/storage/releases/posters/9600/05RqjXuiUbRh54AQFRTwUuHoHYDaORCk.webp',
    preview: 'https://anilibria.top/storage/releases/posters/9600/05RqjXuiUbRh54AQFRTwUuHoHYDaORCk.webp',
    animeTitle: 'Поднятие уровня в одиночку',
    animeId: '9600',
    description: 'Официальный арт релиза Solo Leveling от студии A-1 Pictures. Идеальный тёмно-синий фон подземелья.',
    studio: 'A-1 Pictures',
    year: 2024,
  },
  {
    id: 'jujutsu-banner',
    name: 'Расширение Территории: Магическая битва',
    url: 'https://anilibria.top/storage/releases/posters/8789/4aPhTR3xO8o0XkJrVruXqjDEvKllfXaG.webp',
    preview: 'https://anilibria.top/storage/releases/posters/8789/4aPhTR3xO8o0XkJrVruXqjDEvKllfXaG.webp',
    animeTitle: 'Магическая битва',
    animeId: '8789',
    description: 'Атмосферный постер MAPPA с ключевыми магами и проклятой энергией.',
    studio: 'MAPPA',
    year: 2020,
  },
  {
    id: 'frieren-banner',
    name: 'Цветочное поле воспоминаний Фрирен',
    url: 'https://anilibria.top/storage/releases/posters/9542/8UGD4dHHp1kdjquBph2CUSk9pLNsGtYw.webp',
    preview: 'https://anilibria.top/storage/releases/posters/9542/8UGD4dHHp1kdjquBph2CUSk9pLNsGtYw.webp',
    animeTitle: 'Провожающая в последний путь Фрирен',
    animeId: '9542',
    description: 'Живописный шедевр Madhouse о бесконечном странствии сквозь века.',
    studio: 'Madhouse',
    year: 2023,
  },
  {
    id: 'kimetsu-banner',
    name: 'Пламя Клинка: Деревня Кузнецов',
    url: 'https://anilibria.top/storage/releases/posters/9406/UlOVHi66wC0EocyW8EprVLKLroT19z7H.webp',
    preview: 'https://anilibria.top/storage/releases/posters/9406/UlOVHi66wC0EocyW8EprVLKLroT19z7H.webp',
    animeTitle: 'Клинок, Рассекающий Демонов',
    animeId: '9406',
    description: 'Эпическая работа студии ufotable с непревзойденной динамикой и визуальными эффектами.',
    studio: 'ufotable',
    year: 2023,
  },
  {
    id: 'cyberpunk-banner',
    name: 'Неоновый Найт-Сити: Edgerunners',
    url: 'https://anilibria.top/storage/releases/posters/9307/UpcQ9ZT3vcCR8XwVX6iZ2XHSqL46vGRB.webp',
    preview: 'https://anilibria.top/storage/releases/posters/9307/UpcQ9ZT3vcCR8XwVX6iZ2XHSqL46vGRB.webp',
    animeTitle: 'Киберпанк: Бегущие по краю',
    animeId: '9307',
    description: 'Взрывной кислотный стиль студии Trigger с панорамой футуристического города.',
    studio: 'Studio Trigger',
    year: 2022,
  },
  {
    id: 'oshi-banner',
    name: 'Свет софитов: Звёздное дитя',
    url: 'https://anilibria.top/storage/releases/posters/9420/JUnX1e5B8kszxyMcdlm9ZWFLgGXmngXd.webp',
    preview: 'https://anilibria.top/storage/releases/posters/9420/JUnX1e5B8kszxyMcdlm9ZWFLgGXmngXd.webp',
    animeTitle: 'Звёздное дитя',
    animeId: '9420',
    description: 'Драматический постер Doga Kobo с сияющими глазами-звёздами айдолов.',
    studio: 'Doga Kobo',
    year: 2023,
  },
];

export const AURA_PRESETS: AuraPreset[] = [
  {
    id: 'none',
    name: 'Без ауры (Классика)',
    className: 'border-zinc-700',
    glowColor: 'transparent',
    description: 'Чистый лаконичный контур без анимации и свечения.',
  },
  {
    id: 'neon-rose',
    name: 'Теневой Монарх (Пурпурный Багрянец)',
    className: 'border-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.9)] ring-2 ring-rose-500/50 animate-pulse',
    glowColor: '#f43f5e',
    description: 'Энергетическая пульсация в стиле восставших теневых бойцов Сон Джин-Ву.',
  },
  {
    id: 'cyber-cyan',
    name: 'Сандевистан (Кибер Неон)',
    className: 'border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.9)] ring-2 ring-cyan-400/50 animate-pulse',
    glowColor: '#22d3ee',
    description: 'Высокочастотный кибернетический импульс Найт-Сити с ярким неоновым шлейфом.',
  },
  {
    id: 'golden-shonen',
    name: 'Дыхание Солнца (Золотое Пламя)',
    className: 'border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.9)] ring-2 ring-amber-400/50 animate-pulse',
    glowColor: '#fbbf24',
    description: 'Ослепительное золотистое свечение первородного стиля дыхания клинка.',
  },
  {
    id: 'void-purple',
    name: 'Безграничность (Магия Бездны)',
    className: 'border-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.9)] ring-2 ring-purple-500/50 animate-pulse',
    glowColor: '#a855f7',
    description: 'Мистическое фиолетовое поле проклятой энергии Сатору Годзё.',
  },
  {
    id: 'sakura-blossom',
    name: 'Лепестки Сакуры (Астральный Розовый)',
    className: 'border-pink-400 shadow-[0_0_24px_rgba(244,114,182,0.9)] ring-2 ring-pink-400/50 animate-pulse',
    glowColor: '#f472b6',
    description: 'Нежное сияние магии цветов и древних эльфийских заклинаний Фрирен.',
  },
  {
    id: 'emerald-ghost',
    name: 'Изумрудный Дракон (Вихрь Ветра)',
    className: 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.9)] ring-2 ring-emerald-400/50 animate-pulse',
    glowColor: '#34d399',
    description: 'Таинственное зелёное пламя духов и природной магии древних лесов.',
  },
];

export const ACCENT_THEME_PRESETS: AccentThemePreset[] = [
  {
    id: 'rose',
    name: 'AniCrash Багряный',
    hex: '#f43f5e',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-400',
    bgSubtle: 'bg-rose-950/20',
  },
  {
    id: 'cyan',
    name: 'Кибер Циан',
    hex: '#06b6d4',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    buttonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30',
    borderClass: 'border-cyan-500',
    textClass: 'text-cyan-400',
    bgSubtle: 'bg-cyan-950/20',
  },
  {
    id: 'purple',
    name: 'Магический Фиолет',
    hex: '#a855f7',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
    borderClass: 'border-purple-500',
    textClass: 'text-purple-400',
    bgSubtle: 'bg-purple-950/20',
  },
  {
    id: 'amber',
    name: 'Золотой Огонь',
    hex: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    bgSubtle: 'bg-amber-950/20',
  },
  {
    id: 'emerald',
    name: 'Изумрудный Неон',
    hex: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    bgSubtle: 'bg-emerald-950/20',
  },
  {
    id: 'sakura',
    name: 'Нежная Сакура',
    hex: '#ec4899',
    badgeClass: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    buttonClass: 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30',
    borderClass: 'border-pink-500',
    textClass: 'text-pink-400',
    bgSubtle: 'bg-pink-950/20',
  },
];

export const TITLE_PRESETS = [
  'Хозяин Теней',
  'Охотник S-ранга',
  'Марафонец Онгоингов',
  'Владыка Проклятий',
  'Хранитель Вайфу',
  'Ценитель Классики',
  'Бессмертный Отаку',
  'Ночной Стример',
  'Гуру Озвучек AniLibria',
  'Легенда Аниме',
];

export const ANIME_QUOTE_PRESETS = [
  '«Встань.» — Сон Джин-Ву',
  '«Не беспокойся, ведь я сильнейший.» — Сатору Годзё',
  '«Людям нужно время, чтобы понять друг друга.» — Фрирен',
  '«Не сдавайся! Каким бы бессильным ты себя ни чувствовал!» — Тандзиро Камадо',
  '«Я вытащу тебя на самую вершину башни Арасаки.» — Дэвид Мартинес',
  '«Вак-ваку! (Ух ты, как волнующе!)» — Аня Форджер',
  '«Ложь — это самая изысканная форма любви.» — Аи Хошино',
  '«У тебя нет врагов. Ни у кого нет врагов.» — Торс',
];

export const DEFAULT_PROFILE: UserProfile = {
  username: 'Shadow_Monarch',
  avatar: 'https://anilibria.top/storage/releases/posters/9600/1RwzksvrU3kCWOcWELGVuMYINrwtM6pA.jpg',
  aura: 'neon-rose',
  title: 'Хозяин Теней',
  statusQuote: 'Смотрю аниме в 4K и без единой рекламы на AniCrash',
  bannerUrl: 'https://anilibria.top/storage/releases/posters/9600/1RwzksvrU3kCWOcWELGVuMYINrwtM6pA.jpg',
  accentTheme: 'rose',
  pinnedAnimeId: '9600',
  pinnedAnimeReview: 'Абсолютный фаворит года! Невероятный темп, анимация боёв и эпичный саундтрек от Хироюки Савано.',
  pinnedAnimeRating: 10,
  soundEffects: true,
  joinedDate: 'Август 2024',
};

export interface QuickReaction {
  id: string;
  label: string;
  icon8: string;
  color: string;
}

export const QUICK_REACTIONS: QuickReaction[] = [
  { id: 'fire', label: 'Огонь', icon8: 'fire-element', color: 'from-orange-500 to-rose-500' },
  { id: 'heart', label: 'Любовь', icon8: 'like--v1', color: 'from-rose-500 to-pink-500' },
  { id: 'zap', label: 'Энергия', icon8: 'flash-on', color: 'from-amber-400 to-yellow-500' },
  { id: 'sparkles', label: 'Эпик', icon8: 'sparkling', color: 'from-purple-400 to-indigo-500' },
  { id: 'trophy', label: 'Шедевр', icon8: 'trophy', color: 'from-yellow-400 to-amber-500' },
  { id: 'star', label: 'Топ 1', icon8: 'star--v1', color: 'from-amber-300 to-orange-400' },
  { id: 'popcorn', label: 'Попкорн', icon8: 'popcorn', color: 'from-blue-400 to-cyan-500' },
  { id: 'crown', label: 'Легенда', icon8: 'crown', color: 'from-emerald-400 to-teal-500' },
];

