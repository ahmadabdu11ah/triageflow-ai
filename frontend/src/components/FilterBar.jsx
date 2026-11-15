import { useEffect, useRef, useState } from 'react';
import { Search, X, Filter, Tag, ChevronDown, Check } from 'lucide-react';
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  CATEGORY_MAP,
} from '../constants/ticketMeta';

export default function FilterBar({
  filters,
  stats,
  onFilterChange,
  onResetFilters,
}) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  const byStatus = stats?.by_status || {};
  const byPriority = stats?.by_priority || {};
  const byCategory = stats?.by_category || {};

  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.category || filters.search
  );

  const activeCategoryMeta = filters.category ? CATEGORY_MAP[filters.category] : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectCategory = (categoryValue) => {
    onFilterChange({ category: categoryValue || null });
    setIsCategoryOpen(false);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-4">
      {/* Top Row: Search input + Category filter + Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search tickets by title or description..."
            className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Custom Category Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isCategoryOpen}
              aria-label="Filter by category"
              className={`inline-flex items-center justify-between gap-3 min-w-[185px] px-3.5 py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                activeCategoryMeta
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Tag
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeCategoryMeta ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                <span>
                  {activeCategoryMeta
                    ? `${activeCategoryMeta.label} (${byCategory[activeCategoryMeta.value] ?? 0})`
                    : 'All Categories'}
                </span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                  isCategoryOpen ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>

            {isCategoryOpen && (
              <div
                role="listbox"
                aria-label="Ticket categories"
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/60 p-1.5 z-40 divide-y divide-slate-800/70"
              >
                <div className="pb-1">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!filters.category}
                    onClick={() => handleSelectCategory(null)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      !filters.category
                        ? 'bg-indigo-500/15 text-indigo-200'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>All Categories</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300">
                        {stats?.total ?? 0}
                      </span>
                      {!filters.category && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </span>
                  </button>
                </div>

                <div className="pt-1 space-y-0.5">
                  {TICKET_CATEGORIES.map((cat) => {
                    const isSelected = filters.category === cat.value;
                    const count = byCategory[cat.value] ?? 0;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectCategory(cat.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/15 text-white'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${cat.badgeClass}`}
                          >
                            {cat.label}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800/90 text-[11px] font-mono text-slate-400">
                            {count}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills Row: Status & Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1 border-t border-slate-800/70">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-400" />
            Status:
          </span>
          <button
            type="button"
            onClick={() => onFilterChange({ status: null })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
              !filters.status
                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            All ({stats?.total ?? 0})
          </button>
          {TICKET_STATUSES.map((statusItem) => {
            const active = filters.status === statusItem.value;
            const count = byStatus[statusItem.value] ?? 0;
            return (
              <button
                key={statusItem.value}
                type="button"
                onClick={() =>
                  onFilterChange({ status: active ? null : statusItem.value })
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  active
                    ? statusItem.badgeClass
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusItem.dotClass}`} />
                <span>{statusItem.label}</span>
                <span className="opacity-70 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1.5">
            Priority:
          </span>
          <button
            type="button"
            onClick={() => onFilterChange({ priority: null })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
              !filters.priority
                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {TICKET_PRIORITIES.map((prioItem) => {
            const active = filters.priority === prioItem.value;
            const count = byPriority[prioItem.value] ?? 0;
            return (
              <button
                key={prioItem.value}
                type="button"
                onClick={() =>
                  onFilterChange({ priority: active ? null : prioItem.value })
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  active
                    ? prioItem.badgeClass
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${prioItem.dotClass}`} />
                <span>{prioItem.label}</span>
                <span className="opacity-70 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
