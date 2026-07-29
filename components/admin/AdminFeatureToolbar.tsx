import React from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';

interface AdminFeatureToolbarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  addLabel: string;
  addOpen: boolean;
  disabled?: boolean;
  onAddToggle: () => void;
}

const LABELS: Record<string, string> = {
  All: 'All',
  'Lens Surgery': 'Lens',
  'Retinal Surgery': 'Retina',
  Glaucoma: 'Glaucoma',
  Cornea: 'Cornea',
  Generals: 'Generals',
  Oculoplastics: 'Oculo',
  Strabismus: 'Strab',
  Others: 'Others',
};

export default function AdminFeatureToolbar({
  categories,
  selectedCategory,
  onCategoryChange,
  search,
  onSearchChange,
  searchPlaceholder,
  addLabel,
  addOpen,
  disabled = false,
  onAddToggle,
}: AdminFeatureToolbarProps) {
  const categoryOptions = categories;

  return (
    <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar">
      <div className="relative w-36 min-w-0 flex-[0_1_144px] sm:hidden">
        <select
          value={selectedCategory}
          onChange={event => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
          className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-100 dark:border-slate-800 rounded-xl pl-2.5 pr-8 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
        >
          {categoryOptions.map(category => (
            <option key={category} value={category}>
              {LABELS[category] || category}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
        />
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5 sm:flex">
        {categoryOptions.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${selectedCategory === category ? 'bg-[#fcb7f0] border-[#fcb7f0] text-slate-800 font-extrabold shadow-sm' : 'bg-white dark:bg-[#151f32] border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}
          >
            {LABELS[category] || category}
          </button>
        ))}
      </div>

      <div className="relative w-36 min-w-0 flex-[0_1_144px]">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          className="w-full bg-white dark:bg-[#151f32] border border-gray-100 dark:border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
        />
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
      </div>
      <button
        onClick={onAddToggle}
        disabled={disabled}
        className={`min-w-0 px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-lg transition-all border flex items-center gap-1.5 shrink ${disabled ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-50' : 'bg-[#fcb7f0]/20 hover:bg-[#fcb7f0]/40 text-[#8e5a7d] dark:text-[#fcb7f0] border-[#fcb7f0]/30'}`}
      >
        <Plus size={14} />
        <span className="truncate">{addOpen ? 'Hide' : addLabel}</span>
      </button>
    </div>
  );
}
