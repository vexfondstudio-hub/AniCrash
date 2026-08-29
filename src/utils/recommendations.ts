import { Anime, RecommendationResult, WatchProgress, FavoriteEntry } from '../types';
import { ANIME_DATABASE } from '../data/animeData';

export function getRecommendations(
  watchHistory: WatchProgress[],
  favorites: FavoriteEntry[]
): RecommendationResult[] {
  // If user has no history and no favorites, return top rated and trending titles
  const interactedIds = new Set<string>();
  watchHistory.forEach(h => interactedIds.add(h.animeId));
  favorites.forEach(f => interactedIds.add(f.animeId));

  if (interactedIds.size === 0) {
    // Return curated recommendations
    return ANIME_DATABASE.slice(0, 6).map(anime => ({
      anime,
      matchScore: Math.round(anime.rating * 10),
      matchedGenres: anime.genres.slice(0, 3),
      reason: 'Рекомендация редакции AniCrash на основе рейтинга',
    }));
  }

  // Calculate genre weights based on interacted titles
  const genreWeights: Record<string, number> = {};
  const studioWeights: Record<string, number> = {};
  const tagWeights: Record<string, number> = {};

  const interactedAnimeList = ANIME_DATABASE.filter(a => interactedIds.has(a.id));

  interactedAnimeList.forEach(anime => {
    // Increase weight if completed or favorited
    const isFav = favorites.some(f => f.animeId === anime.id);
    const progress = watchHistory.find(w => w.animeId === anime.id);
    const multiplier = isFav ? 2.5 : (progress?.completed ? 2.0 : 1.5);

    anime.genres.forEach(genre => {
      genreWeights[genre] = (genreWeights[genre] || 0) + multiplier;
    });

    studioWeights[anime.studio] = (studioWeights[anime.studio] || 0) + multiplier;

    anime.tags.forEach(tag => {
      tagWeights[tag] = (tagWeights[tag] || 0) + multiplier;
    });
  });

  // Score candidate anime (excluding already completed titles if any, or ranking highest affinity)
  const candidateScores: { anime: Anime; score: number; matchedGenres: string[]; basisAnime?: Anime }[] = [];

  const candidates = ANIME_DATABASE.filter(a => {
    // Don't recommend titles the user already completed
    const progress = watchHistory.find(w => w.animeId === a.id);
    return !(progress && progress.completed);
  });

  candidates.forEach(candidate => {
    let rawScore = 0;
    const matchedGenres: string[] = [];

    // Genre overlap
    candidate.genres.forEach(genre => {
      if (genreWeights[genre]) {
        rawScore += genreWeights[genre] * 12;
        matchedGenres.push(genre);
      }
    });

    // Studio match
    if (studioWeights[candidate.studio]) {
      rawScore += studioWeights[candidate.studio] * 8;
    }

    // Tag overlap
    candidate.tags.forEach(tag => {
      if (tagWeights[tag]) {
        rawScore += tagWeights[tag] * 5;
      }
    });

    // Base quality score from rating
    rawScore += candidate.rating * 4;

    // Find the closest interacted anime that caused this recommendation
    let bestBasisAnime: Anime | undefined;
    let maxOverlap = 0;

    interactedAnimeList.forEach(source => {
      if (source.id === candidate.id) return;
      const commonGenres = source.genres.filter(g => candidate.genres.includes(g)).length;
      if (commonGenres > maxOverlap) {
        maxOverlap = commonGenres;
        bestBasisAnime = source;
      }
    });

    candidateScores.push({
      anime: candidate,
      score: rawScore,
      matchedGenres,
      basisAnime: bestBasisAnime,
    });
  });

  // Sort by score descending
  candidateScores.sort((a, b) => b.score - a.score);

  // Normalize scores to percentage (82% - 99%)
  const maxScore = candidateScores[0]?.score || 100;

  return candidateScores.slice(0, 8).map(item => {
    const normalized = Math.min(99, Math.max(78, Math.round((item.score / maxScore) * 20 + 79)));
    const reasonText = item.basisAnime
      ? `Потому что вы смотрели «${item.basisAnime.title}»`
      : item.matchedGenres.length > 0
      ? `На основе ваших любимых жанров (${item.matchedGenres.slice(0, 2).join(', ')})`
      : 'Высокий рейтинг зрителей AniCrash';

    return {
      anime: item.anime,
      matchScore: normalized,
      matchedGenres: item.matchedGenres.length > 0 ? item.matchedGenres : item.anime.genres.slice(0, 2),
      reason: reasonText,
      basisAnimeTitle: item.basisAnime?.title,
    };
  });
}
