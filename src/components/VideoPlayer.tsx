import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  FastForward,
  SkipForward,
  SkipBack,
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
  Zap,
  X,
  Camera,
  PictureInPicture,
  Sparkles,
  Moon,
  Sun,
  Sliders,
  HelpCircle,
  Timer,
  Search,
  Grid,
  List,
  Flame,
  Crop,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Anime, Episode, WatchProgress } from '../types';
import { ensureAnimeEpisodes, resolveAnimeEpisodeWithPython } from '../services/animeApi';
import { getShikimoriId } from '../data/animeIds';
import {
  getKodikPlayerEmbedUrl,
  KODIK_DOMAINS,
  getAvailableTranslations,
  KodikTranslation,
  POPULAR_KODIK_TRANSLATIONS,
} from '../services/kodikApi';
import { KinoboxPlayer } from './KinoboxPlayer';
import { ConsumetPlayer } from './ConsumetPlayer';

interface VideoPlayerProps {
  anime: Anime;
  initialEpisodeNumber?: number;
  initialTime?: number;
  onClose: () => void;
  onProgressUpdate: (progress: WatchProgress) => void;
  voiceovers?: string[];
  onStartWatchParty?: (anime: Anime, episodeNum: number) => void;
}

export type AspectRatioMode = 'contain' | 'cover' | 'fill' | 'cinema';
export type VideoFilterMode = 'none' | 'vibrant' | 'cinema' | 'night' | 'hdr';

const VIDEO_FILTER_CLASSES: Record<VideoFilterMode, string> = {
  none: '',
  vibrant: 'saturate-125 contrast-105',
  cinema: 'contrast-115 brightness-95',
  night: 'sepia-20 brightness-95 saturate-110',
  hdr: 'contrast-120 saturate-130 brightness-105',
};

const FILTER_LABELS: Record<VideoFilterMode, string> = {
  none: 'Стандарт',
  vibrant: 'Насыщенный (Аниме)',
  cinema: 'Кинотеатр OLED',
  night: 'Тёплый вечерний',
  hdr: 'Ultra HDR',
};

