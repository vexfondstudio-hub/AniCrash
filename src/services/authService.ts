import { UserAccount, UserProfile, AuthResponse, FavoriteEntry, WatchProgress } from '../types';
import { AVATAR_PRESETS, BANNER_PRESETS } from '../data/profilePresets';

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
        // Refresh with latest data from user table if not guest
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

export function registerAccount(
  username: string,
  email: string,
  password: string,
  avatarUrl?: string,
  title?: string
): AuthResponse {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanUsername || cleanUsername.length < 2) {
    return { success: false, error: 'Никнейм должен быть не короче 2 символов' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Введите корректный адрес эл. почты (например, user@gmail.com)' };
  }
  if (!cleanPassword || cleanPassword.length < 4) {
    return { success: false, error: 'Пароль должен содержать минимум 4 символа' };
  }

  const users = getRegisteredUsers();

  // Check if username or email already exists (case-insensitive)
  if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return { success: false, error: 'Пользователь с таким никнеймом уже зарегистрирован' };
  }
  if (users.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
    return { success: false, error: 'Аккаунт с такой почтой уже существует' };
  }

  const profile = createDefaultProfile(cleanUsername, avatarUrl);
  if (title) {
    profile.title = title;
  }

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username: cleanUsername,
    email: cleanEmail,
    password: cleanPassword, // In client storage
    createdAt: Date.now(),
    isGuest: false,
    profile,
    favorites: [],
    watchHistory: [],
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setSession(newUser);

  return { success: true, user: newUser };
}

export function loginAccount(identifier: string, password: string): AuthResponse {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanId) {
    return { success: false, error: 'Введите никнейм или адрес эл. почты' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Введите пароль' };
  }

  const users = getRegisteredUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
  );

  if (!user) {
    return { success: false, error: 'Пользователь не найден. Проверьте никнейм или зарегистрируйтесь' };
  }

  if (user.password !== password && user.password !== cleanPassword) {
    return { success: false, error: 'Неверный пароль. Пожалуйста, проверьте введённые данные' };
  }

  setSession(user);
  return { success: true, user };
}

export function logoutAccount(): void {
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
