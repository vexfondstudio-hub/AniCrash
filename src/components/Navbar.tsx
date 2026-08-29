import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bookmark,
  History,
  Compass,
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
import { EnhancedImage } from './EnhancedImage';

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

  const mainNavItems: {
    id: ViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'home', label: 'Главная', icon: Tv2 },
    { id: 'catalog', label: 'Каталог', icon: Disc3 },
    { id: 'watch-party', label: 'Стрим', icon: Radio, badge: 'Live' },
    { id: 'recommendations', label: 'Подборки', icon: Compass },
  ];

  const bottomNavItems: {
    id: ViewMode;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'home', label: 'Главная', icon: Tv2 },
    { id: 'catalog', label: 'Каталог', icon: Disc3 },
    { id: 'watch-party', label: 'Стрим', icon: Radio, badge: 'Live' },
    { id: 'recommendations', label: 'Подборки', icon: Compass },
    { id: 'favorites', label: 'Закладки', count: favoritesCount, icon: Bookmark },
    { id: 'history', label: 'История', count: historyCount, icon: History },
  ];

  return (
    <>
      {/* Top Header Navigation Bar */}
      <header
        id="main-navigation-header"
        className="w-full bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-xl shadow-black/50 transition-all"
      >
        <div className="px-3 sm:px-4 md:px-5 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo & Status Tag */}
          <div
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none shrink-0 overflow-visible"
          >
            <div className="flex items-center">
              <img 
                src="https://i.postimg.cc/13Yj85TG/35725-removebg-preview.png" 
                alt="AniCrash" 
                className="w-32 sm:w-44 h-16 sm:h-20 object-contain brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity -my-6 -ml-1 sm:ml-0 mr-1 sm:mr-3 scale-x-[1.15] origin-left pointer-events-none select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <span className="hidden min-[380px]:inline-block text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                0% ADS
              </span>
            </div>
          </div>

          {/* Center: Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink min-w-0">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                  className={`h-9 px-3 lg:px-3.5 rounded-xl text-xs lg:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap border ${
                    isActive
                      ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70 border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 ${isActive ? 'text-rose-500' : 'text-zinc-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[8px] lg:text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions (Search + Quick User Lists + Auth / Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Trigger Button */}
            <button
              id="nav-search-btn"
              onClick={onOpenSearch}
              type="button"
              className="group h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-xs active:scale-95 select-none whitespace-nowrap"
              title="Быстрый поиск аниме (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-xs text-zinc-300 group-hover:text-white font-medium hidden xl:inline whitespace-nowrap">
                Поиск
              </span>
              <kbd className="hidden md:inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono tracking-tight whitespace-nowrap">
                ⌘K
              </kbd>
            </button>

            {/* Quick Access: Favorites Icon */}
            <button
              id="nav-quick-favorites"
              onClick={() => onNavigate('favorites')}
              type="button"
              className={`relative h-9 w-9 hidden md:flex items-center justify-center rounded-xl transition-all cursor-pointer select-none border ${
                currentView === 'favorites'
                  ? 'bg-zinc-800 text-rose-400 border-zinc-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
              title={`Закладки (${favoritesCount})`}
            >
              <Bookmark className="w-4 h-4" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-bold font-mono flex items-center justify-center shadow-xs">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </button>

            {/* Quick Access: History Icon */}
            <button
              id="nav-quick-history"
              onClick={() => onNavigate('history')}
              type="button"
              className={`relative h-9 w-9 hidden md:flex items-center justify-center rounded-xl transition-all cursor-pointer select-none border ${
                currentView === 'history'
                  ? 'bg-zinc-800 text-cyan-400 border-zinc-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
              title={`История (${historyCount})`}
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 rounded-full bg-cyan-600 text-white text-[9px] font-bold font-mono flex items-center justify-center shadow-xs">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </button>

            {/* Guest Actions (Login & Register) */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  type="button"
                  className="h-9 px-2.5 sm:px-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap select-none"
                >
                  <LogIn className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Вход</span>
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  type="button"
                  className="h-9 px-3 sm:px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 hover:shadow-rose-600/35 active:scale-95 cursor-pointer whitespace-nowrap select-none"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>Регистрация</span>
                </button>
              </div>
            ) : (
              /* Authenticated Profile Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  id="nav-profile-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  type="button"
                  className={`h-9 flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    currentView === 'profile'
                      ? 'bg-zinc-800 border-rose-500/60 shadow-lg shadow-rose-950/40'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700'
                  }`}
                  title="Меню профиля"
                >
                  <div
                    className={`w-6 h-6 rounded-lg overflow-hidden border shrink-0 transition-all ${
                      userAura.id !== 'none' ? userAura.className : 'border-zinc-700'
                    }`}
                  >
                    <EnhancedImage
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      enhanceLevel="ultra"
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors max-w-[80px] md:max-w-[100px] truncate leading-tight">
                      {currentUser.username}
                    </div>
                    <div className="text-[9px] text-amber-400 font-medium flex items-center gap-0.5 leading-none mt-0.5">
                      <Crown className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate max-w-[70px] md:max-w-[85px]">{currentUser.title}</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform shrink-0 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1.5 z-50 animate-scale-up space-y-0.5">
                    <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                      <div className="text-xs font-bold text-white truncate">{currentUser.username}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{currentUser.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">Кастомизация профиля</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('favorites');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Закладки ({favoritesCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('history');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">История ({historyCount})</span>
                    </button>
                    <div className="border-t border-zinc-800/80 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Выйти из аккаунта</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-1 xs:px-2 py-1 flex items-center justify-around select-none transition-all"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 4px))' }}
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              type="button"
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
                  <span className="absolute -top-1 -right-2 px-1 min-w-3 h-3 xs:min-w-3.5 xs:h-3.5 rounded-full bg-rose-600 text-white text-[8px] xs:text-[9px] font-bold font-mono flex items-center justify-center shadow-xs">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span className={`text-[9px] xs:text-[10px] mt-0.5 tracking-tight truncate max-w-[52px] xs:max-w-none ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Mobile Profile Item */}
        <button
          id="bottom-nav-profile"
          onClick={() => onNavigate('profile')}
          type="button"
          className={`relative flex flex-col items-center justify-center py-1 px-1.5 xs:px-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
            currentView === 'profile' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div
            className={`w-4.5 h-4.5 xs:w-5 xs:h-5 rounded-full overflow-hidden border ${
              userAura.id !== 'none' ? userAura.className : 'border-zinc-700'
            }`}
          >
            <EnhancedImage
              src={currentUser.avatar}
              alt={currentUser.username}
              enhanceLevel="ultra"
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
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

