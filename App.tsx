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
    Syringe
} from 'lucide-react';

import {
    ANESTHESIA_TYPES,
    COVERAGE_TYPES,
    BASE_ACTIONS,
    BASE_TOOLS,
    OPERATIONS_DATA,
    SURGEON_GROUPS,
    CENTURION_PREFERRED_SURGEONS,
    RAW_IOL_PRICES_DATA,
    TOOL_PRICES,
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

function flattenToolPrices(toolPrices: any) {
    const items: any[] = [];
    Object.keys(toolPrices).forEach(key => {
        const value = toolPrices[key];
        if (value.name && (typeof value.CSMBS === 'number' || typeof value.SSS === 'number' || typeof value.UCS === 'number')) {
            items.push({ 
                id: key, 
                name: value.name, 
                csmbs: value.CSMBS ?? 0, 
                sss: value.SSS ?? 0,
                sale: value.CSMBS ?? 0 
            });
        } 
        else if (typeof value === 'object' && value !== null) {
            Object.keys(value).forEach(subKey => {
                const subValue = value[subKey];
                if (subValue && typeof subValue === 'object' && subValue.name) {
                    items.push({ 
                        id: subKey, 
                        name: value.name, 
                        csmbs: subValue.CSMBS ?? 0, 
                        sss: subValue.SSS ?? 0,
                        sale: subValue.CSMBS ?? 0
                    });
                }
            });
        }
    });
    return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function calculateCostAndBreakdown(tools: ChecklistItemData[], healthCoverage: string, session: PatientSession) {
    let total = 0;
    const breakdown: { name: string, price: number, isReused: boolean }[] = [];
    
    tools.forEach(tool => {
        if (tool.checked) {
            const priceInfo = TOOL_PRICES[tool.id];
            if (priceInfo) {
                let price = 0;
                let itemName = '';
                let isReused = false;
                
                if (tool.selectedValue === NEW_REUSED_OPTIONS.REUSED) {
                    isReused = true;
                }

                if (tool.id === 'ppv-set' && tool.checked) {
                    const tipSize = session.diagnosis.includes("25G") ? "25G" : "23G";
                    const machine = tool.selectedValue; 
                    if (machine) {
                        const key = `${tipSize}_${machine}`;
                        const subItem = priceInfo[key];
                        if (subItem) {
                            price = subItem[healthCoverage] || 0;
                            itemName = subItem.name;
                        }
                    }
                } else if (tool.selectedValue && priceInfo[tool.selectedValue] && !isReused) {
                    const subItem = priceInfo[tool.selectedValue];
                    if (subItem) {
                        price = subItem[healthCoverage] || 0;
                        itemName = subItem.name;
                    }
                } else {
                    price = isReused ? 0 : (priceInfo[healthCoverage] || 0);
                    itemName = priceInfo.name;
                }

                if (itemName) {
                    total += price;
                    breakdown.push({ id: tool.id, name: itemName, price, isReused });
                }
            }
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

const calculateAutoChecklist = (session: PatientSession) => {
    const rawOpText = session.operationInput + ' ' + (session.diagnosis || '');
    const normalizedOpText = normalizeText(rawOpText);
    const newActions = JSON.parse(JSON.stringify(BASE_ACTIONS));
    let newTools = JSON.parse(JSON.stringify(BASE_TOOLS));
    let showMp = false;


    if (session.anesthesiaType === ANESTHESIA_TYPES.LA) {
        const isTxOrGdi = /\btx\b/.test(normalizedOpText) || normalizedOpText.includes('trabeculectomy') || /\bgdi\b/.test(normalizedOpText) || normalizedOpText.includes('drainage implant') || normalizedOpText.includes('xen');
        const isOculoOrStrabismus = normalizedOpText.includes('oculoplastic') || normalizedOpText.includes('strabismus') || normalizedOpText.includes('squint') || normalizedOpText.includes('ptosis') || normalizedOpText.includes('frontalis') || normalizedOpText.includes('sling') || normalizedOpText.includes('lid') || normalizedOpText.includes('entropion') || normalizedOpText.includes('ectropion') || normalizedOpText.includes('blepharoplasty') || normalizedOpText.includes('edcr') || normalizedOpText.includes('dcr');
        if (!isTxOrGdi && !isOculoOrStrabismus) {
            const axl = newActions.find((a: any) => a.id === 'axl');
            if (axl) {
                axl.checked = true;
                axl.autoPopulated = true;
            }
        }
    }

    OPERATIONS_DATA.forEach(op => {
        const isMatch = op.keywords.some(k => {
            const normalizedKeyword = normalizeText(k).trim();
            if (normalizedKeyword.length <= 2) {
                const regex = new RegExp(`\\b${normalizedKeyword}\\b`);
                return regex.test(normalizedOpText);
            }
            return normalizedOpText.includes(normalizedKeyword);
        });
        if (isMatch) {
            op.actions.forEach((a: any) => {
                const item = newActions.find((i: any) => i.id === a.id);
                if (item) {
                    item.checked = true;
                    item.autoPopulated = true;
                    if (a.selectedValue) item.selectedValue = a.selectedValue;
                }
            });
            op.tools.forEach((t: any) => {
                const item = newTools.find((i: any) => i.id === t.id);
                if (item) {
                    item.checked = true;
                    item.autoPopulated = true;
                    if (t.selectedValue) item.selectedValue = t.selectedValue;
                }
            });
            if (op.name === "MP") showMp = true;
            if (op.category === "Lens Surgery" || op.category === "Retinal Surgery") {
                const axl = newActions.find((a: any) => a.id === 'axl');
                if (axl) {
                    axl.checked = true;
                    axl.autoPopulated = true;
                }
            }
        }
    });

    let finalMpTypes: string[] = []; 
    const addMpType = (t: string) => { if (!finalMpTypes.includes(t)) finalMpTypes.push(t); };
    
    // Check if MP is selected or triggered
    const isMpActive = normalizedOpText.includes('mp') || normalizedOpText.includes('membrane peeling') || normalizedOpText.includes('ilm') || showMp;

    if (isMpActive) {
        // ... (existing diags checking logic)
        const diags = (session.diagnosis || '').split(',').map(s => s.trim());
        if (diags.includes('ERM')) addMpType('ERM');
        if (diags.includes('MH')) addMpType('MH');
        if (diags.includes('TRD')) addMpType('TRD');
        if (diags.includes('RRD')) addMpType('RRD');

        // ... (existing raw text logic)
        if (normalizedOpText.includes('erm') || normalizedOpText.includes('epiretinal')) addMpType('ERM');
        if (normalizedOpText.includes('mh') || normalizedOpText.includes('macular hole')) addMpType('MH');
        if (normalizedOpText.includes('trd')) addMpType('TRD');
        if (normalizedOpText.includes('rrd')) addMpType('RRD');
        if (normalizedOpText.includes('ilm')) { addMpType('ERM'); }
    }
    
    // Pass session.diagnosis here
    newTools = applyMpToolsLogic(newTools, finalMpTypes, session.diagnosis);

    if (normalizedOpText.includes('phaco') || normalizedOpText.includes('phacoemulsification')) {
        const machineTool = newTools.find((t: any) => t.id === 'centurion-legion');
        if (machineTool) {
            machineTool.checked = true;
            machineTool.autoPopulated = true;
            const normalizedSurgeon = normalizeText(session.surgeonName);
            const prefersCenturion = CENTURION_PREFERRED_SURGEONS.some(s => normalizedSurgeon.includes(normalizeText(s).trim()));
            
            if (normalizedOpText.includes('stellaris')) {
                machineTool.selectedValue = MACHINE_TYPES.STELLARIS;
            } else {
                machineTool.selectedValue = prefersCenturion ? MACHINE_TYPES.CENTURION : MACHINE_TYPES.LEGION;
            }
        }
    }
    const gdiTool = newTools.find((t: any) => t.id === 'glaucoma-device');
    if (gdiTool) {
        const hasGdiKeyword = normalizedOpText.includes('ahmed') || 
                             normalizedOpText.includes('xen') || 
                             normalizedOpText.includes('express') || 
                             normalizedOpText.includes('gfd') || 
                             normalizedOpText.includes('preserflo') || 
                             normalizedOpText.includes('aadi');
        
        if (hasGdiKeyword) {
            gdiTool.checked = true;
            gdiTool.autoPopulated = true;
            
            if (normalizedOpText.includes('ahmed')) gdiTool.selectedValue = 'ahmed-valve';
            else if (normalizedOpText.includes('xen')) gdiTool.selectedValue = 'gdi-xen-room';
            else if (normalizedOpText.includes('express gfd') || normalizedOpText.includes('gfd express') || normalizedOpText.includes('express')) gdiTool.selectedValue = 'gfd-express';
            else if (normalizedOpText.includes('preserflo')) gdiTool.selectedValue = 'preserflo-shunt';
            else if (normalizedOpText.includes('aadi')) gdiTool.selectedValue = 'aadi-shunt';
        }
    }

    const ppvSet = newTools.find((t: any) => t.id === 'ppv-set');
    if (ppvSet && ppvSet.checked) {
        const softTip = newTools.find((t: any) => t.id === 'soft-tip');
        if (softTip) {
            softTip.checked = true;
            softTip.autoPopulated = true;
        }
    }
    return { actions: newActions, tools: newTools, mpSelectedTypes: finalMpTypes };
};

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
                                                        {item.options.map(opt => (
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

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);

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
        const groups: Record<string, typeof OPERATIONS_DATA> = {};
        OPERATIONS_DATA.forEach(op => {
            if (!groups[op.category]) groups[op.category] = [];
            groups[op.category].push(op);
        });
        return groups;
    }, []);
    
    const initialSession: PatientSession = {
        id: generateUUID(),
        diagnosis: '',
        operationInput: '',
        surgeonName: '',
        anesthesiaType: ANESTHESIA_TYPES.LA,
        healthCoverage: COVERAGE_TYPES.UCS,
        actions: JSON.parse(JSON.stringify(BASE_ACTIONS)),
        tools: JSON.parse(JSON.stringify(BASE_TOOLS)),
        mpSelectedTypes: [],
        updatedAt: new Date()
    };

    const [session, setSession] = useState<PatientSession>(initialSession);

    // Auto update checklist whenever relevant fields change
    useEffect(() => {
        // NEW: If any retinal procedure is selected, ensure PPV is also selected
        const normalizedInput = normalizeText(session.operationInput);
        const retinalKeywords = ['mp', 'membrane peeling', 'ilm', 'el', 'endolaser', 'so', 'soi', 'hd so', 'heavy so', 'pfcl'];
        const hasRetinalProc = retinalKeywords.some(k => normalizedInput.includes(k));
        
        // Use a more specific check for PPV to avoid accidental matches
        const hasPpvProc = /\bppv\b/i.test(normalizedInput) || normalizedInput.includes('vitrectomy');

        if (hasRetinalProc && !hasPpvProc) {
            const currentProc = session.operationInput.trim();
            const updatedProc = currentProc ? `${currentProc} + PPV` : 'PPV';
            setSession(prev => ({ ...prev, operationInput: updatedProc, updatedAt: new Date() }));
            return;
        }

        const result = calculateAutoChecklist(session);
        setSession(prev => ({ ...prev, actions: result.actions, tools: result.tools, mpSelectedTypes: result.mpSelectedTypes }));
    }, [session.operationInput, session.diagnosis, session.anesthesiaType, session.surgeonName]);

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
            // Remove the keyword and handle surrounding '+' and spaces
            let newValue = normalizedInput.replace(regex, (match, p1, p2) => {
                if (p1 === '+' && p2 === '+') return '+';
                return '';
            }).trim();
            newValue = newValue.replace(/^\s*\+\s*|\s*\+\s*$/g, '');
            updateSession('operationInput', newValue);

            // SPECIAL CLEANUP: If we deselect MP or GDI, clear their diagnostic subtypes
            if (keyword.toUpperCase() === 'MP') {
                const currentDiags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                const mpSubtypes = ['MH', 'RRD', 'TRD', 'ERM'];
                const filteredDiags = currentDiags.filter(d => !mpSubtypes.includes(d));
                updateSession('diagnosis', filteredDiags.join(', '));
            }
            if (keyword.toUpperCase() === 'GDI') {
                const currentDiags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                const gdiSubtypes = ['Ahmed', 'XEN', 'Express GFD', 'Preserflo', 'AADI'];
                const filteredDiags = currentDiags.filter(d => !gdiSubtypes.includes(d));
                updateSession('diagnosis', filteredDiags.join(', '));
            }
        } else {
            const newValue = normalizedInput ? `${normalizedInput} + ${keyword}` : keyword;
            updateSession('operationInput', newValue);
        }
    };

    const toggleDiagnosisKeyword = (keyword: string, exclusiveGroup?: string[]) => {
        let currentVals = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
        
        if (currentVals.includes(keyword)) {
            // Deselect
            currentVals = currentVals.filter(v => v !== keyword);
        } else {
            // Select: if part of an exclusive group, remove other members of the group
            if (exclusiveGroup) {
                currentVals = currentVals.filter(v => !exclusiveGroup.includes(v));
            }
            currentVals.push(keyword);
        }
        
        updateSession('diagnosis', currentVals.join(', '));
    };

    const { total, breakdown } = calculateCostAndBreakdown(session.tools, session.healthCoverage, session);

    const activeSurgeonGroup = getSurgeonGroup(session.surgeonName);

    const isMissingRequired = session.operationInput.trim() === '';

    const resetSession = () => {
        setSession({...initialSession, id: generateUUID()});
    };

    const resetCaseBasics = () => {
        setSession(prev => ({
            ...prev,
            surgeonName: initialSession.surgeonName,
            anesthesiaType: initialSession.anesthesiaType,
            healthCoverage: initialSession.healthCoverage
        }));
    };

    const toggleAllToolsChoice = () => {
        const reusables = session.tools.filter(t => t.checked && t.options?.some(o => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED));
        const anyNew = reusables.some(t => t.selectedValue === NEW_REUSED_OPTIONS.NEW);
        const targetValue = anyNew ? NEW_REUSED_OPTIONS.REUSED : NEW_REUSED_OPTIONS.NEW;

        const newTools = session.tools.map(t => {
            if (t.checked && t.options?.some(o => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED)) {
                return { ...t, selectedValue: targetValue };
            }
            return t;
        });
        updateSession('tools', newTools);
    };

    const isMpSelected = useMemo(() => {
        return session.operationInput.split('+').map(s => s.trim()).includes("MP");
    }, [session.operationInput]);

    const isGdiSelected = useMemo(() => {
        return session.operationInput.split('+').map(s => s.trim()).includes("GDI");
    }, [session.operationInput]);

    const isPpvSelected = useMemo(() => {
        return session.operationInput.split('+').map(s => s.trim()).includes("PPV");
    }, [session.operationInput]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-rose-50 to-cyan-50 dark:bg-brand-neutral-dark dark:bg-none text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
            <header className="bg-white dark:bg-[#151f32] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye size={24} className="text-[#8e5a7d] dark:text-pink-200" />
                        <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#101421] dark:text-white leading-tight">OphthalmoSupport</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleTheme} 
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 ${isDarkMode ? 'bg-brand-primary dark:bg-brand-primary-dark' : 'bg-gray-200 dark:bg-slate-700'}`}
                            aria-label="Toggle theme"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                } flex items-center justify-center shadow-sm`}
                            >
                                {isDarkMode ? <Moon size={10} className="text-brand-primary dark:text-brand-primary-dark" /> : <Sun size={10} className="text-gray-400" />}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-6">
                <div className="space-y-4 sm:space-y-6">
                    
                    {/* Main Content */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Section 1: Core Info */}
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

                        {/* Section 2: Procedure & Diagnosis Taps */}
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
                                {/* Procedures */}
                                <div>
                                    {Object.entries(groupedOperations).map(([category, ops]) => {
                                        const renderOpBtn = (op: any) => {
                                            const normalizedInput = session.operationInput.toLowerCase();
                                            const normalizedOpName = op.name.toLowerCase();
                                            // Escape special characters for regex
                                            const escapedName = normalizedOpName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                            // Check if the name exists as a segment between '+' signs or at start/end
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
                                            
                                            {category === 'Lens Surgery' ? (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                                        {ops.filter(op => ['Phaco', 'IOL', 'ECCE', 'SF-IOL'].includes(op.name)).map(renderOpBtn)}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                                        {ops.filter(op => !['Phaco', 'IOL', 'ECCE', 'SF-IOL'].includes(op.name)).map(renderOpBtn)}
                                                    </div>
                                                </div>
                                            ) : category === 'Retinal Surgery' ? (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                                        {ops.map(renderOpBtn)}
                                                    </div>
                                                    
                                                    {(isPpvSelected || isMpSelected) && (
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                                                            {isPpvSelected && (
                                                                <div className="flex items-center gap-1.5 animate-fadeIn shrink-0">
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
                                                                <div className="flex items-center gap-1.5 animate-fadeIn shrink-0">
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
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                                    {ops.map(renderOpBtn)}

                                                    {category === 'Glaucoma' && isGdiSelected && (
                                                    <div className="flex items-center gap-1.5 ml-1 animate-fadeIn shrink-0">
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
                                            )}
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

                        {/* Section 3: Cost Card */}
                        {!isMissingRequired && (
                            <div className="bg-brand-neutral-dark dark:bg-gradient-to-r dark:from-[#FCAAED] dark:to-[#F1B197] rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(252,170,237,0.2)] p-6 text-white dark:text-brand-neutral-dark overflow-hidden relative animate-fadeIn transition-colors duration-300">
                                <Calculator className="absolute -right-4 -top-4 w-24 h-24 opacity-10 dark:opacity-20" />
                                
                                <h3 className="text-xs font-headline font-black uppercase tracking-widest text-slate-300 dark:text-slate-900/60 mb-2">Estimated Tooling Cost</h3>
                                <div className="text-4xl font-headline font-black mb-1 leading-none text-[#fcb7f0] dark:text-slate-900">{total.toLocaleString()}</div>
                                <div className="text-xs font-bold text-slate-400 dark:text-slate-900/60 mb-6 uppercase">Total THB ({session.healthCoverage})</div>

                                <div className="pt-4 border-t border-slate-700 dark:border-slate-900/10">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-900/80">Itemized Breakdown</h4>
                                    </div>
                                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {breakdown.length > 0 ? (
                                            breakdown.map((item, i) => {
                                                const tool = session.tools.find(t => t.id === item.id);
                                                const isReusable = tool?.options?.some(o => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED);
                                                
                                                return (
                                                    <div key={i} className="flex justify-between items-start text-sm group">
                                                        <div className="flex flex-col flex-1 mr-3">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-white dark:text-slate-900 truncate">
                                                                    {item.name}
                                                                </span>
                                                                {isReusable && (
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        {tool?.disabled ? (
                                                                            <span className="inline-flex items-center justify-center h-[20px] w-[60px] rounded-full text-[7px] font-black bg-brand-secondary dark:bg-slate-200 text-white dark:text-slate-900 leading-none uppercase shrink-0">
                                                                                New Only
                                                                            </span>
                                                                        ) : (
                                                                            <button 
                                                                                onClick={() => updateChecklist('tools', item.id, 'selectedValue', item.isReused ? NEW_REUSED_OPTIONS.NEW : NEW_REUSED_OPTIONS.REUSED)}
                                                                                className={`relative inline-flex h-[20px] w-[60px] items-center rounded-full transition-all focus:outline-none ${
                                                                                    !item.isReused 
                                                                                        ? 'bg-brand-secondary dark:bg-slate-200' 
                                                                                        : 'bg-white/30 dark:bg-slate-800/50'
                                                                                }`}
                                                                                aria-label="Toggle New/Reuse"
                                                                            >
                                                                                <span className={`absolute text-[8px] font-black uppercase tracking-wider transition-all ${
                                                                                    !item.isReused 
                                                                                    ? 'right-2.5 text-white dark:text-slate-900' 
                                                                                    : 'left-2.5 text-slate-900 dark:text-white'
                                                                                }`}>
                                                                                    {item.isReused ? 'Reuse' : 'New'}
                                                                                </span>
                                                                                <span
                                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${
                                                                                        !item.isReused ? 'translate-x-1' : 'translate-x-[40px]'
                                                                                    }`}
                                                                                />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="font-mono text-[#fcb7f0] dark:text-slate-900 tracking-tight shrink-0 mt-0.5 font-bold">
                                                            {item.isReused ? '฿0' : `฿${item.price.toLocaleString()}`}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-xs text-slate-400 dark:text-slate-800 italic pt-2 font-medium">No tools selected yet</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 4: Generated Checklists */}
                        {!isMissingRequired && (
                            <section className="space-y-4 animate-fadeIn mb-8">
                                <ChecklistSection 
                                    title="Pre-Operative Checklist" 
                                    items={session.actions} 
                                    onItemChange={(id, k, v) => updateChecklist('actions', id, k, v)} 
                                    colorClass="text-slate-100"
                                    showAllText="Show All Actions"
                                />
                                <ChecklistSection 
                                    title="Surgical Tools Checklist" 
                                    items={session.tools} 
                                    onItemChange={(id, k, v) => updateChecklist('tools', id, k, v)} 
                                    colorClass="text-slate-100"
                                    showAllText="Add Tools"
                                    icon={Syringe}
                                />
                            </section>
                        )}
                        

                    </div>
                </div>
            </main>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    );
}
