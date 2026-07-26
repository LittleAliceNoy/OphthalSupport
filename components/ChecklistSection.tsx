import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, ListChecks } from 'lucide-react';
import { ChecklistItemData, Option } from '../constants';

export type ChecklistField = 'checked' | 'selectedValue' | 'value';
export type ChecklistValue = boolean | string | string[] | null;

interface ChecklistSectionProps {
  title: string;
  items: ChecklistItemData[];
  onItemChange: (id: string, key: ChecklistField, value: ChecklistValue) => void;
  colorClass: string;
  showAllText?: string;
  icon?: React.ElementType;
}

export default function ChecklistSection({
  title,
  items,
  onItemChange,
  colorClass: _colorClass,
  showAllText = 'Show All',
  icon: Icon = ListChecks,
}: ChecklistSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedItems = showAll ? items : items.filter(item => item.checked || item.autoPopulated);

  return (
    <section className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-50 dark:border-slate-800 pb-2 sm:pb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
          <h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h2>
        </div>
        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 flex-shrink-0 rounded">{items.filter(item => item.checked).length} SELECTED</span>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {displayedItems.length === 0 && !showAll && (
          <div className="py-4 text-center text-gray-400 dark:text-slate-500 text-[11px] sm:text-sm font-medium">None selected.</div>
        )}

        <div className="grid grid-cols-1 divide-y divide-gray-50 dark:divide-slate-800/50 -my-1.5 sm:-my-2">
          {displayedItems.map(item => (
            <div key={item.id} className="py-1.5 sm:py-2 transition-colors">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <label className="relative flex items-center cursor-pointer mt-0 shrink-0">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={event => onItemChange(item.id, 'checked', event.target.checked)}
                    className="peer appearance-none w-4 h-4 sm:w-5 sm:h-5 rounded bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 checked:bg-[#fcb7f0] dark:checked:bg-[#fcb7f0] checked:border-[#fcb7f0] dark:checked:border-[#fcb7f0] transition-all"
                  />
                  <Check size={12} strokeWidth={3} className="text-slate-800 dark:text-slate-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity sm:w-[14px] sm:h-[14px]" />
                </label>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex flex-col">
                      <span className={`text-[11px] sm:text-[13px] font-bold leading-snug ${item.checked ? 'text-gray-900 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400'}`}>{item.item}</span>
                      {item.note && <span className="text-[9px] sm:text-[11px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">{item.note}</span>}
                    </div>

                    {item.checked && (
                      <div className="animate-fadeIn shrink-0">
                        {item.type === 'radio' && item.options && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {item.options.map((option: Option) => (
                              <button
                                key={option.value}
                                disabled={item.disabled}
                                onClick={() => onItemChange(item.id, 'selectedValue', option.value)}
                                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all border ${item.selectedValue === option.value ? 'bg-[#fcb7f0] dark:bg-[#fcb7f0] border-[#fcb7f0] dark:border-[#fcb7f0] text-slate-800 dark:text-slate-800 shadow-sm' : 'bg-white dark:bg-[#151f32] text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#fcb7f0]/50 dark:hover:border-[#fcb7f0]/50'} ${item.disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.type === 'number-input' && (
                          <div className="flex gap-1.5 sm:gap-2">
                            {Array.isArray(item.value) ? item.value.map((value, index) => (
                              <input key={index} type="number" value={value} onChange={event => {
                                const newValue = [...item.value as string[]];
                                newValue[index] = event.target.value;
                                onItemChange(item.id, 'value', newValue);
                              }} placeholder={index === 0 ? 'Val 1' : 'Val 2'} className="w-16 sm:w-20 p-1.5 sm:p-2 bg-white dark:bg-[#101421] border border-gray-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-brand-primary/30 dark:focus:ring-brand-primary-dark/30 outline-none text-gray-800 dark:text-slate-200" />
                            )) : (
                              <input type="number" value={item.value as string} onChange={event => onItemChange(item.id, 'value', event.target.value)} placeholder="Value" className="w-16 sm:w-20 p-1.5 sm:p-2 bg-white dark:bg-[#101421] border border-gray-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-brand-primary/30 dark:focus:ring-brand-primary-dark/30 outline-none text-gray-800 dark:text-slate-200" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-50 dark:border-slate-800 flex justify-center">
        <button onClick={() => setShowAll(value => !value)} className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors uppercase tracking-wider py-1 sm:py-1.5 px-3 sm:px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
          {showAll ? <><>Hide Full List</> <ChevronUp size={12} className="sm:w-[14px] sm:h-[14px]" /></> : <>{showAllText} <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" /></>}
        </button>
      </div>
    </section>
  );
}
