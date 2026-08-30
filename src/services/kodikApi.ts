/**
 * Kodik API Client & Player URL Generator
 * Based on official Kodik API specifications (YaNesyTortiK/AnimeParsers)
 */

import { getShikimoriId } from '../data/animeIds';

export interface KodikTranslation {
  id: number;
  title: string;
  type: 'voice' | 'subtitles';
}

export interface KodikMaterialData {
  title?: string;
  anime_title?: string;
  title_en?: string;
  other_titles?: string[];
  anime_kind?: string;
  all_status?: string;
  anime_status?: string;
  year?: number;
  poster_url?: string;
  shikimori_rating?: number;
  shikimori_votes?: number;
  anime_genres?: string[];
  anime_studios?: string[];
  description?: string;
  episodes_total?: number;
  episodes_aired?: number;
  duration?: number;
  age_rating?: string;
  screenshots?: string[];
}

export interface KodikSearchResult {
  id: string;
  type: 'anime' | 'anime-serial' | 'video';
  link: string;
  title: string;
  title_orig?: string;
  other_title?: string;
  translation: KodikTranslation;
  year?: number;
  last_season?: number;
  last_episode?: number;
  episodes_count?: number;
  shikimori_id?: string;
  kinopoisk_id?: string;
  imdb_id?: string;
  screenshots?: string[];
  seasons?: Record<string, {
    link: string;
    episodes: Record<string, string>;
  }>;
  material_data?: KodikMaterialData;
}

export interface KodikApiResponse {
  time: string;
  total: number;
  prev_page?: string | null;
  next_page?: string | null;
  results: KodikSearchResult[];
}

export interface KodikPlayerOptions {
  domain?: string;
  shikimoriId?: number | string | null;
  title?: string;
  englishTitle?: string;
  poster?: string;
  episode?: number;
  season?: number;
  translationId?: number;
  onlyEpisode?: boolean;
  hideSelectors?: boolean;
}

// Default working domains for Kodik and Multi-CDN embeds
export const KODIK_DOMAINS = [
  { id: 'kinobox', name: 'Kinobox Multi-CDN (Рекомендуется)', desc: 'Автоподбор плеера: Kodik, Alloha, Collaps, HDRezka' },
  { id: 'kodik.cc', name: 'Kodik CC (Поиск по базе)', desc: 'Официальное зеркало Kodik с выбором озвучки' },
  { id: 'kodikplayer.com', name: 'Kodik Player', desc: 'Прямой плеер Kodik' },
  { id: 'vidsrc.to', name: 'VidSrc HD (Sub/Eng)', desc: 'Международный HD сервер (Sub / Eng / Multi)' },
  { id: 'aniqit.com', name: 'Aniqit CDN', desc: 'Официальный CDN-сервер Kodik' },
  { id: 'vidsrc.me', name: 'VidSrc Me', desc: 'Дополнительное зеркало' }
];

/**
 * Builds the player embed URL based on Kodik API specifications.
 * Supports direct Shikimori ID mapping and parameter passing.
 */
export function getKodikPlayerEmbedUrl(options: KodikPlayerOptions): string {
  const domain = options.domain || 'kinobox';
  const episode = options.episode || 1;
  const season = options.season || 1;

  // Resolve Shikimori ID
  let shikimoriId = options.shikimoriId;
  if (!shikimoriId && options.title) {
    shikimoriId = getShikimoriId(options.title, options.englishTitle, options.poster);
  }

  // Fallback if shikimoriId is still not found
  if (!shikimoriId) {
    shikimoriId = 1535; // Default fallback (Death Note)
  }

  // If using Kinobox web player iframe
  if (domain === 'kinobox') {
    return `https://kinobox.tv/embed/#${shikimoriId}`;
  }

  // If using VidSrc international player
  if (domain.includes('vidsrc')) {
    return `https://${domain}/embed/anime/shikimori/${shikimoriId}/${episode}`;
  }

  // Kodik find-player API specification
  const params = new URLSearchParams();
  // Pass both shikimori_id and shikimoriID for compatibility
  params.set('shikimori_id', String(shikimoriId));
  params.set('shikimoriID', String(shikimoriId));
  
  if (options.title) {
    params.set('title', options.title);
  }
  if (options.englishTitle) {
    params.set('title_orig', options.englishTitle);
  }

  if (options.episode) {
    params.set('episode', String(episode));
  }
  if (options.season) {
    params.set('season', String(season));
  }

  if (options.translationId) {
    params.set('translation_id', String(options.translationId));
  }

  return `https://${domain}/find-player?${params.toString()}`;
}

/**
 * Popular Kodik translation IDs based on Kodik API specs
 */
export const POPULAR_KODIK_TRANSLATIONS: KodikTranslation[] = [
  { id: 612, title: 'AniLibria (Официальная HD)', type: 'voice' },
  { id: 610, title: 'Студийная Банда (Studio Band)', type: 'voice' },
  { id: 609, title: 'AniDUB', type: 'voice' },
  { id: 643, title: 'DreamCast', type: 'voice' },
  { id: 615, title: 'SHIZA Project', type: 'voice' },
  { id: 617, title: 'Reanimedia', type: 'voice' },
  { id: 622, title: 'AniStar', type: 'voice' },
  { id: 624, title: 'Persona99', type: 'voice' },
  { id: 1845, title: 'Дубляж (DEEP / FlixBik)', type: 'voice' },
  { id: 628, title: 'JAM CLUB', type: 'voice' },
  { id: 620, title: 'Kansai Studio', type: 'voice' },
  { id: 1, title: 'Оригинал (Японский) + Русские Субтитры', type: 'subtitles' },
];

/**
 * Fetch available translations for anime from Kodik API via backend proxy
 */
export async function getAvailableTranslations(
  shikimoriId?: number | string | null,
  title?: string
): Promise<Array<KodikTranslation & { isHlsNative?: boolean }>> {
  const result: Array<KodikTranslation & { isHlsNative?: boolean }> = [
    { id: 612, title: 'AniLibria (Официальная HD)', type: 'voice', isHlsNative: true }
  ];

  try {
    const params = new URLSearchParams();
    if (shikimoriId) params.set('shikimori_id', String(shikimoriId));
    if (title) params.set('title', title);

    const res = await fetch(`/api/kodik/search?${params.toString()}`);
    if (res.ok) {
      const data: KodikApiResponse = await res.json();
      if (data.results && data.results.length > 0) {
        const seenIds = new Set<number>([612]);
        
        for (const item of data.results) {
          if (item.translation && !seenIds.has(item.translation.id)) {
            seenIds.add(item.translation.id);
            result.push({
              id: item.translation.id,
              title: item.translation.title,
              type: item.translation.type,
              isHlsNative: false
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load dynamic Kodik translations, using fallback:', err);
  }

  // If only AniLibria in list, append popular translations as reliable options
  if (result.length <= 1) {
    for (const trans of POPULAR_KODIK_TRANSLATIONS) {
      if (trans.id !== 612) {
        result.push({ ...trans, isHlsNative: false });
      }
    }
  }

  return result;
}

