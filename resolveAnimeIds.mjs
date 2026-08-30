// Быстрый и надежный резолвер ID аниме по базам Shikimori, AniList и AniLibria
// с гарантированной защитой от неверных сопоставлений (Тетрадь смерти, Атака титанов и др.)

import fs from 'node:fs/promises';

const TITLES = [
  { ru: 'Гуррен-Лаганн, пронзающий небеса', en: 'Tengen Toppa Gurren Lagann', jp: 'Tengen Toppa Gurren Lagann' },
  { ru: 'Гуррен-Лаганн, Фильм 2: Огненные лучи', en: 'Gurren Lagann Movie 2: Lagann-hen', jp: 'Tengen Toppa Gurren Lagann: Lagann-hen' },
  { ru: 'Поднятие уровня в одиночку', en: 'Solo Leveling', jp: 'Ore dake Level Up na Ken' },
  { ru: 'Магическая битва', en: 'Jujutsu Kaisen', jp: 'Jujutsu Kaisen' },
  { ru: 'Провожающая в последний путь Фрирен', en: "Frieren: Beyond Journey's End", jp: 'Sousou no Frieren' },
  { ru: 'Клинок, Рассекающий Демонов: Деревня Кузнецов', en: 'Demon Slayer: Swordsmith Village Arc', jp: 'Kimetsu no Yaiba: Katanakaji no Sato-hen' },
  { ru: 'Клинок, рассекающий демонов: Сезон 1', en: 'Demon Slayer: Kimetsu no Yaiba', jp: 'Kimetsu no Yaiba' },
  { ru: 'Киберпанк: Бегущие по краю', en: 'Cyberpunk: Edgerunners', jp: 'Cyberpunk: Edgerunners' },
  { ru: 'Семья шпиона', en: 'SPY x FAMILY', jp: 'SPY x FAMILY' },
  { ru: 'Звёздное дитя', en: 'Oshi No Ko', jp: '【OSHI NO KO】' },
  { ru: 'Человек-бензопила', en: 'Chainsaw Man', jp: 'Chainsaw Man' },
  { ru: 'Кайдзю номер восемь', en: 'Kaiju No. 8', jp: 'Kaijuu 8-gou' },
  { ru: 'Одинокий рокер!', en: 'BOCCHI THE ROCK!', jp: 'Bocchi the Rock!' },
  { ru: 'Синяя тюрьма: Блю Лок', en: 'Blue Lock', jp: 'Blue Lock' },
  { ru: 'Атака титанов', en: 'Attack on Titan', jp: 'Shingeki no Kyojin' },
  { ru: 'Тетрадь смерти', en: 'Death Note', jp: 'Death Note' },
  { ru: 'Стальной алхимик: Братство', en: 'Fullmetal Alchemist: Brotherhood', jp: 'Hagane no Renkinjutsushi: Fullmetal Alchemist' },
  { ru: 'Хантер х Хантер', en: 'Hunter x Hunter', jp: 'Hunter x Hunter (2011)' },
  { ru: 'Наруто: Ураганные хроники', en: 'Naruto: Shippuuden', jp: 'Naruto: Shippuuden' },
  { ru: 'Ван-Пис', en: 'One Piece', jp: 'One Piece' },
  { ru: 'Блич: Тысячелетняя кровавая война', en: 'Bleach: Thousand-Year Blood War', jp: 'BLEACH: Sennen Kessen-hen' },
  { ru: 'Код Гиас: Восставший Лелуш', en: 'Code Geass: Lelouch of the Rebellion', jp: 'Code Geass: Hangyaku no Lelouch' },
  { ru: 'Врата Штейна', en: 'Steins;Gate', jp: 'Steins;Gate' },
  { ru: 'Сага о Винланде', en: 'Vinland Saga', jp: 'Vinland Saga' },
  { ru: 'Евангелион нового поколения', en: 'Neon Genesis Evangelion', jp: 'Shinseiki Evangelion' },
  { ru: 'Токийский гуль', en: 'Tokyo Ghoul', jp: 'Tokyo Ghoul' },
  { ru: 'Ванпанчмен', en: 'One Punch Man', jp: 'One Punch Man' },
  { ru: 'Моб Психо 100', en: 'Mob Psycho 100', jp: 'Mob Psycho 100' },
  { ru: "Невероятные приключения ДжоДжо: Золотой ветер", en: "JoJo's Bizarre Adventure: Golden Wind", jp: "JoJo no Kimyou na Bouken: Ougon no Kaze" },
  { ru: 'О моём перерождении в слизь', en: 'That Time I Got Reincarnated as a Slime', jp: 'Tensei shitara Slime Datta Ken' },
  { ru: 'Реинкарнация безработного', en: 'Mushoku Tensei: Jobless Reincarnation', jp: 'Mushoku Tensei: Isekai Ittara Honki Dasu' },
  { ru: 'Re:Zero. Жизнь с нуля в другом мире', en: 'Re:Zero', jp: 'Re:Zero kara Hajimeru Isekai Seikatsu' },
  { ru: 'Мастера Меча Онлайн', en: 'Sword Art Online', jp: 'Sword Art Online' },
  { ru: 'Чёрный клевер', en: 'Black Clover', jp: 'Black Clover' },
  { ru: 'Пламенная бригада пожарных', en: 'Fire Force', jp: 'Enen no Shouboutai' },
  { ru: 'Доктор Стоун', en: 'Dr. STONE', jp: 'Dr. STONE' },
  { ru: 'Бездомный бог', en: 'Noragami', jp: 'Noragami' },
  { ru: 'Дороро', en: 'Dororo', jp: 'Dororo' },
  { ru: 'Созданный в Бездне', en: 'Made in Abyss', jp: 'Made in Abyss' },
  { ru: 'Моя геройская академия', en: 'My Hero Academia', jp: 'Boku no Hero Academia' },
  { ru: 'Твоё имя', en: 'Kimi no Na wa', jp: 'Kimi no Na wa.' },
  { ru: 'Форма голоса', en: 'A Silent Voice', jp: 'Koe no Katachi' },
  { ru: 'Госпожа Кагуя: В любви как на войне', en: 'Kaguya-sama: Love is War', jp: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen' },
  { ru: 'Волейбол!!', en: 'Haikyuu!!', jp: 'Haikyuu!!' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url, opts = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimeStudio/4.0',
        ...(opts.headers || {})
      }
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(id);
    return null;
  }
}

