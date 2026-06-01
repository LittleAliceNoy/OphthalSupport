import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity,
    Asterisk,
    Calculator,
    CheckCircle,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Eye,
    FileText,
    Settings,
    User,
    Plus,
    Trash2,
    RefreshCw,
    Moon,
    Sun,
    ListChecks,
    Check,
    Syringe,
    Tag,
    Edit3,
    Save,
    X,
    ShieldCheck,
    AlertCircle,
    Layers,
    Box,
    History,
    Cloud,
    ExternalLink,
    Database,
    Filter,
    ChevronRight,
    Search,
    Scissors,
    Zap,
    Wind,
    Stethoscope
} from 'lucide-react';

import {
    ANESTHESIA_TYPES,
    COVERAGE_TYPES,
    SURGEON_GROUPS,
    CENTURION_PREFERRED_SURGEONS,
    MACHINE_TYPES,
    PPV_SIZES,
    MP_TYPES,
    GDI_TYPES,
    PPV_TYPES,
    NEW_REUSED_OPTIONS,
    ChecklistItemData,
    PatientSession,
    Option
} from './constants';
import { fetchConfig, DBTool, DBAction, DBOperation, DBRule, DBPrice, updateTool, createTool, deleteTool, upsertPrice } from './configService';

// --- Constants ---
const TOOL_CATEGORIES_LIST = ['Lens Surgery', 'Retina', 'Glaucoma', 'Cornea', 'General'];

const TOOL_CATEGORIES: Record<string, string> = {
    '15-degree-blade': 'General',
    'slit-knife': 'General',
    'crescent-knife': 'General',
    'centurion-legion': 'Lens Surgery',
    'zeiss-quattro': 'Lens Surgery',
    'basic-phaco-pack': 'Lens Surgery',
    'ctr-no': 'Lens Surgery',
    'cts': 'Lens Surgery',
    'iris-retractor': 'Lens Surgery',
    'ppv-set': 'Retina',
    'bbg': 'Retina',
    'ilm-forceps': 'Retina',
    'micro-scissor': 'Retina',
    'silicone-oil': 'Retina',
    'silicone-oil-hd': 'Retina',
    'endolaser': 'Retina',
    'dk-line': 'Retina',
    'soft-tip': 'Retina',
    'glaucoma-device': 'Glaucoma',
    'punch-trephine': 'Cornea',
    '5fu': 'General',
    'fibrin-glue': 'General',
};

// --- Utility Functions ---
function normalizeText(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]/g, ' ');
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function getSurgeonGroup(name: string) {
    if (!name) return '';
    for (const [group, names] of Object.entries(SURGEON_GROUPS)) {
        if (names.some(n => name.includes(n))) return group;
    }
    return '';
}

function getSurgeonGroupColorClass(group: string) {
    const g = (group || '').toUpperCase();
    if (g === 'A') return 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-900 border-emerald-600 dark:border-emerald-500 shadow-sm';
    if (g === 'B') return 'bg-pink-500 dark:bg-pink-400 text-white dark:text-slate-900 border-pink-600 dark:border-pink-500 shadow-sm';
    if (g === 'C') return 'bg-brand-secondary dark:bg-brand-secondary-dark text-white dark:text-brand-neutral-dark border-brand-secondary dark:border-brand-secondary-dark shadow-sm';
    if (g === 'D') return 'bg-cyan-600 dark:bg-brand-tertiary-dark text-white dark:text-brand-neutral-dark border-cyan-600 dark:border-brand-tertiary-dark shadow-sm';
    return 'bg-gray-500 dark:bg-slate-400 text-white dark:text-slate-900 border-gray-600 dark:border-slate-500 shadow-sm';
}

function calculateCostAndBreakdown(tools: ChecklistItemData[], healthCoverage: string, session: PatientSession, prices: DBPrice[]) {
    let total = 0;
    const breakdown: { name: string, price: number, isReused: boolean, id: string }[] = [];
    
    tools.forEach(tool => {
        if (tool.checked) {
            let price = 0;
            let isReused = tool.selectedValue === NEW_REUSED_OPTIONS.REUSED;
            const coverageKey = (healthCoverage.toLowerCase() + '_price') as keyof DBPrice;

            if (tool.id === 'ppv-set') {
                const tipSize = session.diagnosis.includes("25G") ? "25G" : "23G";
                const machine = tool.selectedValue; 
                const subKey = machine ? `${tipSize}_${machine}` : null;
                const priceRow = prices.find(p => p.tool_id === tool.id && p.sub_key === subKey);
                price = isReused ? 0 : Number(priceRow?.[coverageKey] || 0);
            } else if (tool.type === 'radio' && tool.selectedValue && !isReused) {
                const priceRow = prices.find(p => p.tool_id === tool.id && p.sub_key === tool.selectedValue) || 
                                 prices.find(p => p.tool_id === tool.id && p.sub_key === null);
                price = Number(priceRow?.[coverageKey] || 0);
            } else {
                const priceRow = prices.find(p => p.tool_id === tool.id && p.sub_key === null);
                price = isReused ? 0 : Number(priceRow?.[coverageKey] || 0);
            }

            total += price;
            
            let displayName = tool.item;
            const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
            const gauge = session.diagnosis.includes("25G") ? "25G" : (session.diagnosis.includes("23G") ? "23G" : "");

            if (tool.id === 'ctr-no') displayName = 'Capsular tension ring';
            else if (tool.id === 'centurion-legion' && tool.selectedValue) displayName = `${capitalize(tool.selectedValue)} machine`;
            else if (tool.id === 'ppv-set' && tool.selectedValue) displayName = `${gauge} ${capitalize(tool.selectedValue)}`.trim();
            else if (tool.id === 'soft-tip') displayName = `${gauge} Soft tip`.trim();
            
            breakdown.push({ id: tool.id, name: displayName, price, isReused });
        }
    });
    return { total, breakdown };
}

const applyMpToolsLogic = (tools: ChecklistItemData[], mpTypes: string[], diagnosis: string): ChecklistItemData[] => {
    const newTools = JSON.parse(JSON.stringify(tools));
    const needBbgIlm = mpTypes.includes('ERM') || mpTypes.includes('MH');
    const needScissors = mpTypes.includes('TRD');
    const is25G = diagnosis.includes('25G');

    const bbg = newTools.find((t: any) => t.id === 'bbg');
    const ilm = newTools.find((t: any) => t.id === 'ilm-forceps');
    const scissors = newTools.find((t: any) => t.id === 'micro-scissor');
    
    if (bbg) bbg.checked = needBbgIlm;
    
    if (ilm) {
        ilm.checked = needBbgIlm;
        if (needBbgIlm) {
            if (is25G) {
                ilm.selectedValue = NEW_REUSED_OPTIONS.NEW;
                ilm.disabled = true;
                ilm.note = '25G items must be NEW';
            } else if (!ilm.selectedValue) {
                ilm.selectedValue = NEW_REUSED_OPTIONS.NEW;
            }
        } else {
            ilm.disabled = false;
        }
    }
    
    if (scissors) {
        scissors.checked = needScissors;
        if (needScissors) {
            if (is25G) {
                scissors.selectedValue = NEW_REUSED_OPTIONS.NEW;
                scissors.disabled = true;
                scissors.note = '25G items must be NEW';
            } else {
                scissors.disabled = false;
            }
        } else {
            scissors.disabled = false;
        }
    }
    
    return newTools;
};

