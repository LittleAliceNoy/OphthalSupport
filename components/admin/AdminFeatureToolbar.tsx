import React from 'react';
import { Plus, Search } from 'lucide-react';

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
  return (
    <div className="flex flex-row items-center justify-between gap-2 w-full flex-wrap sm:flex-nowrap">
      <div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-1 max-w-full select-none py-0.5 shrink-0">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${selectedCategory === category ? 'bg-[#fcb7f0] border-[#fcb7f0] text-slate-800 font-extrabold shadow-sm scale-105' : 'bg-white dark:bg-[#151f32] border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}
          >
            {LABELS[category] || category}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 max-w-[240px] sm:max-w-xs md:max-w-sm w-full justify-end">
        <div className="relative max-w-[150px] sm:max-w-[180px] w-full">
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
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 shrink-0 ${disabled ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-50' : 'bg-[#fcb7f0]/20 hover:bg-[#fcb7f0]/40 text-[#8e5a7d] dark:text-[#fcb7f0] border-[#fcb7f0]/30'}`}
        >
          <Plus size={14} />
          {addOpen ? 'Hide' : addLabel}
        </button>
      </div>
    </div>
  );
}
