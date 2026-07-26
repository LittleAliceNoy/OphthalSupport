import React, { useMemo, useState } from 'react';
import { Search, Tag } from 'lucide-react';
import { DBPrice, DBTool } from '../../configService';

const PriceListPage = ({ tools, prices }: { tools: DBTool[], prices: DBPrice[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');

    const TOOL_CATEGORIES: Record<string, string> = {
        '15-degree-blade': 'Generals',
        'slit-knife': 'Generals',
        'crescent-knife': 'Generals',
        'phaco-machine': 'Lens Surgery',
        'zeiss-quattro': 'Lens Surgery',
        'basic-phaco-pack': 'Lens Surgery',
        'ctr-no': 'Lens Surgery',
        'cts': 'Lens Surgery',
        'iris-retractor': 'Lens Surgery',
        'ppv-set': 'Retinal Surgery',
        'bbg': 'Retinal Surgery',
        'ilm-forceps': 'Retinal Surgery',
        'micro-scissor': 'Retinal Surgery',
        'silicone-oil': 'Retinal Surgery',
        'silicone-oil-hd': 'Retinal Surgery',
        'endolaser': 'Retinal Surgery',
        'dk-line': 'Retinal Surgery',
        'soft-tip': 'Retinal Surgery',
        'glaucoma-device': 'Glaucoma',
        'punch-trephine': 'Cornea',
        '5fu': 'Generals',
        'fibrin-glue': 'Generals',
    };

    const categorizedTools = useMemo(() => {
        const TOOL_ORDER = [
            'phaco-machine',
            'zeiss-quattro',
            'basic-phaco-pack',
            'ctr-no',
            'cts',
            'iris-retractor',
            'ppv-set',
            'bbg',
            'ilm-forceps',
            'micro-scissor',
            'silicone-oil',
            'silicone-oil-hd',
            'endolaser',
            'dk-line',
            'soft-tip',
            'glaucoma-device',
            'punch-trephine',
            '15-degree-blade',
            'slit-knife',
            'crescent-knife',
            '5fu',
            'fibrin-glue'
        ];

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
            if (!['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Generals'].includes(category)) {
                category = 'Generals';
            }
            if (!groups[category]) groups[category] = [];
            
            const toolPrices = prices.filter(p => p.tool_id === tool.id);
            
            if (tool.id === 'ppv-set') {
                const machines = ['Constellation', 'Stellaris'];
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

    const getRowDisplayName = (tool: DBTool, price: DBPrice): string => {
        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

        if (price.display_name) return price.display_name;
        if (tool.id === 'ctr-no') return 'Capsular Tension Ring';
        if (tool.id === 'cts') return 'Capsular Tension Segment';
        if (tool.id === 'glaucoma-device' && price.sub_key) {
            if (price.sub_key === 'gdi-xen-room') return 'XEN glaucoma gel implant';
            if (price.sub_key === 'aadi-shunt') return 'AADI shunt';
            if (price.sub_key === 'gfd-express') return 'Express GFD';
            return capitalize(price.sub_key.replace(/-/g, ' '));
        }
        if (tool.id === 'phaco-machine' && price.sub_key) {
            return `${capitalize(price.sub_key)} phaco machine`;
        }
        if (tool.id === 'ppv-set' && price.sub_key) {
            const parts = price.sub_key.split('_');
            const machine = parts.length > 1 ? parts[1] : parts[0];
            return `23G/25G ${capitalize(machine)}`;
        }
        if (tool.id === 'soft-tip') return 'Soft tip';
        return tool.item;
    };

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

    const categories = ['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Generals'];

    return (
        <div className="space-y-4">
            {/* Filter and search controls above the card */}
            <div className="flex flex-row items-center justify-between gap-2 w-full flex-wrap sm:flex-nowrap">
                {/* Category Filter Tabs styled as floating buttons */}
                <div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-1 max-w-full select-none py-0.5 shrink-0">
                    {['All', ...categories].map(cat => {
                        const isSelected = selectedCategory === cat;
                        const labelMap: Record<string, string> = {
                            'All': 'All',
                            'Lens Surgery': 'Lens',
                            'Retinal Surgery': 'Retina',
                            'Glaucoma': 'Glaucoma',
                            'Cornea': 'Cornea',
                            'Generals': 'Generals',
                        };
                        const displayLabel = labelMap[cat] || cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${
                                    isSelected
                                        ? 'bg-[#fcb7f0] border-[#fcb7f0] text-slate-800 font-extrabold shadow-sm scale-105'
                                        : 'bg-white dark:bg-[#151f32] border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                }`}
                            >
                                {displayLabel}
                            </button>
                        );
                    })}
                </div>
                
                {/* Search Box styled as floating box (shortened) */}
                <div className="relative max-w-[150px] sm:max-w-[180px] md:max-w-xs w-full">
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
