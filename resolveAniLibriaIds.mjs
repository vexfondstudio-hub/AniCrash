// Запуск: node resolveAniLibriaIds.mjs
// Требует Node.js 18+ (встроенный fetch). Результат пишется в anilibria-ids.json рядом со скриптом.

const TITLES = [
  { ru: 'Гуррен-Лаганн, пронзающий небеса', en: 'Tengen Toppa Gurren Lagann' },
  { ru: 'Гуррен-Лаганн, Фильм 2: Огненные лучи', en: 'Gurren Lagann Movie 2: Lagann-hen' },
  { ru: 'Поднятие уровня в одиночку', en: 'Solo Leveling' },
  { ru: 'Магическая битва', en: 'Jujutsu Kaisen' },
  { ru: 'Провожающая в последний путь Фрирен', en: "Frieren: Beyond Journey's End" },
  { ru: 'Клинок, Рассекающий Демонов: Деревня Кузнецов', en: 'Demon Slayer: Swordsmith Village' },
  { ru: 'Клинок, рассекающий демонов: Сезон 1', en: 'Demon Slayer: Kimetsu no Yaiba' },
  { ru: 'Киберпанк: Бегущие по краю', en: 'Cyberpunk: Edgerunners' },
  { ru: 'Семья шпиона', en: 'SPY x FAMILY' },
  { ru: 'Звёздное дитя', en: 'Oshi No Ko' },
  { ru: 'Человек-бензопила', en: 'Chainsaw Man' },
  { ru: 'Кайдзю номер восемь', en: 'Kaiju No. 8' },
  { ru: 'Одинокий рокер!', en: 'BOCCHI THE ROCK!' },
  { ru: 'Синяя тюрьма: Блю Лок', en: 'Blue Lock' },
  { ru: 'Атака титанов', en: 'Attack on Titan' },
  { ru: 'Тетрадь смерти', en: 'Death Note' },
  { ru: 'Стальной алхимик: Братство', en: 'Fullmetal Alchemist: Brotherhood' },
  { ru: 'Хантер х Хантер', en: 'Hunter x Hunter' },
  { ru: 'Наруто: Ураганные хроники', en: 'Naruto: Shippuuden' },
  { ru: 'Ван-Пис', en: 'One Piece' },
  { ru: 'Блич: Тысячелетняя кровавая война', en: 'Bleach: Thousand-Year Blood War' },
  { ru: 'Код Гиас: Восставший Лелуш', en: 'Code Geass: Lelouch of the Rebellion' },
  { ru: 'Врата Штейна', en: 'Steins;Gate' },
  { ru: 'Сага о Винланде', en: 'Vinland Saga' },
  { ru: 'Евангелион нового поколения', en: 'Neon Genesis Evangelion' },
  { ru: 'Токийский гуль', en: 'Tokyo Ghoul' },
  { ru: 'Ванпанчмен', en: 'One Punch Man' },
  { ru: 'Моб Психо 100', en: 'Mob Psycho 100' },
  { ru: "Невероятные приключения ДжоДжо: Золотой ветер", en: "JoJo's Bizarre Adventure: Golden Wind" },
  { ru: 'О моём перерождении в слизь', en: 'That Time I Got Reincarnated as a Slime' },
  { ru: 'Реинкарнация безработного', en: 'Mushoku Tensei: Jobless Reincarnation' },
  { ru: 'Re:Zero. Жизнь с нуля в другом мире', en: 'Re:Zero' },
  { ru: 'Мастера Меча Онлайн', en: 'Sword Art Online' },
  { ru: 'Чёрный клевер', en: 'Black Clover' },
  { ru: 'Пламенная бригада пожарных', en: 'Fire Force' },
  { ru: 'Доктор Стоун', en: 'Dr. STONE' },
  { ru: 'Бездомный бог', en: 'Noragami' },
  { ru: 'Дороро', en: 'Dororo' },
  { ru: 'Созданный в Бездне', en: 'Made in Abyss' },
  { ru: 'Моя геройская академия', en: 'My Hero Academia' },
  { ru: 'Твоё имя', en: 'Kimi no Na wa' },
  { ru: 'Форма голоса', en: 'A Silent Voice' },
  { ru: 'Госпожа Кагуя: В любви как на войне', en: 'Kaguya-sama: Love is War' },
  { ru: 'Волейбол!!', en: 'Haikyuu!!' },
];

