import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { GENRES_LIST } from '../data/animeData';
import { AnimeStatus, AnimeType } from '../types';

export type SortOption = 'rating' | 'popular' | 'year' | 'title';

interface CustomSelectProps {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: any) => void;
  icon?: React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = React.memo(({ id, label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-zinc-900/60 border transition-all cursor-pointer select-none whitespace-nowrap ${
          isOpen ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        {icon}
        <span className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white">
          {selectedOption.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-48 sm:w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in duration-200">
          <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50">
            {label}
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-none">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  value === opt.value
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

interface CatalogFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  totalCount: number;
  onResetFilters: () => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = React.memo(({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onSelectGenre,
  selectedStatus,
  onSelectStatus,
  selectedType,
  onSelectType,
  selectedSort,
  onSelectSort,
  totalCount,
  onResetFilters,
}) => {
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedGenre !== 'Все жанры' ||
    selectedStatus !== 'all' ||
    selectedType !== 'all' ||
    selectedSort !== 'popular';

  return (
    <div id="catalog-filters-container" className="space-y-5 mb-8">
      {/* Top row: Search Bar & Custom Dropdowns */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-rose-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-focus-within:text-rose-500" />
          <input
            id="anime-search-input"
            type="text"
            placeholder="Поиск по названию (Магическая битва, Jujutsu Kaisen, Frieren...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 focus:border-rose-500/50 focus:bg-zinc-900/80 text-white placeholder-zinc-500 text-sm outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none shrink-0 px-0.5">
          <CustomSelect
            id="status-filter-select"
            label="Статус"
            value={selectedStatus}
            onChange={onSelectStatus}
            options={[
              { value: 'all', label: 'Все статусы' },
              { value: 'Онгоинг', label: 'Онгоинг' },
              { value: 'Завершён', label: 'Завершён' },
            ]}
          />

          <CustomSelect
            id="type-filter-select"
            label="Тип"
            value={selectedType}
            onChange={onSelectType}
            options={[
              { value: 'all', label: 'Любой тип' },
              { value: 'TV Сериал', label: 'Сериал' },
              { value: 'Фильм', label: 'Фильм' },
            ]}
          />

          <CustomSelect
            id="sort-filter-select"
            label="Сортировка"
            value={selectedSort}
            onChange={onSelectSort}
            options={[
              { value: 'popular', label: 'Популярные' },
              { value: 'rating', label: 'По рейтингу' },
              { value: 'year', label: 'По новизне' },
              { value: 'title', label: 'По алфавиту' },
            ]}
          />

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-bold whitespace-nowrap transition-all border border-rose-500/20 cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Сброс</span>
            </button>
          )}
        </div>
      </div>

      {/* Genre Chips (Horizontal Scroll) */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
          {GENRES_LIST.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => onSelectGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 ${
                  isSelected
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/40 translate-y-[-1px]'
                    : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count Line */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-1">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3 h-3 text-zinc-600" />
          <span>
            Найдено тайтлов: <strong className="text-zinc-300 font-bold">{totalCount}</strong>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-emerald-500/80 font-bold uppercase tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Все серии доступны бесплатно
        </div>
      </div>
    </div>
  );
});