function normalize(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-zа-я0-9]/gi, '');
}

function matchScore(target, cand) {
  if (!cand) return 0;
  const t = normalize(target);
  const c = normalize(cand);
  if (!t || !c) return 0;
  if (t === c) return 100;
  if (c.startsWith(t) || t.startsWith(c)) return 85;
  if (c.includes(t) || t.includes(c)) return 70;
  return 10;
}

function isExactAnimeMatch(target, candidateMain, candidateEn) {
  const main = candidateMain || '';
  const en = candidateEn || '';
  const combo = (main + ' ' + en).toLowerCase();

  // 1. Атака титанов (Attack on Titan / Shingeki no Kyojin)
  if (target.ru.includes('Атака титанов') || target.en.includes('Attack on Titan')) {
    if (combo.includes('нагаторо') || combo.includes('nagatoro') || combo.includes('chuugakkou') || combo.includes('средняя школа')) {
      return false;
    }
    return combo.includes('атака титанов') || combo.includes('attack on titan') || combo.includes('shingeki no kyojin');
  }

  // 2. Тетрадь смерти (Death Note)
  if (target.ru.includes('Тетрадь смерти') || target.en.includes('Death Note')) {
    if (combo.includes('netflix') || combo.includes('нацумэ') || combo.includes('natsume') || combo.includes('хинако') || combo.includes('марш')) {
      return false;
    }
    return combo.includes('тетрадь смерти') || combo.includes('death note');
  }

  // 3. Форма голоса (A Silent Voice / Koe no Katachi)
  if (target.ru.includes('Форма голоса') || target.en.includes('Silent Voice')) {
    if (combo.includes('акэби') || combo.includes('akebi')) return false;
    return combo.includes('форма голоса') || combo.includes('silent voice') || combo.includes('koe no katachi');
  }

  // 4. Блю Лок (Blue Lock)
  if (target.ru.includes('Блю Лок') || target.en.includes('Blue Lock')) {
    if (combo.includes('механическая пушка')) return false;
    return combo.includes('блю лок') || combo.includes('blue lock');
  }

  // 5. Человек-бензопила (Chainsaw Man)
  if (target.ru.includes('Человек-бензопила') || target.en.includes('Chainsaw Man')) {
    if (combo.includes('выбранный богами')) return false;
    return combo.includes('бензопила') || combo.includes('chainsaw');
  }

  // 6. Гуррен-Лаганн (Gurren Lagann)
  if (target.ru.includes('Гуррен') || target.en.includes('Gurren')) {
    if (combo.includes('троецарств') || combo.includes('sangokushi')) return false;
    return combo.includes('гуррен') || combo.includes('gurren');
  }

  const s1 = matchScore(target.ru, main);
  const s2 = matchScore(target.en, en);
  const s3 = target.jp ? matchScore(target.jp, en) : 0;
  return Math.max(s1, s2, s3) >= 55;
}

