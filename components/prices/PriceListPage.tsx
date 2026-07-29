import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, Tag } from 'lucide-react';
import { DBPrice, DBTool } from '../../configService';
import { CATEGORY_LABELS, CATEGORY_ORDER, TOOL_CATEGORIES, TOOL_ORDER, getToolDisplayName } from '../../toolCatalog';
import { CLINICAL_CATALOG } from '../../domain/catalog';
const PriceListPage = ({ tools, prices }: { tools: DBTool[], prices: DBPrice[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');

    const categorizedTools = useMemo(() => {
        const sortedTools = [...tools].sort((a, b) => {
            const orderA = typeof a.sort_order === 'number' ? a.sort_order : 0;
            const orderB = typeof b.sort_order === 'number' ? b.sort_order : 0;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            const idxA = TOOL_ORDER.indexOf(a.id);
            const idxB = TOOL_ORDER.indexOf(b.id);
            const fIdxA = idxA === -1 ? 999 : idxA;
            const fIdxB = idxB === -1 ? 999 : idxB;
            return fIdxA - fIdxB;
        });

        const groups: Record<string, { tool: DBTool, price: DBPrice }[]> = {};
        
        sortedTools.forEach(tool => {
            let category = tool.category || TOOL_CATEGORIES[tool.id] || 'Generals';
            if (!CATEGORY_ORDER.includes(category)) {
                category = 'Generals';
            }
            if (!groups[category]) groups[category] = [];
            
            const toolPrices = prices.filter(p => p.tool_id === tool.id);
            
            if (tool.id === 'ppv-set') {
                const machines = CLINICAL_CATALOG.vitrectomyMachines;
                machines.forEach(machine => {
                    const price23G = toolPrices.find(p => p.sub_key === `23G_${machine}`);
                    const price25G = toolPrices.find(p => p.sub_key === `25G_${machine}`);
                    
                    if (price23G && price25G) {
                        const isSamePrice = 
                            price23G.csmbs_price === price25G.csmbs_price &&
                            price23G.sss_price === price25G.sss_price &&
                            price23G.ucs_price === price25G.ucs_price;
                            
                        if (isSamePrice) {
                            groups[category].push({ 
                                tool, 
                                price: {
                                    ...price23G,
                                    display_name: price23G.display_name && price23G.display_name.startsWith('23G ')
                                        ? price23G.display_name.replace('23G ', '23G/25G ')
                                        : (price23G.display_name || `23G/25G ${machine}`)
                                } 
                            });
                        } else {
                            groups[category].push({ 
                                tool, 
                                price: {
                                    ...price23G,
                                    display_name: price23G.display_name || `23G ${machine}`
                                } 
                            });
                            groups[category].push({ 
                                tool, 
                                price: {
                                    ...price25G,
                                    display_name: price25G.display_name || `25G ${machine}`
                                } 
                            });
                        }
                    } else {
                        toolPrices.filter(p => p.sub_key?.endsWith(machine)).forEach(p => {
                            groups[category].push({ tool, price: p });
                        });
                    }
                });
            } else {
                toolPrices.forEach(price => {
                    groups[category].push({ tool, price });
                });
            }
        });

        return groups;
    }, [tools, prices]);

    const getRowDisplayName = (tool: DBTool, price: DBPrice): string =>
        price.display_name || getToolDisplayName(tool.id, tool.item, price.sub_key);

    const filteredGroups = useMemo(() => {
        const result: Record<string, { tool: DBTool, price: DBPrice }[]> = {};
        
        Object.keys(categorizedTools).forEach(category => {
            if (selectedCategory !== 'All' && category !== selectedCategory) {
                return;
            }
            
            const list = categorizedTools[category] || [];
            const filteredList = list.filter(({ tool, price }) => {
                const displayName = getRowDisplayName(tool, price).toLowerCase();
                const subKey = (price.sub_key || '').toLowerCase();
                const dbItemName = tool.item.toLowerCase();
                const query = searchTerm.toLowerCase().trim();
                
                if (!query) return true;
                
                return displayName.includes(query) || subKey.includes(query) || dbItemName.includes(query);
            });
            
            if (filteredList.length > 0) {
                result[category] = filteredList;
            }
        });
        
        return result;
    }, [categorizedTools, searchTerm, selectedCategory]);

    const categories = CATEGORY_ORDER;
    const categoryOptions = ['All', ...categories];

    return (
        <div className="space-y-4">
            {/* Filter and search controls above the card */}
            <div className="flex w-full items-center justify-between gap-2">
                {/* Category dropdown on narrow screens */}
                <div className="relative w-36 flex-none sm:hidden">
                    <select
                        value={selectedCategory}
                        onChange={event => setSelectedCategory(event.target.value)}
                        aria-label="Filter tools by category"
                        className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-100 dark:border-slate-800 rounded-xl pl-2.5 pr-8 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                    >
                        {categoryOptions.map(category => (
                            <option key={category} value={category}>
                                {CATEGORY_LABELS[category] || category}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                    />
                </div>

                {/* Category tabs when there is enough horizontal space */}
                <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5 sm:flex">
                    {categoryOptions.map(category => {
                        const isSelected = selectedCategory === category;
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                                    isSelected
                                        ? 'bg-[#fcb7f0] border-[#fcb7f0] text-slate-800 font-extrabold shadow-sm'
                                        : 'bg-white dark:bg-[#151f32] border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                }`}
                            >
                                {CATEGORY_LABELS[category] || category}
                            </button>
                        );
                    })}
                </div>

                {/* Search box */}
                <div className="relative w-36 flex-none">
                    <input
                        type="text"
                        placeholder="Search tools, keys..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#151f32] border border-gray-100 dark:border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Categorized Cards layout */}
            <div className="space-y-6">
                {Object.keys(filteredGroups).length === 0 ? (
                    <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                        No tools found matching search term "{searchTerm}"
                    </div>
                ) : (
                    categories.map(category => {
                        const items = filteredGroups[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <section 
                                key={category} 
                                className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300"
                            >
                                <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-50 dark:border-slate-800 pb-2 sm:pb-3">
                                    <div className="flex items-center gap-2">
                                        <Tag size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                        <h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                            {(() => {
                                                if (category.toLowerCase().includes('surgery')) return category;
                                                if (category === 'Generals') return 'General Surgery';
                                                return `${category} Surgery`;
                                            })()}
                                        </h2>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] sm:text-xs">
                                        <thead>
                                            <tr className="text-gray-400 dark:text-slate-500 border-b border-gray-50 dark:border-slate-800/50">
                                                <th className="py-2 px-2 font-bold uppercase tracking-wider w-1/2">Tool / Option</th>
                                                <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">CSMBS</th>
                                                <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">SSS / UCS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/30">
                                            {items.map(({ tool, price }, idx) => (
                                                <tr key={`${tool.id}-${price.sub_key || 'default'}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-2.5 px-2">
                                                        <span className="font-bold text-gray-900 dark:text-slate-200 tracking-tight">
                                                            {getRowDisplayName(tool, price)}
                                                        </span>
                                                        {tool.id !== 'glaucoma-device' && tool.id !== 'phaco-machine' && tool.id !== 'ppv-set' && price.sub_key && (
                                                            <span className="ml-2 text-[10px] text-gray-500 dark:text-slate-400 font-medium bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                                                                {price.sub_key}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right font-mono font-bold text-gray-900 dark:text-slate-200 whitespace-nowrap">
                                                        ฿{price.csmbs_price.toLocaleString()}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right font-mono font-bold text-gray-900 dark:text-slate-200 whitespace-nowrap">
                                                        ฿{price.ucs_price.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PriceListPage;
