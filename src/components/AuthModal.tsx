import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Crown,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../types';
import { AVATAR_PRESETS, TITLE_PRESETS } from '../data/profilePresets';
import { registerAccount, loginAccount } from '../services/authService';
import { EnhancedImage } from './EnhancedImage';

interface AuthModalProps {
  isOpen?: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Sync mode whenever initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setErrorMessage('');
    setSuccessMessage('');
  }, [initialMode, isOpen]);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]?.url || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [selectedTitle, setSelectedTitle] = useState(TITLE_PRESETS[0] || 'Начинающий Отаку');

  // Status state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    setTimeout(() => {
      if (mode === 'register') {
        const finalAvatar = customAvatarUrl.trim() || selectedAvatar;
        const res = registerAccount(username, email, password, finalAvatar, selectedTitle);
        setLoading(false);
        if (res.success && res.user) {
          setSuccessMessage('Аккаунт успешно создан!');
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 600);
        } else {
          setErrorMessage(res.error || 'Ошибка при регистрации');
        }
      } else {
        const res = loginAccount(username || email, password);
        setLoading(false);
        if (res.success && res.user) {
          setSuccessMessage('Добро пожаловать в AniCrash!');
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 600);
        } else {
          setErrorMessage(res.error || 'Ошибка при авторизации');
        }
      }
    }, 250);
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-zinc-200 my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="auth-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight font-['Outfit',sans-serif]">
                {mode === 'register' ? 'Регистрация аккаунта' : 'Вход в AniCrash'}
              </h2>
              <p className="text-xs text-zinc-400">
                {mode === 'register'
                  ? 'Синхронизируйте историю, закладки и кастомный профиль'
                  : 'Войдите, чтобы продолжить просмотр с сохраненного места'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 mt-4">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Вход</span>
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Регистрация</span>
            </button>
          </div>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Username (or Email on login) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>{mode === 'register' ? 'Никнейм (Логин)' : 'Никнейм'}</span>
              </span>
              {mode === 'login' && (
                <span className="text-[10px] text-zinc-500 font-normal">или Gmail</span>
              )}
            </label>
            <input
              id="auth-username-input"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === 'register' ? 'Придумайте никнейм (например: Naruto99)' : 'Введите ваш никнейм'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs sm:text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>

          {/* Email (only in register mode) */}
          {mode === 'register' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Gmail / Эл. почта</span>
                </span>
                <span className="text-[10px] text-rose-400 font-medium">обязательно для регистрации</span>
              </label>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs sm:text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Пароль</span>
              </span>
              {mode === 'register' && (
                <span className="text-[10px] text-zinc-500">минимум 4 символа</span>
              )}
            </label>
            <div className="relative">
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Придумайте пароль' : 'Введите ваш пароль'}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs sm:text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Extra fields for Registration: Avatar & Title preset */}
          {mode === 'register' && (
            <div className="space-y-3 pt-2 border-t border-zinc-800/80 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Выберите стартовый аватар</span>
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.slice(0, 4).map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(av.url);
                        setCustomAvatarUrl('');
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatar === av.url && !customAvatarUrl
                          ? 'border-rose-500 scale-105 shadow-md shadow-rose-600/30'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                      title={av.name}
                    >
                      <EnhancedImage
                        src={av.url}
                        alt={av.name}
                        enhanceLevel="ultra"
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Стартовый титул</span>
                </label>
                <select
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-rose-500"
                >
                  {TITLE_PRESETS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Зарегистрироваться</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Войти в аккаунт</span>
              </>
            )}
          </button>

          {/* Quick Demo Register / Switch Button */}
          <div className="pt-2 flex flex-col gap-2 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-zinc-400">
                Впервые на сайте?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold underline underline-offset-2 cursor-pointer"
                >
                  Создать аккаунт
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                Уже есть аккаунт?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold underline underline-offset-2 cursor-pointer"
                >
                  Войти
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