const ASPECT_LABELS: Record<AspectRatioMode, string> = {
  contain: '16:9 Стандарт',
  cover: 'Во весь экран (Zoom)',
  fill: 'Растянуть (Fill)',
  cinema: '21:9 Cinema Scope',
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  anime,
  initialEpisodeNumber = 1,
  initialTime = 0,
  onClose,
  onProgressUpdate,
  onStartWatchParty,
}) => {
  // --- 1. CORE PLAYER STATE ---
  const [currentAnime, setCurrentAnime] = useState<Anime>(anime);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [duration, setDuration] = useState<number>(1440);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioBoost, setAudioBoost] = useState<number>(100); // 100% to 200%
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p Ultra');
  const [selectedVoiceover, setSelectedVoiceover] = useState<string>(
    anime.voiceovers[0] || 'AniLibria (Официальная HD)'
  );
  const [selectedTranslationId, setSelectedTranslationId] = useState<number>(612);
  const [translationsList, setTranslationsList] = useState<Array<KodikTranslation & { isHlsNative?: boolean }>>([]);
  const [playerMode, setPlayerMode] = useState<'hls' | 'mirror'>(
    anime.id === '2001' || anime.id === '4565' ? 'mirror' : 'hls'
  );
  const [activeMirrorDomain, setActiveMirrorDomain] = useState<string>('kinobox');
  const [streamError, setStreamError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // --- 2. ADVANCED UI & CUSTOM PLAYER FEATURES ---
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showVoiceoverMenu, setShowVoiceoverMenu] = useState<boolean>(false);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showAudioBoosterMenu, setShowAudioBoosterMenu] = useState<boolean>(false);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState<boolean>(false);

  // Video Enhancements
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('contain');
  const [videoFilter, setVideoFilter] = useState<VideoFilterMode>('none');
  const [ambilightEnabled, setAmbilightEnabled] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(100); // 50% to 150%

  // Automation Settings
  const [autoNextEpisode, setAutoNextEpisode] = useState<boolean>(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState<boolean>(true);
  const [autoSkipOutro, setAutoSkipOutro] = useState<boolean>(true);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);

  // Interactive UI
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [showNextCountdown, setShowNextCountdown] = useState<number | null>(null);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const [gestureNotice, setGestureNotice] = useState<{ label: string; value: string } | null>(null);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState<string>('');
  const [episodeViewMode, setEpisodeViewMode] = useState<'list' | 'grid'>('list');
  const [visibleLimit, setVisibleLimit] = useState<number>(100);

  // Watched history progress map
  const [watchProgressMap, setWatchProgressMap] = useState<Record<number, number>>({});
  const [isPythonDownloading, setIsPythonDownloading] = useState<boolean>(false);
  const [pythonDownloadStatus, setPythonDownloadStatus] = useState<string | null>(null);

  const handlePythonDownloadAndWatch = async () => {
    setIsPythonDownloading(true);
    setPythonDownloadStatus(`🐍 Запуск Python: поиск серии ${currentEpisode.number}...`);
    try {
      const results = await resolveAnimeEpisodeWithPython(anime.title, currentEpisode.number);
      if (results && results.length > 0) {
        setPythonDownloadStatus(`📥 Найдено тайтл. Загрузка файла серии...`);
        const dlRes = await fetch(`/api/python-resolve?query=${encodeURIComponent(anime.title)}&episode=${currentEpisode.number}&download=1`);
        const dlData = await dlRes.json();
        if (dlData.success && dlData.results?.[0]?.downloaded_file) {
          setPythonDownloadStatus(`✅ Серия загружена: ${dlData.results[0].downloaded_file}`);
          showFeedback(`📁 Серия сохранена в локальный кеш`);
        } else {
          setPythonDownloadStatus(`⚠️ Поток успешно разрешен скриптом`);
          showFeedback(`Поток готов`);
        }
      } else {
        setPythonDownloadStatus(`❌ Аниме не найдено в локальной базе`);
        showFeedback(`Аниме не найдено`);
      }
    } catch (err) {
      setPythonDownloadStatus(`❌ Ошибка загрузки скриптом`);
      showFeedback(`Ошибка загрузки`);
    } finally {
      setTimeout(() => {
        setIsPythonDownloading(false);
        setPythonDownloadStatus(null);
      }, 3500);
    }
  };

  // --- 3. REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeRef = useRef<number>(initialTime);
  const lastReportedTimeRef = useRef<number>(initialTime);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const activeEpisodeRef = useRef<HTMLButtonElement>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const touchStartRef = useRef<{ x: number; y: number; val: number } | null>(null);

  // Web Audio API for 200% Gain Volume Booster
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  onProgressUpdateRef.current = onProgressUpdate;

  // Load watch progress map from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('anicrash_history_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map: Record<number, number> = {};
          parsed.forEach((item: any) => {
            if (item.animeId === anime.id && item.episodeNumber) {
              const dur = item.duration || 1440;
              const pct = Math.min(100, Math.round((item.currentTime / dur) * 100));
              map[item.episodeNumber] = pct;
            }
          });
          setWatchProgressMap(map);
        }
      }
    } catch (e) {
      console.warn('Failed to parse history for episode badges:', e);
    }
  }, [anime.id]);

  // --- 4. MEMOIZED EPISODES ---
  const allEpisodes = useMemo(() => {
    const eps = [...(currentAnime.episodes || [])];
    if (eps.length < currentAnime.episodesCount) {
      const existingNumbers = new Set(eps.map((e) => e.number));
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

  // Sync initial episode index
  useEffect(() => {
    const idx = allEpisodes.findIndex((e) => e.number === initialEpisodeNumber);
    if (idx !== -1) {
      setCurrentEpisodeIndex(idx);
    }
  }, [allEpisodes, initialEpisodeNumber]);

  const currentEpisode: Episode = allEpisodes[currentEpisodeIndex] || allEpisodes[0];

  // Sync anime prop & fetch episodes if missing
  useEffect(() => {
    if (anime.id !== currentAnime.id || (anime.episodes && !currentAnime.episodes)) {
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
    }
  }, [anime.id, anime.episodes?.length]);

  // Fetch available multi-voiceover translations from Kodik / Shikimori
  useEffect(() => {
    let isMounted = true;
    const shikimoriId =
      getShikimoriId(anime.title, anime.englishTitle, anime.poster) ||
      (anime.id && /^\d+$/.test(anime.id) ? anime.id : undefined);

    getAvailableTranslations(shikimoriId, anime.title).then((list) => {
      if (isMounted && list && list.length > 0) {
        setTranslationsList(list);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [anime.id, anime.title, anime.englishTitle, anime.poster]);

  const handleSelectVoiceover = useCallback(
    (trans: KodikTranslation & { isHlsNative?: boolean }) => {
      setSelectedVoiceover(trans.title);
      setSelectedTranslationId(trans.id);

      if (
        trans.isHlsNative ||
        trans.id === 612 ||
        trans.title.toLowerCase().includes('anilibria')
      ) {
        setPlayerMode('hls');
        setStreamError(false);
        showFeedback('⚡ Озвучка: AniLibria (Быстрый HLS 1080p)');
      } else {
        setPlayerMode('mirror');
        setActiveMirrorDomain('kodik.cc');
        setStreamError(false);
        showFeedback(`🎙️ Озвучка: ${trans.title}`);
      }
      setShowVoiceoverMenu(false);
      setShowSettingsMenu(false);
    },
    []
  );

  // Sleep Timer countdown handler
  useEffect(() => {
    if (sleepRemainingSeconds === null) return;
    if (sleepRemainingSeconds <= 0) {
      const video = videoRef.current;
      if (video) video.pause();
      setIsPlaying(false);
      setSleepRemainingSeconds(null);
      setSleepTimerMinutes(null);
      showFeedback('💤 Таймер сна сработал: воспроизведение приостановлено');
      return;
    }

    const interval = setInterval(() => {
      setSleepRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepRemainingSeconds]);

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepRemainingSeconds(null);
      showFeedback('Таймер сна отключён');
    } else {
      setSleepRemainingSeconds(minutes * 60);
      showFeedback(`Таймер сна установлен на ${minutes} мин.`);
    }
    setShowSleepTimerMenu(false);
  };

  // Initialize Web Audio Gain Node for volume booster (up to 200%)
  const initAudioBooster = useCallback(() => {
    const video = videoRef.current;
    if (!video || audioCtxRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      const source = ctx.createMediaElementSource(video);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gainNode;
      sourceNodeRef.current = source;
    } catch (e) {
      console.warn('Web Audio API Booster notice:', e);
    }
  }, []);

  const handleAudioBoostChange = (boostVal: number) => {
    setAudioBoost(boostVal);
    initAudioBooster();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (gainNodeRef.current) {
      // 100% = 1.0 gain, 200% = 2.0 gain
      gainNodeRef.current.gain.value = boostVal / 100;
    }

    showFeedback(`Усиление звука: ${boostVal}%`);
  };

  // Helper: format time
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
    }, 1600);
  };

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying || playerMode === 'mirror') {
        setShowControls(false);
        setShowSettingsMenu(false);
        setShowAudioBoosterMenu(false);
        setShowSleepTimerMenu(false);
      }
    }, 3800);
  }, [isPlaying, playerMode]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          showFeedback('Воспроизведение');
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      showFeedback('Пауза');
    }
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      const dur = video.duration || duration || 1440;
      const newTime = Math.max(0, Math.min(dur, video.currentTime + delta));
      video.currentTime = newTime;
      setCurrentTime(newTime);
      savedTimeRef.current = newTime;
      showFeedback(`${delta > 0 ? '+' : ''}${delta} сек`);
    },
    [duration]
  );

  const stepFrame = useCallback((forward: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) video.pause();
    // 1 frame at 24fps ≈ 0.0416s
    const frameDelta = forward ? 0.0416 : -0.0416;
    video.currentTime = Math.max(0, video.currentTime + frameDelta);
    setCurrentTime(video.currentTime);
    showFeedback(forward ? 'Кадр вперёд (+1f)' : 'Кадр назад (-1f)');
  }, []);

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
      showFeedback(`Серия ${currentEpisodeIndex + 2}: Наш плеер HD`);
    } else {
      showFeedback('Это последняя серия сезона!');
    }
  }, [allEpisodes.length, currentEpisodeIndex]);

  const goToPrevEpisode = useCallback(() => {
    if (currentEpisodeIndex > 0) {
      savedTimeRef.current = 0;
      setCurrentEpisodeIndex((prev) => prev - 1);
      setCurrentTime(0);
      setShowNextCountdown(null);
      showFeedback(`Серия ${currentEpisodeIndex}: Наш плеер HD`);
    } else {
      showFeedback('Это первая серия!');
    }
  }, [currentEpisodeIndex]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
          try {
            await (window.screen.orientation as any).lock('landscape');
          } catch (e) {}
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

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showFeedback('Картинка в картинке выключена');
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        showFeedback('Картинка в картинке включена');
      }
    } catch (e) {
      showFeedback('Режим PiP не поддерживается браузером');
    }
  }, []);

  const takeScreenshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        const cleanTitle = currentAnime.title.replace(/[^\w\u0400-\u04FF]/g, '_');
        a.download = `AniCrash_${cleanTitle}_Серия_${currentEpisode.number}_${Math.floor(currentTime)}с.png`;
        a.click();
        showFeedback('📸 Скриншот сохранён в загрузки');
      }
    } catch (err) {
      showFeedback('Скриншот недоступен для этого источника');
    }
  }, [currentAnime.title, currentEpisode.number, currentTime]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    showFeedback(!isMuted ? 'Звук выключен' : `Звук ${Math.round(volume * 100)}%`);
  }, [isMuted, volume]);

  const getActiveStreamUrl = useCallback(() => {
    if (!currentEpisode) return '';

    if (currentEpisode.voiceoverUrls && currentEpisode.voiceoverUrls[selectedVoiceover]) {
      return currentEpisode.voiceoverUrls[selectedVoiceover];
    }

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

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    showFeedback(`Скорость: ${speed}x`);
  };

  const handleSelectEpisode = async (idx: number) => {
    savedTimeRef.current = 0;
    setCurrentEpisodeIndex(idx);
    setCurrentTime(0);
    setShowEpisodesDrawer(false);
    const targetEp = allEpisodes[idx];
    showFeedback(`Включена серия ${targetEp?.number || idx + 1}`);

    // If episode has no video stream, automatically trigger server download with percentage progress
    if (targetEp && !targetEp.videoUrl && !targetEp.hls_720) {
      setIsPythonDownloading(true);
      setPythonDownloadStatus(`🚀 Сервер скачивает серию ${targetEp.number}: 0%`);
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 5;
        if (progress > 95) progress = 95;
        setPythonDownloadStatus(`📥 Загрузка на сервер: ${progress}%`);
      }, 400);

      try {
        const res = await fetch(`/api/download-episode?query=${encodeURIComponent(anime.title)}&episode=${targetEp.number}`);
        const data = await res.json();
        clearInterval(progressInterval);
        
        if (data.success && data.downloadedFile) {
          targetEp.videoUrl = data.downloadedFile;
          setPythonDownloadStatus(`✅ Серия ${targetEp.number} загружена: 100%!`);
          showFeedback(`📥 Серия успешно скачана на сервер (100%)`);
        } else {
          setPythonDownloadStatus(`⚠️ Серия готова к просмотру (Резервный поток)`);
        }
      } catch (err) {
        clearInterval(progressInterval);
        setPythonDownloadStatus(`⚠️ Ошибка загрузки, используется поток`);
      } finally {
        setTimeout(() => {
          setIsPythonDownloading(false);
          setPythonDownloadStatus(null);
        }, 2500);
      }
    }
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
        case 'KeyJ':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(1, Number((v + 0.05).toFixed(2)));
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
            const nv = Math.max(0, Number((v - 0.05).toFixed(2)));
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
        case 'KeyP':
          e.preventDefault();
          togglePiP();
          break;
        case 'KeyC':
          e.preventDefault();
          setAmbilightEnabled((prev) => {
            showFeedback(prev ? 'Эмбиент-подсветка выключена' : 'Эмбиент-подсветка включена');
            return !prev;
          });
          break;
        case 'KeyN':
          e.preventDefault();
          goToNextEpisode();
          break;
        case 'KeyB':
          e.preventDefault();
          goToPrevEpisode();
          break;
        case 'KeyS':
          e.preventDefault();
          handleSkipIntro();
          break;
        case 'KeyE':
          e.preventDefault();
          setShowEpisodesDrawer((prev) => !prev);
          break;
        case 'Slash':
        case 'KeyH':
          if (e.shiftKey || e.code === 'KeyH') {
            e.preventDefault();
            setShowShortcutsModal((prev) => !prev);
          }
          break;
        case 'BracketLeft':
          e.preventDefault();
          setPlaybackSpeed((s) => {
            const ns = Math.max(0.25, Number((s - 0.25).toFixed(2)));
            handleSpeedChange(ns);
            return ns;
          });
          break;
        case 'BracketRight':
          e.preventDefault();
          setPlaybackSpeed((s) => {
            const ns = Math.min(3, Number((s + 0.25).toFixed(2)));
            handleSpeedChange(ns);
            return ns;
          });
          break;
        case 'Comma':
          e.preventDefault();
          stepFrame(false);
          break;
        case 'Period':
          e.preventDefault();
          stepFrame(true);
          break;
        case 'Escape':
          if (showShortcutsModal) {
            setShowShortcutsModal(false);
          } else if (showEpisodesDrawer) {
            setShowEpisodesDrawer(false);
          } else if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seekBy,
    toggleFullscreen,
    toggleMute,
    togglePiP,
    goToNextEpisode,
    goToPrevEpisode,
    handleSkipIntro,
    stepFrame,
    isFullscreen,
    showShortcutsModal,
    showEpisodesDrawer,
    onClose,
  ]);

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
      setStreamError(true);
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
    }, 7500);

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
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      });

      let retryCount = 0;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 2) {
                retryCount++;
                hls.startLoad();
              } else {
                if (loadTimeout) clearTimeout(loadTimeout);
                setIsLoading(false);
                setStreamError(true);
              }
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
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
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

    const onProgress = () => {
      if (video.buffered.length > 0 && (video.duration || currentEpisode.duration)) {
        const dur = video.duration || currentEpisode.duration;
        const end = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent((end / dur) * 100);
      }
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

      // Auto skip outro if enabled
      if (
        autoSkipOutro &&
        currentEpisode.outroStart &&
        video.currentTime >= currentEpisode.outroStart &&
        currentEpisodeIndex < allEpisodes.length - 1
      ) {
        goToNextEpisode();
        showFeedback('Титры автоматически пропущены');
      }

      // Countdown for auto next episode near end
      if (
        video.duration &&
        video.duration - video.currentTime <= 12 &&
        currentEpisodeIndex < allEpisodes.length - 1
      ) {
        if (autoNextEpisode && showNextCountdown === null) {
          setShowNextCountdown(Math.ceil(video.duration - video.currentTime));
        }
      }

      // Save watch progress periodically
      const cur = Math.floor(video.currentTime);
      if (Math.abs(cur - lastReportedTimeRef.current) >= 3) {
        lastReportedTimeRef.current = cur;
        const dur = video.duration || currentEpisode.duration;
        onProgressUpdateRef.current({
          animeId: anime.id,
          episodeNumber: currentEpisode.number,
          currentTime: video.currentTime,
          duration: dur,
          completed: video.currentTime > dur * 0.88,
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
        const dur = video.duration || currentEpisode.duration;
        onProgressUpdateRef.current({
          animeId: anime.id,
          episodeNumber: currentEpisode.number,
          currentTime: video.currentTime,
          duration: dur,
          completed: video.currentTime > dur * 0.88,
          lastWatchedAt: Date.now(),
        });
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (video) {
        const dur = video.duration || currentEpisode.duration;
        onProgressUpdateRef.current({
          animeId: anime.id,
          episodeNumber: currentEpisode.number,
          currentTime: dur,
          duration: dur,
          completed: true,
          lastWatchedAt: Date.now(),
        });
      }
      if (autoNextEpisode && currentEpisodeIndex < allEpisodes.length - 1) {
        goToNextEpisode();
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('progress', onProgress);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [
    currentEpisodeIndex,
    currentEpisode,
    autoNextEpisode,
    autoSkipIntro,
    autoSkipOutro,
    anime.id,
    allEpisodes.length,
    goToNextEpisode,
    volume,
    playbackSpeed,
  ]);

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

  // Touch gesture handling on video viewport (Vertical swipes for brightness & volume)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const isLeftSide = touch.clientX < window.innerWidth / 2;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      val: isLeftSide ? brightness : volume * 100,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    const isLeftSide = touchStartRef.current.x < window.innerWidth / 2;

    if (Math.abs(deltaY) > 20) {
      if (isLeftSide) {
        // Brightness adjust: 50% to 150%
        const newBrightness = Math.max(50, Math.min(150, Math.round(touchStartRef.current.val + deltaY * 0.4)));
        setBrightness(newBrightness);
        setGestureNotice({ label: 'Яркость', value: `${newBrightness}%` });
      } else {
        // Volume adjust: 0% to 100%
        const newVolPct = Math.max(0, Math.min(100, Math.round(touchStartRef.current.val + deltaY * 0.3)));
        const newVol = newVolPct / 100;
        setVolume(newVol);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          videoRef.current.muted = false;
          setIsMuted(false);
        }
        setGestureNotice({ label: 'Громкость', value: `${newVolPct}%` });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = null;
    setTimeout(() => setGestureNotice(null), 800);

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

  // Filtered episodes in drawer
  const filteredEpisodes = useMemo(() => {
    if (!episodeSearchQuery.trim()) return allEpisodes;
    const q = episodeSearchQuery.toLowerCase().trim();
    return allEpisodes.filter((ep) => ep.number.toString().includes(q) || ep.title.toLowerCase().includes(q));
  }, [allEpisodes, episodeSearchQuery]);

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Aspect ratio class helper
  const getVideoObjectFit = () => {
    switch (aspectRatio) {
      case 'cover':
        return 'object-cover';
      case 'fill':
        return 'object-fill';
      case 'cinema':
        return 'object-cover scale-y-90';
      default:
        return 'object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      id="anicrash-custom-player-root"
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden"
    >
      {/* 1. AMBIENT GLOW BACKLIGHT (Ambilight Cinema Effect) */}
      {ambilightEnabled && (
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-45 mix-blend-screen filter blur-3xl transition-opacity duration-700 scale-110"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(225, 29, 72, 0.35), rgba(79, 70, 229, 0.25), rgba(0, 0, 0, 0.95))`,
          }}
        />
      )}

      {/* 2. VIDEO CANVAS / MIRROR IFRAME CONTAINER */}
      <div
        className="w-full h-full relative flex items-center justify-center overflow-hidden z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {playerMode === 'mirror' ? (
          <div className="w-full h-full relative bg-zinc-950">
            {activeMirrorDomain === 'kinobox' ? (
              <KinoboxPlayer
                anime={anime}
                currentEpisode={currentEpisode}
                onEpisodeChange={(ep) => {
                  const idx = allEpisodes.findIndex((e) => e.number === ep.number);
                  if (idx !== -1) {
                    setCurrentEpisodeIndex(idx);
                  }
                }}
              />
            ) : activeMirrorDomain === 'consumet' ? (
              <ConsumetPlayer
                anime={anime}
                currentEpisode={currentEpisode}
              />
            ) : (
              <iframe
                id="anicrash-mirror-iframe"
                key={`${activeMirrorDomain}-${anime.id}-${currentEpisode.number}-${selectedTranslationId}`}
                src={getKodikPlayerEmbedUrl({
                  domain: activeMirrorDomain,
                  shikimoriId:
                    getShikimoriId(anime.title, anime.englishTitle, anime.poster) ||
                    (anime.id && /^\d+$/.test(anime.id) ? anime.id : undefined),
                  title: anime.title,
                  englishTitle: anime.englishTitle,
                  poster: anime.poster,
                  episode: currentEpisode.number,
                  translationId: selectedTranslationId,
                })}
                className="w-full h-full border-0 relative z-10"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
                allowFullScreen
              />
            )}

            {/* Mirror Domain Selector Pills on Top (visible when controls visible) */}
            <div
              className={`absolute top-20 left-0 right-0 z-40 flex flex-col items-center gap-2 px-3 transition-opacity duration-300 pointer-events-none ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 p-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/60 rounded-2xl pointer-events-auto shadow-2xl">
                <span className="text-[11px] text-zinc-400 font-medium px-1.5 hidden md:inline">Сервер:</span>
                {[{ id: 'consumet', name: 'Global', desc: 'Consumet API (Gogoanime)' }, ...KODIK_DOMAINS].map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => {
                      setActiveMirrorDomain(domain.id);
                      showFeedback(`Выбран источник: ${domain.name}`);
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeMirrorDomain === domain.id
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                    title={domain.desc}
                  >
                    {domain.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <video
              ref={videoRef}
              id="anicrash-native-video"
              playsInline
              preload="auto"
              style={{ filter: `brightness(${brightness}%)` }}
              className={`w-full h-full ${getVideoObjectFit()} ${VIDEO_FILTER_CLASSES[videoFilter]} cursor-pointer transition-transform duration-300`}
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />
          </div>
        )}
      </div>

      {/* 3. STREAM ERROR / FALLBACK MODAL */}
      {streamError && playerMode === 'hls' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/85 backdrop-blur-md p-4">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Tv className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Основной поток временно недоступен</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                Для аниме «{anime.title}» можно переключить резервный плеер (Kinobox / Kodik) со всеми озвучками.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  setPlayerMode('mirror');
                  setStreamError(false);
                  showFeedback('Включен резервный плеер (Kinobox)');
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4" />
                <span>Включить Резервный Плеер (Kodik / Kinobox)</span>
              </button>
              <button
                onClick={() => {
                  setStreamError(false);
                  setIsLoading(true);
                  if (videoRef.current) videoRef.current.load();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Повторить попытку подключения</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOUBLE TAP VISUAL RIPPLE (MOBILE) */}
      {doubleTapSide === 'left' && (
        <div className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2 z-30 p-5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex flex-col items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in duration-150">
          <RotateCcw className="w-8 h-8 text-rose-500 animate-pulse" />
          <span className="text-xs font-mono font-bold">-10 сек</span>
        </div>
      )}
      {doubleTapSide === 'right' && (
        <div className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 z-30 p-5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex flex-col items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in duration-150">
          <RotateCw className="w-8 h-8 text-rose-500 animate-pulse" />
          <span className="text-xs font-mono font-bold">+10 сек</span>
        </div>
      )}

      {/* 5. GESTURE OVERLAY (BRIGHTNESS / VOLUME SWIPE) */}
      {gestureNotice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-zinc-900/90 text-white font-bold text-sm backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-2.5 animate-in fade-in duration-150">
          {gestureNotice.label === 'Яркость' ? <Sun className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          <span>
            {gestureNotice.label}: {gestureNotice.value}
          </span>
        </div>
      )}

      {/* 6. LOADING SPINNER */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 flex items-center gap-3 shadow-2xl">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
            <div className="text-left">
              <span className="text-xs sm:text-sm font-bold text-zinc-200 block">Загрузка потока</span>
              <span className="text-[10px] sm:text-xs text-zinc-400">{selectedVoiceover} • {selectedQuality}</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. CENTER FEEDBACK TOAST */}
      {feedbackNotice && (
        <div
          id="player-feedback-toast"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 px-5 py-2.5 rounded-full bg-zinc-900/95 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-2 animate-in fade-in duration-150"
        >
          <CheckCheck className="w-4 h-4 text-rose-400" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 8. AUTO-NEXT EPISODE FLOATING BANNER */}
      {showNextCountdown !== null && showNextCountdown > 0 && (
        <div
          id="next-episode-countdown-pill"
          className="absolute bottom-24 sm:bottom-28 inset-x-4 sm:inset-x-auto sm:right-8 z-30 bg-zinc-900/95 border border-rose-500/40 backdrop-blur-lg rounded-2xl p-4 shadow-2xl flex items-center justify-between sm:justify-start gap-4 animate-in slide-in-from-bottom duration-200 max-w-md"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Следующая серия ({showNextCountdown}с)</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs mt-0.5">
              Серия {currentEpisodeIndex + 2}: {allEpisodes[currentEpisodeIndex + 1]?.title || 'Без названия'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNextCountdown(null)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
              title="Отмена"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goToNextEpisode}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Включить</span>
            </button>
          </div>
        </div>
      )}

      {/* Python Download Loading Banner */}
      {isPythonDownloading && pythonDownloadStatus && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 border border-amber-500/50 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300">🐍 Python-скрипт загрузки</div>
            <div className="text-xs text-zinc-300">{pythonDownloadStatus}</div>
          </div>
        </div>
      )}

      {/* 9. TOP OVERLAY BAR */}
      <div
        className={`absolute top-0 inset-x-0 z-20 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/95 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Back & Title Header */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              id="player-back-btn"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-200 hover:text-white backdrop-blur border border-white/10 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Назад к аниме (Esc)"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-sm">
                  СВОЙ ПЛЕЕР
                </span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <BadgeCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span className="hidden xs:inline">0% рекламы</span>
                </span>
                <span className="text-xs text-zinc-400 font-medium hidden md:inline truncate max-w-[140px]">
                  {selectedVoiceover}
                </span>
              </div>
              <h2 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 truncate">
                <span className="truncate">{anime.title}</span>
                <span className="text-zinc-400 font-normal text-xs sm:text-sm shrink-0">
                  • Серия {currentEpisode.number}
                </span>
              </h2>
            </div>
          </div>

          {/* Top Actions & Switchers */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Python Download Button */}
            <button
              id="python-download-btn"
              onClick={handlePythonDownloadAndWatch}
              disabled={isPythonDownloading}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white backdrop-blur border border-amber-500/40 transition-all text-xs md:text-sm font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Запустить Python скрипт для поиска и загрузки серии"
            >
              {isPythonDownloading ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {isPythonDownloading ? 'Загрузка...' : 'Загрузка аниме'}
              </span>
            </button>

            {/* Watch Party Button */}
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

            {/* Mode Switcher: Custom Player vs Mirrors */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-zinc-900/90 backdrop-blur border border-white/10 shadow-lg">
              <button
                id="player-mode-hls-tab-btn"
                onClick={() => {
                  setPlayerMode('hls');
                  setStreamError(false);
                  showFeedback('Включен собственный плеер AniCrash');
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  playerMode === 'hls'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                title="Собственный встроенный плеер AniCrash (HLS, 0% рекламы, автопропуск, 60fps)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Наш плеер</span>
              </button>

              <button
                id="player-mode-mirror-tab-btn"
                onClick={() => {
                  setPlayerMode('mirror');
                  setStreamError(false);
                  showFeedback('Включен резервный плеер (Kinobox / Kodik)');
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  playerMode === 'mirror'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                title="Резервные зеркала (Kinobox, Kodik, Alloha, Collaps, HDRezka)"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Зеркала</span>
              </button>
            </div>

            {/* Episodes Drawer Toggle */}
            <button
              id="player-episodes-toggle-btn"
              onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-200 hover:text-white backdrop-blur border border-white/10 transition-all text-xs md:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ListVideo className="w-4 h-4 text-rose-400" />
              <span className="hidden xs:inline">Серии</span>
              <span>
                ({currentEpisode.number}/{allEpisodes.length})
              </span>
            </button>

            {/* Quick Screenshot Tool */}
            <button
              id="player-screenshot-tool-btn"
              onClick={takeScreenshot}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur border border-white/10 transition-all cursor-pointer"
              title="Сделать скриншот кадра"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Shortcuts Help Modal Trigger */}
            <button
              id="player-shortcuts-help-btn"
              onClick={() => setShowShortcutsModal(true)}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur border border-white/10 transition-all cursor-pointer"
              title="Горячие клавиши (H)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 10. BIG PLAY/PAUSE CENTER BUTTON (WHEN PAUSED) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 backdrop-blur transition-all active:scale-95 group cursor-pointer"
        >
          <Play className="w-7 h-7 sm:w-9 sm:h-9 translate-x-0.5 fill-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* 11. EPISODE SELECTION DRAWER */}
      {showEpisodesDrawer && (
        <div
          id="player-episodes-drawer"
          className="absolute inset-y-0 right-0 z-40 w-full sm:max-w-md bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 p-4 sm:p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-bold text-white text-base">Серии аниме</h3>
                  <span className="text-[11px] text-zinc-400">Всего {allEpisodes.length} серий</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEpisodeViewMode(episodeViewMode === 'list' ? 'grid' : 'list')}
                  className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={episodeViewMode === 'list' ? 'Сетка' : 'Список'}
                >
                  {episodeViewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowEpisodesDrawer(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input for fast filter */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск серии по номеру или названию..."
                value={episodeSearchQuery}
                onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {episodeSearchQuery && (
                <button
                  onClick={() => setEpisodeSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Episodes List / Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
              {episodeViewMode === 'grid' ? (
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {filteredEpisodes.map((ep) => {
                    const idx = allEpisodes.findIndex((e) => e.number === ep.number);
                    const isActive = idx === currentEpisodeIndex;
                    const progressPct = watchProgressMap[ep.number] || 0;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => handleSelectEpisode(idx)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                            : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span>{ep.number}</span>
                        {progressPct > 0 && !isActive && (
                          <div
                            className={`absolute bottom-1 inset-x-1.5 h-0.5 rounded-full ${
                              progressPct >= 88 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                filteredEpisodes.map((ep) => {
                  const idx = allEpisodes.findIndex((e) => e.number === ep.number);
                  const isActive = idx === currentEpisodeIndex;
                  const progressPct = watchProgressMap[ep.number] || 0;
                  return (
                    <button
                      key={ep.id}
                      ref={isActive ? activeEpisodeRef : null}
                      onClick={() => handleSelectEpisode(idx)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all flex items-center gap-3 border cursor-pointer ${
                        isActive
                          ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md'
                          : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {ep.number}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-rose-400' : 'text-zinc-200'}`}>
                            {ep.title}
                          </p>
                          {progressPct >= 88 && (
                            <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                              Просмотрено
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">{selectedVoiceover} • Наш плеер</p>
                        {progressPct > 0 && progressPct < 88 && (
                          <div className="w-full h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${progressPct}%` }} />
                          </div>
                        )}
                      </div>
                      {isActive && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Качество: {selectedQuality}</span>
              <span className="text-emerald-400 font-medium">Без рекламы</span>
            </div>
          </div>
        </div>
      )}

      {/* 12. SHORTCUTS GUIDE MODAL */}
      {showShortcutsModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-white text-base">Горячие клавиши плеера</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">Space / K</span>
                <span className="text-zinc-300">Плей / Пауза</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">← / →</span>
                <span className="text-zinc-300">Перемотка ±10с</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">↑ / ↓</span>
                <span className="text-zinc-300">Громкость ±5%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">F</span>
                <span className="text-zinc-300">Полноэкранный режим</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">M</span>
                <span className="text-zinc-300">Вкл / Выкл звук</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">P</span>
                <span className="text-zinc-300">Картинка в картинке</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">S</span>
                <span className="text-zinc-300">Пропустить опенинг</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">N / B</span>
                <span className="text-zinc-300">След. / Пред. серия</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">[ / ]</span>
                <span className="text-zinc-300">Скорость ±0.25x</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">, / .</span>
                <span className="text-zinc-300">Покадровый шаг (±1f)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">C</span>
                <span className="text-zinc-300">Эмбиент-подсветка</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 font-bold mr-2">E</span>
                <span className="text-zinc-300">Список всех серий</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. SETTINGS MENU POPUP */}
      {showSettingsMenu && (
        <div
          id="player-settings-popup"
          className="absolute bottom-20 sm:bottom-24 inset-x-3 sm:inset-x-auto sm:right-8 z-40 max-w-sm sm:w-80 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl text-xs sm:text-sm text-zinc-200 space-y-3.5 animate-in fade-in duration-150 mx-auto sm:mx-0 max-h-[75vh] overflow-y-auto scrollbar-thin"
        >
          {/* Quality Picker */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Качество видео
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {['1080p Ultra', '720p HD', '480p SD'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedQuality.includes(q.split(' ')[0])
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {q.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Voiceover Picker */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Озвучка / Перевод
            </span>
            <div className="grid grid-cols-1 gap-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
              {anime.voiceovers.map((voice) => (
                <button
                  key={voice}
                  onClick={() => {
                    setSelectedVoiceover(voice);
                    showFeedback(`Озвучка: ${voice}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium text-left truncate transition-all cursor-pointer ${
                    selectedVoiceover === voice
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {voice}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Video Filter */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Масштабирование и Фильтр
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['contain', 'cover', 'fill', 'cinema'] as AspectRatioMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setAspectRatio(mode);
                    showFeedback(`Формат: ${ASPECT_LABELS[mode]}`);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium truncate transition-all cursor-pointer ${
                    aspectRatio === mode ? 'bg-rose-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {ASPECT_LABELS[mode]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {(['none', 'vibrant', 'cinema', 'hdr'] as VideoFilterMode[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setVideoFilter(f);
                    showFeedback(`Цвет: ${FILTER_LABELS[f]}`);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium truncate transition-all cursor-pointer ${
                    videoFilter === f ? 'bg-rose-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Automation Toggles */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Автоматизация
            </span>
            <label className="flex items-center justify-between text-xs cursor-pointer group hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Авто-следующая серия</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full transition-all relative ${
                  autoNextEpisode ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={autoNextEpisode}
                  onChange={(e) => setAutoNextEpisode(e.target.checked)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                    autoNextEpisode ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </div>
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer group hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <FastForward className="w-3.5 h-3.5 text-rose-500" />
                <span>Пропускать опенинг</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full transition-all relative ${
                  autoSkipIntro ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={autoSkipIntro}
                  onChange={(e) => setAutoSkipIntro(e.target.checked)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                    autoSkipIntro ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </div>
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer group hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Эмбиент-подсветка (Кино)</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full transition-all relative ${
                  ambilightEnabled ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ambilightEnabled}
                  onChange={(e) => setAmbilightEnabled(e.target.checked)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                    ambilightEnabled ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 14. AUDIO BOOSTER (200% GAIN) POPUP */}
      {showAudioBoosterMenu && (
        <div
          id="player-audio-booster-popup"
          className="absolute bottom-20 sm:bottom-24 left-4 sm:left-48 z-40 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-4 shadow-2xl text-xs text-zinc-200 space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-rose-500" />
              Усилитель звука (Gain)
            </span>
            <span className="text-rose-400 font-bold">{audioBoost}%</span>
          </div>

          <div>
            <input
              type="range"
              min="100"
              max="200"
              step="5"
              value={audioBoost}
              onChange={(e) => handleAudioBoostChange(Number(e.target.value))}
              className="w-full h-1.5 accent-rose-500 bg-zinc-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
              <span>100% (Норма)</span>
              <span>150%</span>
              <span>200% (Макс)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[100, 150, 200].map((b) => (
              <button
                key={b}
                onClick={() => handleAudioBoostChange(b)}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  audioBoost === b ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {b}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 15. SLEEP TIMER POPUP */}
      {showSleepTimerMenu && (
        <div
          id="player-sleep-timer-popup"
          className="absolute bottom-20 sm:bottom-24 right-16 sm:right-28 z-40 w-56 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-4 shadow-2xl text-xs text-zinc-200 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-rose-500" />
              Таймер сна
            </span>
            {sleepRemainingSeconds !== null && (
              <span className="text-rose-400 font-mono font-bold">
                {Math.floor(sleepRemainingSeconds / 60)}м {sleepRemainingSeconds % 60}с
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => setSleepTimer(m)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sleepTimerMinutes === m ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {m} минут
              </button>
            ))}
          </div>

          {sleepTimerMinutes !== null && (
            <button
              onClick={() => setSleepTimer(null)}
              className="w-full py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-semibold transition-colors cursor-pointer mt-1"
            >
              Отключить таймер
            </button>
          )}
        </div>
      )}

      {/* 16. BOTTOM CONTROLS BAR */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Skip Intro & Quick Next Quick Actions */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 h-8">
          <div className="flex items-center gap-2">
            {((currentEpisode.introStart &&
              currentTime >= currentEpisode.introStart &&
              currentTime <= (currentEpisode.introEnd || currentEpisode.introStart + 90)) ||
              (!currentEpisode.introStart && currentTime > 5 && currentTime < 100)) && (
              <button
                id="player-skip-intro-btn"
                onClick={handleSkipIntro}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] sm:text-xs font-bold backdrop-blur shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all animate-in fade-in active:scale-95 border border-rose-400/30 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Пропустить опенинг (+85с)</span>
              </button>
            )}

            {currentEpisode.outroStart &&
              currentTime >= currentEpisode.outroStart &&
              currentEpisodeIndex < allEpisodes.length - 1 && (
                <button
                  id="player-skip-outro-btn"
                  onClick={goToNextEpisode}
                  className="px-3 sm:px-4 py-1.5 rounded-full bg-amber-600/90 hover:bg-amber-500 text-white text-[11px] sm:text-xs font-bold backdrop-blur shadow-lg shadow-amber-600/20 flex items-center gap-1.5 transition-all animate-in fade-in active:scale-95 border border-amber-400/30 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Пропустить титры</span>
                </button>
              )}
          </div>

          <div className="flex items-center gap-2">
            {currentEpisodeIndex < allEpisodes.length - 1 && (
              <button
                id="player-quick-next-btn"
                onClick={goToNextEpisode}
                className="px-3 sm:px-3.5 py-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] sm:text-xs font-semibold backdrop-blur border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>След. серия</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrub Bar (Timeline Progress + Buffer Bar) */}
        <div
          id="player-scrub-bar-container"
          onClick={handleScrub}
          onTouchStart={handleTouchScrub}
          onTouchMove={handleTouchScrub}
          onMouseMove={handleScrubHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-3.5 group cursor-pointer flex items-center py-2 touch-none"
        >
          {/* Background Track */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative group-hover:h-2.5 transition-all">
            {/* Buffer Bar */}
            <div
              className="h-full bg-zinc-600/60 rounded-full absolute top-0 left-0 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
            />
            {/* Played Progress Bar */}
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-500 rounded-full relative"
              style={{ width: `${currentPercent}%` }}
            />
          </div>

          {/* Scrubber Thumb Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${currentPercent}% - 8px)` }}
          />

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-zinc-900/95 text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md shadow-xl border border-zinc-700 pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Bottom Controls Row */}
        <div className="flex items-center justify-between mt-1 sm:mt-2 pt-1 text-zinc-300">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-3.5">
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
              title="Перемотать назад 10 сек (←)"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              id="player-forward-10-btn"
              onClick={() => seekBy(10)}
              className="hover:text-white transition-colors p-1 flex items-center cursor-pointer"
              title="Перемотать вперед 10 сек (→)"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume & Audio Booster */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                id="player-mute-btn"
                onClick={toggleMute}
                className="hover:text-white transition-colors p-1 cursor-pointer"
                title="Звук (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
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

              {/* Audio Boost 200% Trigger */}
              <button
                id="player-audio-boost-btn"
                onClick={() => setShowAudioBoosterMenu(!showAudioBoosterMenu)}
                className={`hidden md:flex px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  audioBoost > 100 ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Усилитель звука до 200%"
              >
                {audioBoost}%
              </button>
            </div>

            {/* Timestamps & Buffer State */}
            <div className="text-[10px] sm:text-xs font-mono text-zinc-400 flex items-center gap-1">
              <span className="text-white font-medium">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Speed Pills (Desktop) */}
            <div className="hidden lg:flex items-center bg-zinc-900/90 rounded-xl p-0.5 border border-zinc-800 text-xs font-medium">
              {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    playbackSpeed === speed ? 'bg-rose-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Sleep Timer Trigger */}
            <button
              id="player-sleep-timer-btn"
              onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                sleepTimerMinutes !== null ? 'bg-rose-600/30 text-rose-400 border border-rose-500/40' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
              title="Таймер сна"
            >
              <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Picture-in-Picture */}
            <button
              id="player-pip-btn"
              onClick={togglePiP}
              className="p-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Картинка в картинке (P)"
            >
              <PictureInPicture className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Settings Trigger */}
            <button
              id="player-settings-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Настройки качества, озвучки и фильтров"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Fullscreen Trigger */}
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
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
