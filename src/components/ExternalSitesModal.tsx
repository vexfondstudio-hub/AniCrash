import React, { useState } from 'react';
import { X, ExternalLink, Search, Sparkles, Check, Globe } from 'lucide-react';
import { EXTERNAL_SITES, ExternalSite } from '../data/externalSites';
import { Icons8Icon, IconStyle } from './Icons8Icon';
import { Anime } from '../types';

interface ExternalSitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnime?: Anime | null;
}

const ICON_STYLES: { id: IconStyle; label: string; description: string }[] = [
  { id: 'fluency', label: 'Fluency 2.5D', description: 'Яркие плоские иконки в стиле Fluent' },
  { id: '3d-fluency', label: '3D Fluency', description: 'Объемные 3D иконки высокого разрешения' },
  { id: 'color', label: 'Color Vector', description: 'Чистые векторные цветные значки' },
  { id: 'isometric', label: 'Isometric', description: 'Изометрический игровой стиль' },
];

export const ExternalSitesModal: React.FC<ExternalSitesModalProps> = ({
  isOpen,
  onClose,
  selectedAnime,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<IconStyle>('fluency');
  const [searchQuery, setSearchQuery] = useState<string>(selectedAnime?.title || '');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Все сайты' },
    { id: 'database', label: 'Базы данных и рейтинги' },
    { id: 'streaming', label: 'Стриминг и лицензия' },
    { id: 'dubbing', label: 'Озвучка' },
    { id: 'community', label: 'Сообщества' },
  ];

  const filteredSites = EXTERNAL_SITES.filter((site) => {
    if (activeCategory !== 'all' && site.category !== activeCategory) return false;
    return true;
  });

  return (
    <div
      id="external-sites-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="external-sites-modal-content"
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-auto text-zinc-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 p-1.5">
              <Icons8Icon name="globe" size={26} style={selectedStyle} alt="Sites" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Аниме-сайты и базы данных
              </h3>
              <p className="text-xs text-zinc-400">
                Каталог официальных ресурсов, трекеров и энциклопедий с лучшими иконками
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Style Selector Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-zinc-900/30 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Стиль иконок:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {ICON_STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStyle === st.id
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                  title={st.description}
                >
                  {selectedStyle === st.id && <Check className="w-3 h-3" />}
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search input for cross-site search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск тайтла на сайтах..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-950/60 border-b border-zinc-800/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-zinc-200 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sites List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 scrollbar-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSites.map((site) => {
              const targetUrl = searchQuery.trim()
                ? site.searchUrlTemplate(searchQuery.trim(), selectedAnime?.englishTitle)
                : site.websiteUrl;

              return (
                <div
                  key={site.id}
                  className={`p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 transition-all hover:bg-zinc-850 hover:border-zinc-700 flex flex-col justify-between gap-3 group relative overflow-hidden`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* High Quality Icon Badge */}
                    <div
                      className={`w-12 h-12 rounded-2xl ${site.bestIcon.bgColor} border flex items-center justify-center p-2 shrink-0 transition-transform group-hover:scale-105 shadow-lg ${site.bestIcon.glowColor}`}
                    >
                      <Icons8Icon
                        name={site.bestIcon.iconName}
                        size={32}
                        style={selectedStyle}
                        alt={site.name}
                        className="w-full h-full object-contain drop-shadow"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
                            {site.name}
                          </h4>
                          <span className="text-xs text-zinc-500 font-normal">
                            ({site.russianName})
                          </span>
                        </div>
                        {site.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold shrink-0">
                            {site.badge}
                          </span>
                        )}
                      </div>

                      <span className="inline-block text-[11px] font-semibold text-rose-400/90 mt-0.5">
                        {site.categoryLabel}
                      </span>

                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                        {site.description}
                      </p>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/60">
                    {site.features.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-400 text-[10px]"
                      >
                        • {f}
                      </span>
                    ))}
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-zinc-500 truncate">
                      {searchQuery.trim() ? `Поиск «${searchQuery.trim()}»` : site.websiteUrl.replace('https://', '')}
                    </span>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                    >
                      <span>{searchQuery.trim() ? 'Искать' : 'Перейти'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-400" />
            <span>Все внешние ссылки открываются в новой вкладке</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
