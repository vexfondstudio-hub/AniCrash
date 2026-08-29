import { Anime, Episode } from '../types';

function cleanHlsUrl(url?: string | null): string {
  if (!url) return '';
  return url
    .replace(/isWithVideoAds=1/g, 'isWithVideoAds=0')
    .replace(/isWithVideoAdsAlways=1/g, 'isWithVideoAdsAlways=0');
}

export function parseAniLibriaRelease(d: any): Anime {
  const rid = d.id;
  const rawEps = d.episodes || [];
  const posterPath = d.poster?.optimized?.src || d.poster?.src || '';
  const posterUrl = posterPath ? `https://anilibria.top${posterPath}` : '';

  const eps: Episode[] = rawEps.map((ep: any, i: number) => {
    const thumbPath = ep.preview?.optimized?.src || ep.preview?.src || '';
    const thumbUrl = thumbPath ? `https://anilibria.top${thumbPath}` : posterUrl;
    const hls1080 = cleanHlsUrl(ep.hls_1080);
    const hls720 = cleanHlsUrl(ep.hls_720);
    const hls480 = cleanHlsUrl(ep.hls_480);
    const defUrl = hls720 || hls1080 || hls480;
    const op = ep.opening || {};
    const opStart = op.start || 85;
    const opStop = op.stop || 175;
    const ordNum = ep.sort_order || ep.ordinal || (i + 1);

    return {
      id: `${rid}-ep-${ordNum}`,
      number: ordNum,
      title: ep.name || `Серия ${ordNum}`,
      duration: ep.duration || 1440,
      videoUrl: defUrl,
      hls_1080: hls1080,
      hls_720: hls720,
      hls_480: hls480,
      thumbnail: thumbUrl,
      introStart: opStart,
      introEnd: opStop,
    };
  });

  const genres = (d.genres || []).map((g: any) => g.name).filter(Boolean);
  const avgDur = d.average_duration_of_episode || 24;

  return {
    id: String(rid),
    title: d.name?.main || '',
    englishTitle: d.name?.english || d.name?.main || '',
    originalTitle: d.name?.alternative || d.alias || '',
    slug: d.alias || String(rid),
    description: d.description || '',
    poster: posterUrl,
    banner: posterUrl,
    rating: Number((Math.min(9.9, Math.max(8.0, 8.2 + ((d.added_in_users_favorites || 0) % 17) * 0.1))).toFixed(1)),
    votesCount: d.added_in_users_favorites || 1500,
    year: d.year || 2024,
    season: d.season?.description || 'Сезон',
    type: (d.type?.description as any) || 'TV Сериал',
    status: d.is_ongoing ? 'Онгоинг' : 'Завершён',
    genres: genres.length ? genres : ['Аниме'],
    episodesCount: d.episodes_total || eps.length || 1,
    currentEpisodes: eps.length,
    durationPerEp: `${avgDur} мин.`,
    studio: 'AniLibria',
    ageRating: d.age_rating?.label || '16+',
    voiceovers: ['AniLibria (Официальная)'],
    episodes: eps,
    characters: [],
    tags: [...genres, 'AniLibria', 'HD 1080p'],
    trendingRank: 10,
  };
}

export async function searchOnlineAnime(query: string): Promise<Anime[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`https://anilibria.top/api/v1/app/search/releases?query=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];

    // Fetch top 5 releases with episodes
    const fullPromises = list.slice(0, 5).map(async (item: any) => {
      try {
        const detailRes = await fetch(`https://anilibria.top/api/v1/anime/releases/${item.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          return parseAniLibriaRelease(detail);
        }
      } catch (err) {
        console.error('Error fetching release detail:', err);
      }
      return parseAniLibriaRelease(item);
    });

    return await Promise.all(fullPromises);
  } catch (e) {
    console.error('Search online anime failed:', e);
    return [];
  }
}
