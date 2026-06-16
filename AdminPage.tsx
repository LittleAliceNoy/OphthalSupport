import React, { useState, useMemo } from 'react';
import {
    Settings,
    Plus,
    Trash2,
    Save,
    X,
    ChevronDown,
    ChevronUp,
    Edit,
    Search,
    Database,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Play,
    Menu,
    FolderSymlink
} from 'lucide-react';
import { supabase } from './supabase';
import { DBTool, DBAction, DBOperation, DBRule, DBPrice } from './configService';
import { NEW_REUSED_OPTIONS } from './constants';

const CATEGORY_ORDER = ['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Generals'];

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

const getToolDisplayName = (toolId: string, itemText: string, subKey: string | null): string => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    if (toolId === 'ctr-no') {
        return 'Capsular Tension Ring';
    }
    if (toolId === 'cts') {
        return 'Capsular Tension Segment';
    }
    if (toolId === 'glaucoma-device' && subKey) {
        if (subKey === 'gdi-xen-room') return 'XEN glaucoma gel implant';
        if (subKey === 'aadi-shunt') return 'AADI shunt';
        if (subKey === 'gfd-express') return 'Express GFD';
        return capitalize(subKey.replace(/-/g, ' '));
    }
    if (toolId === 'phaco-machine' && subKey) {
        return `${capitalize(subKey)} phaco machine`;
    }
    if (toolId === 'ppv-set' && subKey) {
        const parts = subKey.split('_');
        const machine = parts.length > 1 ? parts[1] : parts[0];
        return `23G/25G ${capitalize(machine)}`;
    }
    if (toolId === 'soft-tip') {
        return 'Soft tip';
    }
    return itemText || toolId;
};

interface AdminPageProps {
    config: {
        tools: DBTool[];
        actions: DBAction[];
        operations: DBOperation[];
        rules: DBRule[];
        prices: DBPrice[];
    };
    onRefresh: () => Promise<void>;
}

