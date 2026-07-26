import React, { useState, useMemo, useEffect } from 'react';  
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
    FolderSymlink,  
    Folder  
} from 'lucide-react';  
import { supabase } from './supabase';  
import { DBTool, DBAction, DBOperation, DBRule, DBPrice } from './configService';  
import { NEW\_REUSED\_OPTIONS } from './constants';  
const CATEGORY\_ORDER \= \['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Generals'\];  
const TOOL\_CATEGORIES: Record\<string, string\> \= {  
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
const TOOL\_ORDER \= \[  
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
\];  
const getToolDisplayName \= (toolId: string, itemText: string, subKey: string | null): string \=\> {  
    const capitalize \= (s: string) \=\> s.charAt(0).toUpperCase() \+ s.slice(1).toLowerCase();  
    if (toolId \=== 'ctr-no') {  
        return 'Capsular Tension Ring';  
    }  
    if (toolId \=== 'cts') {  
        return 'Capsular Tension Segment';  
    }  
    if (toolId \=== 'glaucoma-device' && subKey) {  
        if (subKey \=== 'gdi-xen-room') return 'XEN glaucoma gel implant';  
        if (subKey \=== 'aadi-shunt') return 'AADI shunt';  
        if (subKey \=== 'gfd-express') return 'Express GFD';  
        return capitalize(subKey.replace(/-/g, ' '));  
    }  
    if (toolId \=== 'phaco-machine' && subKey) {  
        return \`${capitalize(subKey)} phaco machine\`;  
    }  
    if (toolId \=== 'ppv-set' && subKey) {  
        const parts \= subKey.split('\_');  
        const machine \= parts.length \> 1 ? parts\[1\] : parts\[0\];  
        return \`23G/25G ${capitalize(machine)}\`;  
    }  
    if (toolId \=== 'soft-tip') {  
        return 'Soft tip';  
    }  
    return itemText || toolId;  
};  
interface AdminPageProps {  
    config: {  
        tools: DBTool\[\];  
        actions: DBAction\[\];  
        operations: DBOperation\[\];  
        rules: DBRule\[\];  
        prices: DBPrice\[\];  
    };  
    onRefresh: () \=\> Promise\<void\>;  
    isOffline: boolean;  
    onEditingChange: (isEditing: boolean) \=\> void;  
}  
export default function AdminPage({ config, onRefresh, isOffline, onEditingChange }: AdminPageProps) {  
    const \[adminTab, setAdminTab\] \= useState\<'prices' | 'logic'\>('prices');  
    const \[toast, setToast\] \= useState\<{ message: string; type: 'success' | 'error' } | null\>(null);  
    const \[loading, setLoading\] \= useState\<string | null\>(null); // tracks active operation description  
    const showToast \= (message: string, type: 'success' | 'error') \=\> {  
        setToast({ message, type });  
        setTimeout(() \=\> setToast(null), 4000);  
    };  
    // \--- Prices State & Logic \---  
    const \[priceSearch, setPriceSearch\] \= useState('');  
    const \[selectedCategory, setSelectedCategory\] \= useState\<'All' | string\>('All');  
    const \[logicSearch, setLogicSearch\] \= useState('');  
    const \[selectedLogicCategory, setSelectedLogicCategory\] \= useState\<'All' | string\>('All');  
    const \[editingCategory, setEditingCategory\] \= useState\<string | null\>(null);  
    const \[editingPriceId, setEditingPriceId\] \= useState\<string | null\>(null);  
    const \[editPricesData, setEditPricesData\] \= useState\<Record\<string, {  
        displayName: string;  
        csmbs: number;  
        sss: number;  
        ucs: number;  
    }\>\>({});  
    const hasCategoryChanges \= (cat: string): boolean \=\> {  
        const catPrices \= categorizedPrices\[cat\] || \[\];  
        for (const p of catPrices) {  
            const current \= editPricesData\[p.id\];  
            if (\!current) continue;  
            const tool \= config.tools.find(t \=\> t.id \=== p.tool\_id);  
            const originalDispName \= p.display\_name || getToolDisplayName(p.tool\_id, tool ? tool.item : p.tool\_id, p.sub\_key);  
            if (  
                current.displayName \!== originalDispName ||  
                current.csmbs \!== p.csmbs\_price ||  
                current.sss \!== p.sss\_price ||  
                current.ucs \!== p.ucs\_price  
            ) {  
                return true;  
            }  
        }  
        return false;  
    };  
    const hasPriceRowChanges \= (priceId: string): boolean \=\> {  
        const originalPrice \= config.prices.find(p \=\> p.id \=== priceId);  
        if (\!originalPrice) return false;  
        const current \= editPricesData\[priceId\];  
        if (\!current) return false;  
        const tool \= config.tools.find(t \=\> t.id \=== originalPrice.tool\_id);  
        const originalDispName \= originalPrice.display\_name || getToolDisplayName(originalPrice.tool\_id, tool ? tool.item : originalPrice.tool\_id, originalPrice.sub\_key);  
        return (  
            current.displayName \!== originalDispName ||  
            current.csmbs \!== originalPrice.csmbs\_price ||  
            current.sss \!== originalPrice.sss\_price ||  
            current.ucs \!== originalPrice.ucs\_price  
        );  
    };  
    const hasUnsavedChanges \= (): boolean \=\> {  
        if (editingCategory) {  
            return hasCategoryChanges(editingCategory);  
        }  
        if (editingPriceId) {  
            return hasPriceRowChanges(editingPriceId);  
        }  
        return false;  
    };  
    useEffect(() \=\> {  
        if (onEditingChange) {  
            onEditingChange(  
                (editingCategory \!== null && hasCategoryChanges(editingCategory)) ||  
                (editingPriceId \!== null && hasPriceRowChanges(editingPriceId))  
            );  
        }  
    }, \[editingCategory, editingPriceId, editPricesData, onEditingChange\]);  
    // Add Tool Form States  
    const \[showAddToolForm, setShowAddToolForm\] \= useState(false);  
    const \[newToolId, setNewToolId\] \= useState('');  
    const \[newToolDisplayName, setNewToolDisplayName\] \= useState('');  
    const \[newToolCategory, setNewToolCategory\] \= useState('Generals');  
    const \[newToolCsmbs, setNewToolCsmbs\] \= useState\<number\>(0);  
    const \[newToolSss, setNewToolSss\] \= useState\<number\>(0);  
    const \[newToolUcs, setNewToolUcs\] \= useState\<number\>(0);  
    const \[newToolType, setNewToolType\] \= useState\<'checkbox' | 'radio' | 'number-input'\>('checkbox');  
      
    interface NewSubtype {  
        subKey: string;  
        displayName: string;  
        csmbs: number;  
        sss: number;  
        ucs: number;  
    }  
    const \[newToolSubtypes, setNewToolSubtypes\] \= useState\<NewSubtype\[\]\>(\[  
        { subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }  
    \]);  
    const \[activeAddSubtypeTool, setActiveAddSubtypeTool\] \= useState\<DBTool | null\>(null);  
    const \[newSubtypeKey, setNewSubtypeKey\] \= useState('');  
    const \[newSubtypeDisplayName, setNewSubtypeDisplayName\] \= useState('');  
    const \[newSubtypeCsmbs, setNewSubtypeCsmbs\] \= useState\<number\>(0);  
    const \[newSubtypeSss, setNewSubtypeSss\] \= useState\<number\>(0);  
    const \[newSubtypeUcs, setNewSubtypeUcs\] \= useState\<number\>(0);  
    const handleAddSubtypeRow \= () \=\> {  
        setNewToolSubtypes(\[  
            ...newToolSubtypes,  
            { subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }  
        \]);  
    };  
    const handleRemoveSubtypeRow \= (index: number) \=\> {  
        const updated \= \[...newToolSubtypes\];  
        updated.splice(index, 1);  
        setNewToolSubtypes(updated);  
    };  
    const handleUpdateSubtypeRow \= (index: number, field: keyof NewSubtype, value: any) \=\> {  
        const updated \= \[...newToolSubtypes\];  
        updated\[index\] \= {  
            ...updated\[index\],  
            \[field\]: value  
        };  
        if (field \=== 'displayName' && \!updated\[index\].subKey) {  
            updated\[index\].subKey \= value  
                .toLowerCase()  
                .replace(/\[^a-z0-9\]+/g, '-')  
                .replace(/(^-|-$)+/g, '');  
        }  
        setNewToolSubtypes(updated);  
    };  
    const handleCloseAddToolForm \= () \=\> {  
        const hasInputs \= newToolDisplayName.trim() ||   
            newToolId.trim() ||   
            newToolCsmbs \> 0 ||   
            newToolSss \> 0 ||   
            newToolUcs \> 0 ||   
            newToolSubtypes.some(s \=\> s.displayName.trim() || s.subKey.trim() || s.csmbs \> 0 || s.sss \> 0 || s.ucs \> 0);  
        if (hasInputs) {  
            const confirmClose \= window.confirm('You have unsaved changes in the Add Tool form. Are you sure you want to discard them?');  
            if (\!confirmClose) return;  
        }  
        setShowAddToolForm(false);  
        // reset form  
        setNewToolDisplayName('');  
        setNewToolId('');  
        setNewToolCategory('Generals');  
        setNewToolCsmbs(0);  
        setNewToolSss(0);  
        setNewToolUcs(0);  
        setNewToolType('checkbox');  
        setNewToolSubtypes(\[{ subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }\]);  
    };  
    // Drag and Drop States  
    const \[draggedToolId, setDraggedToolId\] \= useState\<string | null\>(null);  
    const \[draggedCategory, setDraggedCategory\] \= useState\<string | null\>(null);  
    const \[dragOverToolId, setDragOverToolId\] \= useState\<string | null\>(null);  
    const \[dragOverCategory, setDragOverCategory\] \= useState\<string | null\>(null);  
    const filteredPrices \= useMemo(() \=\> {  
        const filtered \= config.prices.filter(p \=\> {  
            const tool \= config.tools.find(t \=\> t.id \=== p.tool\_id);  
            const toolName \= tool ? tool.item.toLowerCase() : '';  
            const subKey \= p.sub\_key ? p.sub\_key.toLowerCase() : '';  
            const search \= priceSearch.toLowerCase();  
            return toolName.includes(search) || subKey.includes(search) || p.tool\_id.toLowerCase().includes(search);  
        });  
        return \[...filtered\].sort((a, b) \=\> {  
            const toolA \= config.tools.find(t \=\> t.id \=== a.tool\_id);  
            const toolB \= config.tools.find(t \=\> t.id \=== b.tool\_id);  
            const catA \= toolA?.category || TOOL\_CATEGORIES\[a.tool\_id\] || 'Generals';  
            const catB \= toolB?.category || TOOL\_CATEGORIES\[b.tool\_id\] || 'Generals';  
              
            const catIdxA \= CATEGORY\_ORDER.indexOf(catA);  
            const catIdxB \= CATEGORY\_ORDER.indexOf(catB);  
              
            if (catIdxA \!== catIdxB) {  
                return catIdxA \- catIdxB;  
            }  
            const orderA \= toolA && typeof toolA.sort\_order \=== 'number' ? toolA.sort\_order : 0;  
            const orderB \= toolB && typeof toolB.sort\_order \=== 'number' ? toolB.sort\_order : 0;  
            if (orderA \!== orderB) {  
                return orderA \- orderB;  
            }  
            const toolIdxA \= TOOL\_ORDER.indexOf(a.tool\_id);  
            const toolIdxB \= TOOL\_ORDER.indexOf(b.tool\_id);  
              
            const finalIdxA \= toolIdxA \=== \-1 ? 999 : toolIdxA;  
            const finalIdxB \= toolIdxB \=== \-1 ? 999 : toolIdxB;  
              
            if (finalIdxA \!== finalIdxB) {  
                return finalIdxA \- finalIdxB;  
            }  
            const subA \= a.sub\_key || '';  
            const subB \= b.sub\_key || '';  
            return subA.localeCompare(subB);  
        });  
    }, \[config.prices, config.tools, priceSearch\]);  
    const categorizedPrices \= useMemo(() \=\> {  
        const groups: Record\<string, DBPrice\[\]\> \= {};  
        CATEGORY\_ORDER.forEach(c \=\> { groups\[c\] \= \[\]; });  
          
        filteredPrices.forEach(p \=\> {  
            const tool \= config.tools.find(t \=\> t.id \=== p.tool\_id);  
            const cat \= tool?.category || TOOL\_CATEGORIES\[p.tool\_id\] || 'Generals';  
            const finalCat \= CATEGORY\_ORDER.includes(cat) ? cat : 'Generals';  
            groups\[finalCat\].push(p);  
        });  
        return groups;  
    }, \[filteredPrices, config.tools\]);  
    const handleStartEditCategory \= (cat: string) \=\> {  
        setEditingCategory(cat);  
        setEditingPriceId(null);  
        const categoryItems \= categorizedPrices\[cat\] || \[\];  
        const initialData: Record\<string, {  
            displayName: string;  
            csmbs: number;  
            sss: number;  
            ucs: number;  
        }\> \= {};  
        categoryItems.forEach(price \=\> {  
            const tool \= config.tools.find(t \=\> t.id \=== price.tool\_id);  
            const dispName \= price.display\_name || getToolDisplayName(price.tool\_id, tool ? tool.item : price.tool\_id, price.sub\_key);  
            initialData\[price.id\] \= {  
                displayName: dispName,  
                csmbs: price.csmbs\_price,  
                sss: price.sss\_price,  
                ucs: price.ucs\_price  
            };  
        });  
        setEditPricesData(initialData);  
    };  
    const handleSaveCategoryPrices \= async (cat: string) \=\> {  
        const items \= categorizedPrices\[cat\] || \[\];  
        // validate  
        for (const item of items) {  
            const data \= editPricesData\[item.id\];  
            if (\!data) continue;  
            if (data.csmbs \< 0 || data.sss \< 0 || data.ucs \< 0\) {  
                showToast('Prices must be non-negative numbers', 'error');  
                return;  
            }  
            if (\!data.displayName.trim()) {  
                showToast('Tool name is required', 'error');  
                return;  
            }  
        }  
        setLoading('Saving category prices...');  
        try {  
            const updates \= items.map(item \=\> {  
                const data \= editPricesData\[item.id\];  
                if (\!data) return Promise.resolve({ error: null });  
                return supabase  
                    .from('tool\_prices')  
                    .update({  
                        csmbs\_price: Number(data.csmbs),  
                        sss\_price: Number(data.sss),  
                        ucs\_price: Number(data.ucs),  
                        display\_name: data.displayName.trim()  
                    })  
                    .eq('id', item.id);  
            });  
            const results \= await Promise.all(updates);  
            const firstErr \= results.find(r \=\> r.error)?.error;  
            if (firstErr) throw firstErr;  
            showToast(\`All prices in "${cat}" updated successfully\`, 'success');  
            setEditingCategory(null);  
            await onRefresh();  
        } catch (err: any) {  
            if (err.message?.includes('column "display\_name"') || err.code \=== '42703') {  
                // Fallback: update without display\_name  
                try {  
                    const fallbackUpdates \= items.map(item \=\> {  
                        const data \= editPricesData\[item.id\];  
                        if (\!data) return Promise.resolve({ error: null });  
                        return supabase  
                            .from('tool\_prices')  
                            .update({  
                                csmbs\_price: Number(data.csmbs),  
                                sss\_price: Number(data.sss),  
                                ucs\_price: Number(data.ucs)  
                            })  
                            .eq('id', item.id);  
                    });  
                    const fallbackResults \= await Promise.all(fallbackUpdates);  
                    const firstFallbackErr \= fallbackResults.find(r \=\> r.error)?.error;  
                    if (firstFallbackErr) throw firstFallbackErr;  
                    showToast(\`Prices in "${cat}" updated\! Run SQL to enable name changes: ALTER TABLE tool\_prices ADD COLUMN display\_name VARCHAR;\`, 'error');  
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
    const handleStartEditPriceRow \= (price: DBPrice) \=\> {  
        setEditingPriceId(price.id);  
        setEditingCategory(null);  
        const tool \= config.tools.find(t \=\> t.id \=== price.tool\_id);  
        const dispName \= price.display\_name || getToolDisplayName(price.tool\_id, tool ? tool.item : price.tool\_id, price.sub\_key);  
        setEditPricesData(prev \=\> ({  
            ...prev,  
            \[price.id\]: {  
                displayName: dispName,  
                csmbs: price.csmbs\_price,  
                sss: price.sss\_price,  
                ucs: price.ucs\_price  
            }  
        }));  
    };  
    const handleSavePriceRow \= async (priceId: string) \=\> {  
        const data \= editPricesData\[priceId\];  
        if (\!data) {  
            setEditingPriceId(null);  
            return;  
        }  
        // validate  
        if (data.csmbs \< 0 || data.sss \< 0 || data.ucs \< 0\) {  
            showToast('Prices must be non-negative numbers', 'error');  
            return;  
        }  
        if (\!data.displayName.trim()) {  
            showToast('Tool name is required', 'error');  
            return;  
        }  
        setLoading('Saving tool prices...');  
        try {  
            const { error } \= await supabase  
                .from('tool\_prices')  
                .update({  
                    csmbs\_price: Number(data.csmbs),  
                    sss\_price: Number(data.sss),  
                    ucs\_price: Number(data.ucs),  
                    display\_name: data.displayName.trim()  
                })  
                .eq('id', priceId);  
            if (error) throw error;  
            showToast(\`Tool prices updated successfully\`, 'success');  
            setEditingPriceId(null);  
            await onRefresh();  
        } catch (err: any) {  
            if (err.message?.includes('column "display\_name"') || err.code \=== '42703') {  
                // Fallback: update without display\_name  
                try {  
                    const { error: fallbackErr } \= await supabase  
                        .from('tool\_prices')  
                        .update({  
                            csmbs\_price: Number(data.csmbs),  
                            sss\_price: Number(data.sss),  
                            ucs\_price: Number(data.ucs)  
                        })  
                        .eq('id', priceId);  
                    if (fallbackErr) throw fallbackErr;  
                    showToast(\`Prices updated\! Run SQL to enable name changes: ALTER TABLE tool\_prices ADD COLUMN display\_name VARCHAR;\`, 'error');  
                    setEditingPriceId(null);  
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
    const handleUpdateEditField \= (priceId: string, field: string, value: any, price: DBPrice, tool: any) \=\> {  
        setEditPricesData(prev \=\> {  
            const current \= prev\[priceId\] || {  
                displayName: price.display\_name || getToolDisplayName(price.tool\_id, tool ? tool.item : price.tool\_id, price.sub\_key),  
                csmbs: price.csmbs\_price,  
                sss: price.sss\_price,  
                ucs: price.ucs\_price  
            };  
            return {  
                ...prev,  
                \[priceId\]: {  
                    ...current,  
                    \[field\]: value  
                }  
            };  
        });  
    };  
    const handleDisplayNameChange \= (val: string) \=\> {  
        setNewToolDisplayName(val);  
        const slug \= val  
            .toLowerCase()  
            .replace(/\[^a-z0-9\]+/g, '-')  
            .replace(/(^-|-$)+/g, '');  
        setNewToolId(slug);  
    };  
    const handleAddToolSubmit \= async (e: React.FormEvent) \=\> {  
        e.preventDefault();  
        const tid \= newToolId.trim();  
        const dName \= newToolDisplayName.trim();  
        if (\!tid) {  
            showToast('Tool ID is required', 'error');  
            return;  
        }  
        if (\!dName) {  
            showToast('Display name is required', 'error');  
            return;  
        }  
        if (newToolType \=== 'radio') {  
            if (newToolSubtypes.length \=== 0\) {  
                showToast('Please add at least one subtype option', 'error');  
                return;  
            }  
            for (let i \= 0; i \< newToolSubtypes.length; i++) {  
                const st \= newToolSubtypes\[i\];  
                if (\!st.subKey.trim() || \!st.displayName.trim()) {  
                    showToast(\`Subtype at index ${i \+ 1} must have a Key ID and Name\`, 'error');  
                    return;  
                }  
                if (st.csmbs \< 0 || st.sss \< 0 || st.ucs \< 0\) {  
                    showToast(\`Subtype "${st.displayName}" prices must be non-negative\`, 'error');  
                    return;  
                }  
            }  
        } else {  
            if (newToolCsmbs \< 0 || newToolSss \< 0 || newToolUcs \< 0\) {  
                showToast('Prices must be non-negative', 'error');  
                return;  
            }  
        }  
        const exists \= config.tools.some(t \=\> t.id \=== tid);  
        if (exists) {  
            showToast(\`Tool with ID "${tid}" already exists\`, 'error');  
            return;  
        }  
        setLoading('Adding new tool...');  
        try {  
            let toolsOptions: any \= null;  
            let defaultValue: any \= null;  
            if (newToolType \=== 'radio') {  
                toolsOptions \= newToolSubtypes.map(st \=\> ({  
                    label: st.displayName.trim(),  
                    value: st.subKey.trim()  
                }));  
                defaultValue \= newToolSubtypes\[0\]?.subKey.trim() || null;  
            }  
            let toolErr: any \= null;  
            try {  
                const { error } \= await supabase  
                    .from('tools')  
                    .insert({  
                        id: tid,  
                        item: dName,  
                        type: newToolType,  
                        category: newToolCategory,  
                        is\_active: true,  
                        sort\_order: 999,  
                        options: toolsOptions,  
                        default\_value: defaultValue  
                    });  
                toolErr \= error;  
            } catch (err: any) {  
                toolErr \= err;  
            }  
            if (toolErr && (toolErr.message?.includes('column "category"') || toolErr.code \=== '42703')) {  
                const { error: retryErr } \= await supabase  
                    .from('tools')  
                    .insert({  
                        id: tid,  
                        item: dName,  
                        type: newToolType,  
                        is\_active: true,  
                        sort\_order: 999,  
                        options: toolsOptions,  
                        default\_value: defaultValue  
                    });  
                if (retryErr) throw retryErr;  
                showToast('Tool added to database\! Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'warning');  
            } else if (toolErr) {  
                throw toolErr;  
            }  
            if (newToolType \=== 'radio') {  
                const insertPromises \= newToolSubtypes.map(async st \=\> {  
                    let priceErr: any \= null;  
                    try {  
                        const { error } \= await supabase  
                            .from('tool\_prices')  
                            .insert({  
                                tool\_id: tid,  
                                sub\_key: st.subKey.trim(),  
                                csmbs\_price: Number(st.csmbs),  
                                sss\_price: Number(st.sss),  
                                ucs\_price: Number(st.ucs),  
                                display\_name: st.displayName.trim()  
                            });  
                        priceErr \= error;  
                    } catch (err: any) {  
                        priceErr \= err;  
                    }  
                    if (priceErr && (priceErr.message?.includes('column "display\_name"') || priceErr.code \=== '42703')) {  
                        const { error: retryErr } \= await supabase  
                            .from('tool\_prices')  
                            .insert({  
                                tool\_id: tid,  
                                sub\_key: st.subKey.trim(),  
                                csmbs\_price: Number(st.csmbs),  
                                sss\_price: Number(st.sss),  
                                ucs\_price: Number(st.ucs)  
                            });  
                        if (retryErr) throw retryErr;  
                    } else if (priceErr) {  
                        throw priceErr;  
                    }  
                });  
                await Promise.all(insertPromises);  
            } else {  
                let priceErr: any \= null;  
                try {  
                    const { error } \= await supabase  
                        .from('tool\_prices')  
                        .insert({  
                            tool\_id: tid,  
                            sub\_key: null,  
                            csmbs\_price: Number(newToolCsmbs),  
                            sss\_price: Number(newToolSss),  
                            ucs\_price: Number(newToolUcs),  
                            display\_name: dName  
                        });  
                    priceErr \= error;  
                } catch (err: any) {  
                    priceErr \= err;  
                }  
                if (priceErr && (priceErr.message?.includes('column "display\_name"') || priceErr.code \=== '42703')) {  
                    const { error: retryErr } \= await supabase  
                        .from('tool\_prices')  
                        .insert({  
                            tool\_id: tid,  
                            sub\_key: null,  
                            csmbs\_price: Number(newToolCsmbs),  
                            sss\_price: Number(newToolSss),  
                            ucs\_price: Number(newToolUcs)  
                        });  
                    if (retryErr) throw retryErr;  
                    showToast('Tool added, but display name not saved in pricing. Run SQL: ALTER TABLE tool\_prices ADD COLUMN display\_name VARCHAR;', 'warning');  
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
            setNewToolSubtypes(\[{ subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }\]);  
            setShowAddToolForm(false);  
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error adding new tool', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleDeleteTool \= async (toolId: string) \=\> {  
        const confirmDelete \= window.confirm(\`Are you sure you want to delete the tool "${toolId}"? This will delete all its prices and surgery rules.\`);  
        if (\!confirmDelete) return;  
        setLoading('Deleting tool...');  
        try {  
            const { error: priceErr } \= await supabase  
                .from('tool\_prices')  
                .delete()  
                .eq('tool\_id', toolId);  
            if (priceErr) throw priceErr;  
            const { error: ruleErr } \= await supabase  
                .from('operation\_rules')  
                .delete()  
                .eq('target\_type', 'tool')  
                .eq('target\_id', toolId);  
            if (ruleErr) throw ruleErr;  
            const { error: toolErr } \= await supabase  
                .from('tools')  
                .delete()  
                .eq('id', toolId);  
            if (toolErr) throw toolErr;  
            showToast(\`Tool "${toolId}" deleted successfully\`, 'success');  
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error deleting tool', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleDeleteSubtype \= async (priceRow: DBPrice) \=\> {  
        const confirmDelete \= window.confirm(\`Are you sure you want to delete the subtype "${priceRow.sub\_key}" of tool "${priceRow.tool\_id}"? This will delete this specific subtype price.\`);  
        if (\!confirmDelete) return;  
        setLoading('Deleting subtype...');  
        try {  
            // 1\. Delete price row from tool\_prices  
            const { error: priceErr } \= await supabase  
                .from('tool\_prices')  
                .delete()  
                .eq('id', priceRow.id);  
            if (priceErr) throw priceErr;  
            // 2\. Fetch tool options and update options array in tools table  
            const tool \= config.tools.find(t \=\> t.id \=== priceRow.tool\_id);  
            if (tool && tool.options) {  
                const currentOptions \= Array.isArray(tool.options) ? tool.options : \[\];  
                // Filter out the deleted subtype  
                const updatedOptions \= currentOptions.filter((opt: any) \=\> opt.value \!== priceRow.sub\_key);  
                  
                const { error: toolErr } \= await supabase  
                    .from('tools')  
                    .update({  
                        options: updatedOptions.length \> 0 ? updatedOptions : null,  
                        // If no options left, change type to checkbox  
                        type: updatedOptions.length \> 0 ? tool.type : 'checkbox',  
                        default\_value: tool.default\_value \=== priceRow.sub\_key   
                            ? (updatedOptions\[0\]?.value || null)   
                            : tool.default\_value  
                    })  
                    .eq('id', priceRow.tool\_id);  
                if (toolErr) throw toolErr;  
            }  
            showToast(\`Subtype "${priceRow.sub\_key}" deleted successfully\`, 'success');  
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error deleting subtype', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleAddSubtypeSubmit \= async (e: React.FormEvent) \=\> {  
        e.preventDefault();  
        if (\!activeAddSubtypeTool) return;  
          
        const subKey \= newSubtypeKey.trim().toLowerCase().replace(/\[^a-z0-9-\]/g, '');  
        const dispName \= newSubtypeDisplayName.trim();  
          
        if (\!subKey || \!dispName) {  
            showToast('Please fill out all required subtype fields.', 'error');  
            return;  
        }  
        // Check if subtype already exists in prices table  
        const exists \= config.prices.some(p \=\> p.tool\_id \=== activeAddSubtypeTool.id && p.sub\_key \=== subKey);  
        if (exists) {  
            showToast(\`Subtype key "${subKey}" already exists for this tool\`, 'error');  
            return;  
        }  
        setLoading('Adding subtype...');  
        try {  
            // 1\. Update options array in tools table  
            const currentOptions \= Array.isArray(activeAddSubtypeTool.options) ? activeAddSubtypeTool.options : \[\];  
            const updatedOptions \= \[  
                ...currentOptions,  
                { label: dispName, value: subKey }  
            \];  
            const { error: toolErr } \= await supabase  
                .from('tools')  
                .update({  
                    options: updatedOptions,  
                    type: 'radio' // Ensure type is radio if it has subtypes  
                })  
                .eq('id', activeAddSubtypeTool.id);  
            if (toolErr) throw toolErr;  
            // 2\. Insert into tool\_prices table  
            let priceErr: any \= null;  
            try {  
                const { error } \= await supabase  
                    .from('tool\_prices')  
                    .insert({  
                        tool\_id: activeAddSubtypeTool.id,  
                        sub\_key: subKey,  
                        csmbs\_price: Number(newSubtypeCsmbs),  
                        sss\_price: Number(newSubtypeSss),  
                        ucs\_price: Number(newSubtypeUcs),  
                        display\_name: dispName  
                    });  
                priceErr \= error;  
            } catch (err: any) {  
                priceErr \= err;  
            }  
            if (priceErr && (priceErr.message?.includes('column "display\_name"') || priceErr.code \=== '42703')) {  
                const { error: retryErr } \= await supabase  
                    .from('tool\_prices')  
                    .insert({  
                        tool\_id: activeAddSubtypeTool.id,  
                        sub\_key: subKey,  
                        csmbs\_price: Number(newSubtypeCsmbs),  
                        sss\_price: Number(newSubtypeSss),  
                        ucs\_price: Number(newSubtypeUcs)  
                    });  
                if (retryErr) throw retryErr;  
            } else if (priceErr) {  
                throw priceErr;  
            }  
            showToast(\`Subtype "${dispName}" added successfully\`, 'success');  
              
            // Clear state  
            setActiveAddSubtypeTool(null);  
            setNewSubtypeKey('');  
            setNewSubtypeDisplayName('');  
            setNewSubtypeCsmbs(0);  
            setNewSubtypeSss(0);  
            setNewSubtypeUcs(0);  
              
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error adding subtype', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleMoveToolToPosition \= async (draggedId: string, targetId: string, sourceCategory: string, targetCategory: string) \=\> {  
        setLoading('Moving tool...');  
        try {  
            if (sourceCategory \=== targetCategory) {  
                const categoryItems \= categorizedPrices\[targetCategory\] || \[\];  
                const uniqueToolIds: string\[\] \= \[\];  
                categoryItems.forEach(item \=\> {  
                    if (\!uniqueToolIds.includes(item.tool\_id)) {  
                        uniqueToolIds.push(item.tool\_id);  
                    }  
                });  
                const fromIndex \= uniqueToolIds.indexOf(draggedId);  
                const toIndex \= uniqueToolIds.indexOf(targetId);  
                if (fromIndex \=== \-1 || toIndex \=== \-1 || fromIndex \=== toIndex) return;  
                const reordered \= \[...uniqueToolIds\];  
                const \[moved\] \= reordered.splice(fromIndex, 1);  
                reordered.splice(toIndex, 0, moved);  
                const updates \= reordered.map((tid, idx) \=\> ({  
                    id: tid,  
                    sort\_order: (idx \+ 1\) \* 10  
                }));  
                const results \= await Promise.all(  
                    updates.map(upd \=\>   
                        supabase  
                            .from('tools')  
                            .update({ sort\_order: upd.sort\_order })  
                            .eq('id', upd.id)  
                    )  
                );  
                const firstErr \= results.find(r \=\> r.error)?.error;  
                if (firstErr) throw firstErr;  
                showToast('Tool order updated successfully', 'success');  
            } else {  
                // Update category in DB  
                const { error: catErr } \= await supabase  
                    .from('tools')  
                    .update({ category: targetCategory })  
                    .eq('id', draggedId);  
                if (catErr) {  
                    if (catErr.message?.includes('column "category"') || catErr.code \=== '42703') {  
                        showToast('Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'error');  
                        return;  
                    }  
                    throw catErr;  
                }  
                // Get target items  
                const targetCategoryItems \= categorizedPrices\[targetCategory\] || \[\];  
                const uniqueToolIds: string\[\] \= \[\];  
                targetCategoryItems.forEach(item \=\> {  
                    if (\!uniqueToolIds.includes(item.tool\_id)) {  
                        uniqueToolIds.push(item.tool\_id);  
                    }  
                });  
                if (targetId \=== 'end') {  
                    if (\!uniqueToolIds.includes(draggedId)) {  
                        uniqueToolIds.push(draggedId);  
                    }  
                } else {  
                    const toIndex \= uniqueToolIds.indexOf(targetId);  
                    if (toIndex \!== \-1) {  
                        uniqueToolIds.splice(toIndex, 0, draggedId);  
                    } else {  
                        uniqueToolIds.push(draggedId);  
                    }  
                }  
                const updates \= uniqueToolIds.map((tid, idx) \=\> ({  
                    id: tid,  
                    sort\_order: (idx \+ 1\) \* 10  
                }));  
                const results \= await Promise.all(  
                    updates.map(upd \=\>   
                        supabase  
                            .from('tools')  
                            .update({ sort\_order: upd.sort\_order })  
                            .eq('id', upd.id)  
                    )  
                );  
                const firstErr \= results.find(r \=\> r.error)?.error;  
                if (firstErr) throw firstErr;  
                showToast(\`Tool moved to ${targetCategory} successfully\`, 'success');  
            }  
            await onRefresh();  
        } catch (err: any) {  
            if (err.message?.includes('column "sort\_order"') || err.code \=== '42703') {  
                showToast('Enable ordering by running SQL: ALTER TABLE tools ADD COLUMN sort\_order INT DEFAULT 0;', 'error');  
            } else {  
                showToast(err.message || 'Error updating order', 'error');  
            }  
        } finally {  
            setLoading(null);  
        }  
    };  
    // \--- Logic / Operations State & Logic \---  
    const \[expandedOpId, setExpandedOpId\] \= useState\<string | null\>(null);  
    const \[showAddOpForm, setShowAddOpForm\] \= useState(false);  
      
    // New Operation Form state  
    const \[newOpName, setNewOpName\] \= useState('');  
    const \[newOpCategory, setNewOpCategory\] \= useState('Lens Surgery');  
    const \[newOpKeywords, setNewOpKeywords\] \= useState\<string\[\]\>(\[\]);  
    const \[newOpKeywordInput, setNewOpKeywordInput\] \= useState('');  
    const \[isAddingNewOpKeyword, setIsAddingNewOpKeyword\] \= useState(false);  
    const handleCloseAddOpForm \= () \=\> {  
        if (newOpName.trim() || newOpKeywords.length \> 0 || newOpKeywordInput.trim()) {  
            const confirmClose \= window.confirm('You have unsaved changes in the Add Surgery Operation form. Are you sure you want to discard them?');  
            if (\!confirmClose) return;  
        }  
        setShowAddOpForm(false);  
        setNewOpName('');  
        setNewOpKeywords(\[\]);  
        setNewOpKeywordInput('');  
        setIsAddingNewOpKeyword(false);  
        setNewOpCategory('Lens Surgery');  
    };  
    // Editing Operation Form state (inside expanded accordion)  
    const \[editOpId, setEditOpId\] \= useState\<string | null\>(null);  
    const \[editOpName, setEditOpName\] \= useState('');  
    const \[editOpCategory, setEditOpCategory\] \= useState('');  
    const \[editOpKeywords, setEditOpKeywords\] \= useState\<string\[\]\>(\[\]);  
    const \[editOpKeywordInput, setEditOpKeywordInput\] \= useState('');  
    const \[isAddingEditOpKeyword, setIsAddingEditOpKeyword\] \= useState(false);  
    // New Rule state (per operation)  
    const \[newRuleTargetType, setNewRuleTargetType\] \= useState\<'tool' | 'action'\>('tool');  
    const \[newRuleTargetId, setNewRuleTargetId\] \= useState('');  
    const \[newRuleDefaultVal, setNewRuleDefaultVal\] \= useState('');  
    // Separate columns for Tool/Action trigger additions  
    const \[newToolRuleId, setNewToolRuleId\] \= useState('');  
    const \[newToolRuleDefaultVal, setNewToolRuleDefaultVal\] \= useState('');  
    const \[isAddingToolRule, setIsAddingToolRule\] \= useState(false);  
    const \[pendingToolRules, setPendingToolRules\] \= useState\<{ target\_id: string; default\_selected\_value: string | null }\[\]\>(\[\]);  
    const \[newActionRuleId, setNewActionRuleId\] \= useState('');  
    const \[isAddingActionRule, setIsAddingActionRule\] \= useState(false);  
    const \[pendingActionRules, setPendingActionRules\] \= useState\<string\[\]\>(\[\]);  
    const categories \= \['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Oculoplastics', 'Strabismus', 'Others'\];  
    const filteredOperations \= useMemo(() \=\> {  
        return config.operations.filter(op \=\> {  
            const opName \= op.name.toLowerCase();  
            const keywords \= op.keywords.map(kw \=\> kw.toLowerCase()).join(' ');  
            const search \= logicSearch.toLowerCase();  
            return opName.includes(search) || keywords.includes(search) || op.category.toLowerCase().includes(search);  
        });  
    }, \[config.operations, logicSearch\]);  
    const groupedOperations \= useMemo(() \=\> {  
        const groups: Record\<string, DBOperation\[\]\> \= {};  
        categories.forEach(c \=\> { groups\[c\] \= \[\]; });  
        filteredOperations.forEach(op \=\> {  
            const cat \= categories.includes(op.category) ? op.category : 'Others';  
            groups\[cat\].push(op);  
        });  
        return groups;  
    }, \[filteredOperations\]);  
    const handleAddKeywordToNewOp \= (kw: string): boolean \=\> {  
        const trimmed \= kw.trim();  
        if (\!trimmed) return false;  
        const lower \= trimmed.toLowerCase();  
          
        // Check local duplicates  
        if (newOpKeywords.some(k \=\> k.toLowerCase() \=== lower)) {  
            showToast(\`Duplicate keyword: "${trimmed}" is already added.\`, 'error');  
            return false;  
        }  
          
        // Check database duplicates  
        const matchedOp \= config.operations.find(otherOp \=\>  
            otherOp.keywords.some(otherKw \=\> otherKw.toLowerCase() \=== lower)  
        );  
        if (matchedOp) {  
            showToast(\`Duplicate keyword: "${trimmed}" is already defined in operation "${matchedOp.name}".\`, 'error');  
            return false;  
        }  
          
        setNewOpKeywords(prev \=\> \[...prev, trimmed\]);  
        setNewOpKeywordInput('');  
        return true;  
    };  
    const handleRemoveKeywordFromNewOp \= (indexToRemove: number) \=\> {  
        setNewOpKeywords(prev \=\> prev.filter((\_, idx) \=\> idx \!== indexToRemove));  
    };  
    const handleAddKeywordToEditOp \= (kw: string, opId: string): boolean \=\> {  
        const trimmed \= kw.trim();  
        if (\!trimmed) return false;  
        const lower \= trimmed.toLowerCase();  
          
        // Check local duplicates  
        if (editOpKeywords.some(k \=\> k.toLowerCase() \=== lower)) {  
            showToast(\`Duplicate keyword: "${trimmed}" is already added.\`, 'error');  
            return false;  
        }  
          
        // Check database duplicates  
        const matchedOp \= config.operations.find(otherOp \=\>  
            otherOp.id \!== opId && otherOp.keywords.some(otherKw \=\> otherKw.toLowerCase() \=== lower)  
        );  
        if (matchedOp) {  
            showToast(\`Duplicate keyword: "${trimmed}" is already defined in operation "${matchedOp.name}".\`, 'error');  
            return false;  
        }  
          
        setEditOpKeywords(prev \=\> \[...prev, trimmed\]);  
        setEditOpKeywordInput('');  
        return true;  
    };  
    const handleRemoveKeywordFromEditOp \= (indexToRemove: number) \=\> {  
        setEditOpKeywords(prev \=\> prev.filter((\_, idx) \=\> idx \!== indexToRemove));  
    };  
    const handleCreateOperation \= async (e: React.FormEvent) \=\> {  
        e.preventDefault();  
        if (\!newOpName.trim()) {  
            showToast('Operation name is required', 'error');  
            return;  
        }  
          
        let finalKeywords \= \[...newOpKeywords\];  
        if (newOpKeywordInput.trim()) {  
            const trimmedInput \= newOpKeywordInput.trim();  
            const lowerInput \= trimmedInput.toLowerCase();  
            if (newOpKeywords.some(k \=\> k.toLowerCase() \=== lowerInput)) {  
                showToast(\`Duplicate keyword: "${trimmedInput}" is already added.\`, 'error');  
                return;  
            }  
            const matchedOp \= config.operations.find(otherOp \=\>  
                otherOp.keywords.some(otherKw \=\> otherKw.toLowerCase() \=== lowerInput)  
            );  
            if (matchedOp) {  
                showToast(\`Duplicate keyword: "${trimmedInput}" is already defined in operation "${matchedOp.name}".\`, 'error');  
                return;  
            }  
            finalKeywords.push(trimmedInput);  
        }  
        setLoading('Creating operation...');  
        try {  
            const { error } \= await supabase  
                .from('operations')  
                .insert(\[{  
                    name: newOpName.trim(),  
                    category: newOpCategory,  
                    keywords: finalKeywords  
                }\]);  
            if (error) throw error;  
            showToast('Operation created successfully', 'success');  
            setNewOpName('');  
            setNewOpKeywords(\[\]);  
            setNewOpKeywordInput('');  
            setShowAddOpForm(false);  
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error creating operation', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleStartEditOp \= (op: DBOperation) \=\> {  
        setEditOpId(op.id);  
        setEditOpName(op.name);  
        setEditOpCategory(op.category);  
        setEditOpKeywords(\[...op.keywords\]);  
        setEditOpKeywordInput('');  
    };  
    const handleSaveOperationDetails \= async (opId: string) \=\> {  
        if (\!editOpName.trim()) {  
            showToast('Operation name is required', 'error');  
            return;  
        }  
          
        let finalKeywords \= \[...editOpKeywords\];  
        if (editOpKeywordInput.trim()) {  
            const trimmedInput \= editOpKeywordInput.trim();  
            const lowerInput \= trimmedInput.toLowerCase();  
            if (editOpKeywords.some(k \=\> k.toLowerCase() \=== lowerInput)) {  
                showToast(\`Duplicate keyword: "${trimmedInput}" is already added.\`, 'error');  
                return;  
            }  
            const matchedOp \= config.operations.find(otherOp \=\>  
                otherOp.id \!== opId && otherOp.keywords.some(otherKw \=\> otherKw.toLowerCase() \=== lowerInput)  
            );  
            if (matchedOp) {  
                showToast(\`Duplicate keyword: "${trimmedInput}" is already defined in operation "${matchedOp.name}".\`, 'error');  
                return;  
            }  
            finalKeywords.push(trimmedInput);  
        }  
        setLoading('Saving operation details...');  
        try {  
            const { error } \= await supabase  
                .from('operations')  
                .update({  
                    name: editOpName.trim(),  
                    category: editOpCategory,  
                    keywords: finalKeywords  
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
    const handleDeleteOperation \= async (opId: string) \=\> {  
        if (\!window.confirm('Are you sure you want to delete this operation? This will also delete all associated rules.')) {  
            return;  
        }  
        setLoading('Deleting operation...');  
        try {  
            // Delete rules first  
            const { error: rulesError } \= await supabase  
                .from('operation\_rules')  
                .delete()  
                .eq('operation\_id', opId);  
            if (rulesError) throw rulesError;  
            // Delete operation  
            const { error: opError } \= await supabase  
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
    // \--- Rules Logic \---  
    const handleSaveQueuedToolRules \= async (opId: string, opRules: DBRule\[\]) \=\> {  
        const validPending \= pendingToolRules.filter(r \=\> r.target\_id);  
        if (validPending.length \=== 0\) {  
            setIsAddingToolRule(false);  
            return;  
        }  
        // Validate duplicates within the database rules  
        for (const item of validPending) {  
            if (opRules.some(r \=\> r.target\_type \=== 'tool' && r.target\_id \=== item.target\_id)) {  
                const tool \= config.tools.find(t \=\> t.id \=== item.target\_id);  
                showToast(\`Surgical tool "${tool ? tool.item : item.target\_id}" is already triggered in this operation.\`, 'error');  
                return;  
            }  
        }  
        // Validate duplicates within the pending array itself  
        const ids \= validPending.map(r \=\> r.target\_id);  
        const hasDuplicates \= ids.some((val, i) \=\> ids.indexOf(val) \!== i);  
        if (hasDuplicates) {  
            showToast('Please remove duplicate tool selections before saving.', 'error');  
            return;  
        }  
        setLoading('Saving tool triggers...');  
        try {  
            const { error } \= await supabase  
                .from('operation\_rules')  
                .insert(validPending.map(item \=\> ({  
                    operation\_id: opId,  
                    target\_type: 'tool',  
                    target\_id: item.target\_id,  
                    default\_selected\_value: item.default\_selected\_value ? item.default\_selected\_value.trim() || null : null  
                })));  
            if (error) throw error;  
            showToast('Tool triggers saved successfully', 'success');  
            setPendingToolRules(\[\]);  
            setIsAddingToolRule(false);  
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error saving rules', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleSaveQueuedActionRules \= async (opId: string, opRules: DBRule\[\]) \=\> {  
        const validPending \= pendingActionRules.filter(id \=\> id);  
        if (validPending.length \=== 0\) {  
            setIsAddingActionRule(false);  
            return;  
        }  
        // Validate duplicates within the database rules  
        for (const actionId of validPending) {  
            if (opRules.some(r \=\> r.target\_type \=== 'action' && r.target\_id \=== actionId)) {  
                const action \= config.actions.find(a \=\> a.id \=== actionId);  
                showToast(\`Pre-Op action "${action ? action.item : actionId}" is already triggered in this operation.\`, 'error');  
                return;  
            }  
        }  
        // Validate duplicates within the pending array itself  
        const hasDuplicates \= validPending.some((val, i) \=\> validPending.indexOf(val) \!== i);  
        if (hasDuplicates) {  
            showToast('Please remove duplicate action selections before saving.', 'error');  
            return;  
        }  
        setLoading('Saving action triggers...');  
        try {  
            const { error } \= await supabase  
                .from('operation\_rules')  
                .insert(validPending.map(actionId \=\> ({  
                    operation\_id: opId,  
                    target\_type: 'action',  
                    target\_id: actionId,  
                    default\_selected\_value: null  
                })));  
            if (error) throw error;  
            showToast('Action triggers saved successfully', 'success');  
            setPendingActionRules(\[\]);  
            setIsAddingActionRule(false);  
            await onRefresh();  
        } catch (err: any) {  
            showToast(err.message || 'Error saving rules', 'error');  
        } finally {  
            setLoading(null);  
        }  
    };  
    const handleDeleteRule \= async (ruleId: string) \=\> {  
        if (\!window.confirm('Delete this trigger rule?')) return;  
        setLoading('Deleting rule...');  
        try {  
            const { error } \= await supabase  
                .from('operation\_rules')  
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
    const handleOpClick \= (targetOpId: string) \=\> {  
        const isExpanded \= expandedOpId \=== targetOpId;  
        const hasUnsavedChanges \=   
            (isAddingToolRule && pendingToolRules.some(r \=\> r.target\_id)) ||  
            (isAddingActionRule && pendingActionRules.some(id \=\> id));  
        if (hasUnsavedChanges) {  
            const msg \= isExpanded   
                ? 'You have unsaved tool/action triggers. Do you want to discard them and collapse?'   
                : 'You have unsaved tool/action triggers. Do you want to discard them and switch operations?';  
            if (\!window.confirm(msg)) {  
                return;  
            }  
        }  
          
        // Reset states  
        setIsAddingToolRule(false);  
        setPendingToolRules(\[\]);  
        setIsAddingActionRule(false);  
        setPendingActionRules(\[\]);  
          
        setExpandedOpId(isExpanded ? null : targetOpId);  
    };  
    const toolRuleOptions \= useMemo(() \=\> {  
        if (\!config?.tools) return \[\];  
        const sortedTools \= \[...config.tools\].sort((a, b) \=\> {  
            const catA \= a.category || 'Generals';  
            const catB \= b.category || 'Generals';  
            const idxA \= CATEGORY\_ORDER.indexOf(catA);  
            const idxB \= CATEGORY\_ORDER.indexOf(catB);  
            const finalIdxA \= idxA \=== \-1 ? 999 : idxA;  
            const finalIdxB \= idxB \=== \-1 ? 999 : idxB;  
            if (finalIdxA \!== finalIdxB) {  
                return finalIdxA \- finalIdxB;  
            }  
            const orderA \= typeof a.sort\_order \=== 'number' ? a.sort\_order : 999;  
            const orderB \= typeof b.sort\_order \=== 'number' ? b.sort\_order : 999;  
            if (orderA \!== orderB) {  
                return orderA \- orderB;  
            }  
            return a.item.localeCompare(b.item);  
        });  
        return sortedTools.map(t \=\> ({   
            id: t.id,   
            name: t.item,   
            options: t.options,  
            category: t.category || 'Generals'  
        }));  
    }, \[config?.tools\]);  
    const selectedToolRuleOptions \= useMemo(() \=\> {  
        if (\!config?.tools || \!newToolRuleId) return null;  
        const tool \= config.tools.find(t \=\> t.id \=== newToolRuleId);  
        return tool?.options || null;  
    }, \[config?.tools, newToolRuleId\]);  
    const actionRuleOptions \= useMemo(() \=\> {  
        if (\!config?.actions) return \[\];  
        return config.actions.map(a \=\> ({ id: a.id, name: a.item }));  
    }, \[config?.actions\]);  
    return (  
        \<div className="space-y-6 animate-fadeIn pb-12"\>  
            {isOffline && (  
                \<div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl shadow-sm text-xs font-semibold leading-relaxed"\>  
                    \<AlertTriangle size={18} className="text-amber-500 shrink-0" /\>  
                    \<div\>  
                        \<span className="font-bold text-amber-800 dark:text-amber-300"\>Offline Fallback Mode:\</span\> You are currently viewing local configuration data. Saving new tools, deleting items, or editing prices and rules is disabled.  
                    \</div\>  
                \</div\>  
            )}  
            {/\* Admin Tabs \*/}  
            \<div className="flex bg-gray-100 dark:bg-slate-800/60 p-1 rounded-xl max-w-md"\>  
                \<button  
                    onClick={() \=\> {  
                        if (hasUnsavedChanges()) {  
                            alert('You have unsaved changes. Please save or cancel your edits first.');  
                            return;  
                        }  
                        setEditingCategory(null);  
                        setEditingPriceId(null);  
                        setAdminTab('prices');  
                    }}  
                    className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${  
                        adminTab \=== 'prices'  
                            ? 'bg-white dark:bg-\[\#151f32\] text-gray-900 dark:text-white shadow-sm'  
                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'  
                    }\`}  
                \>  
                    Manage Tool Prices  
                \</button\>  
                \<button  
                    onClick={() \=\> {  
                        if (hasUnsavedChanges()) {  
                            alert('You have unsaved changes. Please save or cancel your edits first.');  
                            return;  
                        }  
                        setEditingCategory(null);  
                        setEditingPriceId(null);  
                        setAdminTab('logic');  
                    }}  
                    className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${  
                        adminTab \=== 'logic'  
                            ? 'bg-white dark:bg-\[\#151f32\] text-gray-900 dark:text-white shadow-sm'  
                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'  
                    }\`}  
                \>  
                    Manage Surgery Logic  
                \</button\>  
            \</div\>  
            {/\* Prices Management View \*/}  
            {adminTab \=== 'prices' && (  
                \<div className="space-y-6"\>  
                    {/\* Filter and search controls above the cards \*/}  
                    \<div className="flex flex-row items-center justify-between gap-2 w-full flex-wrap sm:flex-nowrap"\>  
                        {/\* Category Filter Tabs styled as floating buttons \*/}  
                        \<div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-1 max-w-full select-none py-0.5 shrink-0"\>  
                            {\['All', ...CATEGORY\_ORDER\].map(cat \=\> {  
                                const isSelected \= selectedCategory \=== cat;  
                                const labelMap: Record\<string, string\> \= {  
                                    'All': 'All',  
                                    'Lens Surgery': 'Lens',  
                                    'Retinal Surgery': 'Retina',  
                                    'Glaucoma': 'Glaucoma',  
                                    'Cornea': 'Cornea',  
                                    'Generals': 'Generals',  
                                };  
                                const displayLabel \= labelMap\[cat\] || cat;  
                                return (  
                                    \<button  
                                        key={cat}  
                                        onClick={() \=\> {  
                                            if (hasUnsavedChanges()) {  
                                                alert('You have unsaved changes. Please save or cancel your edits first.');  
                                                return;  
                                            }  
                                            setEditingCategory(null);  
                                            setEditingPriceId(null);  
                                            setSelectedCategory(cat);  
                                        }}  
                                        className={\`px-2.5 py-1 rounded-full text-\[10px\] sm:text-xs font-bold transition-all border ${  
                                            isSelected  
                                                ? 'bg-\[\#fcb7f0\] border-\[\#fcb7f0\] text-slate-800 font-extrabold shadow-sm scale-105'  
                                                : 'bg-white dark:bg-\[\#151f32\] border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-slate-800/40'  
                                        }\`}  
                                    \>  
                                        {displayLabel}  
                                    \</button\>  
                                );  
                            })}  
                        \</div\>  
                          
                        {/\* Search Box & Add Tool Button (shortened) \*/}  
                        \<div className="flex items-center gap-2 max-w-\[240px\] sm:max-w-xs md:max-w-sm w-full justify-end"\>  
                            \<div className="relative max-w-\[150px\] sm:max-w-\[180px\] w-full"\>  
                                \<input  
                                    type="text"  
                                    placeholder="Search tools, keys..."  
                                    value={priceSearch}  
                                    onChange={e \=\> setPriceSearch(e.target.value)}  
                                    className="w-full bg-white dark:bg-\[\#151f32\] border border-gray-100 dark:border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                /\>  
                                \<Search size={14} className="absolute left-2.5 top-1/2 \-translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" /\>  
                            \</div\>  
                             \<button  
                                onClick={() \=\> {  
                                    if (hasUnsavedChanges()) {  
                                        alert('You have unsaved changes. Please save or cancel your edits first.');  
                                        return;  
                                    }  
                                    setEditingCategory(null);  
                                    setEditingPriceId(null);  
                                    if (\!isOffline) {  
                                        if (showAddToolForm) {  
                                            handleCloseAddToolForm();  
                                        } else {  
                                            setShowAddToolForm(true);  
                                        }  
                                    }  
                                }}  
                                disabled={isOffline}  
                                className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 shrink-0 ${  
                                    isOffline   
                                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-50'  
                                        : 'bg-\[\#fcb7f0\]/20 hover:bg-\[\#fcb7f0\]/40 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] border-\[\#fcb7f0\]/30'  
                                }\`}  
                            \>  
                                \<Plus size={14} /\>  
                                {showAddToolForm ? 'Hide' : 'Add'}  
                            \</button\>  
                        \</div\>  
                    \</div\>  
                    {/\* Add Tool Form Modal \*/}  
                    {showAddToolForm && (  
                        \<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"\>  
                            \<div className="bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-xl border border-gray-150 dark:border-slate-800 p-5 sm:p-6 w-full max-w-4xl animate-scaleUp overflow-y-auto max-h-\[90vh\]"\>  
                                \<div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2"\>  
                                    \<h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"\>  
                                        \<Plus size={16} className="text-\[\#8e5a7d\] dark:text-brand-primary-dark" /\>  
                                        Add New Tool  
                                    \</h3\>  
                                    \<button   
                                        type="button"  
                                        onClick={handleCloseAddToolForm}  
                                        className="text-gray-400 hover:text-gray-500 transition-colors p-1"  
                                    \>  
                                        \<X size={18} /\>  
                                    \</button\>  
                                \</div\>  
                                \<form onSubmit={handleAddToolSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4"\>  
                                    \<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Tool Display Name\</label\>  
                                            \<input  
                                                type="text"  
                                                value={newToolDisplayName}  
                                                onChange={e \=\> handleDisplayNameChange(e.target.value)}  
                                                placeholder="e.g. Fine Scissors"  
                                                className="w-full bg-gray-50 dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                required  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Tool Database ID\</label\>  
                                            \<input  
                                                type="text"  
                                                value={newToolId}  
                                                onChange={e \=\> setNewToolId(e.target.value.toLowerCase().replace(/\[^a-z0-9-\]/g, ''))}  
                                                placeholder="e.g. fine-scissors"  
                                                className="w-full bg-gray-50 dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                required  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Category\</label\>  
                                            \<div className="relative"\>  
                                                \<select  
                                                    value={newToolCategory}  
                                                    onChange={e \=\> setNewToolCategory(e.target.value)}  
                                                    className="w-full appearance-none bg-white dark:bg-\[\#151f32\] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"  
                                                \>  
                                                    {CATEGORY\_ORDER.map(cat \=\> (  
                                                        \<option key={cat} value={cat}\>{cat}\</option\>  
                                                    ))}  
                                                \</select\>  
                                                \<ChevronDown size={12} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" /\>  
                                            \</div\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Option\</label\>  
                                            \<div className="relative"\>  
                                                \<select  
                                                    value={newToolType}  
                                                    onChange={e \=\> setNewToolType(e.target.value as any)}  
                                                    className="w-full appearance-none bg-white dark:bg-\[\#151f32\] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"  
                                                \>  
                                                    \<option value="checkbox"\>None\</option\>  
                                                    \<option value="radio"\>Subtype (Multiple choices)\</option\>  
                                                    \<option value="number-input"\>Input Value\</option\>  
                                                \</select\>  
                                                \<ChevronDown size={12} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" /\>  
                                            \</div\>  
                                            \<span className="text-\[9px\] text-gray-400 dark:text-slate-555 block mt-1 leading-normal"\>  
                                                {newToolType \=== 'checkbox' && "• Renders as a simple toggle checkbox (e.g., Fibrin Glue)."}  
                                                {newToolType \=== 'radio' && "• Renders as multiple choice options (e.g., Constellation vs Stellaris)."}  
                                                {newToolType \=== 'number-input' && "• Renders with a counter input box (e.g., specifying 4 retractors)."}  
                                            \</span\>  
                                        \</div\>  
                                    \</div\>  
                                    {newToolType \=== 'radio' ? (  
                                        \<div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800"\>  
                                            \<div className="flex justify-between items-center"\>  
                                                \<h4 className="text-\[11px\] font-bold uppercase tracking-wider text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]"\>Subtypes & Pricing\</h4\>  
                                                \<button  
                                                    type="button"  
                                                    onClick={handleAddSubtypeRow}  
                                                    className="px-2 py-1 bg-\[\#fcb7f0\]/20 hover:bg-\[\#fcb7f0\]/40 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] text-\[10px\] font-bold rounded transition-all border border-\[\#fcb7f0\]/30 flex items-center gap-1"  
                                                \>  
                                                    \<Plus size={10} /\>  
                                                    Add Subtype Option  
                                                \</button\>  
                                            \</div\>  
                                            \<div className="space-y-3"\>  
                                                {newToolSubtypes.map((st, idx) \=\> (  
                                                    \<div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-gray-50/50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800 relative"\>  
                                                        \<div\>  
                                                            \<label className="text-\[9px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Subtype Name\</label\>  
                                                            \<input  
                                                                type="text"  
                                                                value={st.displayName}  
                                                                onChange={e \=\> handleUpdateSubtypeRow(idx, 'displayName', e.target.value)}  
                                                                placeholder="e.g. Constellation"  
                                                                className="w-full bg-white dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200"  
                                                                required  
                                                            /\>  
                                                        \</div\>  
                                                        \<div\>  
                                                            \<label className="text-\[9px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Subtype Key ID\</label\>  
                                                            \<input  
                                                                type="text"  
                                                                value={st.subKey}  
                                                                onChange={e \=\> handleUpdateSubtypeRow(idx, 'subKey', e.target.value.toLowerCase().replace(/\[^a-z0-9-\]/g, ''))}  
                                                                placeholder="e.g. constellation"  
                                                                className="w-full bg-white dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200"  
                                                                required  
                                                            /\>  
                                                        \</div\>  
                                                        \<div\>  
                                                            \<label className="text-\[9px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>CSMBS Price (฿)\</label\>  
                                                            \<input  
                                                                type="number"  
                                                                value={st.csmbs}  
                                                                onChange={e \=\> handleUpdateSubtypeRow(idx, 'csmbs', Number(e.target.value))}  
                                                                className="w-full bg-white dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200 font-mono"  
                                                                min="0"  
                                                                required  
                                                            /\>  
                                                        \</div\>  
                                                        \<div\>  
                                                            \<label className="text-\[9px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>SSS Price (฿)\</label\>  
                                                            \<input  
                                                                type="number"  
                                                                value={st.sss}  
                                                                onChange={e \=\> handleUpdateSubtypeRow(idx, 'sss', Number(e.target.value))}  
                                                                className="w-full bg-white dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200 font-mono"  
                                                                min="0"  
                                                                required  
                                                            /\>  
                                                        \</div\>  
                                                        \<div\>  
                                                            \<label className="text-\[9px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>UCS Price (฿)\</label\>  
                                                            \<input  
                                                                type="number"  
                                                                value={st.ucs}  
                                                                onChange={e \=\> handleUpdateSubtypeRow(idx, 'ucs', Number(e.target.value))}  
                                                                className="w-full bg-white dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200 font-mono"  
                                                                min="0"  
                                                                required  
                                                            /\>  
                                                        \</div\>  
                                                        {newToolSubtypes.length \> 1 && (  
                                                            \<button  
                                                                type="button"  
                                                                onClick={() \=\> handleRemoveSubtypeRow(idx)}  
                                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded mb-0.5 transition-colors"  
                                                                title="Remove Subtype"  
                                                            \>  
                                                                \<Trash2 size={14} /\>  
                                                            \</button\>  
                                                        )}  
                                                    \</div\>  
                                                ))}  
                                            \</div\>  
                                        \</div\>  
                                    ) : (  
                                        \<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"\>  
                                            \<div\>  
                                                \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>CSMBS Price (฿)\</label\>  
                                                \<input  
                                                    type="number"  
                                                    value={newToolCsmbs}  
                                                    onChange={e \=\> setNewToolCsmbs(Number(e.target.value))}  
                                                    placeholder="0"  
                                                    className="w-full bg-gray-50 dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                    min="0"  
                                                    required  
                                                /\>  
                                            \</div\>  
                                            \<div\>  
                                                \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>SSS Price (฿)\</label\>  
                                                \<input  
                                                    type="number"  
                                                    value={newToolSss}  
                                                    onChange={e \=\> setNewToolSss(Number(e.target.value))}  
                                                    placeholder="0"  
                                                    className="w-full bg-gray-50 dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                    min="0"  
                                                    required  
                                                /\>  
                                            \</div\>  
                                            \<div\>  
                                                \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>UCS Price (฿)\</label\>  
                                                \<input  
                                                    type="number"  
                                                    value={newToolUcs}  
                                                    onChange={e \=\> setNewToolUcs(Number(e.target.value))}  
                                                    placeholder="0"  
                                                    className="w-full bg-gray-50 dark:bg-slate-855 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                    min="0"  
                                                    required  
                                                /\>  
                                            \</div\>  
                                        \</div\>  
                                    )}  
                                    \<div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800"\>  
                                        \<button  
                                            type="button"  
                                            onClick={handleCloseAddToolForm}  
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"  
                                        \>  
                                            Cancel  
                                        \</button\>  
                                        \<button  
                                            type="submit"  
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"  
                                        \>  
                                            \<Save size={14} /\>  
                                            Save Tool  
                                        \</button\>  
                                    \</div\>  
                                \</form\>  
                            \</div\>  
                        \</div\>  
                    )}  
                    {/\* Add Subtype Form Modal \*/}  
                    {activeAddSubtypeTool && (  
                        \<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"\>  
                            \<div className="bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-xl border border-gray-150 dark:border-slate-800 p-5 sm:p-6 w-full max-w-2xl animate-scaleUp overflow-y-auto max-h-\[90vh\]"\>  
                                \<div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2"\>  
                                    \<h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"\>  
                                        \<Plus size={16} className="text-\[\#8e5a7d\] dark:text-brand-primary-dark" /\>  
                                        Add Subtype Option (Group: {activeAddSubtypeTool.item})  
                                    \</h3\>  
                                    \<button   
                                        type="button"  
                                        onClick={() \=\> setActiveAddSubtypeTool(null)}  
                                        className="text-gray-400 hover:text-gray-500 transition-colors p-1"  
                                    \>  
                                        \<X size={18} /\>  
                                    \</button\>  
                                \</div\>  
                                \<form onSubmit={handleAddSubtypeSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4"\>  
                                    \<div className="grid grid-cols-1 sm:grid-cols-3 gap-4"\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Group Name\</label\>  
                                            \<input  
                                                type="text"  
                                                value={activeAddSubtypeTool.item}  
                                                disabled  
                                                className="w-full bg-gray-150 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-400 dark:text-slate-400 outline-none cursor-not-allowed"  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Subtype Display Name\</label\>  
                                            \<input  
                                                type="text"  
                                                value={newSubtypeDisplayName}  
                                                onChange={e \=\> {  
                                                    setNewSubtypeDisplayName(e.target.value);  
                                                    if (\!newSubtypeKey) {  
                                                        setNewSubtypeKey(e.target.value.toLowerCase().replace(/\[^a-z0-9-\]/g, '-').replace(/-+/g, '-'));  
                                                    }  
                                                }}  
                                                placeholder="e.g. Centurion Active Sentry"  
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                required  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Subtype Key ID\</label\>  
                                            \<input  
                                                type="text"  
                                                value={newSubtypeKey}  
                                                onChange={e \=\> setNewSubtypeKey(e.target.value.toLowerCase().replace(/\[^a-z0-9-\]/g, ''))}  
                                                placeholder="e.g. active-sentry"  
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                required  
                                            /\>  
                                        \</div\>  
                                    \</div\>  
                                    \<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>CSMBS Price (฿)\</label\>  
                                            \<input  
                                                type="number"  
                                                value={newSubtypeCsmbs}  
                                                onChange={e \=\> setNewSubtypeCsmbs(Number(e.target.value))}  
                                                placeholder="0"  
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                min="0"  
                                                required  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>SSS Price (฿)\</label\>  
                                            \<input  
                                                type="number"  
                                                value={newSubtypeSss}  
                                                onChange={e \=\> setNewSubtypeSss(Number(e.target.value))}  
                                                placeholder="0"  
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                min="0"  
                                                required  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>UCS Price (฿)\</label\>  
                                            \<input  
                                                type="number"  
                                                value={newSubtypeUcs}  
                                                onChange={e \=\> setNewSubtypeUcs(Number(e.target.value))}  
                                                placeholder="0"  
                                                className="w-full bg-gray-50 dark:bg-slate-855 border border-gray-255 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                min="0"  
                                                required  
                                            /\>  
                                        \</div\>  
                                    \</div\>  
                                    \<div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800"\>  
                                        \<button  
                                            type="button"  
                                            onClick={() \=\> setActiveAddSubtypeTool(null)}  
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"  
                                        \>  
                                            Cancel  
                                        \</button\>  
                                        \<button  
                                            type="submit"  
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"  
                                        \>  
                                            \<Save size={14} /\>  
                                            Save Subtype  
                                        \</button\>  
                                    \</div\>  
                                \</form\>  
                            \</div\>  
                        \</div\>  
                    )}  
                    {CATEGORY\_ORDER.map(category \=\> {  
                        if (selectedCategory \!== 'All' && category \!== selectedCategory) {  
                            return null;  
                        }  
                        const items \= categorizedPrices\[category\] || \[\];  
                        if (items.length \=== 0\) {  
                            if (priceSearch.trim()) return null;  
                            return (  
                                \<section  
                                    key={category}  
                                    onDragOver={(e) \=\> {  
                                        if (draggedToolId && draggedCategory \!== category && \!editingPriceId && \!editingCategory && \!isOffline) {  
                                            e.preventDefault();  
                                            if (dragOverCategory \!== category) {  
                                                setDragOverCategory(category);  
                                            }  
                                        }  
                                    }}  
                                    onDragLeave={() \=\> {  
                                        if (dragOverCategory \=== category) {  
                                            setDragOverCategory(null);  
                                        }  
                                    }}  
                                    onDrop={async (e) \=\> {  
                                        if (draggedToolId && draggedCategory \!== category && \!editingPriceId && \!editingCategory && \!isOffline) {  
                                            e.preventDefault();  
                                            await handleMoveToolToPosition(draggedToolId, 'end', draggedCategory\!, category);  
                                        }  
                                        setDragOverCategory(null);  
                                    }}  
                                    className={\`bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-sm border p-4 sm:p-5 transition-all duration-300  
                                        ${dragOverCategory \=== category   
                                            ? 'border-\[\#fcb7f0\] dark:border-pink-500/50 ring-2 ring-\[\#fcb7f0\]/30 dark:ring-pink-500/20 bg-pink-50/10 dark:bg-pink-950/5'   
                                            : 'border-gray-100 dark:border-slate-800'  
                                        }  
                                    \`}  
                                \>  
                                    \<div className="flex justify-between items-center \-mx-4 sm:-mx-5 \-mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl"\>  
                                        \<h3 className="text-\[10px\] font-black uppercase tracking-\[0.2em\] text-\[\#8e5a7d\] dark:text-pink-400/80 flex items-center gap-2"\>  
                                            \<span className="w-1.5 h-3 bg-\[\#fcb7f0\] rounded-full"\>\</span\>  
                                            {(() \=\> {  
                                                if (category.toLowerCase().includes('surgery')) return category;  
                                                if (category \=== 'Generals') return 'General Surgery';  
                                                return \`${category} Surgery\`;  
                                            })()}  
                                        \</h3\>  
                                    \</div\>  
                                    \<div className="border border-dashed border-gray-200 dark:border-slate-800/60 rounded-xl p-6 text-center text-xs text-gray-400 dark:text-slate-500 italic bg-gray-50/20 dark:bg-slate-900/10"\>  
                                        No tools in this category. Drag a tool here to assign it.  
                                    \</div\>  
                                \</section\>  
                            );  
                        }  
                        return (  
                                \<section  
                                    key={category}  
                                    onDragOver={(e) \=\> {  
                                        if (draggedToolId && draggedCategory \!== category && \!editingPriceId && \!editingCategory && \!isOffline) {  
                                            e.preventDefault();  
                                            if (dragOverCategory \!== category) {  
                                                setDragOverCategory(category);  
                                            }  
                                        }  
                                    }}  
                                    onDragLeave={() \=\> {  
                                        if (dragOverCategory \=== category) {  
                                            setDragOverCategory(null);  
                                        }  
                                    }}  
                                    onDrop={async (e) \=\> {  
                                        if (draggedToolId && draggedCategory \!== category && \!editingPriceId && \!editingCategory && \!isOffline) {  
                                            e.preventDefault();  
                                            await handleMoveToolToPosition(draggedToolId, 'end', draggedCategory\!, category);  
                                        }  
                                        setDragOverCategory(null);  
                                    }}  
                                    className={\`bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-sm border p-4 sm:p-5 transition-all duration-300  
                                        ${dragOverCategory \=== category   
                                            ? 'border-\[\#fcb7f0\] dark:border-pink-500/50 ring-2 ring-\[\#fcb7f0\]/30 dark:ring-pink-500/20 bg-pink-50/10 dark:bg-pink-950/5'   
                                            : 'border-gray-100 dark:border-slate-800'  
                                        }  
                                    \`}  
                                \>  
                                    \<div className="flex justify-between items-center \-mx-4 sm:-mx-5 \-mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl"\>  
                                        \<h3 className="text-\[10px\] font-black uppercase tracking-\[0.2em\] text-\[\#8e5a7d\] dark:text-pink-400/80 flex items-center gap-2"\>  
                                            \<span className="w-1.5 h-3 bg-\[\#fcb7f0\] rounded-full"\>\</span\>  
                                            {(() \=\> {  
                                                if (category.toLowerCase().includes('surgery')) return category;  
                                                if (category \=== 'Generals') return 'General Surgery';  
                                                return \`${category} Surgery\`;  
                                            })()}  
                                        \</h3\>  
                                        \<div className="flex items-center gap-2"\>  
                                            {editingCategory \=== category ? (  
                                                \<\>  
                                                    \<button  
                                                        onClick={() \=\> handleSaveCategoryPrices(category)}  
                                                        disabled={loading \!== null}  
                                                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-all flex items-center justify-center shadow-sm disabled:opacity-50"  
                                                        title="Save All"  
                                                    \>  
                                                        \<Save size={12} /\>  
                                                    \</button\>  
                                                    \<button  
                                                        onClick={() \=\> {  
                                                            if (hasCategoryChanges(category)) {  
                                                                const confirmCancel \= window.confirm('Are you sure you want to discard your unsaved changes?');  
                                                                if (\!confirmCancel) return;  
                                                            }  
                                                            setEditingCategory(null);  
                                                        }}  
                                                        disabled={loading \!== null}  
                                                        className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition-all flex items-center justify-center shadow-sm disabled:opacity-50"  
                                                        title="Cancel"  
                                                    \>  
                                                        \<X size={12} /\>  
                                                    \</button\>  
                                                \</\>  
                                            ) : (  
                                                \<button  
                                                    onClick={() \=\> {  
                                                        if (hasUnsavedChanges()) {  
                                                            alert('You have unsaved changes. Please save or cancel your edits first.');  
                                                            return;  
                                                        }  
                                                        handleStartEditCategory(category);  
                                                    }}  
                                                    disabled={loading \!== null || isOffline || editingPriceId \!== null}  
                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 rounded text-\[10px\] font-bold transition-all disabled:opacity-50"  
                                                \>  
                                                    Edit  
                                                \</button\>  
                                            )}  
                                        \</div\>  
                                    \</div\>  
                                    \<div className="overflow-x-auto"\>  
                                        \<table className="w-full text-left text-\[11px\] sm:text-xs"\>  
                                            \<thead\>  
                                                \<tr className="text-gray-400 dark:text-slate-500 border-b border-gray-50 dark:border-slate-800/50"\>  
                                                    \<th className="py-2 px-2 font-bold uppercase tracking-wider w-1/3"\>Tool Name\</th\>  
                                                    \<th className="py-2 px-2 font-bold uppercase tracking-wider w-24"\>Sub-key\</th\>  
                                                    \<th className="py-2 px-2 font-bold uppercase tracking-wider text-right"\>CSMBS\</th\>  
                                                    \<th className="py-2 px-2 font-bold uppercase tracking-wider text-right"\>SSS\</th\>  
                                                    \<th className="py-2 px-2 font-bold uppercase tracking-wider text-right"\>UCS\</th\>  
                                                    \<th className="py-2 px-2 font-bold uppercase tracking-wider text-center w-24"\>Actions\</th\>  
                                                \</tr\>  
                                            \</thead\>  
                                            \<tbody className="divide-y divide-gray-50 dark:divide-slate-800/30"\>  
                                                {items.map((price, idx) \=\> {  
                                                    const tool \= config.tools.find(t \=\> t.id \=== price.tool\_id);  
                                                    const isEditingRow \= (editingCategory \=== category) || (editingPriceId \=== price.id);  
                                                    const isFirstOccurrence \= items.findIndex(item \=\> item.tool\_id \=== price.tool\_id) \=== idx;  
                                                    const isLastOccurrence \= (() \=\> {  
                                                        let lastIdx \= \-1;  
                                                        for (let i \= items.length \- 1; i \>= 0; i--) {  
                                                            if (items\[i\].tool\_id \=== price.tool\_id) {  
                                                                lastIdx \= i;  
                                                                break;  
                                                            }  
                                                        }  
                                                        return lastIdx \=== idx;  
                                                    })();  
                                                    const isNewReuseTool \= tool?.options?.some((o: any) \=\> o.value \=== NEW\_REUSED\_OPTIONS.NEW || o.value \=== NEW\_REUSED\_OPTIONS.REUSED);  
                                                    const toolPricesCount \= items.filter(item \=\> item.tool\_id \=== price.tool\_id).length;  
                                                    const hasSubtypes \= (toolPricesCount \> 1 || (tool && (tool.type \=== 'radio' || (tool.options && tool.options.length \> 0)))) && \!isNewReuseTool;  
                                                    const showGroupHeader \= hasSubtypes && isFirstOccurrence && (editingCategory \=== category);  
                                                    const rowData \= editPricesData\[price.id\] || {  
                                                        displayName: price.display\_name || getToolDisplayName(price.tool\_id, tool ? tool.item : price.tool\_id, price.sub\_key),  
                                                    csmbs: price.csmbs\_price,  
                                                        sss: price.sss\_price,  
                                                        ucs: price.ucs\_price  
                                                    };

                                                    return (  
                                                        \<\>  
                                                            {showGroupHeader && (  
                                                                \<tr key={\`group-header-${price.tool\_id}\`} className="bg-\[\#8e5a7d\]/5 dark:bg-slate-800/60 border-y border-\[\#8e5a7d\]/15 dark:border-slate-700/80 font-bold text-xs text-gray-800 dark:text-slate-350"\>  
                                                                    \<td className="py-3 px-3" colSpan={2}\>  
                                                                        \<div className="flex items-center gap-2"\>  
                                                                            \<span className="w-1 h-4 bg-\[\#8e5a7d\] dark:bg-\[\#fcb7f0\] rounded shrink-0"\>\</span\>  
                                                                            \<Folder size={13} className="text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] shrink-0" /\>  
                                                                            \<span className="font-extrabold text-\[\#8e5a7d\] dark:text-white uppercase tracking-wider text-\[10px\]"\>  
                                                                                {tool ? tool.item : price.tool\_id}  
                                                                            \</span\>  
                                                                        \</div\>  
                                                                    \</td\>  
                                                                    \<td className="py-3 px-2 text-right font-mono"\>\</td\>  
                                                                    \<td className="py-3 px-2 text-right font-mono"\>\</td\>  
                                                                    \<td className="py-3 px-2 text-right font-mono"\>\</td\>  
                                                                    \<td className="py-3 px-2 text-center"\>  
                                                                        \<div className="flex items-center justify-center gap-2"\>  
                                                                            \<div   
                                                                                className={\`relative p-1 text-\[\#8e5a7d\] hover:text-\[\#734464\] hover:bg-\[\#fcb7f0\]/10 dark:text-\[\#fcb7f0\] dark:hover:text-\[\#f78de3\] dark:hover:bg-\[\#fcb7f0\]/5 rounded transition-all flex items-center justify-center ${  
                                                                                    (loading \!== null)  
                                                                                        ? 'opacity-50 cursor-not-allowed'  
                                                                                        : 'cursor-pointer'  
                                                                                }\`}  
                                                                                title="Move Category"  
                                                                            \>  
                                                                                \<FolderSymlink size={13} /\>  
                                                                                \<select  
                                                                                    value="move"  
                                                                                    disabled={loading \!== null || isOffline}  
                                                                                    onChange={async (e) \=\> {  
                                                                                        const newCat \= e.target.value;  
                                                                                        if (newCat \!== "move") {  
                                                                                            await handleMoveToolToPosition(price.tool\_id, 'end', category, newCat);  
                                                                                        }  
                                                                                    }}  
                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"  
                                                                                \>  
                                                                                    \<option value="move" disabled hidden\>Move\</option\>  
                                                                                    {CATEGORY\_ORDER.map(cat \=\> (  
                                                                                        \<option key={cat} value={cat} disabled={cat \=== category}\>  
                                                                                            {cat}  
                                                                                        \</option\>  
                                                                                    ))}  
                                                                                \</select\>  
                                                                            \</div\>  
                                                                            \<button  
                                                                                type="button"  
                                                                                onClick={() \=\> handleDeleteTool(price.tool\_id)}  
                                                                                disabled={loading \!== null || isOffline}  
                                                                                                                                                               className="p-1.5 text-\[\#991b1b\] hover:text-\[\#7f1d1d\] bg-red-100/70 hover:bg-red-200/90 border border-red-300 dark:text-red-300 dark:hover:text-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/70 dark:border-red-800 rounded transition-all shrink-0"  
                                                                                title={\`Delete Entire "${tool ? tool.item : price.tool\_id}" Tool\`}  
                                                                            \>  
                                                                                \<Trash2 size={13} /\>  
                                                                           \</button\>  
                                                                        \</div\>  
                                                                    \</td\>  
                                                                \</tr\>  
                                                            )}  
                                                            \<tr  
                                                                key={price.id}  
                                                            draggable={\!isOffline && editingCategory \=== category}  
                                                            onDragStart={(e) \=\> {  
                                                                if (editingCategory \!== category) {  
                                                                    e.preventDefault();  
                                                                    return;  
                                                                }  
                                                                setDraggedToolId(price.tool\_id);  
                                                                setDraggedCategory(category);  
                                                                e.dataTransfer.effectAllowed \= 'move';  
                                                            }}  
                                                            onDragOver={(e) \=\> {  
                                                                e.preventDefault();  
                                                                if (draggedToolId && draggedToolId \!== price.tool\_id && editingCategory \=== category && draggedCategory \=== category) {  
                                                                    if (dragOverToolId \!== price.tool\_id) {  
                                                                        setDragOverToolId(price.tool\_id);  
                                                                    }  
                                                                }  
                                                            }}  
                                                            onDrop={(e) \=\> {  
                                                                e.preventDefault();  
                                                                if (draggedToolId && draggedToolId \!== price.tool\_id && editingCategory \=== category && draggedCategory \=== category) {  
                                                                    e.stopPropagation();  
                                                                    handleMoveToolToPosition(draggedToolId, price.tool\_id, draggedCategory\!, category);  
                                                                }  
                                                                setDraggedToolId(null);  
                                                                setDraggedCategory(null);  
                                                                setDragOverToolId(null);  
                                                                setDragOverCategory(null);  
                                                            }}  
                                                            onDragEnd={() \=\> {  
                                                                setDraggedToolId(null);  
                                                                setDraggedCategory(null);  
                                                                setDragOverToolId(null);  
                                                                setDragOverCategory(null);  
                                                            }}  
                                                            className={\`  
                                                                transition-all duration-200  
                                                                ${draggedToolId \=== price.tool\_id ? 'opacity-30 bg-gray-100 dark:bg-slate-800/40' : ''}  
                                                                ${dragOverToolId \=== price.tool\_id ? 'bg-\[\#fcb7f0\]/10 dark:bg-\[\#fcb7f0\]/5' : ''}  
                                                                hover:bg-gray-50/50 dark:hover:bg-slate-800/30  
                                                            \`}  
                                                        \>  
                                                            \<td className="py-3 px-2"\>  
                                                                \<div className="flex items-center gap-2"\>  
                                                                    {editingCategory \=== category && (  
                                                                        isFirstOccurrence ? (  
                                                                            \<Menu  
                                                                                size={14}  
                                                                                className="text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-\[\#fcb7f0\] transition-colors shrink-0"  
                                                                                title="Drag to reorder tool"  
                                                                            /\>  
                                                                        ) : (  
                                                                            \<div className="w-3.5 shrink-0" /\>  
                                                                        )  
                                                                    )}  
                                                                    {isEditingRow ? (  
                                                                        \<div className="flex flex-col gap-1.5 w-full"\>  
                                                                            \<div className="flex items-center gap-1.5"\>  
                                                                                {editingCategory \=== category && price.sub\_key && \!isNewReuseTool && (  
                                                                                    \<span className="text-gray-400 dark:text-slate-600 font-mono select-none pl-1 shrink-0"\>  
                                                                                        └─  
                                                                                    \</span\>  
                                                                                )}  
                                                                                \<input  
                                                                                    type="text"  
                                                                                    value={rowData.displayName}  
                                                                                    onChange={e \=\> handleUpdateEditField(price.id, 'displayName', e.target.value, price, tool)}  
                                                                                    className="w-full p-1 border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200"  
                                                                                    placeholder="Display Name"  
                                                                                /\>  
                                                                            \</div\>  
                                                                            \<span className="text-\[9px\] text-gray-455 dark:text-slate-550 font-mono pl-1"\>  
                                                                                ID: {price.tool\_id}  
                                                                            \</span\>  
                                                                        \</div\>  
                                                                    ) : (  
                                                                        \<div className="flex flex-col"\>  
                                                                            \<span className="font-bold text-gray-900 dark:text-slate-200"\>  
                                                                                {price.display\_name || getToolDisplayName(price.tool\_id, tool ? tool.item : price.tool\_id, price.sub\_key)}  
                                                                            \</span\>  
                                                                            \<span className="text-\[9px\] text-gray-400 dark:text-slate-550 font-mono"\>  
                                                                                Db Item: {tool ? tool.item : price.tool\_id}  
                                                                            \</span\>  
                                                                        \</div\>  
                                                                    )}  
                                                                \</div\>  
                                                            \</td\>  
                                                            \<td className="py-3 px-2"\>  
                                                                {price.sub\_key ? (  
                                                                    \<span className="text-\[9px\] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"\>  
                                                                        {price.sub\_key}  
                                                                    \</span\>  
                                                                ) : (  
                                                                    \<span className="text-gray-400 dark:text-slate-600 italic"\>-\</span\>  
                                                                )}  
                                                            \</td\>  
                                                            \<td className="py-3 px-2 text-right"\>  
                                                                {isEditingRow ? (  
                                                                    \<input  
                                                                        type="number"  
                                                                        value={rowData.csmbs}  
                                                                        onChange={e \=\> handleUpdateEditField(price.id, 'csmbs', Number(e.target.value), price, tool)}  
                                                                        className="w-16 sm:w-20 text-right p-1 border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\]"  
                                                                    /\>  
                                                                ) : (  
                                                                    \<span className="font-mono font-semibold text-gray-900 dark:text-slate-200"\>  
                                                                        {price.csmbs\_price.toLocaleString()}  
                                                                    \</span\>  
                                                                )}  
                                                            \</td\>  
                                                            \<td className="py-3 px-2 text-right"\>  
                                                                {isEditingRow ? (  
                                                                    \<input  
                                                                        type="number"  
                                                                        value={rowData.sss}  
                                                                        onChange={e \=\> handleUpdateEditField(price.id, 'sss', Number(e.target.value), price, tool)}  
                                                                        className="w-16 sm:w-20 text-right p-1 border border-gray-255 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\]"  
                                                                    /\>  
                                                                ) : (  
                                                                    \<span className="font-mono font-semibold text-gray-900 dark:text-slate-200"\>  
                                                                        {price.sss\_price.toLocaleString()}  
                                                                    \</span\>  
                                                                )}  
                                                            \</td\>  
                                                            \<td className="py-3 px-2 text-right"\>  
                                                                {isEditingRow ? (  
                                                                    \<input  
                                                                        type="number"  
                                                                        value={rowData.ucs}  
                                                                        onChange={e \=\> handleUpdateEditField(price.id, 'ucs', Number(e.target.value), price, tool)}  
                                                                        className="w-16 sm:w-20 text-right p-1 border border-gray-255 dark:border-slate-700 bg-white dark:bg-slate-850 rounded text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\]"  
                                                                    /\>  
                                                                ) : (  
                                                                    \<span className="font-mono font-semibold text-gray-900 dark:text-slate-200"\>  
                                                                        {price.ucs\_price.toLocaleString()}  
                                                                    \</span\>  
                                                                )}  
                                                            \</td\>  
                                                            \<td className="py-3 px-2 text-center"\>  
                                                                {isEditingRow ? (  
                                                                    editingCategory \=== category ? (  
                                                                        \<div className="flex items-center justify-center gap-1.5"\>  
                                                                            \<div   
                                                                                className={\`relative p-1 text-\[\#8e5a7d\] hover:text-\[\#734464\] hover:bg-\[\#fcb7f0\]/10 dark:text-\[\#fcb7f0\] dark:hover:text-\[\#f78de3\] dark:hover:bg-\[\#fcb7f0\]/5 rounded transition-all flex items-center justify-center ${  
                                                                                    (loading \!== null)  
                                                                                        ? 'opacity-50 cursor-not-allowed'  
                                                                                        : 'cursor-pointer'  
                                                                                }\`}  
                                                                                title="Move Category"  
                                                                            \>  
                                                                                {\!hasSubtypes && (  
                                                                                    \<\>  
                                                                                        \<FolderSymlink size={13} /\>  
                                                                                        \<select  
                                                                                            value="move"  
                                                                                            disabled={loading \!== null || isOffline}  
                                                                                            onChange={async (e) \=\> {  
                                                                                                const newCat \= e.target.value;  
                                                                                                if (newCat \!== "move") {  
                                                                                                    await handleMoveToolToPosition(price.tool\_id, 'end', category, newCat);  
                                                                                                }  
                                                                                            }}  
                                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"  
                                                                                        \>  
                                                                                            \<option value="move" disabled hidden\>Move\</option\>  
                                                                                            {CATEGORY\_ORDER.map(cat \=\> (  
                                                                                                \<option key={cat} value={cat} disabled={cat \=== category}\>  
                                                                                                    {cat}  
                                                                                                \</option\>  
                                                                                            ))}  
                                                                                        \</select\>  
                                                                                    \</\>  
                                                                                )}  
                                                                            \</div\>  
                                                                            {price.sub\_key ? (  
                                                                                                                                                                         title={\`Delete Subtype "${price.sub\_key}"\`}  
                                                                                     \>  
                                                                                         \<Trash2 size={13} /\>  
                                                                                     \</button\>  
                                                                                 \</div\>  
                                                                             ) : (  
                                                                                 \<button  
                                                                                     type="button"  
                                                                                     onClick={() \=\> handleDeleteTool(price.tool\_id)}  
                                                                                     disabled={loading \!== null || isOffline}  
                                                                                     className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"  
                                                                                     title="Delete Tool"  
                                                                                 \>  
                                                                                     \<Trash2 size={13} /\>  
                                                                                 \</button\>  
                                                                             )}  
                                                                            {isNewReuseTool && isFirstOccurrence && (  
                                                                                \<button  
                                                                                    type="button"  
                                                                                    onClick={() \=\> handleDeleteTool(price.tool\_id)}  
                                                                                    disabled={loading \!== null || isOffline}  
                                                                                    className="p-1 text-red-655 hover:text-red-855 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50 border border-red-200/50 dark:border-red-900/30 ml-0.5"  
                                                                                    title={\`Delete Entire "${tool ? tool.item : price.tool\_id}" Tool\`}  
                                                                                \>  
                                                                                    \<Trash2 size={13} strokeWidth={2.5} /\>  
                                                                                \</button\>  
                                                                            )}  
                                                                        \</div\>  
                                                                    ) : (  
                                                                        \<div className="flex items-center justify-center gap-1.5"\>  
                                                                            \<button  
                                                                                onClick={() \=\> handleSavePriceRow(price.id)}  
                                                                                disabled={loading \!== null}  
                                                                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"  
                                                                                title="Save"  
                                                                            \>  
                                                                                \<Save size={13} /\>  
                                                                            \</button\>  
                                                                            \<button  
                                                                                onClick={() \=\> {  
                                                                                    if (hasPriceRowChanges(price.id)) {  
                                                                                        const confirmCancel \= window.confirm('Are you sure you want to discard your unsaved changes?');  
                                                                                        if (\!confirmCancel) return;  
                                                                                    }  
                                                                                    setEditingPriceId(null);  
                                                                                }}  
                                                                                disabled={loading \!== null}  
                                                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"  
                                                                                title="Cancel"  
                                                                            \>  
                                                                                \<X size={13} /\>  
                                                                            \</button\>  
                                                                            \<div   
                                                                                className={\`relative p-1 text-\[\#8e5a7d\] hover:text-\[\#734464\] hover:bg-\[\#fcb7f0\]/10 dark:text-\[\#fcb7f0\] dark:hover:text-\[\#f78de3\] dark:hover:bg-\[\#fcb7f0\]/5 rounded transition-all flex items-center justify-center ${  
                                                                                    (loading \!== null)  
                                                                                        ? 'opacity-50 cursor-not-allowed'  
                                                                                        : 'cursor-pointer'  
                                                                                }\`}  
                                                                                title="Move Category"  
                                                                            \>  
                                                                                \<FolderSymlink size={13} /\>  
                                                                                \<select  
                                                                                    value="move"  
                                                                                    disabled={loading \!== null || isOffline}  
                                                                                    onChange={async (e) \=\> {  
                                                                                        const newCat \= e.target.value;  
                                                                                        if (newCat \!== "move") {  
                                                                                            await handleMoveToolToPosition(price.tool\_id, 'end', category, newCat);  
                                                                                            setEditingPriceId(null);  
                                                                                        }  
                                                                                    }}  
                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"  
                                                                                \>  
                                                                                    \<option value="move" disabled hidden\>Move\</option\>  
                                                                                    {CATEGORY\_ORDER.map(cat \=\> (  
                                                                                        \<option key={cat} value={cat} disabled={cat \=== category}\>  
                                                                                            {cat}  
                                                                                        \</option\>  
                                                                                    ))}  
                                                                                \</select\>  
                                                                            \</div\>  
                                                                        \</div\>  
                                                                    )  
                                                                ) : (  
                                                                    \<div className="flex items-center justify-center gap-1.5"\>  
                                                                        \<button  
                                                                            onClick={() \=\> {  
                                                                                if (hasUnsavedChanges()) {  
                                                                                    alert('You have unsaved changes. Please save or cancel your edits first.');  
                                                                                    return;  
                                                                                }  
                                                                                handleStartEditPriceRow(price);  
                                                                            }}  
                                                                            disabled={isOffline || editingPriceId \!== null || editingCategory \!== null}  
                                                                            className="p-1 text-gray-500 hover:text-\[\#fcb7f0\] dark:text-slate-400 dark:hover:text-\[\#fcb7f0\] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"  
                                                                            title="Edit tool prices"  
                                                                        \>  
                                                                            \<Edit size={13} /\>  
                                                                        \</button\>  
                                                                    \</div\>  
                                                                )}  
                                                            \</td\>  
                                                        \</tr\>  
                                                    \</\>  
                                                );  
                                                })}  
                                            \</tbody\>  
                                        \</table\>  
                                    \</div\>  
                                \</section\>  
                            );  
                        })  
                    }  
                    {priceSearch.trim() && Object.keys(categorizedPrices).filter(cat \=\> selectedCategory \=== 'All' || cat \=== selectedCategory).every(cat \=\> categorizedPrices\[cat\].length \=== 0\) && (  
                        \<div className="bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs"\>  
                            No tools found matching search term "{priceSearch}"  
                        \</div\>  
                    )}  
                \</div\>  
            )}  
            {/\* Surgery Logic / Rule Management View \*/}  
            {adminTab \=== 'logic' && (  
                \<div className="space-y-4"\>  
                    {/\* Filter and search controls above the cards \*/}  
                    \<div className="flex flex-row items-center justify-between gap-2 w-full flex-wrap sm:flex-nowrap"\>  
                        {/\* Category Filter Tabs styled as floating buttons \*/}  
                        \<div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-1 max-w-full select-none py-0.5 shrink-0"\>  
                            {\['All', ...categories\].map(cat \=\> {  
                                const isSelected \= selectedLogicCategory \=== cat;  
                                const labelMap: Record\<string, string\> \= {  
                                    'All': 'All',  
                                    'Lens Surgery': 'Lens',  
                                    'Retinal Surgery': 'Retina',  
                                    'Glaucoma': 'Glaucoma',  
                                    'Cornea': 'Cornea',  
                                    'Oculoplastics': 'Oculo',  
                                    'Strabismus': 'Strab',  
                                    'Others': 'Others',  
                                };  
                                const displayLabel \= labelMap\[cat\] || cat;  
                                return (  
                                    \<button  
                                        key={cat}  
                                        onClick={() \=\> {  
                                            if (editingPriceId \!== null && hasPriceRowChanges(editingPriceId)) {  
                                                alert('You have unsaved changes. Please save or cancel your edits first.');  
                                                return;  
                                            }  
                                            setEditingPriceId(null);  
                                            setSelectedLogicCategory(cat);  
                                        }}  
                                        className={\`px-2.5 py-1 rounded-full text-\[10px\] sm:text-xs font-bold transition-all border ${  
                                            isSelected  
                                                ? 'bg-\[\#fcb7f0\] border-\[\#fcb7f0\] text-slate-800 font-extrabold shadow-sm scale-105'  
                                                : 'bg-white dark:bg-\[\#151f32\] border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-slate-800/40'  
                                        }\`}  
                                    \>  
                                        {displayLabel}  
                                    \</button\>  
                                );  
                            })}  
                        \</div\>  
                          
                        {/\* Search Box & Add Operation Button (shortened) \*/}  
                        \<div className="flex items-center gap-2 max-w-\[240px\] sm:max-w-xs md:max-w-sm w-full justify-end"\>  
                            \<div className="relative max-w-\[150px\] sm:max-w-\[180px\] w-full"\>  
                                \<input  
                                    type="text"  
                                    placeholder="Search operations, keys..."  
                                    value={logicSearch}  
                                    onChange={e \=\> setLogicSearch(e.target.value)}  
                                    className="w-full bg-white dark:bg-\[\#151f32\] border border-gray-100 dark:border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                /\>  
                                \<Search size={14} className="absolute left-2.5 top-1/2 \-translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" /\>  
                            \</div\>  
                            \<button  
                                 onClick={() \=\> {  
                                     if (editingPriceId \!== null && hasPriceRowChanges(editingPriceId)) {  
                                         alert('You have unsaved changes. Please save or cancel your edits first.');  
                                         return;  
                                     }  
                                     setEditingPriceId(null);  
                                     if (\!isOffline) {  
                                         if (showAddOpForm) {  
                                             handleCloseAddOpForm();  
                                         } else {  
                                             setShowAddOpForm(true);  
                                         }  
                                     }  
                                 }}  
                                 disabled={isOffline}  
                                 className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 shrink-0 ${  
                                     isOffline   
                                         ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-50'  
                                         : 'bg-\[\#fcb7f0\]/20 hover:bg-\[\#fcb7f0\]/40 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] border-\[\#fcb7f0\]/30'  
                                 }\`}  
                             \>  
                                 \<Plus size={14} /\>  
                                 {showAddOpForm ? 'Hide' : 'Add'}  
                             \</button\>  
                        \</div\>  
                    \</div\>  
                               {/\* Add Operation Form Modal \*/}  
                    {showAddOpForm && (  
                        \<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"\>  
                            \<div className="bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-xl border border-gray-150 dark:border-slate-800 p-5 sm:p-6 w-full max-w-xl animate-scaleUp overflow-y-auto max-h-\[90vh\]"\>  
                                \<div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2"\>  
                                    \<h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"\>  
                                        \<Plus size={16} className="text-\[\#8e5a7d\] dark:text-brand-primary-dark" /\>  
                                        Add Surgery Operation  
                                    \</h3\>  
                                    \<button   
                                        type="button"  
                                        onClick={handleCloseAddOpForm}  
                                        className="text-gray-400 hover:text-gray-500 transition-colors p-1"  
                                    \>  
                                        \<X size={18} /\>  
                                    \</button\>  
                                \</div\>  
                                \<form onSubmit={handleCreateOperation} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4"\>  
                                    \<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Operation Name\</label\>  
                                            \<input  
                                                type="text"  
                                                value={newOpName}  
                                                onChange={e \=\> setNewOpName(e.target.value)}  
                                                placeholder="e.g. PPV, Phaco, GDI"  
                                                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-\[\#fcb7f0\] focus:border-\[\#fcb7f0\] transition-all dark:text-slate-200"  
                                                required  
                                            /\>  
                                        \</div\>  
                                        \<div\>  
                                            \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Category\</label\>  
                                            \<div className="relative"\>  
                                                \<select  
                                                    value={newOpCategory}  
                                                    onChange={e \=\> setNewOpCategory(e.target.value)}  
                                                    className="w-full appearance-none bg-white dark:bg-\[\#151f32\] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"  
                                                \>  
                                                    {categories.map(c \=\> \<option key={c} value={c}\>{c}\</option\>)}  
                                                \</select\>  
                                                \<ChevronDown size={12} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" /\>  
                                            \</div\>  
                                        \</div\>  
                                    \</div\>  
                                    \<div\>  
                                        \<label className="text-\[10px\] font-bold text-gray-500 dark:text-slate-400 block mb-1"\>Trigger Keywords\</label\>  
                                        \<div className="flex flex-wrap items-center gap-1.5 pt-1"\>  
                                            {newOpKeywords.map((kw, idx) \=\> (  
                                                \<span   
                                                    key={idx}   
                                                    className="inline-flex items-center gap-1 bg-\[\#fcb7f0\]/35 dark:bg-\[\#fcb7f0\]/15 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] border border-\[\#fcb7f0\]/35 text-\[10px\] font-bold px-2 py-0.5 rounded-full transition-all"  
                                                \>  
                                                    {kw}  
                                                    \<button  
                                                        type="button"  
                                                        onClick={() \=\> handleRemoveKeywordFromNewOp(idx)}  
                                                        className="hover:bg-\[\#fcb7f0\]/50 dark:hover:bg-\[\#fcb7f0\]/30 rounded-full p-0.5 transition-all text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]"  
                                                    \>  
                                                        \<X size={10} strokeWidth={3} /\>  
                                                    \</button\>  
                                                \</span\>  
                                            ))}  
                                              
                                            {isAddingNewOpKeyword ? (  
                                                \<input  
                                                    type="text"  
                                                    autoFocus  
                                                    value={newOpKeywordInput}  
                                                    onChange={e \=\> setNewOpKeywordInput(e.target.value)}  
                                                    onBlur={() \=\> {  
                                                        if (newOpKeywordInput.trim()) {  
                                                            handleAddKeywordToNewOp(newOpKeywordInput);  
                                                        }  
                                                        setIsAddingNewOpKeyword(false);  
                                                    }}  
                                                    onKeyDown={e \=\> {  
                                                        if (e.key \=== 'Enter') {  
                                                            e.preventDefault();  
                                                            if (newOpKeywordInput.trim()) {  
                                                                handleAddKeywordToNewOp(newOpKeywordInput);  
                                                            }  
                                                            setIsAddingNewOpKeyword(false);  
                                                        } else if (e.key \=== 'Escape') {  
                                                            setIsAddingNewOpKeyword(false);  
                                                            setNewOpKeywordInput('');  
                                                        }  
                                                    }}  
                                                    placeholder="Keyword..."  
                                                    className="bg-transparent border-b border-\[\#fcb7f0\] px-1 py-0 text-\[10px\] font-bold outline-none text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] w-20 transition-all"  
                                                /\>  
                                            ) : (  
                                                \<button  
                                                    type="button"  
                                                    onClick={() \=\> {  
                                                        setIsAddingNewOpKeyword(true);  
                                                        setNewOpKeywordInput('');  
                                                    }}  
                                                    className="inline-flex items-center gap-0.5 bg-white hover:bg-\[\#fcb7f0\]/10 dark:bg-slate-900 dark:hover:bg-\[\#fcb7f0\]/5 border border-dashed border-\[\#fcb7f0\]/60 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] text-\[10px\] font-bold px-2 py-0.5 rounded-full transition-all"  
                                                \>  
                                                    \<Plus size={10} strokeWidth={3} /\> Add  
                                                \</button\>  
                                            )}  
                                        \</div\>  
                                        \<span className="text-\[9px\] text-gray-400 dark:text-slate-555 mt-1 block font-medium"\>Keywords are case-insensitive. Small keywords (≤2 characters) will match whole words only.\</span\>  
                                    \</div\>  
                                    \<div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800"\>  
                                        \<button  
                                            type="button"  
                                            onClick={handleCloseAddOpForm}  
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"  
                                        \>  
                                            Cancel  
                                        \</button\>  
                                        \<button  
                                            type="submit"  
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"  
                                        \>  
                                            \<Save size={14} /\>  
                                            Save Operation  
                                        \</button\>  
                                    \</div\>  
                                \</form\>  
                            \</div\>  
                        \</div\>  
                    )}  
                    {/\* Operations Accordion List \*/}  
                    \<div className="space-y-4"\>  
                        {categories.map(category \=\> {  
                            if (selectedLogicCategory \!== 'All' && category \!== selectedLogicCategory) {  
                                return null;  
                            }  
                            const operations \= groupedOperations\[category\];  
                            if (operations.length \=== 0\) return null;  
                            return (  
                                \<div key={category} className="space-y-2.5"\>  
                                    \<h3 className="text-\[10px\] font-black uppercase tracking-\[0.2em\] text-\[\#8e5a7d\] dark:text-pink-400/80 px-1 flex items-center gap-2 mt-4"\>  
                                        \<span className="w-1.5 h-3 bg-\[\#fcb7f0\] rounded-full"\>\</span\>  
                                        {(() \=\> {  
                                            if (category.toLowerCase().includes('surgery')) return category;  
                                            if (category \=== 'Others') return 'Other Surgery';  
                                            return \`${category} Surgery\`;  
                                        })()}  
                                    \</h3\>  
                                      
                                    \<div className="space-y-2"\>  
                                        {operations.map(op \=\> {  
                                            const isExpanded \= expandedOpId \=== op.id;  
                                            const opRules \= config.rules.filter(r \=\> r.operation\_id \=== op.id);  
                                            const isEditingDetails \= editOpId \=== op.id;  
                                            return (  
                                                \<div   
                                                    key={op.id}   
                                                    className="bg-white dark:bg-\[\#151f32\] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors"  
                                                \>  
                                                    {/\* Operation Header \*/}  
                                                    \<div   
                                                        onClick={() \=\> handleOpClick(op.id)}  
                                                        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"  
                                                    \>  
                                                        \<div className="flex flex-col sm:flex-row sm:items-center gap-2"\>  
                                                            \<span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white"\>  
                                                                {op.name}  
                                                            \</span\>  
                                                            \<div className="flex flex-wrap gap-1"\>  
                                                                {op.keywords.map(kw \=\> (  
                                                                    \<span key={kw} className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-\[9px\] px-1.5 py-0.5 rounded font-mono font-medium"\>  
                                                                        {kw}  
                                                                    \</span\>  
                                                                ))}  
                                                            \</div\>  
                                                        \</div\>  
                                                        \<div className="flex items-center gap-3"\>  
                                                            \<span className="text-\[9px\] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-1.5 py-0.5 rounded"\>  
                                                                {opRules.length} rule{opRules.length \!== 1 ? 's' : ''}  
                                                            \</span\>  
                                                            {isExpanded ? \<ChevronUp size={16} className="text-gray-400" /\> : \<ChevronDown size={16} className="text-gray-400" /\>}  
                                                        \</div\>  
                                                    \</div\>  
                                                    {/\* Expanded Operation Body \*/}  
                                                    {isExpanded && (  
                                                        \<div className="p-3 sm:p-4 border-t border-gray-50 dark:border-slate-800/80 bg-gray-50/30 dark:bg-slate-900/10 space-y-4 animate-slideDown"\>  
                                                            {/\* edit details form \*/}  
                                                            \<div className="p-3 bg-white dark:bg-\[\#111827\] rounded-xl border border-gray-100 dark:border-slate-800 space-y-3"\>  
                                                                {\!isEditingDetails ? (  
                                                                    \<div className="flex items-start justify-between gap-4 text-xs"\>  
                                                                        \<div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 flex-1"\>  
                                                                            \<div\>  
                                                                                \<span className="text-gray-400 dark:text-slate-500 font-bold block mb-0.5"\>Name\</span\>  
                                                                                \<span className="font-bold text-gray-900 dark:text-white"\>{op.name}\</span\>  
                                                                            \</div\>  
                                                                            \<div\>  
                                                                                \<span className="text-gray-400 dark:text-slate-500 font-bold block mb-0.5"\>Category\</span\>  
                                                                                \<span className="font-bold text-gray-800 dark:text-slate-200"\>{op.category}\</span\>  
                                                                            \</div\>  
                                                                            \<div\>  
                                                                                \<span className="text-gray-400 dark:text-slate-500 font-bold block mb-0.5"\>Trigger Keywords\</span\>  
                                                                                \<span className="font-bold text-gray-800 dark:text-slate-200"\>{op.keywords.join(', ') || '(none)'}\</span\>  
                                                                            \</div\>  
                                                                        \</div\>  
                                                                          
                                                                        \<div className="flex gap-2 shrink-0 pt-0.5"\>  
                                                                             \<button  
                                                                                 onClick={() \=\> \!isOffline && handleStartEditOp(op)}  
                                                                                 disabled={isOffline}  
                                                                                 className="p-1 text-gray-400 hover:text-\[\#fcb7f0\] dark:text-slate-500 dark:hover:text-\[\#fcb7f0\] disabled:opacity-30 disabled:hover:text-gray-500 disabled:cursor-not-allowed transition-colors"  
                                                                                 title="Edit details"  
                                                                             \>  
                                                                                 \<Edit size={14} /\>  
                                                                             \</button\>  
                                                                             \<button  
                                                                                 onClick={() \=\> \!isOffline && handleDeleteOperation(op.id)}  
                                                                                 disabled={isOffline}  
                                                                                 className="p-1 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-500 disabled:cursor-not-allowed transition-colors"  
                                                                                 title="Delete operation"  
                                                                             \>  
                                                                                 \<Trash2 size={14} /\>  
                                                                             \</button\>  
                                                                        \</div\>  
                                                                    \</div\>  
                                                                ) : (  
                                                                    \<div className="space-y-3"\>  
                                                                        \<div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/80 pb-1.5 mb-1"\>  
                                                                            \<span className="text-\[10px\] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider"\>Edit Operation Details\</span\>  
                                                                            \<div className="flex gap-1.5"\>  
                                                                                \<button  
                                                                                    onClick={() \=\> handleSaveOperationDetails(op.id)}  
                                                                                    className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"  
                                                                                    title="Save details"  
                                                                                \>  
                                                                                    \<Save size={14} /\>  
                                                                                \</button\>  
                                                                                \<button  
                                                                                    onClick={() \=\> {  
                                                                                        const originalKws \= \[...op.keywords\].sort();  
                                                                                        const currentKws \= \[...editOpKeywords\].sort();  
                                                                                        const kwsChanged \= originalKws.length \!== currentKws.length ||  
                                                                                                           originalKws.some((kw, idx) \=\> kw \!== currentKws\[idx\]);  
                                                                                        const hasChanges \= editOpName.trim() \!== op.name ||   
                                                                                                           editOpCategory \!== op.category ||   
                                                                                                           kwsChanged;  
                                                                                        if (hasChanges) {  
                                                                                            const confirmCancel \= window.confirm('Are you sure you want to discard your unsaved changes?');  
                                                                                            if (\!confirmCancel) return;  
                                                                                        }  
                                                                                        setEditOpId(null);  
                                                                                    }}  
                                                                                    className="p-1 text-gray-400 hover:text-gray-500 transition-colors"  
                                                                                    title="Cancel"  
                                                                                \>  
                                                                                    \<X size={14} /\>  
                                                                                \</button\>  
                                                                            \</div\>  
                                                                        \</div\>  
                                                                        \<div className="grid grid-cols-1 sm:grid-cols-2 gap-3"\>  
                                                                            \<div\>  
                                                                                \<label className="text-\[9px\] font-bold text-gray-455 dark:text-slate-500 block mb-1"\>Name\</label\>  
                                                                                \<input  
                                                                                    type="text"  
                                                                                    value={editOpName}  
                                                                                    onChange={e \=\> setEditOpName(e.target.value)}  
                                                                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200"  
                                                                                /\>  
                                                                            \</div\>  
                                                                            \<div\>  
                                                                                \<label className="text-\[9px\] font-bold text-gray-455 dark:text-slate-500 block mb-1"\>Category\</label\>  
                                                                                \<div className="relative"\>  
                                                                                    \<select  
                                                                                        value={editOpCategory}  
                                                                                        onChange={e \=\> setEditOpCategory(e.target.value)}  
                                                                                        className="w-full appearance-none bg-white dark:bg-\[\#151f32\] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"  
                                                                                    \>  
                                                                                        {categories.map(c \=\> \<option key={c} value={c}\>{c}\</option\>)}  
                                                                                    \</select\>  
                                                                                    \<ChevronDown size={12} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" /\>  
                                                                                \</div\>  
                                                                            \</div\>  
                                                                        \</div\>  
                                                                        \<div\>  
                                                                            \<label className="text-\[9px\] font-bold text-gray-455 dark:text-slate-505 block mb-1"\>Trigger Keywords\</label\>  
                                                                            \<div className="flex flex-wrap items-center gap-1.5 pt-1"\>  
                                                                                {editOpKeywords.map((kw, idx) \=\> (  
                                                                                    \<span   
                                                                                        key={idx}   
                                                                                        className="inline-flex items-center gap-1 bg-\[\#fcb7f0\]/35 dark:bg-\[\#fcb7f0\]/15 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] border border-\[\#fcb7f0\]/35 text-\[10px\] font-bold px-2 py-0.5 rounded-full transition-all"  
                                                                                    \>  
                                                                                        {kw}  
                                                                                        \<button  
                                                                                            type="button"  
                                                                                            onClick={() \=\> handleRemoveKeywordFromEditOp(idx)}  
                                                                                            className="hover:bg-\[\#fcb7f0\]/50 dark:hover:bg-\[\#fcb7f0\]/30 rounded-full p-0.5 transition-all text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]"  
                                                                                        \>  
                                                                                            \<X size={10} strokeWidth={3} /\>  
                                                                                        \</button\>  
                                                                                    \</span\>  
                                                                                ))}  
                                                                                  
                                                                                {isAddingEditOpKeyword ? (  
                                                                                    \<input  
                                                                                        type="text"  
                                                                                        autoFocus  
                                                                                        value={editOpKeywordInput}  
                                                                                        onChange={e \=\> setEditOpKeywordInput(e.target.value)}  
                                                                                        onBlur={() \=\> {  
                                                                                            if (editOpKeywordInput.trim()) {  
                                                                                                handleAddKeywordToEditOp(editOpKeywordInput, op.id);  
                                                                                            }  
                                                                                            setIsAddingEditOpKeyword(false);  
                                                                                        }}  
                                                                                        onKeyDown={e \=\> {  
                                                                                            if (e.key \=== 'Enter') {  
                                                                                                e.preventDefault();  
                                                                                                if (editOpKeywordInput.trim()) {  
                                                                                                    handleAddKeywordToEditOp(editOpKeywordInput, op.id);  
                                                                                                }  
                                                                                                setIsAddingEditOpKeyword(false);  
                                                                                            } else if (e.key \=== 'Escape') {  
                                                                                                setIsAddingEditOpKeyword(false);  
                                                                                                setEditOpKeywordInput('');  
                                                                                            }  
                                                                                        }}  
                                                                                        placeholder="Keyword..."  
                                                                                        className="bg-transparent border-b border-\[\#fcb7f0\] px-1 py-0 text-\[10px\] font-bold outline-none text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] w-20 transition-all"  
                                                                                    /\>  
                                                                                ) : (  
                                                                                    \<button  
                                                                                        type="button"  
                                                                                        onClick={() \=\> {  
                                                                                            setIsAddingEditOpKeyword(true);  
                                                                                            setEditOpKeywordInput('');  
                                                                                        }}  
                                                                                        className="inline-flex items-center gap-0.5 bg-white hover:bg-\[\#fcb7f0\]/10 dark:bg-slate-900 dark:hover:bg-\[\#fcb7f0\]/5 border border-dashed border-\[\#fcb7f0\]/60 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] text-\[10px\] font-bold px-2 py-0.5 rounded-full transition-all"  
                                                                                    \>  
                                                                                        \<Plus size={10} strokeWidth={3} /\> Add  
                                                                                    \</button\>  
                                                                                )}  
                                                                            \</div\>  
                                                                        \</div\>  
                                                                    \</div\>  
                                                                )}  
                                                            \</div\>  
                                                              
                                                            {/\* associated rules \*/}  
                                                             \<div className="pt-1"\>  
                                                                 \<div className="grid grid-cols-1 md:grid-cols-2 gap-4"\>  
                                                                     {/\* 1\. Surgical Tools Column (Left) \*/}  
                                                                     \<div className="flex flex-col h-full bg-gray-50/30 dark:bg-slate-800/10 border border-gray-100 dark:border-slate-800/60 rounded-2xl p-3 sm:p-4"\>  
                                                                         \<div className="flex items-center gap-1.5 mb-3 pb-1 border-b border-gray-100 dark:border-slate-800/80"\>  
                                                                             \<span className="w-1 h-2 bg-sky-400 dark:bg-sky-500 rounded-full"\>\</span\>  
                                                                             \<span className="text-\[9px\] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400"\>Surgical Tools\</span\>  
                                                                         \</div\>  
                                                                           
                                                                         \<div className="flex-1 space-y-2 mb-3"\>  
                                                                             {opRules.filter(r \=\> r.target\_type \=== 'tool').length \=== 0 ? (  
                                                                                 \<div className="py-6 text-center border border-dashed border-gray-150 dark:border-slate-800/60 rounded-xl text-gray-400 dark:text-slate-500 text-\[10px\] italic"\>  
                                                                                     No surgical tools triggered yet.  
                                                                                 \</div\>  
                                                                             ) : (  
                                                                                 opRules.filter(r \=\> r.target\_type \=== 'tool').map(rule \=\> {  
                                                                                     const tool \= config.tools.find(t \=\> t.id \=== rule.target\_id);  
                                                                                     const targetName \= tool ? tool.item : rule.target\_id;  
                                                                                     return (  
                                                                                         \<div   
                                                                                             key={rule.id}   
                                                                                             className="bg-white dark:bg-\[\#111827\] border border-gray-100 dark:border-slate-800/60 p-2 rounded-xl flex items-center justify-between gap-3 text-xs"  
                                                                                         \>  
                                                                                             \<div className="flex flex-col"\>  
                                                                                                 \<span className="font-bold text-gray-800 dark:text-slate-200 text-xs"\>  
                                                                                                     {targetName}  
                                                                                                 \</span\>  
                                                                                                 {rule.default\_selected\_value && (  
                                                                                                     \<span className="text-\[9px\] text-gray-450 dark:text-slate-400 font-semibold mt-0.5"\>  
                                                                                                         Default: {rule.default\_selected\_value}  
                                                                                                     \</span\>  
                                                                                                 )}  
                                                                                             \</div\>  
                                                                                             \<button  
                                                                                                 onClick={() \=\> \!isOffline && handleDeleteRule(rule.id)}  
                                                                                                 disabled={isOffline}  
                                                                                                 className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed p-1 rounded transition-colors"  
                                                                                                 title="Remove trigger"  
                                                                                             \>  
                                                                                                 \<Trash2 size={12} /\>  
                                                                                             \</button\>  
                                                                                         \</div\>  
                                                                                     );  
                                                                                 })  
                                                                             )}  
                                                                         \</div\>  
                                                                         {isAddingToolRule ? (  
                                                                             \<div className="bg-white dark:bg-\[\#111827\] border border-dashed border-gray-200 dark:border-slate-800/80 p-2.5 rounded-xl space-y-2 mt-auto"\>  
                                                                                 \<div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-1.5"\>  
                                                                                     \<span className="text-\[8px\] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block"\>Add Surgical Tool Triggers\</span\>  
                                                                                     \<div className="flex items-center gap-1.5"\>  
                                                                                         \<button  
                                                                                             type="button"  
                                                                                             onClick={() \=\> \!isOffline && handleSaveQueuedToolRules(op.id, opRules)}  
                                                                                             disabled={isOffline || pendingToolRules.filter(r \=\> r.target\_id).length \=== 0}  
                                                                                             className="text-emerald-500 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-emerald-500 p-0.5 transition-colors"  
                                                                                             title="Save triggers"  
                                                                                         \>  
                                                                                             \<Save size={14} /\>  
                                                                                         \</button\>  
                                                                                         \<button  
                                                                                             type="button"  
                                                                                             onClick={() \=\> {  
                                                                                                 setIsAddingToolRule(false);  
                                                                                                 setPendingToolRules(\[\]);  
                                                                                             }}  
                                                                                             className="text-gray-400 hover:text-gray-600 dark:text-slate-550 dark:hover:text-slate-400 p-0.5 transition-colors"  
                                                                                             title="Exit"  
                                                                                         \>  
                                                                                             \<X size={14} /\>  
                                                                                         \</button\>  
                                                                                     \</div\>  
                                                                                 \</div\>  
                                                                                   
                                                                                 \<div className="space-y-2 max-h-\[220px\] overflow-y-auto pr-1"\>  
                                                                                     {pendingToolRules.map((queued, idx) \=\> {  
                                                                                         const tool \= config.tools.find(t \=\> t.id \=== queued.target\_id);  
                                                                                         const rowOptions \= tool && tool.options ? tool.options : null;  
                                                                                         return (  
                                                                                             \<div key={idx} className="flex gap-2 items-center"\>  
                                                                                                 \<div className="relative flex-1"\>  
                                                                                                     \<select  
                                                                                                         value={queued.target\_id}  
                                                                                                         onChange={e \=\> {  
                                                                                                             const newId \= e.target.value;  
                                                                                                             setPendingToolRules(prev \=\> prev.map((item, i) \=\>   
                                                                                                                 i \=== idx ? { target\_id: newId, default\_selected\_value: '' } : item  
                                                                                                             ));  
                                                                                                         }}  
                                                                                                         className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-2.5 pr-8 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200 appearance-none"  
                                                                                                     \>  
                                                                                                         \<option value=""\>- Select Tool \-\</option\>  
                                                                                                         {CATEGORY\_ORDER.map(cat \=\> {  
                                                                                                             const catTools \= toolRuleOptions.filter(t \=\> t.category \=== cat);  
                                                                                                             if (catTools.length \=== 0\) return null;  
                                                                                                             return (  
                                                                                                                 \<optgroup key={cat} label={cat} className="text-gray-500 font-bold bg-white dark:bg-slate-800"\>  
                                                                                                                     {catTools.map(opt \=\> (  
                                                                                                                         \<option key={opt.id} value={opt.id} className="text-gray-900 dark:text-white font-medium"\>  
                                                                                                                             {opt.name}  
                                                                                                                         \</option\>  
                                                                                                                     ))}  
                                                                                                                 \</optgroup\>  
                                                                                                             );  
                                                                                                         })}  
                                                                                                     \</select\>  
                                                                                                     \<ChevronDown size={14} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 pointer-events-none" /\>  
                                                                                                 \</div\>  
                                                                                                   
                                                                                                 {rowOptions && (  
                                                                                                     \<div className="relative min-w-\[100px\] max-w-\[140px\]"\>  
                                                                                                         \<select  
                                                                                                             value={queued.default\_selected\_value || ''}  
                                                                                                             onChange={e \=\> {  
                                                                                                                 const val \= e.target.value;  
                                                                                                                 setPendingToolRules(prev \=\> prev.map((item, i) \=\>   
                                                                                                                     i \=== idx ? { ...item, default\_selected\_value: val } : item  
                                                                                                                 ));  
                                                                                                             }}  
                                                                                                             className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-2.5 pr-8 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200 appearance-none"  
                                                                                                         \>  
                                                                                                             \<option value=""\>- Value (Opt) \-\</option\>  
                                                                                                             {rowOptions.map(o \=\> (  
                                                                                                                 \<option key={o.value} value={o.value}\>{o.label}\</option\>  
                                                                                                             ))}  
                                                                                                         \</select\>  
                                                                                                         \<ChevronDown size={14} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 pointer-events-none" /\>  
                                                                                                     \</div\>  
                                                                                                 )}  
                                                                                                   
                                                                                                 {pendingToolRules.length \> 1 && (  
                                                                                                     \<button  
                                                                                                         type="button"  
                                                                                                         onClick={() \=\> {  
                                                                                                             setPendingToolRules(prev \=\> prev.filter((\_, i) \=\> i \!== idx));  
                                                                                                         }}  
                                                                                                         className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"  
                                                                                                         title="Remove this tool row"  
                                                                                                     \>  
                                                                                                         \<Trash2 size={12} /\>  
                                                                                                     \</button\>  
                                                                                                 )}  
                                                                                             \</div\>  
                                                                                         );  
                                                                                     })}  
                                                                                 \</div\>  
                                                                                 \<div className="pt-1.5 flex justify-start"\>  
                                                                                     \<button  
                                                                                         type="button"  
                                                                                         onClick={() \=\> {  
                                                                                             setPendingToolRules(prev \=\> \[...prev, { target\_id: '', default\_selected\_value: '' }\]);  
                                                                                         }}  
                                                                                         className="flex items-center gap-1 bg-\[\#fcb7f0\]/10 hover:bg-\[\#fcb7f0\]/20 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] border border-\[\#fcb7f0\]/20 rounded-lg px-2.5 py-1 text-\[10px\] font-black uppercase tracking-wider transition-all"  
                                                                                     \>  
                                                                                         \<Plus size={10} strokeWidth={3} className="text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]" /\> Add another tool  
                                                                                     \</button\>  
                                                                                 \</div\>  
                                                                             \</div\>  
                                                                         ) : (  
                                                                             \<button  
                                                                                 type="button"  
                                                                                 disabled={isOffline}  
                                                                                 onClick={() \=\> {  
                                                                                     setIsAddingToolRule(true);  
                                                                                     setPendingToolRules(\[{ target\_id: '', default\_selected\_value: '' }\]);  
                                                                                 }}  
                                                                                 className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-\[\#fcb7f0\]/10 dark:bg-\[\#111827\] dark:hover:bg-\[\#fcb7f0\]/5 border border-dashed border-\[\#fcb7f0\]/60 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-auto"  
                                                                             \>  
                                                                                 \<Plus size={12} strokeWidth={3} className="text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]" /\> Add Surgical Tool  
                                                                             \</button\>  
                                                                         )}  
                                                                     \</div\>  
                                                                       
                                                                     {/\* 2\. Pre-Op Actions Column (Right) \*/}  
                                                                     \<div className="flex flex-col h-full bg-gray-50/30 dark:bg-slate-800/10 border border-gray-100 dark:border-slate-800/60 rounded-2xl p-3 sm:p-4"\>  
                                                                         \<div className="flex items-center gap-1.5 mb-3 pb-1 border-b border-gray-100 dark:border-slate-800/80"\>  
                                                                             \<span className="w-1 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full"\>\</span\>  
                                                                             \<span className="text-\[9px\] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400"\>Pre-Op Actions\</span\>  
                                                                         \</div\>  
                                                                           
                                                                         \<div className="flex-1 space-y-2 mb-3"\>  
                                                                             {opRules.filter(r \=\> r.target\_type \=== 'action').length \=== 0 ? (  
                                                                                 \<div className="py-6 text-center border border-dashed border-gray-150 dark:border-slate-800/60 rounded-xl text-gray-400 dark:text-slate-500 text-\[10px\] italic"\>  
                                                                                     No pre-op actions triggered yet.  
                                                                                 \</div\>  
                                                                             ) : (  
                                                                                 opRules.filter(r \=\> r.target\_type \=== 'action').map(rule \=\> {  
                                                                                     const action \= config.actions.find(a \=\> a.id \=== rule.target\_id);  
                                                                                     const targetName \= action ? action.item : rule.target\_id;  
                                                                                     return (  
                                                                                         \<div   
                                                                                             key={rule.id}   
                                                                                             className="bg-white dark:bg-\[\#111827\] border border-gray-100 dark:border-slate-800/60 p-2 rounded-xl flex items-center justify-between gap-3 text-xs"  
                                                                                         \>  
                                                                                             \<span className="font-bold text-gray-800 dark:text-slate-200 text-xs"\>  
                                                                                                 {targetName}  
                                                                                             \</span\>  
                                                                                             \<button  
                                                                                                 onClick={() \=\> \!isOffline && handleDeleteRule(rule.id)}  
                                                                                                 disabled={isOffline}  
                                                                                                 className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed p-1 rounded transition-colors"  
                                                                                                 title="Remove trigger"  
                                                                                             \>  
                                                                                                 \<Trash2 size={12} /\>  
                                                                                             \</button\>  
                                                                                         \</div\>  
                                                                                     );  
                                                                                 })  
                                                                             )}  
                                                                         \</div\>  
                                                                           
                                                                         {/\* Add action inline row at the last row of the column \*/}  
                                                                         {isAddingActionRule ? (  
                                                                             \<div className="bg-white dark:bg-\[\#111827\] border border-dashed border-gray-200 dark:border-slate-800/80 p-2.5 rounded-xl space-y-2 mt-auto"\>  
                                                                                 \<div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-1.5"\>  
                                                                                     \<span className="text-\[8px\] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block"\>Add Pre-Op Action Triggers\</span\>  
                                                                                     \<div className="flex items-center gap-1.5"\>  
                                                                                         \<button  
                                                                                             type="button"  
                                                                                             onClick={() \=\> \!isOffline && handleSaveQueuedActionRules(op.id, opRules)}  
                                                                                             disabled={isOffline || pendingActionRules.filter(id \=\> id).length \=== 0}  
                                                                                             className="text-emerald-500 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-emerald-500 p-0.5 transition-colors"  
                                                                                             title="Save triggers"  
                                                                                         \>  
                                                                                             \<Save size={14} /\>  
                                                                                         \</button\>  
                                                                                         \<button  
                                                                                             type="button"  
                                                                                             onClick={() \=\> {  
                                                                                                 setIsAddingActionRule(false);  
                                                                                                 setPendingActionRules(\[\]);  
                                                                                             }}  
                                                                                             className="text-gray-400 hover:text-gray-600 dark:text-slate-550 dark:hover:text-slate-400 p-0.5 transition-colors"  
                                                                                             title="Exit"  
                                                                                         \>  
                                                                                             \<X size={14} /\>  
                                                                                         \</button\>  
                                                                                     \</div\>  
                                                                                 \</div\>  
                                                                                   
                                                                                 \<div className="space-y-2 max-h-\[220px\] overflow-y-auto pr-1"\>  
                                                                                     {pendingActionRules.map((actionId, idx) \=\> {  
                                                                                         return (  
                                                                                             \<div key={idx} className="flex gap-2 items-center"\>  
                                                                                                 \<div className="relative flex-1"\>  
                                                                                                     \<select  
                                                                                                         value={actionId}  
                                                                                                         onChange={e \=\> {  
                                                                                                             const newId \= e.target.value;  
                                                                                                             setPendingActionRules(prev \=\> prev.map((item, i) \=\>   
                                                                                                                 i \=== idx ? newId : item  
                                                                                                             ));  
                                                                                                         }}  
                                                                                                         className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-2.5 pr-8 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-\[\#fcb7f0\] dark:text-slate-200 appearance-none"  
                                                                                                     \>  
                                                                                                         \<option value=""\>- Select Action \-\</option\>  
                                                                                                         {actionRuleOptions.map(opt \=\> (  
                                                                                                             \<option key={opt.id} value={opt.id}\>{opt.name}\</option\>  
                                                                                                         ))}  
                                                                                                     \</select\>  
                                                                                                     \<ChevronDown size={14} className="absolute right-2.5 top-1/2 \-translate-y-1/2 text-gray-400 pointer-events-none" /\>  
                                                                                                 \</div\>  
                                                                                                   
                                                                                                 {pendingActionRules.length \> 1 && (  
                                                                                                     \<button  
                                                                                                         type="button"  
                                                                                                         onClick={() \=\> {  
                                                                                                             setPendingActionRules(prev \=\> prev.filter((\_, i) \=\> i \!== idx));  
                                                                                                         }}  
                                                                                                         className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"  
                                                                                                         title="Remove this action row"  
                                                                                                     \>  
                                                                                                         \<Trash2 size={12} /\>  
                                                                                                     \</button\>  
                                                                                                 )}  
                                                                                             \</div\>  
                                                                                         );  
                                                                                     })}  
                                                                                 \</div\>  
                                                                                 \<div className="pt-1.5 flex justify-start"\>  
                                                                                     \<button  
                                                                                         type="button"  
                                                                                         onClick={() \=\> {  
                                                                                             setPendingActionRules(prev \=\> \[...prev, ''\]);  
                                                                                         }}  
                                                                                         className="flex items-center gap-1 bg-\[\#fcb7f0\]/10 hover:bg-\[\#fcb7f0\]/20 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] border border-\[\#fcb7f0\]/20 rounded-lg px-2.5 py-1 text-\[10px\] font-black uppercase tracking-wider transition-all"  
                                                                                     \>  
                                                                                         \<Plus size={10} strokeWidth={3} className="text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]" /\> Add another action  
                                                                                     \</button\>  
                                                                                 \</div\>  
                                                                             \</div\>  
                                                                         ) : (  
                                                                             \<button  
                                                                                 type="button"  
                                                                                 disabled={isOffline}  
                                                                                 onClick={() \=\> {  
                                                                                     setIsAddingActionRule(true);  
                                                                                     setPendingActionRules(\[''\]);  
                                                                                 }}  
                                                                                 className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-\[\#fcb7f0\]/10 dark:bg-\[\#111827\] dark:hover:bg-\[\#fcb7f0\]/5 border border-dashed border-\[\#fcb7f0\]/60 text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-auto"  
                                                                             \>  
                                                                                 \<Plus size={12} strokeWidth={3} className="text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\]" /\> Add Pre-Op Action  
                                                                             \</button\>  
                                                                         )}  
                                                                     \</div\>  
                                                                 \</div\>  
                                                             \</div\>  
                                                        \</div\>  
                                                    )}  
                                                \</div\>  
                                            );  
                                        })}  
                                    \</div\>  
                                \</div\>  
                            );  
                        })}  
                        {logicSearch.trim() && Object.keys(groupedOperations).filter(cat \=\> selectedLogicCategory \=== 'All' || cat \=== selectedLogicCategory).every(cat \=\> groupedOperations\[cat\].length \=== 0\) && (  
                            \<div className="bg-white dark:bg-\[\#151f32\] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs"\>  
                                No surgery operations found matching search term "{logicSearch}"  
                            \</div\>  
                        )}  
                    \</div\>  
                \</div\>  
            )}  
            {/\* loading Indicator Overlay \*/}  
            {loading && (  
                \<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-\[2px\] flex items-center justify-center z-50 animate-fadeIn"\>  
                    \<div className="bg-white dark:bg-\[\#151f32\] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center gap-3"\>  
                        \<RefreshCw size={24} className="text-\[\#8e5a7d\] dark:text-\[\#fcb7f0\] animate-spin" /\>  
                        \<span className="text-xs font-bold text-gray-700 dark:text-slate-350"\>{loading}\</span\>  
                    \</div\>  
                \</div\>  
            )}  
            {/\* Toast Notifications \*/}  
            {toast && (  
                \<div className="fixed bottom-4 right-4 z-50 animate-slideUp"\>  
                    \<div className={\`p-4 rounded-xl shadow-lg border flex items-center gap-2 max-w-sm ${  
                        toast.type \=== 'success'  
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'  
                            : 'bg-red-50 dark:bg-red-950/30 border-red-500/30 text-red-855 dark:text-red-300'  
                    }\`}\>  
                        {toast.type \=== 'success' ? \<CheckCircle size={16} /\> : \<AlertTriangle size={16} /\>}  
                        \<span className="text-xs font-bold"\>{toast.message}\</span\>  
                    \</div\>  
                \</div\>  
            )}  
        \</div\>  
    );  
}

