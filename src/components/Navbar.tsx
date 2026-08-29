import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  Search,
  Bookmark,
  History,
  Compass,
  BadgeCheck,
  Disc3,
  Tv2,
  Radio,
  User,
  Crown,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ViewMode, UserProfile } from '../types';
import { AURA_PRESETS } from '../data/profilePresets';
import { Icons8Icon } from './Icons8Icon';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  favoritesCount: number;
  historyCount: number;
  onOpenSearch: () => void;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  favoritesCount,
  historyCount,
  onOpenSearch,
  currentUser,
  isAuthenticated,
  onOpenAuth,
  onLogout,
}) => {
  const userAura = AURA_PRESETS.find((a) => a.id === currentUser.aura) || AURA_PRESETS[0];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: {
    id: ViewMode;
    label: string;
    shortLabel: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'home', label: 'Главная', shortLabel: 'Главная', icon: Tv2 },
    { id: 'catalog', label: 'Каталог', shortLabel: 'Каталог', icon: Disc3 },
    { id: 'watch-party', label: 'С друзьями', shortLabel: 'С друзьями', icon: Radio, badge: 'Live' },
    { id: 'recommendations', label: 'Рекомендации', shortLabel: 'Подборки', icon: Compass },
    { id: 'favorites', label: 'Закладки', shortLabel: 'Закладки', count: favoritesCount, icon: Bookmark },
    { id: 'history', label: 'История', shortLabel: 'История', count: historyCount, icon: History },
  ];

  return (
    <>
      {/* Top Header */}
      <header
        id="main-navigation-header"
        className="w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-2xl sm:rounded-3xl shadow-2xl transition-all"
      >
        <div className="px-3 sm:px-6 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 xs:gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <img 
                  src="https://i.postimg.cc/13Yj85TG/35725-removebg-preview.png" 
                  alt="AniCrash" 
                  className="w-32 sm:w-52 h-32 sm:h-52 object-contain brightness-0 invert opacity-90 -mt-10 -mb-10 sm:-mt-17 sm:-mb-15 -ml-2 sm:ml-0 mr-3 sm:mr-8 scale-x-[1.15] sm:scale-x-[1.25] origin-left pointer-events-none select-none"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <span className="hidden min-[380px]:inline-block text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  0% ADS
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links (lg and up) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold ${
                        isActive ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Search + Auth / Profile Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger Button */}
            <button
              id="nav-search-btn"
              onClick={onOpenSearch}
              className="group flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800/80 transition-all cursor-pointer shadow-inner"
              title="Быстрый поиск аниме (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] sm:text-xs text-zinc-500 font-bold hidden sm:inline uppercase tracking-wider">Поиск</span>
              <kbd className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600 border border-zinc-700 font-black">
                ⌘ K
              </kbd>
            </button>

            {/* Auth Buttons if not authenticated or Guest */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden xs:inline">Вход</span>
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Регистрация</span>
                </button>
              </div>
            ) : (
              /* Profile Button with Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  id="nav-profile-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl border transition-all cursor-pointer select-none group ${
                    currentView === 'profile'
                      ? 'bg-zinc-800 border-rose-500/60 shadow-lg shadow-rose-950/40'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800/80'
                  }`}
                  title="Меню профиля"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden border shrink-0 transition-all ${
                      userAura.id !== 'none' ? userAura.className : 'border-zinc-700'
                    }`}
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors max-w-[100px] truncate leading-tight">
                      {currentUser.username}
                    </div>
                    <div className="text-[9px] text-amber-400 font-medium flex items-center gap-0.5 leading-none mt-0.5">
                      <Crown className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[85px]">{currentUser.title}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1.5 z-50 animate-scale-up space-y-1">
                    <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                      <div className="text-xs font-bold text-white truncate">{currentUser.username}</div>
                      <div className="text-[10px] text-zinc-400">{currentUser.title}</div>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-rose-500" />
                      <span>Кастомизация профиля</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('favorites');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Мои закладки ({favoritesCount})</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('history');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span>История ({historyCount})</span>
                    </button>
                    <div className="border-t border-zinc-800/80 my-1" />
                    <button
                      onClick={() => {
                        onLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Выйти из аккаунта</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Bottom Navigation Bar (below lg screens) */}
      <nav
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-1 xs:px-2 py-1 flex items-center justify-around select-none transition-all"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 4px))' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 xs:px-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isActive ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 xs:w-5 xs:h-5 transition-transform ${isActive ? 'scale-110 text-rose-500' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-emerald-500 text-zinc-950 text-[7px] xs:text-[8px] font-black uppercase shadow-xs">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-3 h-3 xs:min-w-3.5 xs:h-3.5 rounded-full bg-rose-600 text-white text-[8px] xs:text-[9px] font-bold font-mono flex items-center justify-center shadow-sm">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span className={`text-[9px] xs:text-[10px] mt-0.5 tracking-tight truncate max-w-[52px] xs:max-w-none ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* Mobile Profile Item */}
        <button
          id="bottom-nav-profile"
          onClick={() => onNavigate('profile')}
          className={`relative flex flex-col items-center justify-center py-1 px-1.5 xs:px-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
            currentView === 'profile' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div
            className={`w-4.5 h-4.5 xs:w-5 xs:h-5 rounded-full overflow-hidden border ${
              userAura.id !== 'none' ? userAura.className : 'border-zinc-700'
            }`}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className={`text-[9px] xs:text-[10px] mt-0.5 tracking-tight ${currentView === 'profile' ? 'font-bold text-white' : 'font-medium'}`}>
            Профиль
          </span>
        </button>
      </nav>
    </>
  );
};
