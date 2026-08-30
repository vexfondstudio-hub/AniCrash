import React, { useEffect, useState } from 'react';
import { Anime, Episode } from '../types';
import { fetchConsumetAnimeSearch, fetchConsumetAnimeInfo, fetchConsumetEpisodeSources } from '../services/animeApi';
import { Loader2, AlertCircle, RefreshCw, Play } from 'lucide-react';
import Hls from 'hls.js';

interface ConsumetPlayerProps {
  anime: Anime;
  currentEpisode: Episode;
  onEpisodeChange?: (episode: Episode) => void;
}

export const ConsumetPlayer: React.FC<ConsumetPlayerProps> = ({
  anime,
  currentEpisode,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [sources, setSources] = useState<any[]>([]);
  const [activeSource, setActiveSource] = useState<string>('');
  const [status, setStatus] = useState<string>('Инициализация...');
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStream = async () => {
      setIsLoading(true);
      setHasError(false);
      setStatus('Поиск аниме в глобальной базе...');

      try {
        // 1. Search for anime
        const searchResults = await fetchConsumetAnimeSearch(anime.englishTitle || anime.title);
        if (!isMounted) return;
        
        if (searchResults.length === 0) {
          throw new Error('Anime not found in Consumet database');
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
      } catch (err) {
        console.error('Consumet player error:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Источник недоступен</h3>
            <p className="text-sm text-zinc-400 max-w-md mt-1">
              Не удалось найти работающий поток в глобальной базе Gogoanime. Попробуйте другой плеер (Kinobox или Kodik).
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
          >
            <RefreshCw className="w-4 h-4" />
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
