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

const BASE = 'https://anilibria.top/api/v1';

async function searchOne(query) {
  try {
    const res = await fetch(`${BASE}/app/search/releases?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

async function resolveTitle({ ru, en }) {
  // сперва по русскому названию, если пусто - по английскому
  let list = await searchOne(ru);
  if (list.length === 0) list = await searchOne(en);

  const candidates = list.slice(0, 3).map((item) => ({
    id: item.id,
    alias: item.alias,
    name_main: item.name?.main,
    name_english: item.name?.english,
    episodes_total: item.episodes_total,
    type: item.type?.description,
  }));

  return { query_ru: ru, query_en: en, candidates };
}

async function main() {
  const results = [];
  for (const title of TITLES) {
    try {
      const r = await resolveTitle(title);
      results.push(r);
      console.log(`✓ ${title.ru} -> ${r.candidates.length} candidate(s)`);
    } catch (e) {
      console.warn(`✗ ${title.ru}:`, e.message);
      results.push({ query_ru: title.ru, query_en: title.en, candidates: [], error: String(e) });
    }
    // небольшая пауза, чтобы не долбить API слишком быстро
    await new Promise((r) => setTimeout(r, 300));
  }

  const fs = await import('node:fs/promises');
  await fs.writeFile('anilibria-ids.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nГотово. Результат в anilibria-ids.json');
}

main();