const ANILIBRIA_BASE = 'https://anilibria.top/api/v1';
const SHIKIMORI_BASE = 'https://shikimori.one/api';
const JIKAN_BASE = 'https://api.jikan.moe/v4';
const ANILIST_BASE = 'https://graphql.anilist.co';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function safeJson(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------- AniLibria ----------
async function searchAniLibria(query) {
  const list = await safeJson(`${ANILIBRIA_BASE}/app/search/releases?query=${encodeURIComponent(query)}`);
  if (!Array.isArray(list)) return [];
  return list.slice(0, 3).map((item) => ({
    id: item.id,
    alias: item.alias,
    name_main: item.name?.main,
    name_english: item.name?.english,
    episodes_total: item.episodes_total,
    type: item.type?.description,
  }));
}

// ---------- Shikimori ----------
async function searchShikimori(query) {
  const list = await safeJson(`${SHIKIMORI_BASE}/animes?search=${encodeURIComponent(query)}&limit=3`);
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    id: item.id,
    russian: item.russian,
    name: item.name,
    episodes: item.episodes,
    kind: item.kind,
    url: `https://shikimori.one${item.url}`,
  }));
}

// ---------- Jikan (MyAnimeList) ----------
async function searchJikan(query) {
  const json = await safeJson(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=3`);
  const list = json?.data;
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    mal_id: item.mal_id,
    title: item.title,
    title_english: item.title_english,
    episodes: item.episodes,
    score: item.score,
    url: item.url,
  }));
}

// ---------- AniList (GraphQL) ----------
async function searchAniList(query) {
  const gqlQuery = `
    query ($search: String) {
      Page(perPage: 3) {
        media(search: $search, type: ANIME) {
          id
          title { romaji english native }
          episodes
          format
          siteUrl
        }
      }
    }
  `;
  const json = await safeJson(ANILIST_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gqlQuery, variables: { search: query } }),
  });
  const list = json?.data?.Page?.media;
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    id: item.id,
    title_romaji: item.title?.romaji,
    title_english: item.title?.english,
    episodes: item.episodes,
    format: item.format,
    url: item.siteUrl,
  }));
}

async function resolveTitle({ ru, en }) {
  const anilibria = (await searchAniLibria(ru)).length ? await searchAniLibria(ru) : await searchAniLibria(en);
  await sleep(150);
  const shikimori = (await searchShikimori(ru)).length ? await searchShikimori(ru) : await searchShikimori(en);
  await sleep(150);
  const jikan = await searchJikan(en);
  await sleep(400); // jikan просит не чаще ~1 запроса/сек без ключа
  const anilist = await searchAniList(en);

  return { query_ru: ru, query_en: en, sources: { anilibria, shikimori, jikan, anilist } };
}

async function main() {
  const results = [];
  for (const title of TITLES) {
    try {
      const r = await resolveTitle(title);
      const total = Object.values(r.sources).reduce((n, arr) => n + arr.length, 0);
      results.push(r);
      console.log(`✓ ${title.ru} -> ${total} candidate(s) across sources`);
    } catch (e) {
      console.warn(`✗ ${title.ru}:`, e.message);
      results.push({ query_ru: title.ru, query_en: title.en, sources: {}, error: String(e) });
    }
    await sleep(300);
  }

  const fs = await import('node:fs/promises');
  await fs.writeFile('anime-ids.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nГотово. Результат в anime-ids.json');
}

main();
