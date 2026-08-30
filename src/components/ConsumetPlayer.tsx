import React, { useEffect, useState } from 'react';
import { Anime, Episode } from '../types';
import { fetchConsumetAnimeSearch, fetchConsumetAnimeInfo, fetchConsumetEpisodeSources } from '../services/animeApi';
import { Loader2, AlertCircle, RefreshCw, Play } from 'lucide-react';
import Hls from 'hls.js';

interface ConsumetPlayerProps {
  anime: Anime;
  currentEpisode: Episode;
  onEpisodeChange?: (episode: Episode) => void;
  onSwitchMirror?: (domain: string) => void;
  onSwitchPlayerMode?: (mode: 'hls' | 'mirror') => void;
}

export const ConsumetPlayer: React.FC<ConsumetPlayerProps> = ({
  anime,
  currentEpisode,
  onSwitchMirror,
  onSwitchPlayerMode,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [sources, setSources] = useState<any[]>([]);
  const [activeSource, setActiveSource] = useState<string>('');
  const [status, setStatus] = useState<string>('Инициализация...');
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const isMostlyLatin = (str: string) => {
      if (!str) return false;
      const latinCount = (str.match(/[a-zA-Z0-9]/g) || []).length;
      const totalCount = str.replace(/\s/g, '').length;
      if (totalCount === 0) return false;
      return (latinCount / totalCount) > 0.7;
    };

    const loadStream = async () => {
      setIsLoading(true);
      setHasError(false);
      setStatus('Поиск аниме в глобальной базе...');

      try {
        // 1. Gather all potential search terms
        const searchTerms: string[] = [];
        
        if (anime.englishTitle) {
          searchTerms.push(anime.englishTitle);
          
          // Clean English Title (remove season descriptors, TV specifiers, movie specifiers)
          const cleaned = anime.englishTitle
            .replace(/:\s*season\s*\d+/i, '')
            .replace(/season\s*\d+/i, '')
            .replace(/\s*\(tv\)/i, '')
            .replace(/:\s*part\s*\d+/i, '')
            .replace(/:\s*movies?/i, '')
            .trim();
          if (cleaned && cleaned !== anime.englishTitle) {
            searchTerms.push(cleaned);
          }
        }
        
        if (anime.originalTitle && isMostlyLatin(anime.originalTitle)) {
          searchTerms.push(anime.originalTitle);
        }
        
        if (anime.title && isMostlyLatin(anime.title)) {
          searchTerms.push(anime.title);
        }

        // Deduplicate
        const uniqueTerms = Array.from(new Set(searchTerms.filter(Boolean)));
        if (uniqueTerms.length === 0) {
          throw new Error('No valid search terms generated for this title');
        }

        let searchResults: any[] = [];
        for (const term of uniqueTerms) {
          if (!isMounted) return;
          setStatus(`Поиск по названию "${term}"...`);
          try {
            const results = await fetchConsumetAnimeSearch(term);
            if (results && results.length > 0) {
              searchResults = results;
              break;
            }
          } catch (e) {
            console.warn(`Search for term "${term}" did not yield results:`, e);
          }
        }

        if (searchResults.length === 0) {
          throw new Error('No matching title found in the public index');
        }

        // Use first match
        const bestMatch = searchResults[0];
        setStatus(`Загрузка информации о сериях для: ${bestMatch.title}...`);

        // 2. Get info (episodes list)
        const info = await fetchConsumetAnimeInfo(bestMatch.id);
        if (!isMounted) return;

        if (!info || !info.episodes || info.episodes.length === 0) {
          throw new Error('No episodes found for this anime');
        }

        // 3. Find target episode
        const targetEp = info.episodes.find((e: any) => e.number === currentEpisode.number) || info.episodes[0];
        setStatus(`Получение потока для ${currentEpisode.number} серии...`);

        // 4. Get sources
        const sourceData = await fetchConsumetEpisodeSources(targetEp.id);
        if (!isMounted) return;

        if (!sourceData || !sourceData.sources || sourceData.sources.length === 0) {
          throw new Error('No video sources found for this episode');
        }

        setSources(sourceData.sources);
        const defaultSource = sourceData.sources.find((s: any) => s.quality === 'default') || sourceData.sources[0];
        setActiveSource(defaultSource.url);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('Stream processing notice:', err?.message || err);
        if (isMounted) {
          // If fallback callback is present, perform seamless switch automatically
          if (onSwitchMirror && onSwitchPlayerMode) {
            console.log('Consumet failed, auto-switching to Kodik mirror...');
            onSwitchMirror('kodik.cc');
            onSwitchPlayerMode('mirror');
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }
      }
    };

    loadStream();
    return () => { isMounted = false; };
  }, [anime.id, currentEpisode.number]);

  useEffect(() => {
    if (activeSource && videoRef.current) {
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(activeSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            console.log('Autoplay prevented');
          });
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeSource;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
        });
      }
    }
  }, [activeSource]);

  return (
    <div className="w-full h-full relative bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {activeSource && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm text-white gap-4">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
          <div className="text-center">
            <p className="text-base font-bold text-white">Consumet Global API</p>
            <p className="text-xs text-zinc-400 mt-1">{status}</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white gap-5">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="w-7 h-7 text-rose-500" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold">Глобальный поток недоступен</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Не удалось загрузить видео-поток из базы Gogoanime (ошибка 451 или лимит запросов). Рекомендуем переключиться на российские зеркала с дубляжом.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
            <button
              onClick={() => {
                if (onSwitchMirror && onSwitchPlayerMode) {
                  onSwitchMirror('kodik.cc');
                  onSwitchPlayerMode('mirror');
                }
              }}
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              🚀 Включить Kodik
            </button>
            <button
              onClick={() => {
                if (onSwitchMirror && onSwitchPlayerMode) {
                  onSwitchMirror('kinobox');
                  onSwitchPlayerMode('mirror');
                }
              }}
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              🎬 Включить Kinobox
            </button>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Обновить попытку</span>
          </button>
        </div>
      )}

      {/* Source Selector if multiple sources exist */}
      {!isLoading && !hasError && sources.length > 1 && (
        <div className="absolute bottom-16 left-0 right-0 z-30 flex justify-center p-2">
          <div className="flex gap-2 p-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
            {sources.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSource(s.url)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeSource === s.url ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {s.quality}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
