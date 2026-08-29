import { UserAccount, UserProfile, AuthResponse, FavoriteEntry, WatchProgress } from '../types';
import { AVATAR_PRESETS, BANNER_PRESETS } from '../data/profilePresets';
import { supabase } from '../lib/supabase';

const USERS_STORAGE_KEY = 'anicrash_users_accounts_v2';
const SESSION_STORAGE_KEY = 'anicrash_current_session_v2';

export function createDefaultProfile(username: string, avatarUrl?: string): UserProfile {
  const defaultAvatar = avatarUrl || AVATAR_PRESETS[0]?.url || 'https://shikimori.io/system/animes/original/52991.jpg';
  const defaultBanner = BANNER_PRESETS[0]?.url || 'https://anilibria.top/storage/releases/posters/9600/1RwzksvrU3kCWOcWELGVuMYINrwtM6pA.jpg';

  return {
    username: username.trim(),
    avatar: defaultAvatar,
    aura: 'neon-rose',
    title: 'Начинающий Отаку',
    statusQuote: 'Смотрю аниме в 1080p без рекламы на AniCrash',
    bannerUrl: defaultBanner,
    accentTheme: 'rose',
    pinnedAnimeId: undefined,
    pinnedAnimeReview: undefined,
    pinnedAnimeRating: undefined,
    soundEffects: true,
    joinedDate: new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date()),
  };
}

export function createGuestAccount(): UserAccount {
  const guestProfile: UserProfile = {
    username: 'Гость',
    avatar: AVATAR_PRESETS[0]?.url || 'https://shikimori.io/system/animes/original/52991.jpg',
    aura: 'none',
    title: 'Гостевой режим',
    statusQuote: 'Смотрите аниме или зарегистрируйтесь для синхронизации',
    bannerUrl: BANNER_PRESETS[0]?.url || 'https://anilibria.top/storage/releases/posters/9600/1RwzksvrU3kCWOcWELGVuMYINrwtM6pA.jpg',
    accentTheme: 'rose',
    pinnedAnimeId: undefined,
    pinnedAnimeReview: undefined,
    pinnedAnimeRating: undefined,
    soundEffects: true,
    joinedDate: 'Гость',
  };

  return {
    id: 'guest_user',
    username: 'Гость',
    email: '',
    createdAt: Date.now(),
    isGuest: true,
    profile: guestProfile,
    favorites: [],
    watchHistory: [],
  };
}

export function getRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  return [];
}

export function saveRegisteredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export function getCurrentSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id) {
        if (!user.isGuest) {
          const users = getRegisteredUsers();
          const found = users.find((u) => u.id === user.id);
          if (found) return found;
        }
        return user;
      }
    }
  } catch (e) {
    console.error('Error getting session:', e);
  }
  return null;
}

export function setSession(user: UserAccount | null): void {
  try {
    if (!user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

export async function registerAccount(
  username: string,
  email: string,
  password: string,
  avatarUrl?: string,
  title?: string
): Promise<AuthResponse> {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanUsername || cleanUsername.length < 2) {
    return { success: false, error: 'Никнейм должен быть не короче 2 символов' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Введите корректный адрес эл. почты (например, user@gmail.com)' };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, error: 'Пароль должен содержать минимум 6 символов' };
  }

  // 1. SignUp in Supabase Auth
  if (!supabase) {
    return { success: false, error: 'Сервис авторизации временно недоступен' };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      data: {
        username: cleanUsername,
        avatarUrl: avatarUrl
      }
    }
  });

  if (authError) {
    if (authError.message.includes('User already registered')) {
       return { success: false, error: 'Пользователь с такой почтой уже существует' };
    }
    return { success: false, error: authError.message };
  }

  const userId = authData.user?.id || `user_${Date.now()}`;

  // 2. Setup local user info
  const profile = createDefaultProfile(cleanUsername, avatarUrl);
  if (title) {
    profile.title = title;
  }

  const newUser: UserAccount = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    createdAt: Date.now(),
    isGuest: false,
    profile,
    favorites: [],
    watchHistory: [],
  };

  const users = getRegisteredUsers();
  // Filter out any older entry with same ID just in case
  const filteredUsers = users.filter(u => u.id !== userId);
  filteredUsers.push(newUser);
  saveRegisteredUsers(filteredUsers);
  
  setSession(newUser);
  return { success: true, user: newUser };
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Введите адрес эл. почты' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Введите пароль' };
  }

  // 1. SignIn with Supabase Auth
  if (!supabase) {
    return { success: false, error: 'Сервис авторизации временно недоступен' };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (authError) {
    return { success: false, error: 'Неверная почта или пароль' };
  }

  const userId = authData.user?.id;
  if (!userId) {
     return { success: false, error: 'Ошибка получения данных пользователя' };
  }

  // 2. Load user from local storage (or create if this is a first-time login on this device)
  const users = getRegisteredUsers();
  let user = users.find((u) => u.id === userId);

  if (!user) {
    // If not found locally, we create a fresh local representation for this Supabase user
    const username = authData.user?.user_metadata?.username || cleanEmail.split('@')[0];
    const avatar = authData.user?.user_metadata?.avatarUrl || undefined;
    
    user = {
      id: userId,
      username: username,
      email: cleanEmail,
      createdAt: Date.now(),
      isGuest: false,
      profile: createDefaultProfile(username, avatar),
      favorites: [],
      watchHistory: [],
    };
    users.push(user);
    saveRegisteredUsers(users);
  }

  setSession(user);
  return { success: true, user };
}

export async function logoutAccount(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  setSession(null);
}

export const logoutUserAccount = logoutAccount;
export const getCurrentUserAccount = getCurrentSession;

export function saveAccountProfile(userId: string, profile: UserProfile): void {
  updateUserAccountData(userId, { profile });
}

export type { UserAccount };

export function updateUserAccountData(
  userId: string,
  update: {
    profile?: UserProfile;
    favorites?: FavoriteEntry[];
    watchHistory?: WatchProgress[];
  }
): void {
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index !== -1) {
    if (update.profile) users[index].profile = update.profile;
    if (update.favorites) users[index].favorites = update.favorites;
    if (update.watchHistory) users[index].watchHistory = update.watchHistory;
    saveRegisteredUsers(users);

    const session = getCurrentSession();
    if (session && session.id === userId) {
      setSession(users[index]);
    }
  }
}