// 1. Поиск Shikimori
async function searchShikimori(item) {
  const queries = [item.ru, item.en, item.jp].filter(Boolean);
  for (const q of queries) {
    const list = await fetchWithTimeout(`https://shikimori.one/api/animes?search=${encodeURIComponent(q)}&limit=6`);
    if (Array.isArray(list) && list.length > 0) {
      for (const cand of list) {
        if (isExactAnimeMatch(item, cand.russian, cand.name)) {
          return {
            id: cand.id,
            russian: cand.russian || cand.name,
            name: cand.name,
            episodes: cand.episodes,
            kind: cand.kind,
            url: `https://shikimori.one${cand.url}`,
          };
        }
      }
    }
  }
  return null;
}

// 2. Поиск AniList
async function searchAniList(item) {
  const gqlQuery = `
    query ($search: String) {
      Page(perPage: 4) {
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
  const queries = [item.en, item.jp].filter(Boolean);
  for (const q of queries) {
    const json = await fetchWithTimeout('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery, variables: { search: q } }),
    });
    const list = json?.data?.Page?.media;
    if (Array.isArray(list) && list.length > 0) {
      for (const cand of list) {
        const romaji = cand.title?.romaji || '';
        const english = cand.title?.english || '';
        if (isExactAnimeMatch(item, english, romaji)) {
          return {
            id: cand.id,
            title_romaji: romaji,
            title_english: english,
            episodes: cand.episodes,
            format: cand.format,
            url: cand.siteUrl,
          };
        }
      }
    }
  }
  return null;
}

// 3. Поиск AniLibria (со строгой фильтрацией)
async function searchAniLibria(item) {
  const queries = [item.ru, item.en].filter(Boolean);
  for (const q of queries) {
    const list = await fetchWithTimeout(`https://anilibria.top/api/v1/app/search/releases?query=${encodeURIComponent(q)}`);
    if (Array.isArray(list) && list.length > 0) {
      for (const cand of list) {
        const main = cand.name?.main || '';
        const en = cand.name?.english || '';
        const alias = cand.alias || '';
        if (alias.includes('netflix') || alias.includes('live-action') || alias.includes('nagatoro')) {
          continue;
        }
        if (isExactAnimeMatch(item, `${main} ${alias}`, `${en} ${alias}`)) {
          return {
            id: cand.id,
            alias: cand.alias,
            name_main: main,
            name_english: en,
            episodes_total: cand.episodes_total,
            type: cand.type?.description,
          };
        }
      }
    }
  }
  return null;
}

async function main() {
  console.log('🚀 Запуск быстрого и точного сопоставления ID аниме (44 тайтла)...');
  const results = [];

  for (let i = 0; i < TITLES.length; i++) {
    const t = TITLES[i];
    console.log(`[${i + 1}/${TITLES.length}] Поиск: "${t.ru}" / "${t.en}"...`);

    const shikimori = await searchShikimori(t);
    const anilist = await searchAniList(t);
    const anilibria = await searchAniLibria(t);

    const record = {
      query_ru: t.ru,
      query_en: t.en,
      query_jp: t.jp,
      bestMatch: {
        shikimori_id: shikimori?.id || null,
        shikimori_title: shikimori?.russian || shikimori?.name || null,
        anilist_id: anilist?.id || null,
        anilist_title: anilist?.title_english || anilist?.title_romaji || null,
        anilibria_id: anilibria?.id || null,
        anilibria_alias: anilibria?.alias || null,
        anilibria_title: anilibria?.name_main || null,
        player_source: anilibria 
          ? 'AniLibria HLS + Kodik + Shikimori' 
          : 'Kodik / Shikimori / Jut.su / Allvideo (на AniLibria релиз отсутствует/не лицензирован)'
      },
      sources: {
        shikimori,
        anilist,
        anilibria
      }
    };

    results.push(record);
    // Мгновенная запись
    await fs.writeFile('anime-ids.json', JSON.stringify(results, null, 2), 'utf-8');

    const b = record.bestMatch;
    console.log(`  ✓ Shikimori: ${b.shikimori_id} (${b.shikimori_title}) | AniLibria: ${b.anilibria_id || '—'}`);

    await sleep(150);
  }

  console.log('\n🎉 ГОТОВО! Все 44 тайтла проверены и сохранены в anime-ids.json');
}

main();
