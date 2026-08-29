import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Radio,
  Tv2,
  Play,
  Pause,
  Crown,
  MessagesSquare,
  Send,
  Copy,
  Check,
  Share2,
  Disc3,
  BadgeCheck,
  Zap,
  Volume2,
  VolumeX,
  CheckCheck,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  Anime,
  Episode,
  UserProfile,
  WatchPartyRoom,
  RoomMember,
  RoomMessage,
  RoomReaction,
  WatchProgress,
} from '../types';
import { QUICK_REACTIONS, AURA_PRESETS } from '../data/profilePresets';
import { supabase } from '../lib/supabase';
import { Icons8Icon } from './Icons8Icon';
import { EnhancedImage } from './EnhancedImage';

interface WatchPartyViewProps {
  allAnime: Anime[];
  currentUser: UserProfile;
  initialAnimeId?: string;
  initialEpisode?: number;
  onPlayInSoloPlayer: (anime: Anime, epNum: number, time: number) => void;
  onProgressUpdate: (progress: WatchProgress) => void;
}

export const WatchPartyView: React.FC<WatchPartyViewProps> = ({
  allAnime,
  currentUser,
  initialAnimeId,
  initialEpisode,
  onPlayInSoloPlayer,
  onProgressUpdate,
}) => {
  // Room state
  const [currentRoom, setCurrentRoom] = useState<WatchPartyRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(
    initialAnimeId || allAnime[0]?.id || ''
  );
  const [selectedEpisodeNum, setSelectedEpisodeNum] = useState<number>(initialEpisode || 1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [autoFollowHost, setAutoFollowHost] = useState(true);

  // Sync if initialAnimeId changes
  useEffect(() => {
    if (initialAnimeId) {
      setSelectedAnimeId(initialAnimeId);
      if (initialEpisode) {
        setSelectedEpisodeNum(initialEpisode);
      }
    }
  }, [initialAnimeId, initialEpisode]);

  // Chat & Reactions
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<RoomReaction[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');

  // Video playback
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastReportedTimeRef = useRef<number>(0);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [syncStatusNotice, setSyncStatusNotice] = useState<string>('');

  // Cross-tab synchronization via BroadcastChannel
  const channelRef = useRef<any | null>(null);
  const latestRoomRef = useRef<WatchPartyRoom | null>(null);
  useEffect(() => {
    latestRoomRef.current = currentRoom;
  }, [currentRoom]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Current anime & episode in room
  const activeAnime = useMemo(() => {
    if (!currentRoom) return null;
    return allAnime.find((a) => a.id === currentRoom.animeId) || allAnime[0];
  }, [allAnime, currentRoom]);

  const activeEpisode = useMemo<Episode | null>(() => {
    if (!activeAnime || !currentRoom) return null;
    return (
      activeAnime.episodes.find((e) => e.number === currentRoom.episodeNumber) ||
      activeAnime.episodes[0] ||
      null
    );
  }, [activeAnime, currentRoom]);

  // Setup Supabase Realtime channel for global sync
  useEffect(() => {
    if (!supabase) {
      if (currentRoom) {
        setSyncStatusNotice('Внимание: Supabase не настроен. Синхронизация не будет работать.');
      }
      return;
    }

    if (!currentRoom) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    try {
      const channel = supabase.channel(`watchparty_${currentRoom.id}`);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'room_event' }, ({ payload: data }) => {
        if (!data || !data.type) return;

        switch (data.type) {
          case 'PLAY':
            if (videoRef.current) {
              if (Math.abs(videoRef.current.currentTime - data.time) > 1.5) {
                videoRef.current.currentTime = data.time;
              }
              videoRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
            setSyncStatusNotice(`${data.senderName} запустил воспроизведение`);
            break;

          case 'PAUSE':
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = data.time;
              setIsPlaying(false);
            }
            setSyncStatusNotice(`${data.senderName} поставил на паузу`);
            break;

          case 'SEEK':
            if (videoRef.current) {
              videoRef.current.currentTime = data.time;
            }
            setSyncStatusNotice(`${data.senderName} перемотал видео`);
            break;

          case 'CHAT':
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === data.message.id);
              if (exists) return prev;
              return [...prev, data.message];
            });
            break;

          case 'REACTION':
            triggerReaction(data.emoji, data.senderName);
            break;

          case 'JOIN':
            setSyncStatusNotice(`${data.senderName} присоединился к просмотру`);
            
            // Auto-sync for the new user if we are the host
            if (latestRoomRef.current && latestRoomRef.current.hostId === currentUser.username) {
               const r = latestRoomRef.current;
               setTimeout(() => {
                 channelRef.current?.send({
                   type: 'broadcast',
                   event: 'room_event',
                   payload: {
                     type: 'EPISODE_CHANGE',
                     animeId: r.animeId,
                     episodeNum: r.episodeNumber,
                     senderName: 'Авто-синхронизация'
                   }
                 });
                 
                 setTimeout(() => {
                   if (videoRef.current) {
                     channelRef.current?.send({
                       type: 'broadcast',
                       event: 'room_event',
                       payload: {
                         type: videoRef.current.paused ? 'PAUSE' : 'PLAY',
                         time: videoRef.current.currentTime,
                         senderName: 'Авто-синхронизация'
                       }
                     });
                   }
                 }, 500);
               }, 1000);
            }
            break;
            
          case 'EPISODE_CHANGE':
            setCurrentRoom(prev => prev ? {
               ...prev,
               animeId: data.animeId,
               episodeNumber: data.episodeNum
            } : null);
            setSyncStatusNotice(`${data.senderName} переключил серию`);
            break;
        }
      }).subscribe((status) => {
         if (status === 'SUBSCRIBED') {
            // Send join event
            channel.send({
              type: 'broadcast',
              event: 'room_event',
              payload: {
                type: 'JOIN',
                senderName: currentUser.username,
                senderAvatar: currentUser.avatar,
                senderAura: currentUser.aura
              }
            });
         }
      });

      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    } catch (e) {
      console.warn('Realtime channel error', e);
    }
  }, [currentRoom?.id, currentUser.username, currentUser.avatar, currentUser.aura]);

  // Scroll chat down on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto clear sync notice after 3 seconds
  useEffect(() => {
    if (syncStatusNotice) {
      const timer = setTimeout(() => setSyncStatusNotice(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [syncStatusNotice]);

  // Time formatter
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper: Trigger floating reaction
  const triggerReaction = (emoji: string, senderName: string) => {
    const newReaction: RoomReaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      emoji,
      senderName,
      timestamp: Date.now(),
      xOffset: Math.floor(Math.random() * 70) + 15,
    };
    setFloatingReactions((prev) => [...prev, newReaction]);

    // Auto remove after 2.5 seconds
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2400);
  };

  // Send reaction locally + broadcast
  const handleSendReaction = (emoji: string) => {
    triggerReaction(emoji, currentUser.username);
    if (channelRef.current) {
      channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'REACTION',
        emoji,
        senderName: currentUser.username,
      }
    });
    }
  };

  // Send chat message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !currentRoom) return;

    const newMsg: RoomMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.username,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      senderAura: currentUser.aura,
      text: chatInput.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (channelRef.current) {
      channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'CHAT',
        message: newMsg,
      }
    });
    }
  };

  // Create room
  const handleCreateRoom = () => {
    if (!supabase) {
      setSyncStatusNotice('Ошибка: Совместный просмотр требует настройки Supabase.');
      return;
    }
    const targetAnime = allAnime.find((a) => a.id === selectedAnimeId) || allAnime[0];
    const generatedId = `ANICRASH-${Math.floor(1000 + Math.random() * 9000)}`;

    const hostMember: RoomMember = {
      id: currentUser.username,
      name: currentUser.username,
      avatar: currentUser.avatar,
      aura: currentUser.aura,
      isHost: true,
      isPlaying: false,
      currentTime: 0,
      lastPing: Date.now(),
      status: 'ready',
    };

    const newRoom: WatchPartyRoom = {
      id: generatedId,
      name: `Просмотр: ${targetAnime.title}`,
      animeId: targetAnime.id,
      episodeNumber: selectedEpisodeNum,
      currentTime: 0,
      isPlaying: false,
      hostId: currentUser.username,
      hostName: currentUser.username,
      members: [hostMember],
      createdAt: Date.now(),
    };

    setCurrentRoom(newRoom);
    setMessages([
      {
        id: 'sys-welcome',
        senderId: 'system',
        senderName: 'AniCrash Party',
        senderAvatar: '',
        text: `Комната ${generatedId} создана. Скопируйте код или ссылку, чтобы пригласить друга!`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };

  // Join room by code
  const handleJoinRoom = () => {
    if (!supabase) {
      setSyncStatusNotice('Ошибка: Совместный просмотр требует настройки Supabase.');
      return;
    }
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    const targetAnime = allAnime[0];
    const userMember: RoomMember = {
      id: currentUser.username,
      name: currentUser.username,
      avatar: currentUser.avatar,
      aura: currentUser.aura,
      isHost: false,
      isPlaying: false,
      currentTime: 0,
      lastPing: Date.now(),
      status: 'ready',
    };

    const newRoom: WatchPartyRoom = {
      id: code,
      name: `Комната ${code}`,
      animeId: targetAnime.id,
      episodeNumber: 1,
      currentTime: 0,
      isPlaying: false,
      hostId: 'Хост_Комнаты',
      hostName: 'Организатор',
      members: [userMember],
      createdAt: Date.now(),
    };

    setCurrentRoom(newRoom);
    setMessages([
      {
        id: 'sys-join',
        senderId: 'system',
        senderName: 'AniCrash Party',
        senderAvatar: '',
        text: `Вы вошли в комнату ${code}! Ожидание синхронизации с другими участниками...`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };

  // Play / Pause toggle with broadcast
  const handleTogglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (channelRef.current) {
        channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'PAUSE',
        time: videoRef.current.currentTime,
        senderName: currentUser.username,
      }
    });
      }
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      if (channelRef.current) {
        channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'PLAY',
        time: videoRef.current.currentTime,
        senderName: currentUser.username,
      }
    });
      }
    }
  };

  // Seek bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      if (channelRef.current) {
        channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
          type: 'SEEK',
          time: target,
          senderName: currentUser.username,
        }
      });
      }
    }
  };

  // Episode change
  const handleEpisodeChange = (epNum: number) => {
    if (!currentRoom) return;
    setCurrentRoom((prev) => (prev ? { ...prev, episodeNumber: epNum, currentTime: 0 } : null));
    if (channelRef.current) {
      channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'EPISODE_CHANGE',
        animeId: currentRoom.animeId,
        episodeNum: epNum,
        senderName: currentUser.username,
      }
    });
    }
  };

  // Copy room link
  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard?.writeText(currentRoom.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Force sync everyone (Host action)
  const handleForceSync = () => {
    if (!videoRef.current || !channelRef.current || !currentRoom) return;
    
    // Send episode state first
    channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'EPISODE_CHANGE',
        animeId: currentRoom.animeId,
        episodeNum: currentRoom.episodeNumber,
        senderName: `${currentUser.username} (Хост)`,
      }
    });
    
    // Then time state
    channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'SEEK',
        time: videoRef.current.currentTime,
        senderName: `${currentUser.username} (Хост)`,
      }
    });
    setSyncStatusNotice('Синхронизация отправлена всем участникам!');
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const cur = Math.floor(videoRef.current.currentTime);
      if (activeAnime && currentRoom && Math.abs(cur - lastReportedTimeRef.current) >= 3) {
        lastReportedTimeRef.current = cur;
        onProgressUpdateRef.current({
          animeId: activeAnime.id,
          episodeNumber: currentRoom.episodeNumber,
          currentTime: cur,
          duration: Math.floor(videoRef.current.duration || 1440),
          completed: videoRef.current.currentTime > (videoRef.current.duration || 1440) * 0.9,
          lastWatchedAt: Date.now(),
        });
      }
    }
  };

  // IF NO ACTIVE ROOM: SHOW LOBBY (CREATE OR JOIN)
  if (!currentRoom) {
    return (
      <div id="watch-party-lobby" className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto">
        {/* Banner */}
        <div className="relative rounded-2xl sm:rounded-3xl p-5 xs:p-6 sm:p-10 overflow-hidden bg-gradient-to-r from-rose-950/60 via-zinc-900 to-zinc-950 border border-rose-500/30 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Radio className="w-4 h-4" />
              </span>
              <span className="text-[11px] xs:text-xs font-bold uppercase tracking-wider text-rose-400">
                AniParty • Совместный просмотр
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] xs:text-[10px] font-bold border border-emerald-500/30">
                0% РЕКЛАМЫ
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-4xl font-black text-white leading-tight">
              Смотрите аниме синхронно вместе с друзьями
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Создайте приватную комнату, отправьте код друзьям и смотрите серии в полной синхронизации
              кадр-в-кадр с общим чатом и живыми аниме-реакциями.
            </p>
          </div>
        </div>

        {/* Action Cards: Create vs Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Create Room */}
          <div className="p-4 xs:p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-4 sm:space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Создать новую комнату</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">Вы будете хостом и сможете управлять плеером</p>
                </div>
              </div>

              {/* Select Anime */}
              <div className="space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Выберите аниме для совместного просмотра
                </label>
                <select
                  value={selectedAnimeId}
                  onChange={(e) => {
                    setSelectedAnimeId(e.target.value);
                    setSelectedEpisodeNum(1);
                  }}
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm font-semibold focus:border-rose-500 outline-none cursor-pointer"
                >
                  {allAnime.map((anime) => (
                    <option key={anime.id} value={anime.id}>
                      {anime.title} ({anime.genres.slice(0, 2).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Episode */}
              <div className="space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Стартовая серия
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Серия №</span>
                  <input
                    type="number"
                    min={1}
                    max={allAnime.find((a) => a.id === selectedAnimeId)?.episodesCount || 24}
                    value={selectedEpisodeNum}
                    onChange={(e) => setSelectedEpisodeNum(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold text-center focus:border-rose-500 outline-none"
                  />
                  <span className="text-xs text-zinc-500">
                    из {allAnime.find((a) => a.id === selectedAnimeId)?.episodesCount || 12}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer transform active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Создать комнату и начать просмотр</span>
            </button>
          </div>

          {/* Card 2: Join Room */}
          <div className="p-4 xs:p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-4 sm:space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Присоединиться по коду</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">Введите код, который отправил вам друг</p>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Код комнаты
                </label>
                <input
                  type="text"
                  placeholder="Например: ANICRASH-7482"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs sm:text-sm uppercase placeholder-zinc-600 tracking-wider focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Quick join tip */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-[11px] sm:text-xs text-zinc-400 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Синхронизация работает мгновенно между любыми вкладками и браузерами!</span>
              </div>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!joinCodeInput.trim()}
              className={`w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                joinCodeInput.trim()
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transform active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>Войти в комнату</span>
            </button>
          </div>
        </div>

        {/* How It Works Explainer */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Как устроен совместный просмотр AniCrash
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <strong className="text-white block font-bold">1. Единый таймлайн</strong>
              <span>Когда хост нажимает паузу или перематывает серию, плеер каждого участника мгновенно синхронизируется.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <strong className="text-white block font-bold">2. Живой чат и реакции</strong>
              <span>Отправляйте стикеры и эмодзи, которые взлетают вверх прямо над экраном в реальном времени.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <strong className="text-white block font-bold">3. Без рекламы и задержек</strong>
              <span>Никаких раздражающих баннеров или рассинхрона из-за рекламы. Чистый стриминг серии.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE ROOM SCREEN
  const isUserHost = currentRoom.hostId === currentUser.username;
  const userAura = AURA_PRESETS.find((a) => a.id === currentUser.aura) || AURA_PRESETS[0];

  return (
    <div id="watch-party-active-room" className="space-y-4 animate-fade-in">
      {/* ROOM HEADER BAR */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white">
                {activeAnime?.title} — Серия {currentRoom.episodeNumber}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                В эфире
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span>Хост: <strong className="text-zinc-200">{currentRoom.hostName}</strong></span>
              <span>•</span>
              <span>В комнате: <strong className="text-zinc-200">{currentRoom.members.length === 1 ? '1 зритель (Вы)' : `${currentRoom.members.length} зрителей`}</strong></span>
            </p>
          </div>
        </div>

        {/* Room Code & Controls */}
        <div className="flex items-center gap-2">
          {/* Force sync button for host */}
          {isUserHost && (
            <button
              onClick={handleForceSync}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Принудительно подтянуть всех участников к вашему текущему времени"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Синхронизировать всех</span>
            </button>
          )}

          {/* Copy Room Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-white transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentRoom.id}</span>
              </>
            )}
          </button>

          {/* Leave Room Button */}
          <button
            onClick={() => setCurrentRoom(null)}
            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Sync Status Toast Banner */}
      {syncStatusNotice && (
        <div className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 text-white text-xs font-medium flex items-center gap-2 animate-slide-down shadow-md">
          <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatusNotice}</span>
        </div>
      )}

      {/* MAIN WATCH PARTY LAYOUT: VIDEO (LEFT) + CHAT/MEMBERS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* VIDEO CONTAINER (2 COLUMNS ON LARGE SCREENS) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Synchronized Player Frame */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group">
            {activeEpisode?.videoUrl ? (
              <video
                ref={videoRef}
                src={activeEpisode.videoUrl}
                poster={activeEpisode.thumbnail || activeAnime?.banner}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                Загрузка видео...
              </div>
            )}

            {/* FLOATING LIVE REACTIONS OVER VIDEO */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  style={{ left: `${r.xOffset}%` }}
                  className="absolute bottom-16 animate-bounce transition-all duration-1000 transform -translate-y-48 opacity-90 drop-shadow-2xl select-none"
                >
                  <Icons8Icon name={r.emoji} size={48} alt="reaction" />
                </div>
              ))}
            </div>

            {/* Top Bar inside Player */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/10 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  Live Sync
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  0% рекламы
                </span>
              </div>
            </div>

            {/* Big center play button if paused */}
            {!isPlaying && (
              <button
                onClick={handleTogglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer z-10"
              >
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </button>
            )}

            {/* Bottom Player Overlay Bar */}
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 z-10">
              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={duration || 1440}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 rounded-lg appearance-none bg-zinc-700 accent-rose-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <span>
                    {formatTime(currentTime)} / {formatTime(duration || 1440)}
                  </span>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeAnime && currentRoom) {
                        onPlayInSoloPlayer(activeAnime, currentRoom.episodeNumber, currentTime);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    В полный плеер
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK REACTIONS BAR UNDER VIDEO */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0 pl-1">
              Реакции в чат:
            </span>
            <div className="flex items-center gap-1.5">
              {QUICK_REACTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSendReaction(r.icon8)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1.5 group border border-zinc-700/40"
                  title={`Отправить реакцию «${r.label}»`}
                >
                  <Icons8Icon name={r.icon8} size={22} alt={r.label} />
                  <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white hidden sm:inline">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* EPISODES SELECTOR ROW */}
          {activeAnime && (
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-rose-500" />
                  Выбор серии для комнаты
                </span>
                <span className="text-zinc-500">
                  {isUserHost ? 'Вы управляете сериями как хост' : 'Хост управляет сериями'}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {activeAnime.episodes.map((ep) => {
                  const isActive = ep.number === currentRoom.episodeNumber;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => handleEpisodeChange(ep.number)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500/40'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {ep.number} серия
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CHAT & MEMBERS PANEL */}
        <div className="flex flex-col h-[520px] rounded-3xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Panel Tabs */}
          <div className="flex border-b border-zinc-800 p-1.5 bg-zinc-950/60">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessagesSquare className="w-3.5 h-3.5" />
              <span>Чат ({messages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Участники ({currentRoom.members.length})</span>
            </button>
          </div>

          {/* TAB 1: CHAT MESSAGES */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center text-[11px] text-zinc-400"
                      >
                        {msg.text}
                      </div>
                    );
                  }

                  const isMe = msg.senderId === currentUser.username;
                  const senderAura = AURA_PRESETS.find((a) => a.id === msg.senderAura) || AURA_PRESETS[0];

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 border ${
                          senderAura.id !== 'none' ? senderAura.className : 'border-zinc-700'
                        }`}
                      >
                        <EnhancedImage
                          src={msg.senderAvatar || currentUser.avatar}
                          alt={msg.senderName}
                          enhanceLevel="ultra"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                          isMe
                            ? 'bg-rose-600 text-white rounded-tr-sm shadow-md'
                            : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                        }`}
                      >
                        <div className="font-bold text-[10px] text-white/70 mb-0.5">
                          {msg.senderName}
                        </div>
                        <div className="leading-relaxed break-words">{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex gap-2">
                <input
                  type="text"
                  placeholder="Написать сообщение в комнату..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:border-rose-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className={`p-2 rounded-xl text-white transition-colors cursor-pointer ${
                    chatInput.trim() ? 'bg-rose-600 hover:bg-rose-500' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MEMBERS LIST */}
          {activeTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="text-xs text-zinc-400 mb-2 font-medium">
                Участники совместного просмотра:
              </div>
              {currentRoom.members.map((member) => {
                const aura = AURA_PRESETS.find((a) => a.id === member.aura) || AURA_PRESETS[0];
                return (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 border ${
                          aura.id !== 'none' ? aura.className : 'border-zinc-700'
                        }`}
                      >
                        <EnhancedImage
                          src={member.avatar}
                          alt={member.name}
                          enhanceLevel="ultra"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{member.name}</span>
                          {member.id === currentUser.username && (
                            <span className="text-[10px] text-zinc-400 font-normal">(Вы)</span>
                          )}
                          {member.isHost && (
                            <span className="p-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Хост">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {member.isHost ? 'Организатор комнаты' : 'Зритель'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>В сети</span>
                    </div>
                  </div>
                );
              })}

              {currentRoom.members.length === 1 && (
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-300">Вы пока один в этой комнате</p>
                  <p className="text-[11px] text-zinc-500">
                    Отправьте код <span className="font-mono text-zinc-300 font-bold">{currentRoom.id}</span> другу, чтобы смотреть вместе синхронно без задержек.
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-center">
                <button
                  onClick={handleCopyCode}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Скопировать код для друга</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
