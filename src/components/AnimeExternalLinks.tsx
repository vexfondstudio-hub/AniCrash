import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { EXTERNAL_SITES } from '../data/externalSites';
import { Icons8Icon } from './Icons8Icon';
import { Anime } from '../types';

interface AnimeExternalLinksProps {
  anime: Anime;
  onOpenAllSitesModal?: () => void;
}

export const AnimeExternalLinks: React.FC<AnimeExternalLinksProps> = ({
  anime,
  onOpenAllSitesModal,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-sm">Внешние базы данных и трекеры</h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Смотрите рецензии, франшизы и рейтинги «{anime.title}» на мировых и русскоязычных порталах
          </p>
        </div>
        {onOpenAllSitesModal && (
          <button
            onClick={onOpenAllSitesModal}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Все сайты</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {EXTERNAL_SITES.map((site) => {
          const directUrl = site.searchUrlTemplate(anime.title, anime.englishTitle);

          return (
            <a
              key={site.id}
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between gap-2.5 group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${site.bestIcon.bgColor} border flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icons8Icon
                    name={site.bestIcon.iconName}
                    size={22}
                    style={site.bestIcon.style || 'fluency'}
                    alt={site.name}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white group-hover:text-rose-400 transition-colors truncate">
                      {site.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate block">
                    {site.categoryLabel}
                  </span>
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-rose-600 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
