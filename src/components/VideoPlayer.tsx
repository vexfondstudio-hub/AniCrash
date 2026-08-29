import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FastForward,
  SkipForward,
  Settings2,
  BadgeCheck,
  Check,
  CheckCheck,
  ArrowLeft,
  Tv,
  ListVideo,
  Info,
  Loader2,
  Radio,
} from 'lucide-react';
import { Anime, Episode, WatchProgress } from '../types';
import { ensureAnimeEpisodes } from '../services/animeApi';

interface VideoPlayerProps {
  anime: Anime;
  initialEpisodeNumber?: number;
  initialTime?: number;
  onClose: () => void;
  onProgressUpdate: (progress: WatchProgress) => void;
  voiceovers?: string[];
  onStartWatchParty?: (anime: Anime, episodeNum: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  anime,
  initialEpisodeNumber = 1,
  initialTime = 0,
  onClose,
  onProgressUpdate,
  onStartWatchParty,
}) => {
  // --- 1. ALL STATE HOOKS ---
  const [currentAnime, setCurrentAnime] = useState<Anime>(anime);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [duration, setDuration] = useState<number>(1440);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('720p HD');
  const [selectedVoiceover, setSelectedVoiceover] = useState<string>(anime.voiceovers[0] || 'AniLibria');
  const [playerMode, setPlayerMode] = useState<'hls' | 'mirror'>('mirror');
  const [activeMirrorDomain, setActiveMirrorDomain] = useState<string>('kodik.biz');
  const [streamError, setStreamError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState<boolean>(false);
  const [autoNextEpisode, setAutoNextEpisode] = useState<boolean>(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [showNextCountdown, setShowNextCountdown] = useState<number | null>(null);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(100);

  // --- 2. ALL REF HOOKS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeRef = useRef<number>(initialTime);
  const lastReportedTimeRef = useRef<number>(initialTime);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const activeEpisodeRef = useRef<HTMLButtonElement>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  onProgressUpdateRef.current = onProgressUpdate;

  // --- 3. MEMOIZED DATA ---
  const allEpisodes = React.useMemo(() => {
    const eps = [...(currentAnime.episodes || [])];
    if (eps.length < currentAnime.episodesCount) {
      const existingNumbers = new Set(eps.map(e => e.number));
      for (let i = 1; i <= currentAnime.episodesCount; i++) {
        if (!existingNumbers.has(i)) {
          eps.push({
            id: `${currentAnime.id}-ep-${i}`,
            number: i,
            title: `Серия ${i}`,
            duration: 1440,
            videoUrl: currentAnime.episodes[0]?.videoUrl || '',
            thumbnail: currentAnime.episodes[0]?.thumbnail || currentAnime.poster,
            hls_1080: currentAnime.episodes[0]?.hls_1080,
            hls_720: currentAnime.episodes[0]?.hls_720,
            hls_480: currentAnime.episodes[0]?.hls_480,
          });
        }
      }
    }
    return eps.sort((a, b) => a.number - b.number);
  }, [currentAnime]);

  // Sync initial episode index when allEpisodes updates
  useEffect(() => {
    const idx = allEpisodes.findIndex((e) => e.number === initialEpisodeNumber);
    if (idx !== -1) {
      setCurrentEpisodeIndex(idx);
    }
  }, [allEpisodes, initialEpisodeNumber]);

  const currentEpisode: Episode = allEpisodes[currentEpisodeIndex] || allEpisodes[0];

  // Sync anime prop
  useEffect(() => {
    let active = true;
    setCurrentAnime(anime);
    ensureAnimeEpisodes(anime).then((resolved) => {
      if (active && resolved) {
        setCurrentAnime(resolved);
      }
    });
    return () => {
      active = false;
    };
  }, [anime]);

  // Auto-fullscreen and landscape orientation on mobile mount
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        const screenOrientation = (window.screen.orientation as any);
        if (window.screen && screenOrientation && screenOrientation.lock) {
          screenOrientation.lock('landscape').catch(() => {});
        }
      }).catch((e) => console.log('Auto-fullscreen error:', e));
    }
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const showFeedback = (text: string) => {
    setFeedbackNotice(text);
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 1400);
  };

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      // In mirror mode we don't know the exact play state, so always auto-hide
      if (isPlaying || playerMode === 'mirror') {
        setShowControls(false);
        setShowSettingsMenu(false);
      }
    }, 3500);
  }, [isPlaying, playerMode]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        showFeedback('Воспроизведение');
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      showFeedback('Пауза');
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || duration || 1440;
    const newTime = Math.max(0, Math.min(dur, video.currentTime + delta));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    savedTimeRef.current = newTime;
    showFeedback(`${delta > 0 ? '+' : ''}${delta} сек`);
  }, [duration]);

  const handleSkipIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const skipTarget = currentEpisode.introEnd || video.currentTime + 85;
    video.currentTime = skipTarget;
    setCurrentTime(skipTarget);
    savedTimeRef.current = skipTarget;
    showFeedback('Опенинг пропущен (+85с)');
  }, [currentEpisode]);

  const goToNextEpisode = useCallback(() => {
    if (currentEpisodeIndex < allEpisodes.length - 1) {
      savedTimeRef.current = 0;
      setCurrentEpisodeIndex((prev) => prev + 1);
      setCurrentTime(0);
      setShowNextCountdown(null);
      showFeedback(`Серия ${currentEpisodeIndex + 2}: Без рекламы`);
    } else {
      showFeedback('Это последняя серия сезона!');
    }
  }, [allEpisodes.length, currentEpisodeIndex]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
          try {
            await (window.screen.orientation as any).lock('landscape');
          } catch (e) {
            console.log('Orientation lock error:', e);
          }
        }
      } catch (e) {
        console.log('Fullscreen error:', e);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
        if (window.screen && window.screen.orientation && (window.screen.orientation as any).unlock) {
          (window.screen.orientation as any).unlock();
        }
      } catch (e) {
        console.log('Exit fullscreen error:', e);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    showFeedback(!isMuted ? 'Звук выключен' : `Звук ${Math.round(volume * 100)}%`);
  }, [isMuted, volume]);

  const getActiveStreamUrl = useCallback(() => {
    if (!currentEpisode) return '';
    if (selectedQuality.startsWith('1080')) {
      return currentEpisode.hls_1080 || currentEpisode.hls_720 || currentEpisode.videoUrl;
    }
    if (selectedQuality.startsWith('720')) {
      return currentEpisode.hls_720 || currentEpisode.videoUrl || currentEpisode.hls_1080;
    }
    if (selectedQuality.startsWith('480')) {
      return currentEpisode.hls_480 || currentEpisode.hls_720 || currentEpisode.videoUrl;
    }
    return currentEpisode.videoUrl;
  }, [currentEpisode, selectedQuality, selectedVoiceover]);

  const handleQualityChange = (q: string) => {
    setSelectedQuality(q);
    if (videoRef.current) {
      savedTimeRef.current = videoRef.current.currentTime;
    }
    showFeedback(`Качество: ${q}`);
  };

  useEffect(() => {
    if (showEpisodesDrawer && activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showEpisodesDrawer]);

  const handleSelectEpisode = (idx: number) => {
    savedTimeRef.current = 0;
    setCurrentEpisodeIndex(idx);
    setCurrentTime(0);
    setShowEpisodesDrawer(false);
    showFeedback(`Включена серия ${allEpisodes[idx]?.number || idx + 1}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(1, v + 0.1);
            if (videoRef.current) {
              videoRef.current.volume = nv;
              videoRef.current.muted = false;
              setIsMuted(false);
            }
            showFeedback(`Громкость ${Math.round(nv * 100)}%`);
            return nv;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.max(0, v - 0.1);
            if (videoRef.current) {
              videoRef.current.volume = nv;
            }
            showFeedback(`Громкость ${Math.round(nv * 100)}%`);
            return nv;
          });
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          goToNextEpisode();
          break;
        case 'KeyS':
          e.preventDefault();
          handleSkipIntro();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekBy, toggleFullscreen, toggleMute, goToNextEpisode, handleSkipIntro, isFullscreen, onClose]);

  // Stream loading with HLS.js
  useEffect(() => {
    if (playerMode === 'mirror') {
      setIsLoading(false);
      setStreamError(false);
      return;
    }

    const video = videoRef.current;
    if (!video || !currentEpisode) return;

    const streamUrl = getActiveStreamUrl();
    if (!streamUrl) {
      setPlayerMode('mirror');
      setStreamError(false);
      setIsLoading(false);
      return;
    }

    setStreamError(false);
    setIsLoading(true);

    let loadTimeout: NodeJS.Timeout | null = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setStreamError(true);
      }
    }, 7000);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const restoreTime = savedTimeRef.current;
    const applyRestoreTime = () => {
      if (restoreTime > 0) {
        try {
          video.currentTime = restoreTime;
        } catch (e) {}
      }
    };

    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (loadTimeout) clearTimeout(loadTimeout);
        setIsLoading(false);
        setStreamError(false);
        applyRestoreTime();
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (loadTimeout) clearTimeout(loadTimeout);
              setIsLoading(false);
              setStreamError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Native HLS (Safari/iOS) or MP4 fallback
      video.src = streamUrl;
      const onLoaded = () => {
        if (loadTimeout) clearTimeout(loadTimeout);
        setIsLoading(false);
        setStreamError(false);
        applyRestoreTime();
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      };
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
    }

    return () => {
      if (loadTimeout) clearTimeout(loadTimeout);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpisode.id, selectedQuality, getActiveStreamUrl, playerMode]);

  // Video playback listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.playbackRate = playbackSpeed;

    const onLoadedMetadata = () => {
      setDuration(video.duration || currentEpisode.duration || 1440);
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      savedTimeRef.current = video.currentTime;

      // Auto skip intro if enabled
      if (
        autoSkipIntro &&
        currentEpisode.introStart &&
        currentEpisode.introEnd &&
        video.currentTime >= currentEpisode.introStart &&
        video.currentTime <= currentEpisode.introStart + 2
      ) {
        video.currentTime = currentEpisode.introEnd;
        showFeedback('Опенинг автоматически пропущен');
      }

      // Countdown for auto next episode near end
      if (video.duration && video.duration - video.currentTime <= 10 && currentEpisodeIndex < allEpisodes.length - 1) {
        if (autoNextEpisode && showNextCountdown === null) {
          setShowNextCountdown(Math.ceil(video.duration - video.currentTime));
        }
      }

      // Save watch progress periodically (every 3+ seconds)
      const cur = Math.floor(video.currentTime);
      if (Math.abs(cur - lastReportedTimeRef.current) >= 3) {
        lastReportedTimeRef.current = cur;
        onProgressUpdateRef.current({
          animeId: anime.id,
          episodeNumber: currentEpisode.number,
          currentTime: video.currentTime,
          duration: video.duration || currentEpisode.duration,
          completed: video.currentTime > (video.duration || currentEpisode.duration) * 0.88,
          lastWatchedAt: Date.now(),
        });
      }
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      if (video) {
        onProgressUpdateRef.current({
          animeId: anime.id,
          episodeNumber: currentEpisode.number,
          currentTime: video.currentTime,
          duration: video.duration || currentEpisode.duration,
          completed: video.currentTime > (video.duration || currentEpisode.duration) * 0.88,
          lastWatchedAt: Date.now(),
        });
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (video) {
        onProgressUpdateRef.current({
          animeId: anime.id,
          episodeNumber: currentEpisode.number,
          currentTime: video.duration || currentEpisode.duration,
          duration: video.duration || currentEpisode.duration,
          completed: true,
          lastWatchedAt: Date.now(),
        });
      }
      if (autoNextEpisode && currentEpisodeIndex < allEpisodes.length - 1) {
        goToNextEpisode();
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [currentEpisodeIndex, currentEpisode, autoNextEpisode, autoSkipIntro, anime.id, allEpisodes.length, goToNextEpisode, volume, playbackSpeed]);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = percent * (duration || 1440);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      savedTimeRef.current = targetTime;
    }
  };

  const handleTouchScrub = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.touches[0].clientX;
    const percent = Math.max(0, Math.min(1, (touchX - rect.left) / rect.width));
    const targetTime = percent * (duration || 1440);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      savedTimeRef.current = targetTime;
    }
  };

  const handleVideoTouchEnd = (e: React.TouchEvent<HTMLVideoElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const x = touch.clientX;
    const screenWidth = window.innerWidth;
    const isDoubleTap = now - lastTapRef.current.time < 320 && Math.abs(x - lastTapRef.current.x) < 70;

    if (isDoubleTap) {
      if (x < screenWidth * 0.38) {
        seekBy(-10);
        setDoubleTapSide('left');
        setTimeout(() => setDoubleTapSide(null), 600);
      } else if (x > screenWidth * 0.62) {
        seekBy(10);
        setDoubleTapSide('right');
        setTimeout(() => setDoubleTapSide(null), 600);
      } else {
        togglePlay();
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x };
      handleUserActivity();
    }
  };

  const handleScrubHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(percent * 100);
    setHoverTime(percent * (duration || 1440));
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    showFeedback(`Скорость ${speed}x`);
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      id="anicrash-player-container"
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Video / Mirror Player Rendering */}
      {playerMode === 'mirror' ? (
        <div className="w-full h-full relative bg-zinc-950">
          <iframe
            id="anicrash-mirror-iframe"
            src={activeMirrorDomain.includes('vidsrc') 
              ? `https://vidsrc.me/embed/anime/shikimori/${anime.id}/${currentEpisode.number}`
              : `https://${activeMirrorDomain}/find-player?shikimoriID=${anime.id}&title=${encodeURIComponent(anime.title)}&episode=${currentEpisode.number}`
            }
            className="w-full h-full border-0 relative z-10"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />

          {/* Mouse interceptor overlay for mirror mode when controls are hidden */}
          {!showControls && (
            <div 
              className="absolute inset-0 z-30" 
              onMouseMove={handleUserActivity}
              onClick={handleUserActivity}
            />
          )}

          {/* Sandbox Warning Overlay */}
          {window !== window.parent && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/80 backdrop-blur-sm text-white space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-2">
                <Tv className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold">Ограничения предпросмотра</h3>
                <p className="text-sm text-zinc-300">
                  Вы находитесь в режиме песочницы (sandbox). Сторонние плееры блокируют воспроизведение внутри таких окон.
                </p>
                <p className="text-xs text-zinc-400 font-medium">
                  Пожалуйста, откройте приложение в новой вкладке (кнопка ↗ в верхнем меню).
                </p>
              </div>
              <div className="pt-4">
                <a 
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  Открыть в новой вкладке ↗
                </a>
              </div>
            </div>
          )}

          {/* Mirror Domain Switcher (visible on hover/activity) */}
          <div className={`absolute top-20 left-0 right-0 z-40 flex justify-center transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-wrap justify-center items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-2xl pointer-events-auto shadow-2xl">
              <span className="text-xs text-zinc-400 font-medium px-2">Если не работает, смените сервер:</span>
              {[
                { id: 'kodik.cc', name: 'Kodik CC' },
                { id: 'kodik.biz', name: 'Kodik Biz' },
                { id: 'kodik.info', name: 'Kodik Info' },
                { id: 'aniqit.com', name: 'Aniqit CDN' },
                { id: 'vidsrc.me', name: 'VidSrc' }
              ].map(domain => (
                <button
                  key={domain.id}
                  onClick={() => {
                    setActiveMirrorDomain(domain.id);
                    showFeedback(`Выбран сервер ${domain.name}`);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeMirrorDomain === domain.id 
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {domain.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          id="anicrash-native-video"
          playsInline
          preload="auto"
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onTouchEnd={handleVideoTouchEnd}
        />
      )}

      {/* Stream Error / Missing Source Fallback Card */}
      {streamError && playerMode === 'hls' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Основной сервер недоступен</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Для аниме «{anime.title}» рекомендуется включить резервный плеер (Kodik Mirror).
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setPlayerMode('mirror');
                  setStreamError(false);
                  showFeedback('Включен резервный плеер');
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all shadow-lg shadow-rose-600/30 active:scale-98 cursor-pointer"
              >
                Включить Резервный Плеер (Kodik)
              </button>
              <button
                onClick={() => {
                  setStreamError(false);
                  setIsLoading(true);
                  // Retry loading
                  const v = videoRef.current;
                  if (v) v.load();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-all cursor-pointer"
              >
                Повторить загрузку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double Tap Visual Indicators for Mobile */}
      {doubleTapSide === 'left' && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white flex flex-col items-center gap-1 animate-fade-in pointer-events-none">
          <RotateCcw className="w-8 h-8 text-rose-500 animate-pulse" />
          <span className="text-xs font-mono font-bold">-10 сек</span>
        </div>
      )}
      {doubleTapSide === 'right' && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white flex flex-col items-center gap-1 animate-fade-in pointer-events-none">
          <RotateCw className="w-8 h-8 text-rose-500 animate-pulse" />
          <span className="text-xs font-mono font-bold">+10 сек</span>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="p-3 sm:p-4 rounded-2xl bg-zinc-950/80 backdrop-blur border border-zinc-800 flex items-center gap-2.5 sm:gap-3 shadow-2xl">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 animate-spin" />
            <span className="text-xs sm:text-sm font-medium text-zinc-200">Загрузка озвучки {selectedVoiceover}...</span>
          </div>
        </div>
      )}

      {/* Center Feedback Toast */}
      {feedbackNotice && (
        <div
          id="player-feedback-toast"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-zinc-900/90 text-white font-medium text-xs sm:text-sm backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-2 animate-fade-in"
        >
          <CheckCheck className="w-4 h-4 text-rose-400" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Auto-Next Episode Overlay Countdown */}
      {showNextCountdown !== null && showNextCountdown > 0 && (
        <div
          id="next-episode-countdown-pill"
          className="absolute bottom-20 sm:bottom-24 inset-x-4 sm:inset-x-auto sm:right-8 z-30 bg-zinc-900/95 border border-rose-500/40 backdrop-blur-lg rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between sm:justify-start gap-3 sm:gap-4 animate-slide-up max-w-md"
        >
          <div>
            <p className="text-[10px] sm:text-xs text-rose-400 font-semibold uppercase tracking-wider">Следующая серия</p>
            <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              Серия {currentEpisodeIndex + 2}: {allEpisodes[currentEpisodeIndex + 1]?.title || 'Без названия'}
            </p>
            <p className="text-[10px] sm:text-xs text-zinc-400">Мгновенный старт без рекламы</p>
          </div>
          <button
            onClick={goToNextEpisode}
            className="px-3 sm:px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer shrink-0"
          >
            <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Включить
          </button>
        </div>
      )}

      {/* Top Bar (Overlay) */}
      <div
        className={`absolute top-0 inset-x-0 z-20 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              id="player-back-btn"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white backdrop-blur border border-white/10 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Назад к аниме (Esc)"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  AniCrash
                </span>
                <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <BadgeCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span className="hidden xs:inline">0% рекламы</span>
                </span>
                <span className="text-xs text-zinc-400 font-medium hidden md:inline">
                  {selectedVoiceover}
                </span>
              </div>
              <h2 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 truncate">
                <span className="truncate">{anime.title}</span>
                <span className="text-zinc-400 font-normal text-xs sm:text-sm shrink-0">
                  • Серия {currentEpisode.number}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onStartWatchParty && (
              <button
                id="player-watch-party-btn"
                onClick={() => onStartWatchParty(anime, currentEpisode.number)}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white backdrop-blur border border-rose-500/40 transition-all text-xs md:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                title="Смотреть синхронно с друзьями в комнате"
              >
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="hidden sm:inline">С друзьями</span>
              </button>
            )}

            <button
              id="player-mode-toggle-btn"
              onClick={() => {
                const newMode = playerMode === 'hls' ? 'mirror' : 'hls';
                setPlayerMode(newMode);
                showFeedback(newMode === 'mirror' ? 'Включен резервный плеер' : 'Включен основной HLS');
              }}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl backdrop-blur border transition-all text-xs md:text-sm font-medium flex items-center gap-1.5 cursor-pointer ${
                playerMode === 'mirror'
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-white/10'
              }`}
              title="Переключить плеер (Основной / Резервный)"
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">{playerMode === 'mirror' ? 'Зеркало' : 'HLS Сервер'}</span>
            </button>

            <button
              id="player-episodes-toggle-btn"
              onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white backdrop-blur border border-white/10 transition-all text-xs md:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <ListVideo className="w-4 h-4 text-rose-400" />
              <span className="hidden xs:inline">Серии</span>
              <span>({currentEpisode.number}/{allEpisodes.length})</span>
            </button>

            <button
              id="player-info-hint-btn"
              onClick={() => showFeedback('Двойной тап: ±10с | Пробел: Пауза | F: Экран | M: Звук')}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur border border-white/10 transition-all cursor-pointer"
              title="Справка по управлению"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Big Center Play/Pause button when paused */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 backdrop-blur transition-all active:scale-95 group cursor-pointer"
        >
          <Play className="w-7 h-7 sm:w-9 sm:h-9 translate-x-0.5 fill-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Episode Selection Drawer */}
      {showEpisodesDrawer && (
        <div
          id="player-episodes-drawer"
          className="absolute inset-y-0 right-0 z-40 w-full sm:max-w-sm bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 p-4 sm:p-6 flex flex-col justify-between shadow-2xl animate-slide-left"
        >
          <div>
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-white text-base">Список серий</h3>
              </div>
              <button
                onClick={() => setShowEpisodesDrawer(false)}
                className="text-zinc-400 hover:text-white text-xs sm:text-sm px-2.5 py-1 rounded bg-zinc-900 cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2 overflow-y-auto max-h-[70vh] pr-1 scrollbar-none">
              {(() => {
                // Windowing optimization for 1000+ episodes
                const currentChunk = Math.floor(currentEpisodeIndex / 100);
                const startIdx = Math.max(0, currentChunk * 100 - 20);
                const endIdx = Math.min(allEpisodes.length, startIdx + visibleLimit);

                return (
                  <>
                    {startIdx > 0 && (
                      <div className="py-2 text-[10px] text-zinc-600 text-center uppercase tracking-widest font-bold">
                        ... {startIdx} предыдущих серий
                      </div>
                    )}
                    {allEpisodes.slice(startIdx, endIdx).map((ep, actualIdx) => {
                      const idx = startIdx + actualIdx;
                      const isActive = idx === currentEpisodeIndex;
                      return (
                        <button
                          key={ep.id}
                          ref={isActive ? activeEpisodeRef : null}
                          onClick={() => handleSelectEpisode(idx)}
                          className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all flex items-center gap-2.5 sm:gap-3 border cursor-pointer ${
                            isActive
                              ? 'bg-rose-500/15 border-rose-500/50 text-white'
                              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                              isActive ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {ep.number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-rose-400' : 'text-zinc-200'}`}>
                              {ep.title}
                            </p>
                            <p className="text-[10px] sm:text-xs text-zinc-500">{selectedVoiceover} • Без рекламы</p>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                        </button>
                      );
                    })}
                    {endIdx < allEpisodes.length && (
                      <button
                        onClick={() => setVisibleLimit(prev => prev + 100)}
                        className="w-full py-3 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest cursor-pointer"
                      >
                        Показать еще серии
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between pb-safe">
            <span>Качество: {selectedQuality}</span>
            <span className="text-emerald-400">100% без рекламы</span>
          </div>
        </div>
      )}

      {/* Settings Menu Popup */}
      {showSettingsMenu && (
        <div
          id="player-settings-popup"
          className="absolute bottom-20 sm:bottom-24 inset-x-3 sm:inset-x-auto sm:right-8 z-40 max-w-sm sm:w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl text-xs sm:text-sm text-zinc-200 space-y-3 sm:space-y-4 animate-fade-in mx-auto sm:mx-0"
        >
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
              Озвучка / Перевод
            </span>
            <div className="grid grid-cols-1 gap-1">
              {anime.voiceovers.map((voice) => (
                <button
                  key={voice}
                  onClick={() => {
                    setSelectedVoiceover(voice);
                    showFeedback(`Озвучка: ${voice}`);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition-all cursor-pointer ${
                    selectedVoiceover === voice
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {voice}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
              Качество видео
            </span>
            <div className="flex gap-1.5">
              {['1080p Ultra', '720p HD', '480p'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedQuality.includes(q.split(' ')[0])
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {q.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>Авто-следующая серия</span>
              <input
                type="checkbox"
                checked={autoNextEpisode}
                onChange={(e) => setAutoNextEpisode(e.target.checked)}
                className="accent-rose-600 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>Пропускать опенинг авто</span>
              <input
                type="checkbox"
                checked={autoSkipIntro}
                onChange={(e) => setAutoSkipIntro(e.target.checked)}
                className="accent-rose-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Skip Intro & Quick Next floating buttons */}
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <button
              id="player-skip-intro-btn"
              onClick={handleSkipIntro}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] sm:text-xs font-semibold backdrop-blur shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all active:scale-95 border border-rose-400/30 cursor-pointer"
            >
              <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Пропустить (+85с)</span>
            </button>
          </div>

          {currentEpisodeIndex < allEpisodes.length - 1 && (
            <button
              id="player-quick-next-btn"
              onClick={goToNextEpisode}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[10px] sm:text-xs font-semibold backdrop-blur border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>След. серия</span>
              <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        {/* Progress Bar (Scrub Bar with touch support) */}
        <div
          id="player-scrub-bar-container"
          onClick={handleScrub}
          onTouchStart={handleTouchScrub}
          onTouchMove={handleTouchScrub}
          onMouseMove={handleScrubHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-3 group cursor-pointer flex items-center py-2 touch-none"
        >
          {/* Track Background */}
          <div className="w-full h-1.5 bg-zinc-700/60 rounded-full overflow-hidden relative group-hover:h-2 transition-all">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-500 rounded-full relative"
              style={{ width: `${currentPercent}%` }}
            />
          </div>

          {/* Scrubber Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 rounded-full border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${currentPercent}% - 7px)` }}
          />

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 bg-zinc-900 text-white text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded shadow border border-zinc-700 pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mt-1 sm:mt-2 pt-1 text-zinc-300">
          {/* Left Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              id="player-play-toggle-btn"
              onClick={togglePlay}
              className="text-white hover:text-rose-400 transition-colors p-1 cursor-pointer"
              title="Воспроизведение / Пауза (Пробел)"
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button
              id="player-rewind-10-btn"
              onClick={() => seekBy(-10)}
              className="hover:text-white transition-colors p-1 flex items-center cursor-pointer"
              title="Перемотать на 10 сек назад (←)"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              id="player-forward-10-btn"
              onClick={() => seekBy(10)}
              className="hover:text-white transition-colors p-1 flex items-center cursor-pointer"
              title="Перемотать на 10 сек вперед (→)"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 sm:gap-2 group/vol">
              <button
                id="player-mute-btn"
                onClick={toggleMute}
                className="hover:text-white transition-colors p-1 cursor-pointer"
                title="Звук (M)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <input
                id="player-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const nv = parseFloat(e.target.value);
                  setVolume(nv);
                  if (videoRef.current) {
                    videoRef.current.volume = nv;
                    videoRef.current.muted = false;
                    setIsMuted(false);
                  }
                }}
                className="hidden sm:block w-16 md:w-20 h-1 accent-rose-500 bg-zinc-700 rounded-lg cursor-pointer transition-all"
              />
            </div>

            {/* Timestamps */}
            <div className="text-[10px] sm:text-xs font-mono text-zinc-400">
              <span className="text-white font-medium">{formatTime(currentTime)}</span>
              <span className="mx-0.5 sm:mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Speed pills (desktop) */}
            <div className="hidden md:flex items-center bg-zinc-900/90 rounded-lg p-0.5 border border-zinc-800 text-xs font-medium">
              {[0.75, 1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    playbackSpeed === speed ? 'bg-rose-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Settings trigger */}
            <button
              id="player-settings-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer"
              title="Настройки качества и озвучки"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Fullscreen */}
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer"
              title="Во весь экран (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
