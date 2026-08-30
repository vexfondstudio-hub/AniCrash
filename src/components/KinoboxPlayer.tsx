import React, { useEffect, useRef, useState } from 'react';
import { Anime, Episode } from '../types';
import { getShikimoriId } from '../data/animeIds';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface KinoboxPlayerProps {
  anime: Anime;
  currentEpisode: Episode;
  onEpisodeChange?: (episode: Episode) => void;
}

declare global {
  interface Window {
    kbox?: (element: string | HTMLElement, options: any) => void;
  }
}

export const KinoboxPlayer: React.FC<KinoboxPlayerProps> = ({
  anime,
  currentEpisode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [initKey, setInitKey] = useState<number>(0);

  const shikimoriId = getShikimoriId(anime.title, anime.englishTitle, anime.poster) || 
    (anime.id && /^\d+$/.test(anime.id) ? parseInt(anime.id, 10) : 1535);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    const initKinobox = () => {
      if (!containerRef.current || !isMounted) return;

      try {
        if (typeof window.kbox === 'function') {
          // Clear previous contents
          containerRef.current.innerHTML = '';

          window.kbox(containerRef.current, {
            search: {
              shikimori: String(shikimoriId),
              title: anime.title,
            },
            menu: {
              default: 'menuList',
              format: '{source} ({translation})',
              limit: 12,
            },
            players: {
              Kodik: { enable: true, position: 1 },
              Collaps: { enable: true, position: 2 },
              Alloha: { enable: true, position: 3 },
              HDRezka: { enable: true, position: 4 },
              Voidboost: { enable: true, position: 5 },
            },
            params: {
              all: {
                episode: currentEpisode?.number || 1,
              }
            }
          });

          setIsLoading(false);
        } else {
          // Try loading script if not present
          const existingScript = document.querySelector('script[src*="kinobox.min.js"]');
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://kinobox.tv/kinobox.min.js';
            script.async = true;
            script.onload = () => {
              if (isMounted) initKinobox();
            };
            script.onerror = () => {
              if (isMounted) {
                setIsLoading(false);
                setHasError(true);
              }
            };
            document.body.appendChild(script);
          } else {
            // Script tag exists, wait for load
            setTimeout(() => {
              if (isMounted) {
                if (typeof window.kbox === 'function') {
                  initKinobox();
                } else {
                  setIsLoading(false);
                  setHasError(true);
                }
              }
            }, 1000);
          }
        }
      } catch (e) {
        console.error('Kinobox init error:', e);
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    };

    const timer = setTimeout(initKinobox, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [anime.id, anime.title, shikimoriId, initKey]);

  return (
    <div className="w-full h-full relative bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Kinobox target DOM element */}
      <div 
        ref={containerRef} 
        id="kinobox-player-container"
        className="w-full h-full min-h-[400px] relative z-10 kinobox_player"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm text-white gap-3">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="text-sm font-medium text-zinc-300">Поиск доступных озвучек и серий (Kodik, Alloha, Collaps)...</p>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white gap-3">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <h3 className="text-base font-bold">Не удалось загрузить плеер Kinobox</h3>
          <p className="text-xs text-zinc-400 max-w-md">
            Переключите сервер зеркала сверху (на Kodik CC, VidSrc или HLS) или обновите попытку.
          </p>
          <button
            onClick={() => setInitKey(prev => prev + 1)}
            className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Попробовать снова</span>
          </button>
        </div>
      )}
    </div>
  );
};