// --- Components ---

const ChecklistSection = ({ title, items, onItemChange, colorClass, showAllText = "Show All", icon: Icon = ListChecks }: { title: string, items: ChecklistItemData[], onItemChange: (id: string, key: string, value: any) => void, colorClass: string, showAllText?: string, icon?: React.ElementType }) => {
    const [showAll, setShowAll] = useState(false);
    const displayedItems = showAll ? items : items.filter(i => i.checked || i.autoPopulated);

    return (
        <section className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-50 dark:border-slate-800 pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    <h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h2>
                </div>
                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 flex-shrink-0 rounded">{items.filter(i => i.checked).length} SELECTED</span>
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
                                        onChange={e => onItemChange(item.id, 'checked', e.target.checked)} 
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
                                                        {item.options.map((opt: any) => (
                                                            <button 
                                                                key={opt.value} 
                                                                disabled={item.disabled}
                                                                onClick={() => onItemChange(item.id, 'selectedValue', opt.value)} 
                                                                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all border ${
                                                                    item.selectedValue === opt.value 
                                                                    ? 'bg-[#fcb7f0] dark:bg-[#fcb7f0] border-[#fcb7f0] dark:border-[#fcb7f0] text-slate-800 dark:text-slate-800 shadow-sm' 
                                                                    : 'bg-white dark:bg-[#151f32] text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#fcb7f0]/50 dark:hover:border-[#fcb7f0]/50'
                                                                } ${item.disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.type === 'number-input' && (
                                                    <div className="flex gap-1.5 sm:gap-2">
                                                        {Array.isArray(item.value) ? item.value.map((v, idx) => (
                                                            <input key={idx} type="number" value={v} onChange={e => {
                                                                const newValue = [...(item.value as string[])];
                                                                newValue[idx] = e.target.value;
                                                                onItemChange(item.id, 'value', newValue);
                                                            }} placeholder={idx === 0 ? "Val 1" : "Val 2"} className="w-16 sm:w-20 p-1.5 sm:p-2 bg-white dark:bg-[#101421] border border-gray-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-brand-primary/30 dark:focus:ring-brand-primary-dark/30 outline-none text-gray-800 dark:text-slate-200"/>
                                                        )) : (
                                                            <input type="number" value={item.value as string} onChange={e => onItemChange(item.id, 'value', e.target.value)} placeholder="Value" className="w-16 sm:w-20 p-1.5 sm:p-2 bg-white dark:bg-[#101421] border border-gray-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-brand-primary/30 dark:focus:ring-brand-primary-dark/30 outline-none text-gray-800 dark:text-slate-200"/>
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
                <button onClick={() => setShowAll(!showAll)} className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors uppercase tracking-wider py-1 sm:py-1.5 px-3 sm:px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                    {showAll ? (
                        <>Hide Full List <ChevronUp size={12} className="sm:w-[14px] sm:h-[14px]" /></>
                    ) : (
                        <>{showAllText} <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" /></>
                    )}
                </button>
            </div>
        </section>
    );
};

const ToolIcon = ({ id, className = "w-5 h-5" }: { id: string, className?: string }) => {
    if (id.includes('knife') || id.includes('blade')) return <Scissors className={className} />;
    if (id.includes('centurion') || id.includes('phaco')) return <Zap className={className} />;
    if (id.includes('glaucoma')) return <Stethoscope className={className} />;
    if (id.includes('forceps') || id.includes('scissor')) return <Scissors className={className} />;
    if (id.includes('ppv') || id.includes('retinal')) return <Wind className={className} />;
    return <Box className={className} />;
};

const PriceListPage = ({ tools, prices, onAdminClick }: { tools: DBTool[], prices: DBPrice[], onAdminClick?: () => void }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    
    const getDisplayName = (tool: DBTool, price: DBPrice) => {
        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        if (tool.id === 'ctr-no') return 'Capsular Tension Ring';
        if (tool.id === 'cts') return 'Capsular Tension Segment';
        if (tool.id === 'glaucoma-device' && price.sub_key) {
            if (price.sub_key === 'gdi-xen-room') return 'XEN glaucoma gel implant';
            if (price.sub_key === 'aadi-shunt') return 'AADI shunt';
            if (price.sub_key === 'gfd-express') return 'Express GFD';
            return capitalize(price.sub_key.replace(/-/g, ' '));
        }
        if (tool.id === 'centurion-legion' && price.sub_key) return `${capitalize(price.sub_key)} phaco machine`;
        if (tool.id === 'ppv-set' && price.sub_key) {
            const parts = price.sub_key.split('_');
            return `23G/25G ${capitalize(parts.length > 1 ? parts[1] : parts[0])}`;
        }
        if (tool.id === 'soft-tip') return 'Soft tip';
        return tool.item;
    };

    const categorizedTools = useMemo(() => {
        const groups: Record<string, { tool: DBTool, price: DBPrice }[]> = {};
        const lowerSearch = searchTerm.toLowerCase();
        
        tools.forEach(tool => {
            const category = TOOL_CATEGORIES[tool.id] || 'Others';
            if (!groups[category]) groups[category] = [];
            
            const toolPrices = prices.filter(p => p.tool_id === tool.id);
            
            if (tool.id === 'ppv-set') {
                const machineGroups: Record<string, DBPrice> = {};
                toolPrices.forEach(price => {
                    const machineName = price.sub_key?.split('_')[1] || price.sub_key || 'Unknown';
                    if (!machineGroups[machineName]) {
                        machineGroups[machineName] = price;
                    }
                });
                Object.values(machineGroups).forEach(price => {
                    const displayName = getDisplayName(tool, price);
                    if (!searchTerm || displayName.toLowerCase().includes(lowerSearch) || category.toLowerCase().includes(lowerSearch)) {
                        groups[category].push({ tool, price });
                    }
                });
            } else {
                toolPrices.forEach(price => {
                    const displayName = getDisplayName(tool, price);
                    if (!searchTerm || displayName.toLowerCase().includes(lowerSearch) || category.toLowerCase().includes(lowerSearch)) {
                        groups[category].push({ tool, price });
                    }
                });
            }
        });

        Object.keys(groups).forEach(category => {
            groups[category].sort((a, b) => {
                const nameA = getDisplayName(a.tool, a.price).toLowerCase();
                const nameB = getDisplayName(b.tool, b.price).toLowerCase();
                return nameA.localeCompare(nameB);
            });
        });

        return groups;
    }, [tools, prices, searchTerm]);

    const categories = ['All', ...TOOL_CATEGORIES_LIST];
    const categoriesToRender = selectedCategory === 'All' ? TOOL_CATEGORIES_LIST : [selectedCategory];

    return (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                selectedCategory === cat 
                                ? 'bg-[#fcb7f0] text-slate-800 border-[#fcb7f0] shadow-sm' 
                                : 'bg-white dark:bg-[#151f32] text-gray-400 dark:text-slate-500 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 shrink-0">
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8e5a7d] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search tools..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#fcb7f0]/30 outline-none border border-gray-100 dark:border-slate-800 focus:border-[#fcb7f0] w-40 sm:w-64 transition-all shadow-sm"
                        />
                    </div>
                    <button onClick={onAdminClick} className="flex items-center gap-2 px-4 py-2 bg-[#fcb7f0] text-slate-800 rounded-xl text-xs font-bold hover:shadow-md transition-all">
                        <Plus size={14} strokeWidth={3} /> New Item
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {categoriesToRender.map(category => {
                    const items = categorizedTools[category] || [];
                    if (items.length === 0) return null;

                    return (
                        <section key={category} className="bg-white dark:bg-[#151f32] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-slate-800 pb-3">
                                <Box size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
                                <h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-[0.15em]">
                                    {category}
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {items.map(({ tool, price }, idx) => {
                                    const isReusable = tool.type === 'radio' || tool.id === 'ppv-set' || tool.id === 'centurion-legion';
                                    return (
                                        <div key={`${tool.id}-${price.sub_key}-${idx}`} className="group relative">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-transparent hover:border-[#fcb7f0]/30 transition-all">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-gray-400 group-hover:text-[#8e5a7d] transition-colors shadow-sm shrink-0">
                                                        <ToolIcon id={tool.id} className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight mb-1 truncate">
                                                            {getDisplayName(tool, price)}
                                                        </h4>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter inline-block ${isReusable ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
                                                            {isReusable ? 'Reusable' : 'Single-use'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800/50 rounded-xl px-3 py-2 shadow-sm border border-gray-50 dark:border-slate-800 sm:w-[320px] shrink-0">
                                                    <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] items-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[7px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">UCS</span>
                                                            <span className="text-[11px] font-mono font-bold text-gray-900 dark:text-slate-200">฿{price.ucs_price.toLocaleString()}</span>
                                                        </div>
                                                        <div className="w-[1px] h-6 bg-gray-100 dark:bg-slate-700"></div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[7px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">SSS</span>
                                                            <span className="text-[11px] font-mono font-bold text-gray-900 dark:text-slate-200">฿{price.sss_price.toLocaleString()}</span>
                                                        </div>
                                                        <div className="w-[1px] h-6 bg-gray-100 dark:bg-slate-700"></div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[7px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">CSMBS</span>
                                                            <span className="text-[11px] font-mono font-bold text-gray-900 dark:text-slate-200">฿{price.csmbs_price.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

const AdminPage = ({ tools, prices, operations, rules, onRefresh, actions }: { tools: DBTool[], prices: DBPrice[], operations: DBOperation[], rules: DBRule[], actions: DBAction[], onRefresh: () => void }) => {
    const [editingPrice, setEditingPrice] = useState<{tool_id: string, sub_key: string | null} | null>(null);
    const [priceForm, setPricePriceForm] = useState<DBPrice | null>(null);
    const [editingTool, setEditingTool] = useState<string | null>(null);
    const [toolForm, setToolForm] = useState<Partial<DBTool> | null>(null);
    const [isAddingTool, setIsAddingTool] = useState(false);
    const [newToolForm, setNewToolForm] = useState({ item: '', category: 'Others' });
    const [isSaving, setIsSaving] = useState(false);

    const handleEditPrice = (price: DBPrice) => {
        setEditingPrice({ tool_id: price.tool_id, sub_key: price.sub_key });
        setPricePriceForm({ ...price });
    };

    const handleSavePrice = async () => {
        if (!priceForm) return;
        setIsSaving(true);
        try {
            await upsertPrice(priceForm);
            setEditingPrice(null);
            onRefresh();
        } catch (err) {
            alert('Failed to save price');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditTool = (tool: DBTool) => {
        setEditingTool(tool.id);
        setToolForm({ ...tool });
    };

    const handleSaveTool = async () => {
        if (!toolForm || !editingTool) return;
        setIsSaving(true);
        try {
            await updateTool(editingTool, toolForm);
            setEditingTool(null);
            onRefresh();
        } catch (err) {
            alert('Failed to save tool');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTool = async (id: string) => {
        if (!confirm('Are you sure you want to remove this tool?')) return;
        setIsSaving(true);
        try {
            await deleteTool(id);
            onRefresh();
        } catch (err) {
            alert('Failed to delete tool');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTool = async () => {
        if (!newToolForm.item) return;
        setIsSaving(true);
        try {
            const tool = await createTool({
                item: newToolForm.item,
                type: 'checkbox',
                options: null,
                default_value: null
            });
            if (tool) {
                await upsertPrice({
                    tool_id: tool.id,
                    sub_key: null,
                    csmbs_price: 0,
                    sss_price: 0,
                    ucs_price: 0
                });
            }
            setIsAddingTool(false);
            setNewToolForm({ item: '', category: 'Others' });
            onRefresh();
        } catch (err) {
            alert('Failed to add tool');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-fadeIn relative pb-20 max-w-6xl mx-auto">
             {/* Price Editor Modal */}
             {editingPrice && priceForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a233a] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xs font-headline font-bold uppercase tracking-widest text-slate-500">Edit Price</h3>
                            <button onClick={() => setEditingPrice(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">CSMBS Price (฿)</label>
                                <input type="number" className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-[#fcb7f0] outline-none" value={priceForm.csmbs_price} onChange={e => setPricePriceForm({...priceForm, csmbs_price: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">SSS Price (฿)</label>
                                <input type="number" className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-[#fcb7f0] outline-none" value={priceForm.sss_price} onChange={e => setPricePriceForm({...priceForm, sss_price: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">UCS / UC Price (฿)</label>
                                <input type="number" className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-[#fcb7f0] outline-none" value={priceForm.ucs_price} onChange={e => setPricePriceForm({...priceForm, ucs_price: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-900/50 flex gap-3">
                            <button onClick={() => setEditingPrice(null)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">Cancel</button>
                            <button onClick={handleSavePrice} disabled={isSaving} className="flex-1 py-3 bg-[#fcb7f0] text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tool Editor Modal */}
            {editingTool && toolForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a233a] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xs font-headline font-bold uppercase tracking-widest text-slate-500">Edit Tool</h3>
                            <button onClick={() => setEditingTool(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Tool Name</label>
                                <input type="text" className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-[#fcb7f0] outline-none" value={toolForm.item || ''} onChange={e => setToolForm({...toolForm, item: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-900/50 flex gap-3">
                            <button onClick={() => setEditingTool(null)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">Cancel</button>
                            <button onClick={handleSaveTool} disabled={isSaving} className="flex-1 py-3 bg-[#fcb7f0] text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Management Section */}
            <section className="bg-white dark:bg-[#151f32] rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-8 border-b border-gray-50 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <Layers size={20} className="text-[#8e5a7d]" strokeWidth={2.5} />
                        <h2 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-[0.15em]">Price Management</h2>
                    </div>
                    <button onClick={() => setIsAddingTool(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#fcb7f0] text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all">
                        <Plus size={16} strokeWidth={3} /> New Item
                    </button>
                </div>

                {isAddingTool && (
                    <div className="mb-8 p-6 bg-gray-50 dark:bg-slate-900/50 rounded-3xl border border-gray-100 dark:border-slate-800 animate-fadeIn">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">New Inventory Item</h4>
                            <button onClick={() => setIsAddingTool(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                placeholder="Item Name (e.g. 15-degree blade)" 
                                className="flex-1 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm font-bold outline-none focus:ring-2 focus:ring-[#fcb7f0]"
                                value={newToolForm.item}
                                onChange={e => setNewToolForm({ ...newToolForm, item: e.target.value })}
                            />
                            <button onClick={handleAddTool} className="px-8 py-4 bg-[#fcb7f0] text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all">
                                <Save size={16} /> Create Item
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {tools.map(tool => {
                        const price = prices.find(p => p.tool_id === tool.id) || { tool_id: tool.id, sub_key: null, csmbs_price: 0, sss_price: 0, ucs_price: 0 };
                        return (
                            <div key={tool.id} className="p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-gray-100 dark:border-slate-800/50 group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-gray-400 group-hover:text-[#8e5a7d] transition-colors shadow-sm">
                                            <ToolIcon id={tool.id} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{tool.item}</h4>
                                                <button onClick={() => handleEditTool(tool)} className="p-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={12}/></button>
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ID: {tool.id}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-1 max-w-md items-center justify-around bg-white dark:bg-slate-800/50 rounded-xl px-6 py-2 shadow-sm border border-gray-50 dark:border-slate-800">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] font-black uppercase text-gray-400 tracking-wider">UCS</span>
                                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-slate-200">฿{price.ucs_price.toLocaleString()}</span>
                                        </div>
                                        <div className="w-[1px] h-6 bg-gray-100 dark:bg-slate-700"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] font-black uppercase text-gray-400 tracking-wider">SSS</span>
                                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-slate-200">฿{price.sss_price.toLocaleString()}</span>
                                        </div>
                                        <div className="w-[1px] h-6 bg-gray-100 dark:bg-slate-700"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] font-black uppercase text-gray-400 tracking-wider">CSMBS</span>
                                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-slate-200">฿{price.csmbs_price.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <button onClick={() => handleEditPrice(price as DBPrice)} className="p-2.5 text-gray-400 hover:text-[#8e5a7d] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteTool(tool.id)} className="p-2.5 text-gray-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Procedure Config Section */}
            <section className="bg-white dark:bg-[#151f32] rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-8 border-b border-gray-50 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <Settings size={20} className="text-[#8e5a7d]" strokeWidth={2.5} />
                        <h2 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-[0.15em]">Automation Rules</h2>
                    </div>
                    <button className="text-[10px] font-black text-[#8e5a7d] hover:text-[#fcb7f0] transition-colors uppercase tracking-widest border-b border-[#8e5a7d] pb-0.5">
                        Mapping Tool
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {operations.map(op => {
                        const opRules = rules.filter(r => r.operation_id === op.id);
                        return (
                            <div key={op.id} className="p-5 bg-gray-50/50 dark:bg-slate-900/30 rounded-3xl border border-gray-100 dark:border-slate-800/50 flex flex-col h-full hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all group">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="space-y-0.5">
                                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{op.name}</h4>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{op.category}</p>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${opRules.length > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                                        {opRules.length > 0 ? `${opRules.length} Automated` : 'Manual'}
                                    </span>
                                </div>
                                
                                <div className="flex-1 space-y-4 mb-5">
                                    {opRules.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Will Auto-Check:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {opRules.map((rule, rid) => {
                                                    const target = rule.target_type === 'action' 
                                                        ? actions.find(a => a.id === rule.target_id)
                                                        : tools.find(t => t.id === rule.target_id);
                                                    return (
                                                        <span key={rid} className="px-2 py-1 bg-white dark:bg-slate-800 text-[10px] font-bold text-gray-700 dark:text-slate-300 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center gap-1 shadow-sm">
                                                            <CheckCircle size={10} className="text-emerald-500" />
                                                            {target?.item || rule.target_id}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Trigger Keywords:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {op.keywords.map(k => (
                                                <span key={k} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-900 text-[9px] font-bold text-[#8e5a7d] dark:text-brand-primary-dark rounded-md italic">
                                                    #{k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <button className="w-full py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 text-[9px] font-bold text-gray-400 uppercase tracking-widest rounded-xl hover:text-[#8e5a7d] hover:border-[#fcb7f0] transition-all">
                                    Edit Mapping
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [config, setConfig] = useState<{tools: DBTool[], actions: DBAction[], operations: DBOperation[], rules: DBRule[], prices: DBPrice[]} | null>(null);

    const refreshData = async () => {
        const data = await fetchConfig();
        setConfig(data);
    };

    useEffect(() => {
        const load = async () => {
            const data = await fetchConfig();
            setConfig(data);
            
            const initialActions: ChecklistItemData[] = data.actions.map(a => ({
                id: a.id, item: a.item, type: 'checkbox', checked: false
            }));
            const initialTools: ChecklistItemData[] = data.tools.map(t => {
                const isCtr = t.id === 'ctr-no';
                return {
                    id: t.id,
                    item: isCtr ? 'CTR No.' : t.item,
                    type: (isCtr ? 'number-input' : t.type) as any,
                    options: t.options,
                    checked: false, 
                    selectedValue: t.type === 'radio' ? t.default_value : null,
                    value: isCtr ? '' : (t.type === 'number-input' ? (Array.isArray(t.default_value) ? t.default_value : ['', '']) : '')
                };
            });

            setSession(prev => ({
                ...prev,
                actions: initialActions,
                tools: initialTools
            }));
        };
        load();
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const allSurgeonNames = useMemo(() => Object.values(SURGEON_GROUPS).flat().sort(), []);
    
    const groupedOperations = useMemo(() => {
        if (!config) return {} as Record<string, DBOperation[]>;
        const groups: Record<string, DBOperation[]> = {};
        config.operations.forEach(op => {
            if (!groups[op.category]) groups[op.category] = [];
            groups[op.category].push(op);
        });
        return groups;
    }, [config]);
    
    const initialSession: PatientSession = {
        id: generateUUID(),
        diagnosis: '',
        operationInput: '',
        surgeonName: '',
        anesthesiaType: ANESTHESIA_TYPES.LA,
        healthCoverage: COVERAGE_TYPES.UCS,
        actions: [],
        tools: [],
        mpSelectedTypes: [],
        updatedAt: new Date()
    };

    const [session, setSession] = useState<PatientSession>(initialSession);
    const [currentView, setCurrentView] = useState<'checklist' | 'inventory' | 'admin'>('checklist');

    const calculateAutoChecklistDB = (currentSession: PatientSession) => {
        if (!config) return { actions: currentSession.actions, tools: currentSession.tools, mpSelectedTypes: currentSession.mpSelectedTypes };

        const rawOpText = currentSession.operationInput + ' ' + (currentSession.diagnosis || '');
        const normalizedOpText = normalizeText(rawOpText);
        
        let newActions = JSON.parse(JSON.stringify(currentSession.actions)).map((a: any) => ({ ...a, checked: false, autoPopulated: false }));
        let newTools = JSON.parse(JSON.stringify(currentSession.tools)).map((t: any) => ({ ...t, checked: false, autoPopulated: false }));
        let showMp = false;

        if (currentSession.anesthesiaType === ANESTHESIA_TYPES.LA) {
            const isTxOrGdi = /\btx\b/.test(normalizedOpText) || normalizedOpText.includes('trabeculectomy') || /\bgdi\b/.test(normalizedOpText) || normalizedOpText.includes('drainage implant') || normalizedOpText.includes('xen');
            const isOculoOrStrabismus = normalizedOpText.includes('oculoplastic') || normalizedOpText.includes('strabismus') || normalizedOpText.includes('squint') || normalizedOpText.includes('ptosis') || normalizedOpText.includes('frontalis') || normalizedOpText.includes('sling') || normalizedOpText.includes('lid') || normalizedOpText.includes('entropion') || normalizedOpText.includes('ectropion') || normalizedOpText.includes('blepharoplasty') || normalizedOpText.includes('edcr') || normalizedOpText.includes('dcr');
            if (!isTxOrGdi && !isOculoOrStrabismus) {
                const axl = newActions.find((a: any) => a.id === 'axl');
                if (axl) { axl.checked = true; axl.autoPopulated = true; }
            }
        }

        config.operations.forEach(op => {
            const isMatch = op.keywords.some(k => {
                const normalizedKeyword = normalizeText(k).trim();
                if (normalizedKeyword.length <= 2) {
                    const regex = new RegExp(`\\b${normalizedKeyword}\\b`);
                    return regex.test(normalizedOpText);
                }
                return normalizedOpText.includes(normalizedKeyword);
            });

            if (isMatch) {
                const opRules = config.rules.filter(r => r.operation_id === op.id);
                opRules.forEach(rule => {
                    const list = rule.target_type === 'action' ? newActions : newTools;
                    const item = list.find((i: any) => i.id === rule.target_id);
                    if (item) {
                        item.checked = true;
                        item.autoPopulated = true;
                        if (rule.default_selected_value) item.selectedValue = rule.default_selected_value;
                    }
                });
                if (op.name === "MP") showMp = true;
                if (op.category === "Lens Surgery" || op.category === "Retinal Surgery") {
                    const axl = newActions.find((a: any) => a.id === 'axl');
                    if (axl) { axl.checked = true; axl.autoPopulated = true; }
                }
            }
        });

        const ctrTool = newTools.find((t: any) => t.id === 'ctr-no');
        if (ctrTool && ctrTool.checked) {
            ctrTool.note = 'AXL<24: no.12, AXL 24-28: no.13, AXL>28: no.14';
        }

        let finalMpTypes: string[] = []; 
        const isMpActive = normalizedOpText.includes('mp') || normalizedOpText.includes('membrane peeling') || normalizedOpText.includes('ilm') || showMp;
        if (isMpActive) {
            const diags = (currentSession.diagnosis || '').split(',').map(s => s.trim());
            const mpKeywords = ['ERM', 'MH', 'TRD', 'RRD'];
            mpKeywords.forEach(k => { if (diags.includes(k) || normalizedOpText.includes(k.toLowerCase())) finalMpTypes.push(k); });
            if (normalizedOpText.includes('epiretinal')) finalMpTypes.push('ERM');
            if (normalizedOpText.includes('macular hole')) finalMpTypes.push('MH');
            if (normalizedOpText.includes('ilm')) finalMpTypes.push('ERM');
        }
        newTools = applyMpToolsLogic(newTools, [...new Set(finalMpTypes)], currentSession.diagnosis);

        if (normalizedOpText.includes('phaco')) {
            const machineTool = newTools.find((t: any) => t.id === 'centurion-legion');
            if (machineTool) {
                machineTool.checked = true;
                machineTool.autoPopulated = true;
                const normalizedSurgeon = normalizeText(currentSession.surgeonName);
                const prefersCenturion = CENTURION_PREFERRED_SURGEONS.some(s => normalizedSurgeon.includes(normalizeText(s).trim()));
                if (normalizedOpText.includes('stellaris')) machineTool.selectedValue = MACHINE_TYPES.STELLARIS;
                else machineTool.selectedValue = prefersCenturion ? MACHINE_TYPES.CENTURION : MACHINE_TYPES.LEGION;
            }
        }

        const gdiTool = newTools.find((t: any) => t.id === 'glaucoma-device');
        if (gdiTool) {
            const gdiKeywords: Record<string, string[]> = {
                'ahmed-valve': ['ahmed'],
                'gdi-xen-room': ['xen'],
                'gfd-express': ['express', 'gfd'],
                'preserflo-shunt': ['preserflo'],
                'aadi-shunt': ['aadi']
            };
            for (const [val, keywords] of Object.entries(gdiKeywords)) {
                if (keywords.some(k => normalizedOpText.includes(k))) {
                    gdiTool.checked = true;
                    gdiTool.autoPopulated = true;
                    gdiTool.selectedValue = val;
                    break;
                }
            }
        }

        const ppvSet = newTools.find((t: any) => t.id === 'ppv-set');
        if (ppvSet && ppvSet.checked) {
            const softTip = newTools.find((t: any) => t.id === 'soft-tip');
            if (softTip) { softTip.checked = true; softTip.autoPopulated = true; }
        }

        return { actions: newActions, tools: newTools, mpSelectedTypes: finalMpTypes };
    };

    useEffect(() => {
        if (!config) return;
        const normalizedInput = normalizeText(session.operationInput);
        const retinalKeywords = ['mp', 'membrane peeling', 'ilm', 'el', 'endolaser', 'so', 'soi', 'hd so', 'heavy so', 'pfcl'];
        const hasRetinalProc = retinalKeywords.some(k => normalizedInput.includes(k));
        const hasPpvProc = /\bppv\b/i.test(normalizedInput) || normalizedInput.includes('vitrectomy');

        if (hasRetinalProc && !hasPpvProc) {
            const currentProc = session.operationInput.trim();
            const updatedProc = currentProc ? `${currentProc} + PPV` : 'PPV';
            setSession(prev => ({ ...prev, operationInput: updatedProc, updatedAt: new Date() }));
            return;
        }

        const result = calculateAutoChecklistDB(session);
        setSession(prev => ({ ...prev, actions: result.actions, tools: result.tools, mpSelectedTypes: result.mpSelectedTypes }));
    }, [session.operationInput, session.diagnosis, session.anesthesiaType, session.surgeonName, config]);

    const updateSession = (key: keyof PatientSession, value: any) => {
        setSession(prev => ({ ...prev, [key]: value, updatedAt: new Date() }));
    };

    const updateChecklist = (listName: 'actions' | 'tools', itemId: string, key: string, value: any) => {
        setSession(prev => ({
            ...prev,
            [listName]: (prev[listName] as ChecklistItemData[]).map(i => i.id === itemId ? { ...i, [key]: value } : i),
            updatedAt: new Date()
        }));
    };

    const toggleProcedureKeyword = (keyword: string) => {
        const normalizedInput = session.operationInput.trim();
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(^|\\+)\\s*' + escapedKeyword + '\\s*($|\\+)', 'i');
        const isSelected = regex.test(normalizedInput);
        
        if (isSelected) {
            let newValue = normalizedInput.replace(regex, (match, p1, p2) => {
                if (p1 === '+' && p2 === '+') return '+';
                return '';
            }).trim();
            newValue = newValue.replace(/^\s*\+\s*|\s*\+\s*$/g, '');
            updateSession('operationInput', newValue);

            if (keyword.toUpperCase() === 'MP') {
                const currentDiags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                const filteredDiags = currentDiags.filter(d => !['MH', 'RRD', 'TRD', 'ERM'].includes(d));
                updateSession('diagnosis', filteredDiags.join(', '));
            }
            if (keyword.toUpperCase() === 'GDI') {
                const currentDiags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                const filteredDiags = currentDiags.filter(d => !['Ahmed', 'XEN', 'Express GFD', 'Preserflo', 'AADI'].includes(d));
                updateSession('diagnosis', filteredDiags.join(', '));
            }
        } else {
            const newValue = normalizedInput ? `${normalizedInput} + ${keyword}` : keyword;
            updateSession('operationInput', newValue);
        }
    };

    const toggleDiagnosisKeyword = (keyword: string, exclusiveGroup?: string[]) => {
        let currentVals = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
        let currentOpInput = session.operationInput.trim();

        if (currentVals.includes(keyword)) {
            currentVals = currentVals.filter(v => v !== keyword);
            if (PPV_TYPES.includes(keyword)) {
                const gaugeRegex = new RegExp(`\\b${keyword}(PPV)?\\b`, 'i');
                if (gaugeRegex.test(currentOpInput)) {
                    currentOpInput = currentOpInput.replace(gaugeRegex, 'PPV');
                } else {
                    const regex = new RegExp(`(^|\\+)\\s*${keyword}\\s*($|\\+)`, 'i');
                    currentOpInput = currentOpInput.replace(regex, (match, p1, p2) => {
                        if (p1 === '+' && p2 === '+') return '+';
                        return '';
                    }).trim().replace(/^\s*\+\s*|\s*\+\s*$/g, '');
                }
            }
        } else {
            if (exclusiveGroup) {
                exclusiveGroup.forEach(g => {
                    if (g !== keyword && currentVals.includes(g)) {
                        const otherGaugeRegex = new RegExp(`\\b${g}(PPV)?\\b`, 'i');
                        if (otherGaugeRegex.test(currentOpInput)) {
                            currentOpInput = currentOpInput.replace(otherGaugeRegex, `${keyword}PPV`);
                        } else {
                            const regex = new RegExp(`\\b${g}\\b`, 'i');
                            currentOpInput = currentOpInput.replace(regex, keyword);
                        }
                    }
                });
                currentVals = currentVals.filter(v => !exclusiveGroup.includes(v));
            }
            currentVals.push(keyword);
            if (PPV_TYPES.includes(keyword)) {
                const ppvRegex = /\bPPV\b/i;
                if (ppvRegex.test(currentOpInput)) {
                    currentOpInput = currentOpInput.replace(ppvRegex, `${keyword}PPV`);
                } else if (!currentOpInput.toLowerCase().includes(keyword.toLowerCase())) {
                    currentOpInput = currentOpInput ? `${currentOpInput} + ${keyword}` : keyword;
                }
            }
        }
        
        setSession(prev => ({
            ...prev,
            diagnosis: currentVals.join(', '),
            operationInput: currentOpInput,
            updatedAt: new Date()
        }));
    };

    const { total, breakdown } = useMemo(() => {
        if (!config) return { total: 0, breakdown: [] };
        return calculateCostAndBreakdown(session.tools, session.healthCoverage, session, config.prices);
    }, [session.tools, session.healthCoverage, session.diagnosis, config]);

    const activeSurgeonGroup = getSurgeonGroup(session.surgeonName);
    const isMissingRequired = session.operationInput.trim() === '';

    const resetCaseBasics = () => {
        setSession(prev => ({
            ...prev,
            surgeonName: initialSession.surgeonName,
            anesthesiaType: initialSession.anesthesiaType,
            healthCoverage: initialSession.healthCoverage
        }));
    };

    const isMpSelected = useMemo(() => session.operationInput.split('+').map(s => s.trim()).includes("MP"), [session.operationInput]);
    const isGdiSelected = useMemo(() => session.operationInput.split('+').map(s => s.trim()).includes("GDI"), [session.operationInput]);
    const isPpvSelected = useMemo(() => {
        return session.operationInput.split('+').some(part => /\b(23G|25G)?PPV\b/i.test(part.trim()));
    }, [session.operationInput]);

    if (!config) return <div className="min-h-screen flex items-center justify-center dark:bg-brand-neutral-dark text-slate-500">Loading Configuration...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-rose-50 to-cyan-50 dark:bg-brand-neutral-dark dark:bg-none text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
            <header className="bg-white dark:bg-[#151f32] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Eye size={24} className="text-[#8e5a7d] dark:text-pink-200" />
                            <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#101421] dark:text-white leading-tight tracking-tighter">OphthalSupport</h1>
                        </div>
                        <nav className="hidden sm:flex items-center gap-1">
                            {[
                                { id: 'checklist', label: 'Checklist', icon: ListChecks },
                                { id: 'inventory', label: 'Inventory', icon: Box },
                                { id: 'admin', label: 'Admin', icon: Settings },
                            ].map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                        currentView === item.id 
                                        ? 'bg-[#fcb7f0] text-slate-800 shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <item.icon size={14} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleTheme} 
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 ${isDarkMode ? 'bg-brand-primary dark:bg-brand-primary-dark' : 'bg-gray-200 dark:bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center shadow-sm`}>
                                {isDarkMode ? <Moon size={10} className="text-brand-primary dark:text-brand-primary-dark" /> : <Sun size={10} className="text-gray-400" />}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
                {currentView === 'inventory' && (
                    <PriceListPage 
                        tools={config.tools} 
                        prices={config.prices} 
                        onAdminClick={() => setCurrentView('admin')}
                    />
                )}
                {currentView === 'admin' && (
                    <AdminPage 
                        tools={config.tools} 
                        prices={config.prices} 
                        operations={config.operations}
                        rules={config.rules}
                        actions={config.actions}
                        onRefresh={refreshData}
                    />
                )}
                {currentView === 'checklist' && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-4 sm:space-y-6">
                            <section className="bg-white dark:bg-[#151f32] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-3 sm:p-4 transition-colors duration-300">
                                <div className="flex justify-between items-center mb-2 sm:mb-3 border-b border-gray-50 dark:border-slate-800 pb-1.5 sm:pb-2">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-[#8e5a7d] dark:text-brand-secondary-dark sm:w-[16px] sm:h-[16px]" />
                                        <h2 className="text-[11px] sm:text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Case Basics</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeSurgeonGroup && (
                                            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-black border uppercase ${getSurgeonGroupColorClass(activeSurgeonGroup)}`}>
                                                {activeSurgeonGroup}
                                            </span>
                                        )}
                                        <button onClick={resetCaseBasics} className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 flex-shrink-0 rounded transition-colors" title="Reset Case Basics">
                                            <RefreshCw size={10} className="sm:w-[12px] sm:h-[12px]" /> Reset
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Surgeon</label>
                                        <div className="relative">
                                            <select 
                                                value={session.surgeonName} 
                                                onChange={e => updateSession('surgeonName', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                            >
                                                <option value="">- Select -</option>
                                                {allSurgeonNames.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Anes.</label>
                                        <div className="relative">
                                            <select 
                                                value={session.anesthesiaType} 
                                                onChange={e => updateSession('anesthesiaType', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                            >
                                                {Object.values(ANESTHESIA_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Coverage</label>
                                        <div className="relative">
                                            <select 
                                                value={session.healthCoverage} 
                                                onChange={e => updateSession('healthCoverage', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                            >
                                                {Object.values(COVERAGE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300">
                                <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-50 dark:border-slate-800 pb-2 sm:pb-3">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare size={16} className="text-[#8e5a7d] dark:text-brand-tertiary-dark sm:w-[18px] sm:h-[18px]" />
                                        <h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Procedure</h2>
                                    </div>
                                    <button onClick={() => {
                                        updateSession('operationInput', '');
                                        updateSession('diagnosis', '');
                                        updateSession('mpSelectedTypes', []);
                                    }} className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 flex-shrink-0 rounded transition-colors">
                                        <RefreshCw size={10} className="sm:w-[12px] sm:h-[12px]" /> Reset
                                    </button>
                                </div>

                                <div className="space-y-3 sm:space-y-5">
                                    <div>
                                        {Object.entries(groupedOperations).map(([category, ops]) => {
                                            const renderOpBtn = (op: any) => {
                                                const normalizedInput = session.operationInput.toLowerCase();
                                                const normalizedOpName = op.name.toLowerCase();
                                                const escapedName = normalizedOpName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                const regex = new RegExp('(^|\\+)\\s*' + escapedName + '\\s*($|\\+)', 'i');
                                                const isSelected = regex.test(normalizedInput);
                                                return (
                                                    <button
                                                        key={op.name}
                                                        onClick={() => toggleProcedureKeyword(op.name)}
                                                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all border shrink-0 ${
                                                            isSelected 
                                                            ? 'bg-[#fcb7f0] dark:bg-[#fcb7f0] text-slate-800 dark:text-slate-800 border-[#fcb7f0] dark:border-[#fcb7f0] shadow-md scale-[1.02]' 
                                                            : 'bg-white dark:bg-[#151f32] text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#fcb7f0]/50 dark:hover:border-[#fcb7f0]/50 hover:bg-[#fcb7f0]/5 dark:hover:bg-[#fcb7f0]/5'
                                                        }`}
                                                    >
                                                        {isSelected ? <CheckCircle size={14} className="inline mr-1" /> : <Plus size={14} className="inline mr-1 opacity-50" />}
                                                        {op.name}
                                                    </button>
                                                );
                                            };

                                            return (
                                            <div key={category} className="mb-3 sm:mb-4 last:mb-0">
                                                <label className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1.5 sm:mb-2">{category}</label>
                                                <div className="space-y-2.5">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                                        {(ops as any[]).map(renderOpBtn)}
                                                    </div>
                                                    
                                                    {category === 'Retinal Surgery' && (isPpvSelected || isMpSelected) && (
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center pt-1 animate-fadeIn">
                                                            {isPpvSelected && (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <div className="w-2 h-[2px] bg-pink-400/40 rounded-full"></div>
                                                                    {PPV_TYPES.map(p => {
                                                                        const diags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                                                                        const isPpvSelectedDiag = diags.includes(p);
                                                                        return (
                                                                            <button
                                                                                key={p}
                                                                                onClick={() => toggleDiagnosisKeyword(p, PPV_TYPES)}
                                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                                                                    isPpvSelectedDiag 
                                                                                    ? 'bg-pink-500 dark:bg-pink-400 text-white dark:text-slate-900 border-pink-600 dark:border-pink-500 shadow-sm' 
                                                                                    : 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/30 hover:bg-pink-100 dark:hover:bg-pink-500/20'
                                                                                }`}
                                                                            >
                                                                                {p}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                            {isMpSelected && (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <div className="w-2 h-[2px] bg-brand-secondary/40 rounded-full"></div>
                                                                    {MP_TYPES.map(mp => {
                                                                        const diags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                                                                        const isMpSelectedDiag = diags.includes(mp);
                                                                        return (
                                                                            <button
                                                                                key={mp}
                                                                                onClick={() => toggleDiagnosisKeyword(mp)}
                                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                                                                    isMpSelectedDiag 
                                                                                    ? 'bg-brand-secondary dark:bg-brand-secondary-dark text-white dark:text-brand-neutral-dark border-brand-secondary dark:border-brand-secondary-dark shadow-sm' 
                                                                                    : 'bg-brand-secondary/5 dark:bg-brand-secondary-dark/10 text-brand-secondary dark:text-brand-secondary-dark border-brand-secondary/30 dark:border-brand-secondary-dark/30 hover:bg-brand-secondary/20 dark:hover:bg-brand-secondary-dark/20'
                                                                                }`}
                                                                            >
                                                                                {mp}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {category === 'Glaucoma' && isGdiSelected && (
                                                        <div className="flex items-center gap-1.5 pt-1 animate-fadeIn shrink-0">
                                                            <div className="w-2 h-[2px] bg-cyan-600/40 dark:bg-brand-tertiary-dark/40 rounded-full"></div>
                                                            {GDI_TYPES.map(gdi => {
                                                                const diags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                                                                const isGdiSelectedDiag = diags.includes(gdi);
                                                                return (
                                                                    <button
                                                                        key={gdi}
                                                                        onClick={() => toggleDiagnosisKeyword(gdi, GDI_TYPES)}
                                                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                                                            isGdiSelectedDiag 
                                                                            ? 'bg-cyan-600 dark:bg-brand-tertiary-dark text-white dark:text-brand-neutral-dark border-cyan-600 dark:border-brand-tertiary-dark shadow-sm' 
                                                                            : 'bg-cyan-600/5 dark:bg-brand-tertiary-dark/10 text-cyan-700 dark:text-brand-tertiary-dark border-cyan-600/30 dark:border-brand-tertiary-dark/30 hover:bg-cyan-600/20 dark:hover:bg-brand-tertiary-dark/20'
                                                                        }`}
                                                                    >
                                                                        {gdi}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                        <input 
                                            type="text" 
                                            value={session.operationInput} 
                                            onChange={e => updateSession('operationInput', e.target.value)}
                                            placeholder="Or type custom procedure..."
                                            className="mt-2 sm:mt-3 w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                        />
                                        {isMissingRequired && (
                                            <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse"></span>
                                                Please select at least one procedure
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {!isMissingRequired && (
                                <div className="bg-brand-neutral-dark dark:bg-gradient-to-r dark:from-[#FCAAED] dark:to-[#F1B197] rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(252,170,237,0.2)] p-6 text-white dark:text-brand-neutral-dark overflow-hidden relative animate-fadeIn transition-colors duration-300">
                                    <Calculator className="absolute -right-4 -top-4 w-24 h-24 opacity-10 dark:opacity-20" />
                                    <h3 className="text-xs font-headline font-black uppercase tracking-widest text-slate-300 dark:text-slate-900/60 mb-2">Estimated Tooling Cost</h3>
                                    <div className="text-4xl font-headline font-black mb-1 leading-none text-white dark:text-slate-900">{total.toLocaleString()}</div>
                                    <div className="text-xs font-bold text-slate-400 dark:text-slate-900/60 mb-6 uppercase">Total THB ({session.healthCoverage})</div>
                                    <div className="pt-4 border-t border-slate-700 dark:border-slate-900/10">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-900/80 mb-3">Itemized Breakdown</h4>
                                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {breakdown.length > 0 ? (
                                                breakdown.map((item, i) => {
                                                    const tool = session.tools.find(t => t.id === item.id);
                                                    const isReusable = tool?.options?.some((o: any) => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED);
                                                    return (
                                                        <div key={i} className="flex justify-between items-start text-sm group">
                                                            <div className="flex flex-col flex-1 mr-3">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-white dark:text-slate-900 truncate">{item.name}</span>
                                                                    {isReusable && (
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            {tool?.disabled ? (
                                                                                <span className="inline-flex items-center justify-center h-[20px] w-[60px] rounded-full text-[7px] font-black bg-brand-secondary dark:bg-slate-200 text-white dark:text-slate-900 leading-none uppercase shrink-0">New Only</span>
                                                                            ) : (
                                                                                <button 
                                                                                    onClick={() => updateChecklist('tools', item.id, 'selectedValue', item.isReused ? NEW_REUSED_OPTIONS.NEW : NEW_REUSED_OPTIONS.REUSED)}
                                                                                    className={`relative inline-flex h-[20px] w-[60px] items-center rounded-full transition-all focus:outline-none ${!item.isReused ? 'bg-brand-secondary dark:bg-slate-200' : 'bg-white/30 dark:bg-slate-800/50'}`}
                                                                                >
                                                                                    <span className={`absolute text-[8px] font-black uppercase tracking-wider transition-all ${!item.isReused ? 'right-2.5 text-white dark:text-slate-900' : 'left-2.5 text-slate-900 dark:text-white'}`}>{item.isReused ? 'Reuse' : 'New'}</span>
                                                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${!item.isReused ? 'translate-x-1' : 'translate-x-[40px]'}`} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="font-mono text-white dark:text-slate-900 tracking-tight shrink-0 mt-0.5 font-bold">{item.isReused ? '฿0' : `฿${item.price.toLocaleString()}`}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : <div className="text-xs text-slate-400 dark:text-slate-800 italic pt-2 font-medium">No tools selected yet</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isMissingRequired && (
                                <section className="space-y-4 animate-fadeIn mb-8">
                                    <ChecklistSection title="Pre-Operative Checklist" items={session.actions} onItemChange={(id, k, v) => updateChecklist('actions', id, k, v)} colorClass="text-slate-100" showAllText="Show All Actions" />
                                    <ChecklistSection title="Surgical Tools Checklist" items={session.tools} onItemChange={(id, k, v) => updateChecklist('tools', id, k, v)} colorClass="text-slate-100" showAllText="Add Tools" icon={Syringe} />
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
