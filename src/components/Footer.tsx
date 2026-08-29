import React from 'react';
import { Clapperboard, BadgeCheck } from 'lucide-react';
import { ViewMode } from '../types';
import { Icons8Icon } from './Icons8Icon';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  onSelectGenre: (genre: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onSelectGenre,
}) => {
  return (
    <footer id="main-footer" className="mt-16 sm:mt-20 border-t border-zinc-800/80 bg-zinc-950/90 text-zinc-400 text-xs pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 sm:mb-12">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Logo size="lg" />
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Современная платформа для просмотра аниме онлайн в высоком качестве без рекламы,
              казино и скрытых пауз. Чистый звук, плавная перемотка и персональные рекомендации.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <BadgeCheck className="w-4 h-4" />
              <span>AniCrash Pure: 0% рекламы гарантировано</span>
            </div>
            <a
              href="https://t.me/AniCrashQ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 border border-[#2AABEE]/20 text-[#2AABEE] text-xs font-bold transition-all w-fit cursor-pointer group"
            >
              <Icons8Icon name="telegram-app" size={18} style="3d-fluency" className="group-hover:scale-110 transition-transform" />
              <span>Наш Telegram</span>
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Разделы
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Главная страница
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Каталог аниме
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('recommendations')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Умные рекомендации
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('watch-party')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-rose-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Смотреть с друзьями
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('profile')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Кастомный профиль
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('favorites')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Мои закладки
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('history')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  История просмотров
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Genres */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Популярные жанры
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {['Экшен', 'Сёнен', 'Фэнтези', 'Киберпанк', 'Романтика', 'Триллер', 'Комедия'].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    onSelectGenre(g);
                    onNavigate('catalog');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-[11px] border border-zinc-800 cursor-pointer"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Player & Freedom */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Возможности плеера
            </h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Плеер с поддержкой HLS-потоков 1080p, кнопкой «Пропустить опенинг (+85с)»,
              удобными горячими клавишами (Пробел, стрелки) и мгновенным автопереходом на следующую серию.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
          <p>© {new Date().getFullYear()} AniCrash. Создано для ценителей качественного аниме без рекламы.</p>
          <p className="flex items-center gap-1">
            Плеер без рекламы • AniLibria HLS • Мгновенная перемотка
          </p>
        </div>
      </div>
    </footer>
  );
};