export default function AdminPage({ config, onRefresh }: AdminPageProps) {
    const [adminTab, setAdminTab] = useState<'prices' | 'logic'>('prices');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState<string | null>(null); // tracks active operation description

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // --- Prices State & Logic ---
    const [priceSearch, setPriceSearch] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editPricesData, setEditPricesData] = useState<Record<string, {
        displayName: string;
        csmbs: number;
        sss: number;
        ucs: number;
    }>>({});

    // Add Tool Form States
    const [showAddToolForm, setShowAddToolForm] = useState(false);
    const [newToolId, setNewToolId] = useState('');
    const [newToolDisplayName, setNewToolDisplayName] = useState('');
    const [newToolCategory, setNewToolCategory] = useState('Generals');
    const [newToolCsmbs, setNewToolCsmbs] = useState<number>(0);
    const [newToolSss, setNewToolSss] = useState<number>(0);
    const [newToolUcs, setNewToolUcs] = useState<number>(0);
    const [newToolType, setNewToolType] = useState<'checkbox' | 'radio' | 'number-input'>('checkbox');
    
    interface NewSubtype {
        subKey: string;
        displayName: string;
        csmbs: number;
        sss: number;
        ucs: number;
    }
    const [newToolSubtypes, setNewToolSubtypes] = useState<NewSubtype[]>([
        { subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }
    ]);

    const handleAddSubtypeRow = () => {
        setNewToolSubtypes([
            ...newToolSubtypes,
            { subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }
        ]);
    };

    const handleRemoveSubtypeRow = (index: number) => {
        const updated = [...newToolSubtypes];
        updated.splice(index, 1);
        setNewToolSubtypes(updated);
    };

    const handleUpdateSubtypeRow = (index: number, field: keyof NewSubtype, value: any) => {
        const updated = [...newToolSubtypes];
        updated[index] = {
            ...updated[index],
            [field]: value
        };
        if (field === 'displayName' && !updated[index].subKey) {
            updated[index].subKey = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        }
        setNewToolSubtypes(updated);
    };

    // Drag and Drop States
    const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
    const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
    const [dragOverToolId, setDragOverToolId] = useState<string | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

    const filteredPrices = useMemo(() => {
        const filtered = config.prices.filter(p => {
            const tool = config.tools.find(t => t.id === p.tool_id);
            const toolName = tool ? tool.item.toLowerCase() : '';
            const subKey = p.sub_key ? p.sub_key.toLowerCase() : '';
            const search = priceSearch.toLowerCase();
            return toolName.includes(search) || subKey.includes(search) || p.tool_id.toLowerCase().includes(search);
        });

        return [...filtered].sort((a, b) => {
            const toolA = config.tools.find(t => t.id === a.tool_id);
            const toolB = config.tools.find(t => t.id === b.tool_id);
            const catA = toolA?.category || TOOL_CATEGORIES[a.tool_id] || 'Generals';
            const catB = toolB?.category || TOOL_CATEGORIES[b.tool_id] || 'Generals';
            
            const catIdxA = CATEGORY_ORDER.indexOf(catA);
            const catIdxB = CATEGORY_ORDER.indexOf(catB);
            
            if (catIdxA !== catIdxB) {
                return catIdxA - catIdxB;
            }

            const orderA = toolA && typeof toolA.sort_order === 'number' ? toolA.sort_order : 0;
            const orderB = toolB && typeof toolB.sort_order === 'number' ? toolB.sort_order : 0;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            const toolIdxA = TOOL_ORDER.indexOf(a.tool_id);
            const toolIdxB = TOOL_ORDER.indexOf(b.tool_id);
            
            const finalIdxA = toolIdxA === -1 ? 999 : toolIdxA;
            const finalIdxB = toolIdxB === -1 ? 999 : toolIdxB;
            
            if (finalIdxA !== finalIdxB) {
                return finalIdxA - finalIdxB;
            }

            const subA = a.sub_key || '';
            const subB = b.sub_key || '';
            return subA.localeCompare(subB);
        });
    }, [config.prices, config.tools, priceSearch]);

    const categorizedPrices = useMemo(() => {
        const groups: Record<string, DBPrice[]> = {};
        CATEGORY_ORDER.forEach(c => { groups[c] = []; });
        
        filteredPrices.forEach(p => {
            const tool = config.tools.find(t => t.id === p.tool_id);
            const cat = tool?.category || TOOL_CATEGORIES[p.tool_id] || 'Generals';
            const finalCat = CATEGORY_ORDER.includes(cat) ? cat : 'Generals';
            groups[finalCat].push(p);
        });
        return groups;
    }, [filteredPrices, config.tools]);

    const handleStartEditCategory = (cat: string) => {
        setEditingCategory(cat);
        const categoryItems = categorizedPrices[cat] || [];
        const initialData: Record<string, {
            displayName: string;
            csmbs: number;
            sss: number;
            ucs: number;
        }> = {};
        categoryItems.forEach(price => {
            const tool = config.tools.find(t => t.id === price.tool_id);
            const dispName = price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key);
            initialData[price.id] = {
                displayName: dispName,
                csmbs: price.csmbs_price,
                sss: price.sss_price,
                ucs: price.ucs_price
            };
        });
        setEditPricesData(initialData);
    };

    const handleSaveCategoryPrices = async (cat: string) => {
        const items = categorizedPrices[cat] || [];
        // validate
        for (const item of items) {
            const data = editPricesData[item.id];
            if (!data) continue;
            if (data.csmbs < 0 || data.sss < 0 || data.ucs < 0) {
                showToast('Prices must be non-negative numbers', 'error');
                return;
            }
            if (!data.displayName.trim()) {
                showToast('Tool name is required', 'error');
                return;
            }
        }

        setLoading('Saving category prices...');
        try {
            const updates = items.map(item => {
                const data = editPricesData[item.id];
                if (!data) return Promise.resolve({ error: null });
                return supabase
                    .from('tool_prices')
                    .update({
                        csmbs_price: Number(data.csmbs),
                        sss_price: Number(data.sss),
                        ucs_price: Number(data.ucs),
                        display_name: data.displayName.trim()
                    })
                    .eq('id', item.id);
            });

            const results = await Promise.all(updates);
            const firstErr = results.find(r => r.error)?.error;
            if (firstErr) throw firstErr;

            showToast(`All prices in "${cat}" updated successfully`, 'success');
            setEditingCategory(null);
            await onRefresh();
        } catch (err: any) {
            if (err.message?.includes('column "display_name"') || err.code === '42703') {
                // Fallback: update without display_name
                try {
                    const fallbackUpdates = items.map(item => {
                        const data = editPricesData[item.id];
                        if (!data) return Promise.resolve({ error: null });
                        return supabase
                            .from('tool_prices')
                            .update({
                                csmbs_price: Number(data.csmbs),
                                sss_price: Number(data.sss),
                                ucs_price: Number(data.ucs)
                            })
                            .eq('id', item.id);
                    });
                    const fallbackResults = await Promise.all(fallbackUpdates);
                    const firstFallbackErr = fallbackResults.find(r => r.error)?.error;
                    if (firstFallbackErr) throw firstFallbackErr;

                    showToast(`Prices in "${cat}" updated! Run SQL to enable name changes: ALTER TABLE tool_prices ADD COLUMN display_name VARCHAR;`, 'error');
                    setEditingCategory(null);
                    await onRefresh();
                } catch (fallbackErr: any) {
                    showToast(fallbackErr.message || 'Error updating prices', 'error');
                }
            } else {
                showToast(err.message || 'Error updating details', 'error');
            }
        } finally {
            setLoading(null);
        }
    };

    const handleUpdateEditField = (priceId: string, field: string, value: any, price: DBPrice, tool: any) => {
        setEditPricesData(prev => {
            const current = prev[priceId] || {
                displayName: price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key),
                csmbs: price.csmbs_price,
                sss: price.sss_price,
                ucs: price.ucs_price
            };
            return {
                ...prev,
                [priceId]: {
                    ...current,
                    [field]: value
                }
            };
        });
    };

    const handleDisplayNameChange = (val: string) => {
        setNewToolDisplayName(val);
        const slug = val
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setNewToolId(slug);
    };

    const handleAddToolSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tid = newToolId.trim();
        const dName = newToolDisplayName.trim();
        if (!tid) {
            showToast('Tool ID is required', 'error');
            return;
        }
        if (!dName) {
            showToast('Display name is required', 'error');
            return;
        }

        if (newToolType === 'radio') {
            if (newToolSubtypes.length === 0) {
                showToast('Please add at least one subtype option', 'error');
                return;
            }
            for (let i = 0; i < newToolSubtypes.length; i++) {
                const st = newToolSubtypes[i];
                if (!st.subKey.trim() || !st.displayName.trim()) {
                    showToast(`Subtype at index ${i + 1} must have a Key ID and Name`, 'error');
                    return;
                }
                if (st.csmbs < 0 || st.sss < 0 || st.ucs < 0) {
                    showToast(`Subtype "${st.displayName}" prices must be non-negative`, 'error');
                    return;
                }
            }
        } else {
            if (newToolCsmbs < 0 || newToolSss < 0 || newToolUcs < 0) {
                showToast('Prices must be non-negative', 'error');
                return;
            }
        }

        const exists = config.tools.some(t => t.id === tid);
        if (exists) {
            showToast(`Tool with ID "${tid}" already exists`, 'error');
            return;
        }

        setLoading('Adding new tool...');
        try {
            let toolsOptions: any = null;
            let defaultValue: any = null;
            if (newToolType === 'radio') {
                toolsOptions = newToolSubtypes.map(st => ({
                    label: st.displayName.trim(),
                    value: st.subKey.trim()
                }));
                defaultValue = newToolSubtypes[0]?.subKey.trim() || null;
            }

            let toolErr: any = null;
            try {
                const { error } = await supabase
                    .from('tools')
                    .insert({
                        id: tid,
                        item: dName,
                        type: newToolType,
                        category: newToolCategory,
                        is_active: true,
                        sort_order: 999,
                        options: toolsOptions,
                        default_value: defaultValue
                    });
                toolErr = error;
            } catch (err: any) {
                toolErr = err;
            }

            if (toolErr && (toolErr.message?.includes('column "category"') || toolErr.code === '42703')) {
                const { error: retryErr } = await supabase
                    .from('tools')
                    .insert({
                        id: tid,
                        item: dName,
                        type: newToolType,
                        is_active: true,
                        sort_order: 999,
                        options: toolsOptions,
                        default_value: defaultValue
                    });
                if (retryErr) throw retryErr;
                showToast('Tool added to database! Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'warning');
            } else if (toolErr) {
                throw toolErr;
            }

            if (newToolType === 'radio') {
                const insertPromises = newToolSubtypes.map(async st => {
                    let priceErr: any = null;
                    try {
                        const { error } = await supabase
                            .from('tool_prices')
                            .insert({
                                tool_id: tid,
                                sub_key: st.subKey.trim(),
                                csmbs_price: Number(st.csmbs),
                                sss_price: Number(st.sss),
                                ucs_price: Number(st.ucs),
                                display_name: st.displayName.trim()
                            });
                        priceErr = error;
                    } catch (err: any) {
                        priceErr = err;
                    }

                    if (priceErr && (priceErr.message?.includes('column "display_name"') || priceErr.code === '42703')) {
                        const { error: retryErr } = await supabase
                            .from('tool_prices')
                            .insert({
                                tool_id: tid,
                                sub_key: st.subKey.trim(),
                                csmbs_price: Number(st.csmbs),
                                sss_price: Number(st.sss),
                                ucs_price: Number(st.ucs)
                            });
                        if (retryErr) throw retryErr;
                    } else if (priceErr) {
                        throw priceErr;
                    }
                });
                await Promise.all(insertPromises);
            } else {
                let priceErr: any = null;
                try {
                    const { error } = await supabase
                        .from('tool_prices')
                        .insert({
                            tool_id: tid,
                            sub_key: null,
                            csmbs_price: Number(newToolCsmbs),
                            sss_price: Number(newToolSss),
                            ucs_price: Number(newToolUcs),
                            display_name: dName
                        });
                    priceErr = error;
                } catch (err: any) {
                    priceErr = err;
                }

                if (priceErr && (priceErr.message?.includes('column "display_name"') || priceErr.code === '42703')) {
                    const { error: retryErr } = await supabase
                        .from('tool_prices')
                        .insert({
                            tool_id: tid,
                            sub_key: null,
                            csmbs_price: Number(newToolCsmbs),
                            sss_price: Number(newToolSss),
                            ucs_price: Number(newToolUcs)
                        });
                    if (retryErr) throw retryErr;
                    showToast('Tool added, but display name not saved in pricing. Run SQL: ALTER TABLE tool_prices ADD COLUMN display_name VARCHAR;', 'warning');
                } else if (priceErr) {
                    throw priceErr;
                }
            }

            showToast('New tool added successfully', 'success');
            setNewToolId('');
            setNewToolDisplayName('');
            setNewToolCsmbs(0);
            setNewToolSss(0);
            setNewToolUcs(0);
            setNewToolType('checkbox');
            setNewToolSubtypes([{ subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }]);
            setShowAddToolForm(false);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error adding new tool', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteTool = async (toolId: string) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the tool "${toolId}"? This will delete all its prices and surgery rules.`);
        if (!confirmDelete) return;

        setLoading('Deleting tool...');
        try {
            const { error: priceErr } = await supabase
                .from('tool_prices')
                .delete()
                .eq('tool_id', toolId);
            if (priceErr) throw priceErr;

            const { error: ruleErr } = await supabase
                .from('operation_rules')
                .delete()
                .eq('target_type', 'tool')
                .eq('target_id', toolId);
            if (ruleErr) throw ruleErr;

            const { error: toolErr } = await supabase
                .from('tools')
                .delete()
                .eq('id', toolId);
            if (toolErr) throw toolErr;

            showToast(`Tool "${toolId}" deleted successfully`, 'success');
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error deleting tool', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleMoveToolToPosition = async (draggedId: string, targetId: string, sourceCategory: string, targetCategory: string) => {
        setLoading('Moving tool...');
        try {
            if (sourceCategory === targetCategory) {
                const categoryItems = categorizedPrices[targetCategory] || [];
                const uniqueToolIds: string[] = [];
                categoryItems.forEach(item => {
                    if (!uniqueToolIds.includes(item.tool_id)) {
                        uniqueToolIds.push(item.tool_id);
                    }
                });

                const fromIndex = uniqueToolIds.indexOf(draggedId);
                const toIndex = uniqueToolIds.indexOf(targetId);
                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

                const reordered = [...uniqueToolIds];
                const [moved] = reordered.splice(fromIndex, 1);
                reordered.splice(toIndex, 0, moved);

                const updates = reordered.map((tid, idx) => ({
                    id: tid,
                    sort_order: (idx + 1) * 10
                }));

                const results = await Promise.all(
                    updates.map(upd => 
                        supabase
                            .from('tools')
                            .update({ sort_order: upd.sort_order })
                            .eq('id', upd.id)
                    )
                );

                const firstErr = results.find(r => r.error)?.error;
                if (firstErr) throw firstErr;

                showToast('Tool order updated successfully', 'success');
            } else {
                // Update category in DB
                const { error: catErr } = await supabase
                    .from('tools')
                    .update({ category: targetCategory })
                    .eq('id', draggedId);

                if (catErr) {
                    if (catErr.message?.includes('column "category"') || catErr.code === '42703') {
                        showToast('Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'error');
                        return;
                    }
                    throw catErr;
                }

                // Get target items
                const targetCategoryItems = categorizedPrices[targetCategory] || [];
                const uniqueToolIds: string[] = [];
                targetCategoryItems.forEach(item => {
                    if (!uniqueToolIds.includes(item.tool_id)) {
                        uniqueToolIds.push(item.tool_id);
                    }
                });

                if (targetId === 'end') {
                    if (!uniqueToolIds.includes(draggedId)) {
                        uniqueToolIds.push(draggedId);
                    }
                } else {
                    const toIndex = uniqueToolIds.indexOf(targetId);
                    if (toIndex !== -1) {
                        uniqueToolIds.splice(toIndex, 0, draggedId);
                    } else {
                        uniqueToolIds.push(draggedId);
                    }
                }

                const updates = uniqueToolIds.map((tid, idx) => ({
                    id: tid,
                    sort_order: (idx + 1) * 10
                }));

                const results = await Promise.all(
                    updates.map(upd => 
                        supabase
                            .from('tools')
                            .update({ sort_order: upd.sort_order })
                            .eq('id', upd.id)
                    )
                );

                const firstErr = results.find(r => r.error)?.error;
                if (firstErr) throw firstErr;

                showToast(`Tool moved to ${targetCategory} successfully`, 'success');
            }
            await onRefresh();
        } catch (err: any) {
            if (err.message?.includes('column "sort_order"') || err.code === '42703') {
                showToast('Enable ordering by running SQL: ALTER TABLE tools ADD COLUMN sort_order INT DEFAULT 0;', 'error');
            } else {
                showToast(err.message || 'Error updating order', 'error');
            }
        } finally {
            setLoading(null);
        }
    };

    // --- Logic / Operations State & Logic ---
    const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
    const [showAddOpForm, setShowAddOpForm] = useState(false);
    
    // New Operation Form state
    const [newOpName, setNewOpName] = useState('');
    const [newOpCategory, setNewOpCategory] = useState('Lens Surgery');
    const [newOpKeywords, setNewOpKeywords] = useState('');

    // Editing Operation Form state (inside expanded accordion)
    const [editOpId, setEditOpId] = useState<string | null>(null);
    const [editOpName, setEditOpName] = useState('');
    const [editOpCategory, setEditOpCategory] = useState('');
    const [editOpKeywords, setEditOpKeywords] = useState('');

    // New Rule state (per operation)
    const [newRuleTargetType, setNewRuleTargetType] = useState<'tool' | 'action'>('tool');
    const [newRuleTargetId, setNewRuleTargetId] = useState('');
    const [newRuleDefaultVal, setNewRuleDefaultVal] = useState('');

    const categories = ['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Oculoplastics', 'Strabismus', 'Others'];

    const groupedOperations = useMemo(() => {
        const groups: Record<string, DBOperation[]> = {};
        categories.forEach(c => { groups[c] = []; });
        config.operations.forEach(op => {
            const cat = categories.includes(op.category) ? op.category : 'Others';
            groups[cat].push(op);
        });
        return groups;
    }, [config.operations]);

    const handleCreateOperation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOpName.trim()) {
            showToast('Operation name is required', 'error');
            return;
        }
        setLoading('Creating operation...');
        try {
            const parsedKeywords = newOpKeywords
                .split(',')
                .map(k => k.trim())
                .filter(Boolean);

            const { error } = await supabase
                .from('operations')
                .insert([{
                    name: newOpName.trim(),
                    category: newOpCategory,
                    keywords: parsedKeywords
                }]);

            if (error) throw error;
            showToast('Operation created successfully', 'success');
            setNewOpName('');
            setNewOpKeywords('');
            setShowAddOpForm(false);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error creating operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleStartEditOp = (op: DBOperation) => {
        setEditOpId(op.id);
        setEditOpName(op.name);
        setEditOpCategory(op.category);
        setEditOpKeywords(op.keywords.join(', '));
    };

    const handleSaveOperationDetails = async (opId: string) => {
        if (!editOpName.trim()) {
            showToast('Operation name is required', 'error');
            return;
        }
        setLoading('Saving operation details...');
        try {
            const parsedKeywords = editOpKeywords
                .split(',')
                .map(k => k.trim())
                .filter(Boolean);

            const { error } = await supabase
                .from('operations')
                .update({
                    name: editOpName.trim(),
                    category: editOpCategory,
                    keywords: parsedKeywords
                })
                .eq('id', opId);

            if (error) throw error;
            showToast('Operation updated successfully', 'success');
            setEditOpId(null);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error updating operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteOperation = async (opId: string) => {
        if (!window.confirm('Are you sure you want to delete this operation? This will also delete all associated rules.')) {
            return;
        }
        setLoading('Deleting operation...');
        try {
            // Delete rules first
            const { error: rulesError } = await supabase
                .from('operation_rules')
                .delete()
                .eq('operation_id', opId);

            if (rulesError) throw rulesError;

            // Delete operation
            const { error: opError } = await supabase
                .from('operations')
                .delete()
                .eq('id', opId);

            if (opError) throw opError;

            showToast('Operation and its rules deleted successfully', 'success');
            setExpandedOpId(null);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error deleting operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    // --- Rules Logic ---
    const handleAddRule = async (opId: string) => {
        if (!newRuleTargetId) {
            showToast('Please select a target tool or action', 'error');
            return;
        }
        setLoading('Adding rule...');
        try {
            const { error } = await supabase
                .from('operation_rules')
                .insert([{
                    operation_id: opId,
                    target_type: newRuleTargetType,
                    target_id: newRuleTargetId,
                    default_selected_value: newRuleDefaultVal.trim() || null
                }]);

            if (error) throw error;
            showToast('Trigger rule added successfully', 'success');
            setNewRuleTargetId('');
            setNewRuleDefaultVal('');
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error adding rule', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!window.confirm('Delete this trigger rule?')) return;
        setLoading('Deleting rule...');
        try {
            const { error } = await supabase
                .from('operation_rules')
                .delete()
                .eq('id', ruleId);

            if (error) throw error;
            showToast('Rule deleted successfully', 'success');
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error deleting rule', 'error');
        } finally {
            setLoading(null);
        }
    };

    // Get active items list for rule target selector
    const ruleTargetOptions = useMemo(() => {
        if (newRuleTargetType === 'tool') {
            return config.tools.map(t => ({ id: t.id, name: t.item, options: t.options }));
        } else {
            return config.actions.map(a => ({ id: a.id, name: a.item, options: null }));
        }
    }, [config.tools, config.actions, newRuleTargetType]);

    // Get specific suboptions for selected tool (if any)
    const selectedToolOptions = useMemo(() => {
        if (newRuleTargetType !== 'tool' || !newRuleTargetId) return null;
        const tool = config.tools.find(t => t.id === newRuleTargetId);
        return tool?.options || null;
    }, [config.tools, newRuleTargetType, newRuleTargetId]);

    // Handle change of rule target type
    const handleRuleTargetTypeChange = (type: 'tool' | 'action') => {
        setNewRuleTargetType(type);
        setNewRuleTargetId('');
        setNewRuleDefaultVal('');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Admin Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-800/60 p-1 rounded-xl max-w-md">
                <button
                    onClick={() => setAdminTab('prices')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        adminTab === 'prices'
                            ? 'bg-white dark:bg-[#151f32] text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    Manage Tool Prices
                </button>
                <button
                    onClick={() => setAdminTab('logic')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        adminTab === 'logic'
                            ? 'bg-white dark:bg-[#151f32] text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    Manage Surgery Logic
                </button>
            </div>

            {/* Prices Management View */}
            {adminTab === 'prices' && (
                <div className="space-y-6">
                    {/* Search Panel */}
                    <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-50 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Database size={18} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
                                <h2 className="text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Tool Configurations & Prices</h2>
                            </div>
                            <div className="flex items-center gap-2 max-w-md w-full sm:justify-end">
                                <div className="relative max-w-xs w-full">
                                    <input
                                        type="text"
                                        placeholder="Search tools or keys..."
                                        value={priceSearch}
                                        onChange={e => setPriceSearch(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                    />
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => setShowAddToolForm(!showAddToolForm)}
                                    className="px-3 py-1.5 bg-[#fcb7f0]/20 hover:bg-[#fcb7f0]/40 text-[#8e5a7d] dark:text-[#fcb7f0] text-xs font-bold rounded-lg transition-all border border-[#fcb7f0]/30 flex items-center gap-1.5 shrink-0"
                                >
                                    <Plus size={14} />
                                    {showAddToolForm ? 'Hide Form' : 'Add Tool'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add Tool Form */}
                    {showAddToolForm && (
                        <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 animate-slideDown transition-all duration-300">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
                                <h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                    <Plus size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
                                    Add New Tool
                                </h3>
                            </div>
                            <form onSubmit={handleAddToolSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Tool Display Name</label>
                                        <input
                                            type="text"
                                            value={newToolDisplayName}
                                            onChange={e => handleDisplayNameChange(e.target.value)}
                                            placeholder="e.g. Fine Scissors"
                                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Tool Database ID</label>
                                        <input
                                            type="text"
                                            value={newToolId}
                                            onChange={e => setNewToolId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="e.g. fine-scissors"
                                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Category</label>
                                        <select
                                            value={newToolCategory}
                                            onChange={e => setNewToolCategory(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                        >
                                            {CATEGORY_ORDER.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Option</label>
                                        <select
                                            value={newToolType}
                                            onChange={e => setNewToolType(e.target.value as any)}
                                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                        >
                                            <option value="checkbox">None</option>
                                            <option value="radio">Subtype (Multiple choices)</option>
                                            <option value="number-input">Input Value</option>
                                        </select>
                                        <span className="text-[9px] text-gray-400 dark:text-slate-555 block mt-1 leading-normal">
                                            {newToolType === 'checkbox' && "• Renders as a simple toggle checkbox (e.g., Fibrin Glue)."}
                                            {newToolType === 'radio' && "• Renders as multiple choice options (e.g., Constellation vs Stellaris)."}
                                            {newToolType === 'number-input' && "• Renders with a counter input box (e.g., specifying 4 retractors)."}
                                        </span>
                                    </div>
                                </div>
                                {newToolType === 'radio' ? (
                                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0]">Subtypes & Pricing</h4>
                                            <button
                                                type="button"
                                                onClick={handleAddSubtypeRow}
                                                className="px-2 py-1 bg-[#fcb7f0]/20 hover:bg-[#fcb7f0]/40 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold rounded transition-all border border-[#fcb7f0]/30 flex items-center gap-1"
                                            >
                                                <Plus size={10} />
                                                Add Subtype Option
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {newToolSubtypes.map((st, idx) => (
                                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-gray-50/50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800 relative">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Name</label>
                                                        <input
                                                            type="text"
                                                            value={st.displayName}
                                                            onChange={e => handleUpdateSubtypeRow(idx, 'displayName', e.target.value)}
                                                            placeholder="e.g. Constellation"
                                                            className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Key ID</label>
                                                        <input
                                                            type="text"
                                                            value={st.subKey}
                                                            onChange={e => handleUpdateSubtypeRow(idx, 'subKey', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                            placeholder="e.g. constellation"
                                                            className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">CSMBS Price (฿)</label>
                                                        <input
                                                            type="number"
                                                            value={st.csmbs}
                                                            onChange={e => handleUpdateSubtypeRow(idx, 'csmbs', Number(e.target.value))}
                                                            className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 font-mono"
                                                            min="0"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">SSS Price (฿)</label>
                                                        <input
                                                            type="number"
                                                            value={st.sss}
                                                            onChange={e => handleUpdateSubtypeRow(idx, 'sss', Number(e.target.value))}
                                                            className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 font-mono"
                                                            min="0"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">UCS Price (฿)</label>
                                                            <input
                                                                type="number"
                                                                value={st.ucs}
                                                                onChange={e => handleUpdateSubtypeRow(idx, 'ucs', Number(e.target.value))}
                                                                className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 font-mono"
                                                                min="0"
                                                                required
                                                            />
                                                        </div>
                                                        {newToolSubtypes.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSubtypeRow(idx)}
                                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded mb-0.5 transition-colors"
                                                                title="Remove Subtype"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">CSMBS Price (฿)</label>
                                            <input
                                                type="number"
                                                value={newToolCsmbs}
                                                onChange={e => setNewToolCsmbs(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">SSS Price (฿)</label>
                                            <input
                                                type="number"
                                                value={newToolSss}
                                                onChange={e => setNewToolSss(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">UCS Price (฿)</label>
                                            <input
                                                type="number"
                                                value={newToolUcs}
                                                onChange={e => setNewToolUcs(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddToolForm(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                    >
                                        <Save size={14} />
                                        Save Tool
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Categorized Tables */}
                    {CATEGORY_ORDER.map(category => {
                        const items = categorizedPrices[category] || [];
                        if (items.length === 0) {
                            if (priceSearch.trim()) return null;
                            return (
                                <section
                                    key={category}
                                    onDragOver={(e) => {
                                        if (draggedToolId && draggedCategory !== category && editingCategory === draggedCategory) {
                                            e.preventDefault();
                                            if (dragOverCategory !== category) {
                                                setDragOverCategory(category);
                                            }
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverCategory === category) {
                                            setDragOverCategory(null);
                                        }
                                    }}
                                    onDrop={async (e) => {
                                        if (draggedToolId && draggedCategory !== category && editingCategory === draggedCategory) {
                                            e.preventDefault();
                                            await handleMoveToolToPosition(draggedToolId, 'end', draggedCategory!, category);
                                        }
                                        setDragOverCategory(null);
                                    }}
                                    className={`bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border p-4 sm:p-5 transition-all duration-300
                                        ${dragOverCategory === category 
                                            ? 'border-[#fcb7f0] dark:border-pink-500/50 ring-2 ring-[#fcb7f0]/30 dark:ring-pink-500/20 bg-pink-50/10 dark:bg-pink-950/5' 
                                            : 'border-gray-100 dark:border-slate-800'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-center -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e5a7d] dark:text-pink-400/80 flex items-center gap-2">
                                            <span className="w-1.5 h-3 bg-[#fcb7f0] rounded-full"></span>
                                            {category}
                                        </h3>
                                    </div>
                                    <div className="border border-dashed border-gray-200 dark:border-slate-800/60 rounded-xl p-6 text-center text-xs text-gray-400 dark:text-slate-500 italic bg-gray-50/20 dark:bg-slate-900/10">
                                        No tools in this category. Drag a tool here to assign it.
                                    </div>
                                </section>
                            );
                        }

                        return (
                                <section
                                    key={category}
                                    onDragOver={(e) => {
                                        if (draggedToolId && draggedCategory !== category && editingCategory === draggedCategory) {
                                            e.preventDefault();
                                            if (dragOverCategory !== category) {
                                                setDragOverCategory(category);
                                            }
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverCategory === category) {
                                            setDragOverCategory(null);
                                        }
                                    }}
                                    onDrop={async (e) => {
                                        if (draggedToolId && draggedCategory !== category && editingCategory === draggedCategory) {
                                            e.preventDefault();
                                            await handleMoveToolToPosition(draggedToolId, 'end', draggedCategory!, category);
                                        }
                                        setDragOverCategory(null);
                                    }}
                                    className={`bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border p-4 sm:p-5 transition-all duration-300
                                        ${dragOverCategory === category 
                                            ? 'border-[#fcb7f0] dark:border-pink-500/50 ring-2 ring-[#fcb7f0]/30 dark:ring-pink-500/20 bg-pink-50/10 dark:bg-pink-950/5' 
                                            : 'border-gray-100 dark:border-slate-800'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-center -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e5a7d] dark:text-pink-400/80 flex items-center gap-2">
                                            <span className="w-1.5 h-3 bg-[#fcb7f0] rounded-full"></span>
                                            {category}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {editingCategory === category ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveCategoryPrices(category)}
                                                        disabled={loading !== null}
                                                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                                                        title="Save All"
                                                    >
                                                        <Save size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCategory(null)}
                                                        disabled={loading !== null}
                                                        className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleStartEditCategory(category)}
                                                    disabled={editingCategory !== null || loading !== null}
                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[11px] sm:text-xs">
                                            <thead>
                                                <tr className="text-gray-400 dark:text-slate-500 border-b border-gray-50 dark:border-slate-800/50">
                                                    <th className="py-2 px-2 font-bold uppercase tracking-wider w-1/3">Tool Name</th>
                                                    <th className="py-2 px-2 font-bold uppercase tracking-wider w-24">Sub-key</th>
                                                    <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">CSMBS</th>
                                                    <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">SSS</th>
                                                    <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">UCS</th>
                                                    <th className="py-2 px-2 font-bold uppercase tracking-wider text-center w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/30">
                                                {items.map((price, idx) => {
                                                    const tool = config.tools.find(t => t.id === price.tool_id);
                                                    const isEditing = editingCategory === category;
                                                    const isFirstOccurrence = items.findIndex(item => item.tool_id === price.tool_id) === idx;
                                                    const rowData = editPricesData[price.id] || {
                                                        displayName: price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key),
                                                        csmbs: price.csmbs_price,
                                                        sss: price.sss_price,
                                                        ucs: price.ucs_price
                                                    };

                                                    return (
                                                        <tr
                                                            key={price.id}
                                                            draggable={isEditing}
                                                            onDragStart={(e) => {
                                                                setDraggedToolId(price.tool_id);
                                                                setDraggedCategory(category);
                                                                e.dataTransfer.effectAllowed = 'move';
                                                            }}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                if (draggedToolId && draggedToolId !== price.tool_id) {
                                                                    if (dragOverToolId !== price.tool_id) {
                                                                        setDragOverToolId(price.tool_id);
                                                                    }
                                                                }
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                if (draggedToolId && draggedToolId !== price.tool_id) {
                                                                    e.stopPropagation();
                                                                    handleMoveToolToPosition(draggedToolId, price.tool_id, draggedCategory!, category);
                                                                }
                                                                setDraggedToolId(null);
                                                                setDraggedCategory(null);
                                                                setDragOverToolId(null);
                                                                setDragOverCategory(null);
                                                            }}
                                                            onDragEnd={() => {
                                                                setDraggedToolId(null);
                                                                setDraggedCategory(null);
                                                                setDragOverToolId(null);
                                                                setDragOverCategory(null);
                                                            }}
                                                            className={`
                                                                transition-all duration-200
                                                                ${draggedToolId === price.tool_id ? 'opacity-30 bg-gray-100 dark:bg-slate-800/40' : ''}
                                                                ${dragOverToolId === price.tool_id ? 'bg-[#fcb7f0]/10 dark:bg-[#fcb7f0]/5' : ''}
                                                                hover:bg-gray-50/50 dark:hover:bg-slate-800/30
                                                            `}
                                                        >
                                                            <td className="py-3 px-2">
                                                                <div className="flex items-center gap-2">
                                                                    {isEditing && (
                                                                        isFirstOccurrence ? (
                                                                            <Menu
                                                                                size={14}
                                                                                className="text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-[#fcb7f0] transition-colors shrink-0"
                                                                                title="Drag to reorder tool"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-3.5 shrink-0" />
                                                                        )
                                                                    )}
                                                                    {isEditing ? (
                                                                        <div className="flex flex-col gap-1.5 w-full">
                                                                            <input
                                                                                type="text"
                                                                                value={rowData.displayName}
                                                                                onChange={e => handleUpdateEditField(price.id, 'displayName', e.target.value, price, tool)}
                                                                                className="w-full p-1 border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                placeholder="Display Name"
                                                                            />
                                                                            <span className="text-[9px] text-gray-455 dark:text-slate-500 font-mono pl-1">
                                                                                ID: {price.tool_id}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-gray-900 dark:text-slate-200">
                                                                                {price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key)}
                                                                            </span>
                                                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono">
                                                                                Db Item: {tool ? tool.item : price.tool_id}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-2">
                                                                {price.sub_key ? (
                                                                    <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                                        {price.sub_key}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-slate-600 italic">-</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-right">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
                                                                        value={rowData.csmbs}
                                                                        onChange={e => handleUpdateEditField(price.id, 'csmbs', Number(e.target.value), price, tool)}
                                                                        className="w-16 sm:w-20 text-right p-1 border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0]"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                        {price.csmbs_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-right">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
                                                                        value={rowData.sss}
                                                                        onChange={e => handleUpdateEditField(price.id, 'sss', Number(e.target.value), price, tool)}
                                                                        className="w-16 sm:w-20 text-right p-1 border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0]"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                        {price.sss_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-right">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
                                                                        value={rowData.ucs}
                                                                        onChange={e => handleUpdateEditField(price.id, 'ucs', Number(e.target.value), price, tool)}
                                                                        className="w-16 sm:w-20 text-right p-1 border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0]"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                        {price.ucs_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-center">
                                                                {isEditing ? (
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <div 
                                                                            className={`relative p-1 text-[#8e5a7d] hover:text-[#734464] hover:bg-[#fcb7f0]/10 dark:text-[#fcb7f0] dark:hover:text-[#f78de3] dark:hover:bg-[#fcb7f0]/5 rounded transition-all flex items-center justify-center ${
                                                                                (loading !== null)
                                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                                    : 'cursor-pointer'
                                                                            }`}
                                                                            title="Move Category"
                                                                        >
                                                                            <FolderSymlink size={13} />
                                                                            <select
                                                                                value="move"
                                                                                disabled={loading !== null}
                                                                                onChange={async (e) => {
                                                                                    const newCat = e.target.value;
                                                                                    if (newCat !== "move") {
                                                                                        await handleMoveToolToPosition(price.tool_id, 'end', category, newCat);
                                                                                    }
                                                                                }}
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                            >
                                                                                <option value="move" disabled hidden>Move</option>
                                                                                {CATEGORY_ORDER.map(cat => (
                                                                                    <option key={cat} value={cat} disabled={cat === category}>
                                                                                        {cat}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDeleteTool(price.tool_id)}
                                                                            disabled={loading !== null}
                                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                                                                            title="Delete Tool"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-slate-600">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            );
                        })
                    }

                    {priceSearch.trim() && Object.values(categorizedPrices).every(arr => arr.length === 0) && (
                        <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                            No tools found matching search term "{priceSearch}"
                        </div>
                    )}
                </div>
            )}

            {/* Surgery Logic / Rule Management View */}
            {adminTab === 'logic' && (
                <div className="space-y-4">
                    {/* Add Operation Toggle Panel */}
                    <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                <Plus size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
                                Add Surgery Operation
                            </h2>
                            <button
                                onClick={() => setShowAddOpForm(!showAddOpForm)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all"
                            >
                                {showAddOpForm ? 'Hide Form' : 'Show Form'}
                            </button>
                        </div>

                        {showAddOpForm && (
                            <form onSubmit={handleCreateOperation} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4 animate-slideDown">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Operation Name</label>
                                        <input
                                            type="text"
                                            value={newOpName}
                                            onChange={e => setNewOpName(e.target.value)}
                                            placeholder="e.g. PPV, Phaco, GDI"
                                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Category</label>
                                        <select
                                            value={newOpCategory}
                                            onChange={e => setNewOpCategory(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Trigger Keywords (comma separated)</label>
                                    <input
                                        type="text"
                                        value={newOpKeywords}
                                        onChange={e => setNewOpKeywords(e.target.value)}
                                        placeholder="e.g. phaco, phacoemulsification, phc"
                                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                    />
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 block font-medium">Keywords are case-insensitive. Small keywords (≤2 characters) will match whole words only.</span>
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#fcb7f0] hover:bg-[#fcb7f0]/85 text-slate-800 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Create Operation
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Operations Accordion List */}
                    <div className="space-y-4">
                        {categories.map(category => {
                            const operations = groupedOperations[category];
                            if (operations.length === 0) return null;

                            return (
                                <div key={category} className="space-y-2.5">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e5a7d] dark:text-pink-400/80 px-1 flex items-center gap-2 mt-4">
                                        <span className="w-1.5 h-3 bg-[#fcb7f0] rounded-full"></span>
                                        {category}
                                    </h3>
                                    
                                    <div className="space-y-2">
                                        {operations.map(op => {
                                            const isExpanded = expandedOpId === op.id;
                                            const opRules = config.rules.filter(r => r.operation_id === op.id);
                                            const isEditingDetails = editOpId === op.id;

                                            return (
                                                <div 
                                                    key={op.id} 
                                                    className="bg-white dark:bg-[#151f32] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors"
                                                >
                                                    {/* Operation Header */}
                                                    <div 
                                                        onClick={() => setExpandedOpId(isExpanded ? null : op.id)}
                                                        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                                                {op.name}
                                                            </span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {op.keywords.map(kw => (
                                                                    <span key={kw} className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono font-medium">
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
                                                                {opRules.length} rule{opRules.length !== 1 ? 's' : ''}
                                                            </span>
                                                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                        </div>
                                                    </div>

                                                    {/* Expanded Operation Body */}
                                                    {isExpanded && (
                                                        <div className="p-4 sm:p-5 border-t border-gray-50 dark:border-slate-800/80 bg-gray-50/30 dark:bg-slate-900/10 space-y-5 animate-slideDown">
                                                            {/* edit details form */}
                                                            <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-slate-800 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Operation Settings</h4>
                                                                    {!isEditingDetails ? (
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => handleStartEditOp(op)}
                                                                                className="p-1 text-gray-500 hover:text-[#fcb7f0] transition-colors"
                                                                                title="Edit details"
                                                                            >
                                                                                <Edit size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteOperation(op.id)}
                                                                                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                                                                title="Delete operation"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex gap-1.5">
                                                                            <button
                                                                                onClick={() => handleSaveOperationDetails(op.id)}
                                                                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                                                                title="Save details"
                                                                            >
                                                                                <Save size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setEditOpId(null)}
                                                                                className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
                                                                                title="Cancel"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {isEditingDetails ? (
                                                                    <div className="space-y-3">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            <div>
                                                                                <label className="text-[9px] font-bold text-gray-450 dark:text-slate-500 block mb-1">Name</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editOpName}
                                                                                    onChange={e => setEditOpName(e.target.value)}
                                                                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[9px] font-bold text-gray-455 dark:text-slate-500 block mb-1">Category</label>
                                                                                <select
                                                                                    value={editOpCategory}
                                                                                    onChange={e => setEditOpCategory(e.target.value)}
                                                                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                >
                                                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[9px] font-bold text-gray-450 dark:text-slate-500 block mb-1">Trigger Keywords (comma separated)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={editOpKeywords}
                                                                                onChange={e => setEditOpKeywords(e.target.value)}
                                                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                                        <div>
                                                                            <span className="text-gray-400 dark:text-slate-500 font-bold block">Category</span>
                                                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{op.category}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400 dark:text-slate-500 font-bold block">Trigger Keywords</span>
                                                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{op.keywords.join(', ') || '(none)'}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* associated rules */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-slate-400 px-1">Checklist Triggers</h4>
                                                                
                                                                {opRules.length === 0 ? (
                                                                    <div className="py-4 text-center border border-dashed border-gray-150 dark:border-slate-800 rounded-xl text-gray-400 dark:text-slate-500 text-xs italic">
                                                                        No tools or actions are automatically triggered for this operation yet.
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {opRules.map(rule => {
                                                                            let targetName = 'Unknown';
                                                                            if (rule.target_type === 'tool') {
                                                                                const tool = config.tools.find(t => t.id === rule.target_id);
                                                                                targetName = tool ? tool.item : rule.target_id;
                                                                            } else {
                                                                                const action = config.actions.find(a => a.id === rule.target_id);
                                                                                targetName = action ? action.item : rule.target_id;
                                                                            }

                                                                            return (
                                                                                <div 
                                                                                    key={rule.id} 
                                                                                    className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                                                                                >
                                                                                    <div className="flex flex-col">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded leading-none shrink-0 ${
                                                                                                rule.target_type === 'tool' 
                                                                                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400' 
                                                                                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                                                                                            }`}>
                                                                                                {rule.target_type}
                                                                                            </span>
                                                                                            <span className="font-bold text-gray-800 dark:text-slate-200">
                                                                                                {targetName}
                                                                                            </span>
                                                                                        </div>
                                                                                        {rule.default_selected_value && (
                                                                                            <span className="text-[9px] text-gray-450 dark:text-slate-400 font-semibold mt-1">
                                                                                                Default select: {rule.default_selected_value}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleDeleteRule(rule.id)}
                                                                                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                                                                        title="Remove trigger"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Add new rule inline panel */}
                                                                <div className="bg-white dark:bg-[#111827] border border-dashed border-gray-200 dark:border-slate-800 p-3 sm:p-4 rounded-xl space-y-3">
                                                                    <h5 className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Add Checklist Trigger Rule</h5>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                        <div>
                                                                            <select
                                                                                value={newRuleTargetType}
                                                                                onChange={e => handleRuleTargetTypeChange(e.target.value as any)}
                                                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                            >
                                                                                <option value="tool">Surgical Tool</option>
                                                                                <option value="action">Pre-Op Action</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <select
                                                                                value={newRuleTargetId}
                                                                                onChange={e => setNewRuleTargetId(e.target.value)}
                                                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                            >
                                                                                <option value="">- Select Item -</option>
                                                                                {ruleTargetOptions.map(opt => (
                                                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            {selectedToolOptions ? (
                                                                                <select
                                                                                    value={newRuleDefaultVal}
                                                                                    onChange={e => setNewRuleDefaultVal(e.target.value)}
                                                                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                >
                                                                                    <option value="">- Selection (Opt) -</option>
                                                                                    {selectedToolOptions.map(o => (
                                                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                                                    ))}
                                                                                </select>
                                                                            ) : newRuleTargetType === 'tool' ? (
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Default value (optional)"
                                                                                    value={newRuleDefaultVal}
                                                                                    onChange={e => setNewRuleDefaultVal(e.target.value)}
                                                                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-8 flex items-center justify-center text-[10px] text-gray-400 dark:text-slate-650 bg-gray-50/50 dark:bg-slate-850 rounded border border-gray-150 dark:border-slate-800 select-none">
                                                                                    No value config
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleAddRule(op.id)}
                                                                        className="px-3 py-1 bg-[#fcb7f0]/20 hover:bg-[#fcb7f0]/40 text-[#8e5a7d] dark:text-[#fcb7f0] rounded text-[10px] font-black transition-all border border-[#fcb7f0]/30 uppercase tracking-wider flex items-center gap-1"
                                                                    >
                                                                        <Plus size={10} strokeWidth={3} /> Add Trigger
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* loading Indicator Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-[#151f32] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center gap-3">
                        <RefreshCw size={24} className="text-[#8e5a7d] dark:text-[#fcb7f0] animate-spin" />
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-350">{loading}</span>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
                    <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-2 max-w-sm ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-50 dark:bg-red-950/30 border-red-500/30 text-red-855 dark:text-red-300'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span className="text-xs font-bold">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
