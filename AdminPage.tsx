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
import { DBTool, DBAction, DBOperation, DBRule, DBPrice } from './configService';
import {
    createOperation,
    deleteOperation,
    deletePrice,
    deleteTool,
    insertPrice,
    insertTool,
    syncOperationRules,
    updateOperation,
    updatePrice,
    updateTool,
    updateToolCategory,
    updateToolOrder,
    updateToolPrices,
} from './adminService';
import { NEW_REUSED_OPTIONS } from './constants';
import AdminShell from './components/admin/AdminShell';
import { CATEGORY_ORDER, getToolDisplayName } from './components/admin/adminCatalog';
import { filterAndSortPrices, filterOperations, getPriceDisplayName, groupOperations, groupPricesByCategory } from './components/admin/adminSelectors';
import AdminFeatureToolbar from './components/admin/AdminFeatureToolbar';
import AdminModalFrame from './components/admin/AdminModalFrame';
import OperationHeader from './components/admin/OperationHeader';
import OperationSummary from './components/admin/OperationSummary';
import OperationRuleSummary from './components/admin/OperationRuleSummary';
import OperationRuleEditor, { EditableOperationRule } from './components/admin/OperationRuleEditor';

interface AdminPageProps {
    config: {
        tools: DBTool[];
        actions: DBAction[];
        operations: DBOperation[];
        rules: DBRule[];
        prices: DBPrice[];
    };
    onRefresh: () => Promise<void>;
    isOffline: boolean;
    onEditingChange: (isEditing: boolean) => void;
}

export default function AdminPage({ config, onRefresh, isOffline, onEditingChange }: AdminPageProps) {
    const [adminTab, setAdminTab] = useState<'prices' | 'logic'>('prices');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState<string | null>(null); // tracks active operation description

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // --- Prices State & Logic ---
    const [priceSearch, setPriceSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');
    const [logicSearch, setLogicSearch] = useState('');
    const [selectedLogicCategory, setSelectedLogicCategory] = useState<'All' | string>('All');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editPricesData, setEditPricesData] = useState<Record<string, {
        displayName: string;
        csmbs: number;
        sss: number;
        ucs: number;
    }>>({});

    const hasCategoryChanges = (cat: string): boolean => {
        const catPrices = categorizedPrices[cat] || [];
        for (const p of catPrices) {
            const current = editPricesData[p.id];
            if (!current) continue;
            const tool = config.tools.find(t => t.id === p.tool_id);
            const originalDispName = p.display_name || getToolDisplayName(p.tool_id, tool ? tool.item : p.tool_id, p.sub_key);
            if (
                current.displayName !== originalDispName ||
                current.csmbs !== p.csmbs_price ||
                current.sss !== p.sss_price ||
                current.ucs !== p.ucs_price
            ) {
                return true;
            }
        }
        return false;
    };

    const hasPriceRowChanges = (priceId: string): boolean => {
        const originalPrice = config.prices.find(p => p.id === priceId);
        if (!originalPrice) return false;
        const current = editPricesData[priceId];
        if (!current) return false;
        const tool = config.tools.find(t => t.id === originalPrice.tool_id);
        const originalDispName = originalPrice.display_name || getToolDisplayName(originalPrice.tool_id, tool ? tool.item : originalPrice.tool_id, originalPrice.sub_key);
        return (
            current.displayName !== originalDispName ||
            current.csmbs !== originalPrice.csmbs_price ||
            current.sss !== originalPrice.sss_price ||
            current.ucs !== originalPrice.ucs_price
        );
    };

    const hasUnsavedChanges = (): boolean => {
        if (editingCategory) {
            return hasCategoryChanges(editingCategory);
        }
        if (editingPriceId) {
            return hasPriceRowChanges(editingPriceId);
        }
        return false;
    };

    useEffect(() => {
        if (onEditingChange) {
            onEditingChange(
                (editingCategory !== null && hasCategoryChanges(editingCategory)) ||
                (editingPriceId !== null && hasPriceRowChanges(editingPriceId))
            );
        }
    }, [editingCategory, editingPriceId, editPricesData, onEditingChange]);

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
    const [activeAddSubtypeTool, setActiveAddSubtypeTool] = useState<DBTool | null>(null);
    const [newSubtypeKey, setNewSubtypeKey] = useState('');
    const [newSubtypeDisplayName, setNewSubtypeDisplayName] = useState('');
    const [newSubtypeCsmbs, setNewSubtypeCsmbs] = useState<number>(0);
    const [newSubtypeSss, setNewSubtypeSss] = useState<number>(0);
    const [newSubtypeUcs, setNewSubtypeUcs] = useState<number>(0);

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

    const handleCloseAddToolForm = () => {
        const hasInputs = newToolDisplayName.trim() || 
            newToolId.trim() || 
            newToolCsmbs > 0 || 
            newToolSss > 0 || 
            newToolUcs > 0 || 
            newToolSubtypes.some(s => s.displayName.trim() || s.subKey.trim() || s.csmbs > 0 || s.sss > 0 || s.ucs > 0);

        if (hasInputs) {
            const confirmClose = window.confirm('You have unsaved changes in the Add Tool form. Are you sure you want to discard them?');
            if (!confirmClose) return;
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
        setNewToolSubtypes([{ subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }]);
    };

    // Drag and Drop States
    const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
    const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
    const [dragOverToolId, setDragOverToolId] = useState<string | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

    const filteredPrices = useMemo(
        () => filterAndSortPrices(config.prices, config.tools, priceSearch),
        [config.prices, config.tools, priceSearch],
    );

    const categorizedPrices = useMemo(
        () => groupPricesByCategory(filteredPrices, config.tools),
        [filteredPrices, config.tools],
    );

    const handleStartEditCategory = (cat: string) => {
        setEditingCategory(cat);
        setEditingPriceId(null);
        const categoryItems = categorizedPrices[cat] || [];
        const initialData: Record<string, {
            displayName: string;
            csmbs: number;
            sss: number;
            ucs: number;
        }> = {};
        categoryItems.forEach(price => {
            const tool = config.tools.find(t => t.id === price.tool_id);
            const dispName = getPriceDisplayName(price, tool);
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
                return data ? {
                    id: item.id,
                    csmbs_price: Number(data.csmbs),
                    sss_price: Number(data.sss),
                    ucs_price: Number(data.ucs),
                    display_name: data.displayName.trim(),
                } : null;
            }).filter((update): update is NonNullable<typeof update> => update !== null);

            const { displayNameSupported } = await updateToolPrices(updates);

            showToast(`All prices in "${cat}" updated successfully`, 'success');
            setEditingCategory(null);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error updating details', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleStartEditPriceRow = (price: DBPrice) => {
        setEditingPriceId(price.id);
        setEditingCategory(null);
        const tool = config.tools.find(t => t.id === price.tool_id);
        const dispName = price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key);
        setEditPricesData(prev => ({
            ...prev,
            [price.id]: {
                displayName: dispName,
                csmbs: price.csmbs_price,
                sss: price.sss_price,
                ucs: price.ucs_price
            }
        }));
    };

    const handleSavePriceRow = async (priceId: string) => {
        const data = editPricesData[priceId];
        if (!data) {
            setEditingPriceId(null);
            return;
        }
        // validate
        if (data.csmbs < 0 || data.sss < 0 || data.ucs < 0) {
            showToast('Prices must be non-negative numbers', 'error');
            return;
        }
        if (!data.displayName.trim()) {
            showToast('Tool name is required', 'error');
            return;
        }

        setLoading('Saving tool prices...');
        try {
            const result = await updatePrice({
                id: priceId,
                    csmbs_price: Number(data.csmbs),
                    sss_price: Number(data.sss),
                    ucs_price: Number(data.ucs),
                    display_name: data.displayName.trim()
            });

            showToast(`Tool prices updated successfully`, 'success');
            setEditingPriceId(null);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error updating details', 'error');
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

            const toolResult = await insertTool({
                id: tid,
                item: dName,
                type: newToolType,
                category: newToolCategory,
                is_active: true,
                sort_order: 999,
                options: toolsOptions,
                default_value: defaultValue,
            });
            if (!toolResult.categorySupported) {
                showToast('Tool added to database! Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'error');
            }

            if (newToolType === 'radio') {
                const insertPromises = newToolSubtypes.map(st => insertPrice({
                    tool_id: tid,
                    sub_key: st.subKey.trim(),
                    csmbs_price: Number(st.csmbs),
                    sss_price: Number(st.sss),
                    ucs_price: Number(st.ucs),
                    display_name: st.displayName.trim(),
                }));
                await Promise.all(insertPromises);
            } else {
                const priceResult = await insertPrice({
                    tool_id: tid,
                    sub_key: null,
                    csmbs_price: Number(newToolCsmbs),
                    sss_price: Number(newToolSss),
                    ucs_price: Number(newToolUcs),
                    display_name: dName,
                });
                if (!priceResult.displayNameSupported) {
                    showToast('Tool added, but display name not saved in pricing. Run SQL: ALTER TABLE tool_prices ADD COLUMN display_name VARCHAR;', 'error');
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
            await deleteTool(toolId);

            showToast(`Tool "${toolId}" deleted successfully`, 'success');
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error deleting tool', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteSubtype = async (priceRow: DBPrice) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the subtype "${priceRow.sub_key}" of tool "${priceRow.tool_id}"? This will delete this specific subtype price.`);
        if (!confirmDelete) return;

        setLoading('Deleting subtype...');
        try {
            // 1. Delete price row from tool_prices
            await deletePrice(priceRow.id);

            // 2. Fetch tool options and update options array in tools table
            const tool = config.tools.find(t => t.id === priceRow.tool_id);
            if (tool && tool.options) {
                const currentOptions = Array.isArray(tool.options) ? tool.options : [];
                // Filter out the deleted subtype
                const updatedOptions = currentOptions.filter((opt: any) => opt.value !== priceRow.sub_key);
                
                await updateTool(priceRow.tool_id, {
                        options: updatedOptions.length > 0 ? updatedOptions : null,
                        // If no options left, change type to checkbox
                        type: updatedOptions.length > 0 ? tool.type : 'checkbox',
                        default_value: tool.default_value === priceRow.sub_key 
                            ? (updatedOptions[0]?.value || null) 
                            : tool.default_value
                    });
            }

            showToast(`Subtype "${priceRow.sub_key}" deleted successfully`, 'success');
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error deleting subtype', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleAddSubtypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAddSubtypeTool) return;
        
        const subKey = newSubtypeKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const dispName = newSubtypeDisplayName.trim();
        
        if (!subKey || !dispName) {
            showToast('Please fill out all required subtype fields.', 'error');
            return;
        }

        // Check if subtype already exists in prices table
        const exists = config.prices.some(p => p.tool_id === activeAddSubtypeTool.id && p.sub_key === subKey);
        if (exists) {
            showToast(`Subtype key "${subKey}" already exists for this tool`, 'error');
            return;
        }

        setLoading('Adding subtype...');
        try {
            // 1. Update options array in tools table
            const currentOptions = Array.isArray(activeAddSubtypeTool.options) ? activeAddSubtypeTool.options : [];
            const updatedOptions = [
                ...currentOptions,
                { label: dispName, value: subKey }
            ];

            await updateTool(activeAddSubtypeTool.id, {
                options: updatedOptions,
                type: 'radio',
            });

            // 2. Insert into tool_prices table
            await insertPrice({
                tool_id: activeAddSubtypeTool.id,
                sub_key: subKey,
                csmbs_price: Number(newSubtypeCsmbs),
                sss_price: Number(newSubtypeSss),
                ucs_price: Number(newSubtypeUcs),
                display_name: dispName,
            });

            showToast(`Subtype "${dispName}" added successfully`, 'success');
            
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

                await updateToolOrder(updates);

                showToast('Tool order updated successfully', 'success');
            } else {
                // Update category in DB
                const categoryResult = await updateToolCategory(draggedId, targetCategory);
                if (!categoryResult.categorySupported) {
                    showToast('Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'error');
                    return;
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

                await updateToolOrder(updates);

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
    const [newOpKeywords, setNewOpKeywords] = useState<string[]>([]);
    const [newOpKeywordInput, setNewOpKeywordInput] = useState('');
    const [isAddingNewOpKeyword, setIsAddingNewOpKeyword] = useState(false);

    const handleCloseAddOpForm = () => {
        if (newOpName.trim() || newOpKeywords.length > 0 || newOpKeywordInput.trim()) {
            const confirmClose = window.confirm('You have unsaved changes in the Add Surgery Operation form. Are you sure you want to discard them?');
            if (!confirmClose) return;
        }
        setShowAddOpForm(false);
        setNewOpName('');
        setNewOpKeywords([]);
        setNewOpKeywordInput('');
        setIsAddingNewOpKeyword(false);
        setNewOpCategory('Lens Surgery');
    };

    // Editing Operation Form state (inside expanded accordion)
    const [editOpId, setEditOpId] = useState<string | null>(null);
    const [editOpName, setEditOpName] = useState('');
    const [editOpCategory, setEditOpCategory] = useState('');
    const [editOpKeywords, setEditOpKeywords] = useState<string[]>([]);
    const [editOpKeywordInput, setEditOpKeywordInput] = useState('');
    const [isAddingEditOpKeyword, setIsAddingEditOpKeyword] = useState(false);

    // New Rule state (per operation)
    const [newRuleTargetType, setNewRuleTargetType] = useState<'tool' | 'action'>('tool');
    const [newRuleTargetId, setNewRuleTargetId] = useState('');
    const [newRuleDefaultVal, setNewRuleDefaultVal] = useState('');

    // Edit operation draft rules (tools & pre-op actions saved on card save)
    const [editOpRules, setEditOpRules] = useState<EditableOperationRule[]>([]);

    const categories = ['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Oculoplastics', 'Strabismus', 'Others'];

    const filteredOperations = useMemo(
        () => filterOperations(config.operations, logicSearch),
        [config.operations, logicSearch],
    );

    const groupedOperations = useMemo(
        () => groupOperations(filteredOperations, categories),
        [filteredOperations, categories],
    );

    const handleAddKeywordToNewOp = (kw: string): boolean => {
        const trimmed = kw.trim();
        if (!trimmed) return false;
        const lower = trimmed.toLowerCase();
        
        // Check local duplicates
        if (newOpKeywords.some(k => k.toLowerCase() === lower)) {
            showToast(`Duplicate keyword: "${trimmed}" is already added.`, 'error');
            return false;
        }
        
        // Check database duplicates
        const matchedOp = config.operations.find(otherOp =>
            otherOp.keywords.some(otherKw => otherKw.toLowerCase() === lower)
        );
        if (matchedOp) {
            showToast(`Duplicate keyword: "${trimmed}" is already defined in operation "${matchedOp.name}".`, 'error');
            return false;
        }
        
        setNewOpKeywords(prev => [...prev, trimmed]);
        setNewOpKeywordInput('');
        return true;
    };

    const handleRemoveKeywordFromNewOp = (indexToRemove: number) => {
        setNewOpKeywords(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleAddKeywordToEditOp = (kw: string, opId: string): boolean => {
        const trimmed = kw.trim();
        if (!trimmed) return false;
        const lower = trimmed.toLowerCase();
        
        // Check local duplicates
        if (editOpKeywords.some(k => k.toLowerCase() === lower)) {
            showToast(`Duplicate keyword: "${trimmed}" is already added.`, 'error');
            return false;
        }
        
        // Check database duplicates
        const matchedOp = config.operations.find(otherOp =>
            otherOp.id !== opId && otherOp.keywords.some(otherKw => otherKw.toLowerCase() === lower)
        );
        if (matchedOp) {
            showToast(`Duplicate keyword: "${trimmed}" is already defined in operation "${matchedOp.name}".`, 'error');
            return false;
        }
        
        setEditOpKeywords(prev => [...prev, trimmed]);
        setEditOpKeywordInput('');
        return true;
    };

    const handleRemoveKeywordFromEditOp = (indexToRemove: number) => {
        setEditOpKeywords(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleCreateOperation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOpName.trim()) {
            showToast('Operation name is required', 'error');
            return;
        }
        
        let finalKeywords = [...newOpKeywords];
        if (newOpKeywordInput.trim()) {
            const trimmedInput = newOpKeywordInput.trim();
            const lowerInput = trimmedInput.toLowerCase();
            if (newOpKeywords.some(k => k.toLowerCase() === lowerInput)) {
                showToast(`Duplicate keyword: "${trimmedInput}" is already added.`, 'error');
                return;
            }
            const matchedOp = config.operations.find(otherOp =>
                otherOp.keywords.some(otherKw => otherKw.toLowerCase() === lowerInput)
            );
            if (matchedOp) {
                showToast(`Duplicate keyword: "${trimmedInput}" is already defined in operation "${matchedOp.name}".`, 'error');
                return;
            }
            finalKeywords.push(trimmedInput);
        }

        setLoading('Creating operation...');
        try {
            await createOperation({
                    name: newOpName.trim(),
                    category: newOpCategory,
                    keywords: finalKeywords
                });
            showToast('Operation created successfully', 'success');
            setNewOpName('');
            setNewOpKeywords([]);
            setNewOpKeywordInput('');
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
        setEditOpKeywords([...op.keywords]);
        setEditOpKeywordInput('');
        
        // Copy current DB rules for this operation into draft state
        const currentRules = config?.rules.filter(r => r.operation_id === op.id) || [];
        setEditOpRules(currentRules.map(r => ({
            id: r.id,
            operation_id: r.operation_id,
            target_type: r.target_type,
            target_id: r.target_id,
            default_selected_value: r.default_selected_value || null
        })));
    };

    const hasOpEditChanges = (opId: string): boolean => {
        if (editOpId !== opId) return false;
        const op = config?.operations.find(o => o.id === opId);
        if (!op) return false;

        if (editOpName.trim() !== op.name) return true;
        if (editOpCategory !== op.category) return true;
        if (editOpKeywords.join(', ') !== op.keywords.join(', ')) return true;

        const dbRules = config?.rules.filter(r => r.operation_id === opId) || [];
        const validRules = editOpRules.filter(r => r.target_id.trim() !== '');
        if (validRules.length !== dbRules.length) return true;

        for (let i = 0; i < validRules.length; i++) {
            const vr = validRules[i];
            const dr = dbRules[i];
            if (!dr) return true;
            if (vr.id !== dr.id || vr.target_type !== dr.target_type || vr.target_id !== dr.target_id || (vr.default_selected_value || null) !== (dr.default_selected_value || null)) {
                return true;
            }
        }
        return false;
    };

    const handleSaveOperationDetails = async (opId: string) => {
        if (!editOpName.trim()) {
            showToast('Operation name is required', 'error');
            return;
        }
        
        let finalKeywords = [...editOpKeywords];
        if (editOpKeywordInput.trim()) {
            const trimmedInput = editOpKeywordInput.trim();
            const lowerInput = trimmedInput.toLowerCase();
            if (editOpKeywords.some(k => k.toLowerCase() === lowerInput)) {
                showToast(`Duplicate keyword: "${trimmedInput}" is already added.`, 'error');
                return;
            }
            const matchedOp = config.operations.find(otherOp =>
                otherOp.id !== opId && otherOp.keywords.some(otherKw => otherKw.toLowerCase() === lowerInput)
            );
            if (matchedOp) {
                showToast(`Duplicate keyword: "${trimmedInput}" is already defined in operation "${matchedOp.name}".`, 'error');
                return;
            }
            finalKeywords.push(trimmedInput);
        }

        // Validate rules (filter out empty rows)
        const validRules = editOpRules.filter(r => r.target_id.trim() !== '');

        // Check for duplicate triggers within validRules
        const toolSeen = new Set<string>();
        const actionSeen = new Set<string>();
        for (const r of validRules) {
            if (r.target_type === 'tool') {
                if (toolSeen.has(r.target_id)) {
                    const tool = config?.tools.find(t => t.id === r.target_id);
                    showToast(`Surgical tool "${tool ? tool.item : r.target_id}" is selected more than once.`, 'error');
                    return;
                }
                toolSeen.add(r.target_id);
            } else if (r.target_type === 'action') {
                if (actionSeen.has(r.target_id)) {
                    const action = config?.actions.find(a => a.id === r.target_id);
                    showToast(`Pre-Op action "${action ? action.item : r.target_id}" is selected more than once.`, 'error');
                    return;
                }
                actionSeen.add(r.target_id);
            }
        }

        setLoading('Saving operation details...');
        try {
            // 1. Update operation metadata
            await updateOperation({
                id: opId,
                    name: editOpName.trim(),
                    category: editOpCategory,
                    keywords: finalKeywords
                });

            // 2. Sync rules in Supabase
            const dbRules = config?.rules.filter(r => r.operation_id === opId) || [];
            const dbRuleIds = dbRules.map(r => r.id);

            // A) Delete removed rules
            const validRuleIds = validRules.map(r => r.id).filter(Boolean);
            const idsToDelete = dbRuleIds.filter(id => !validRuleIds.includes(id));
            if (idsToDelete.length > 0) {
            }

            // B) Insert new rules
            const newRulesToInsert = validRules
                .filter(r => !r.id)
                .map(r => ({
                    operation_id: opId,
                    target_type: r.target_type,
                    target_id: r.target_id,
                    default_selected_value: r.default_selected_value ? r.default_selected_value.trim() || null : null
                }));

            const rulesToUpdate = [];
            for (const r of validRules.filter(r => r.id)) {
                const orig = dbRules.find(d => d.id === r.id);
                if (orig && (orig.target_id !== r.target_id || (orig.default_selected_value || null) !== (r.default_selected_value || null))) {
                    rulesToUpdate.push({
                        id: r.id as string,
                        target_id: r.target_id,
                        default_selected_value: r.default_selected_value ? r.default_selected_value.trim() || null : null,
                    });
                }
            }

            await syncOperationRules(opId, idsToDelete, newRulesToInsert, rulesToUpdate);

            showToast('Operation updated successfully', 'success');
            setEditOpId(null);
            setEditOpRules([]);
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
            await deleteOperation(opId);

            showToast('Operation and its rules deleted successfully', 'success');
            setExpandedOpId(null);
            await onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Error deleting operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleOpClick = (targetOpId: string) => {
        const isExpanded = expandedOpId === targetOpId;
        if (editOpId) {
            if (hasOpEditChanges(editOpId)) {
                if (!window.confirm('You have unsaved operation changes. Do you want to discard them?')) {
                    return;
                }
            }
            setEditOpId(null);
            setEditOpRules([]);
        }
        setExpandedOpId(isExpanded ? null : targetOpId);
    };

    const toolRuleOptions = useMemo(() => {
        if (!config?.tools) return [];
        const sortedTools = [...config.tools].sort((a, b) => {
            const catA = a.category || 'Generals';
            const catB = b.category || 'Generals';
            const idxA = CATEGORY_ORDER.indexOf(catA);
            const idxB = CATEGORY_ORDER.indexOf(catB);
            const finalIdxA = idxA === -1 ? 999 : idxA;
            const finalIdxB = idxB === -1 ? 999 : idxB;
            if (finalIdxA !== finalIdxB) {
                return finalIdxA - finalIdxB;
            }
            const orderA = typeof a.sort_order === 'number' ? a.sort_order : 999;
            const orderB = typeof b.sort_order === 'number' ? b.sort_order : 999;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.item.localeCompare(b.item);
        });
        return sortedTools
            // `mm` is a stale legacy tool row and is not a real surgical tool.
            // Keep it out of new rule selectors until the legacy row is removed
            // from the database.
            .filter(t => t.id.toLowerCase() !== 'mm' && t.item.trim().toLowerCase() !== 'mm')
            .map(t => ({
            id: t.id, 
            name: t.item, 
            options: t.options,
            category: t.category || 'Generals'
            }));
    }, [config?.tools]);

    const actionRuleOptions = useMemo(() => {
        if (!config?.actions) return [];
        return config.actions.map(a => ({ id: a.id, name: a.item }));
    }, [config?.actions]);

    return (
        <AdminShell
            isOffline={isOffline}
            activeTab={adminTab}
            canNavigate={!hasUnsavedChanges()}
            onTabChange={(tab) => {
                setEditingCategory(null);
                setEditingPriceId(null);
                setAdminTab(tab);
            }}
        >

            {/* Prices Management View */}
            {adminTab === 'prices' && (
                <div className="space-y-6">
                    <AdminFeatureToolbar
                        categories={['All', ...CATEGORY_ORDER]}
                        selectedCategory={selectedCategory}
                        onCategoryChange={category => {
                            if (hasUnsavedChanges()) {
                                alert('You have unsaved changes. Please save or cancel your edits first.');
                                return;
                            }
                            setEditingCategory(null);
                            setEditingPriceId(null);
                            setSelectedCategory(category);
                        }}
                        search={priceSearch}
                        onSearchChange={setPriceSearch}
                        searchPlaceholder="Search tools, keys..."
                        addLabel="Add"
                        addOpen={showAddToolForm}
                        disabled={isOffline}
                        onAddToggle={() => {
                            if (hasUnsavedChanges()) {
                                alert('You have unsaved changes. Please save or cancel your edits first.');
                                return;
                            }
                            setEditingCategory(null);
                            setEditingPriceId(null);
                            if (showAddToolForm) handleCloseAddToolForm();
                            else setShowAddToolForm(true);
                        }}
                    />

                    {/* Add Tool Form Modal */}
                    {showAddToolForm && (
                        <AdminModalFrame title="Add New Tool" maxWidth="max-w-4xl" onClose={handleCloseAddToolForm}>
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
                                            <div className="relative">
                                                <select
                                                    value={newToolCategory}
                                                    onChange={e => setNewToolCategory(e.target.value)}
                                                    className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                                >
                                                    {CATEGORY_ORDER.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Option</label>
                                            <div className="relative">
                                                <select
                                                    value={newToolType}
                                                    onChange={e => setNewToolType(e.target.value as any)}
                                                    className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                                >
                                                    <option value="checkbox">None</option>
                                                    <option value="radio">Subtype (Multiple choices)</option>
                                                    <option value="number-input">Input Value</option>
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            </div>
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
                                            onClick={handleCloseAddToolForm}
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
                        </AdminModalFrame>
                )}
                    {/* Add Subtype Form Modal */}
                    {activeAddSubtypeTool && (
                        <AdminModalFrame title={`Add Subtype Option (Group: ${activeAddSubtypeTool.item})`} maxWidth="max-w-2xl" onClose={() => setActiveAddSubtypeTool(null)}>
                                <form onSubmit={handleAddSubtypeSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Group Name</label>
                                            <input
                                                type="text"
                                                value={activeAddSubtypeTool.item}
                                                disabled
                                                className="w-full bg-gray-150 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-400 dark:text-slate-400 outline-none cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Display Name</label>
                                            <input
                                                type="text"
                                                value={newSubtypeDisplayName}
                                                onChange={e => {
                                                    setNewSubtypeDisplayName(e.target.value);
                                                    if (!newSubtypeKey) {
                                                        setNewSubtypeKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                                                    }
                                                }}
                                                placeholder="e.g. Centurion Active Sentry"
                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Key ID</label>
                                            <input
                                                type="text"
                                                value={newSubtypeKey}
                                                onChange={e => setNewSubtypeKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                placeholder="e.g. active-sentry"
                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">CSMBS Price (฿)</label>
                                            <input
                                                type="number"
                                                value={newSubtypeCsmbs}
                                                onChange={e => setNewSubtypeCsmbs(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">SSS Price (฿)</label>
                                            <input
                                                type="number"
                                                value={newSubtypeSss}
                                                onChange={e => setNewSubtypeSss(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">UCS Price (฿)</label>
                                            <input
                                                type="number"
                                                value={newSubtypeUcs}
                                                onChange={e => setNewSubtypeUcs(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setActiveAddSubtypeTool(null)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                        >
                                            <Save size={14} />
                                            Save Subtype
                                        </button>
                                    </div>
                                </form>
                        </AdminModalFrame>
                    )}

                    {CATEGORY_ORDER.map(category => {
                        if (selectedCategory !== 'All' && category !== selectedCategory) {
                            return null;
                        }
                        const items = categorizedPrices[category] || [];
                        if (items.length === 0) {
                            if (priceSearch.trim()) return null;
                            return (
                                <section
                                    key={category}
                                    onDragOver={(e) => {
                                        if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
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
                                        if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
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
                                            {(() => {
                                                if (category.toLowerCase().includes('surgery')) return category;
                                                if (category === 'Generals') return 'General Surgery';
                                                return `${category} Surgery`;
                                            })()}
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
                                        if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
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
                                        if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
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
                                        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0] flex items-center gap-2">
                                            <span className="w-1.5 h-3 bg-[#8e5a7d] dark:bg-[#fcb7f0] rounded-full"></span>
                                            {(() => {
                                                if (category.toLowerCase().includes('surgery')) return category;
                                                if (category === 'Generals') return 'General Surgery';
                                                return `${category} Surgery`;
                                            })()}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {editingCategory === category ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveCategoryPrices(category)}
                                                        disabled={loading !== null}
                                                        className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                                        title="Save All"
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (hasCategoryChanges(category)) {
                                                                const confirmCancel = window.confirm('Are you sure you want to discard your unsaved changes?');
                                                                if (!confirmCancel) return;
                                                            }
                                                            setEditingCategory(null);
                                                        }}
                                                        disabled={loading !== null}
                                                        className="p-1 text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (hasUnsavedChanges()) {
                                                            alert('You have unsaved changes. Please save or cancel your edits first.');
                                                            return;
                                                        }
                                                        handleStartEditCategory(category);
                                                    }}
                                                    disabled={loading !== null || isOffline || editingPriceId !== null}
                                                    className="p-1 text-gray-500 hover:text-[#fcb7f0] disabled:opacity-30 disabled:hover:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                                    title="Edit category prices"
                                                >
                                                    <Edit size={14} />
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
                                                    const isEditingRow = (editingCategory === category) || (editingPriceId === price.id);
                                                     const isFirstOccurrence = items.findIndex(item => item.tool_id === price.tool_id) === idx;
                                                     const isLastOccurrence = (() => {
                                                         let lastIdx = -1;
                                                         for (let i = items.length - 1; i >= 0; i--) {
                                                             if (items[i].tool_id === price.tool_id) {
                                                                 lastIdx = i;
                                                                 break;
                                                             }
                                                         }
                                                         return lastIdx === idx;
                                                     })();
                                                     const isNewReuseTool = tool?.options?.some(o => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED);
                                                     const toolPricesCount = items.filter(item => item.tool_id === price.tool_id).length;
                                                     const hasSubtypes = toolPricesCount > 1 && !isNewReuseTool;
                                                     const isSubtypeTool = (tool?.type === 'radio') || (tool?.options && tool.options.length > 0 && !isNewReuseTool) || hasSubtypes;
                                                     const showGroupHeader = hasSubtypes && isFirstOccurrence && (editingCategory === category);
                                                    const rowData = editPricesData[price.id] || {
                                                        displayName: price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key),
                                                        csmbs: price.csmbs_price,
                                                        sss: price.sss_price,
                                                        ucs: price.ucs_price
                                                    };

                                                    return (
                                                        <React.Fragment key={price.id}>
                                                             {showGroupHeader && (
                                                                 <tr
                                                                     key={`group-header-${price.tool_id}`}
                                                                     className="bg-[#8e5a7d]/5 dark:bg-slate-800/60 border-y border-[#8e5a7d]/15 dark:border-slate-700/80 font-bold text-xs text-gray-800 dark:text-slate-350"
                                                                     draggable={editingCategory === category && !isOffline}
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
                                                                 >
                                                                     <td className="py-3 px-3" colSpan={2}>
                                                                         <div className="flex items-center gap-2">
                                                                             <Menu
                                                                                 size={14}
                                                                                 className="text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-[#fcb7f0] transition-colors shrink-0"
                                                                                 title="Drag to reorder tool group"
                                                                             />
                                                                             <Folder size={13} className="text-[#8e5a7d] dark:text-[#fcb7f0] shrink-0" />
                                                                             <span className="font-extrabold text-[#8e5a7d] dark:text-white uppercase tracking-wider text-[10px]">
                                                                                 {tool ? tool.item : price.tool_id}
                                                                             </span>
                                                                         </div>
                                                                     </td>
                                                                     <td className="py-3 px-2 text-right font-mono"></td>
                                                                     <td className="py-3 px-2 text-right font-mono"></td>
                                                                     <td className="py-3 px-2 text-right font-mono"></td>
                                                                     <td className="py-3 px-2 text-center"></td>
                                                                 </tr>
                                                             )}
                                                            <tr
                                                                key={price.id}
                                                            draggable={isEditingRow && !isOffline && !isSubtypeTool}
                                                            onDragStart={(e) => {
                                                                 if (isSubtypeTool) return;
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
                                                                ${isEditingRow ? 'bg-[#fcb7f0]/5 dark:bg-[#fcb7f0]/10' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/30'}
                                                            `}
                                                        >
                                                            <td className="py-3 px-2">
                                                                <div className="flex items-center gap-2">
                                                                    {isEditingRow && (
                                                                        (isFirstOccurrence && !isSubtypeTool) ? (
                                                                            <Menu
                                                                                size={14}
                                                                                className="text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-[#fcb7f0] transition-colors shrink-0"
                                                                                title="Drag to reorder tool"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-3.5 shrink-0" />
                                                                        )
                                                                    )}
                                                                    {isEditingRow ? (
                                                                        <div className="flex flex-col gap-1.5 w-full">
                                                                            <div className="flex items-center gap-1.5 w-full">
                                                                                {editingCategory === category && price.sub_key && !isNewReuseTool && (
                                                                                    <span className="text-gray-400 dark:text-slate-600 font-mono select-none pl-1 shrink-0">
                                                                                        └─
                                                                                    </span>
                                                                                )}
                                                                                <input
                                                                                    type="text"
                                                                                    value={rowData.displayName}
                                                                                    onChange={e => handleUpdateEditField(price.id, 'displayName', e.target.value, price, tool)}
                                                                                    className="w-full px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                                    placeholder="Display Name"
                                                                                />
                                                                            </div>
                                                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono pl-1">
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
                                                                {isEditingRow ? (
                                                                    <input
                                                                        type="number"
                                                                        value={rowData.csmbs}
                                                                        onChange={e => handleUpdateEditField(price.id, 'csmbs', Number(e.target.value), price, tool)}
                                                                        className="w-16 sm:w-20 text-right px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                        {price.csmbs_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-right">
                                                                {isEditingRow ? (
                                                                    <input
                                                                        type="number"
                                                                        value={rowData.sss}
                                                                        onChange={e => handleUpdateEditField(price.id, 'sss', Number(e.target.value), price, tool)}
                                                                        className="w-16 sm:w-20 text-right px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                        {price.sss_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-right">
                                                                {isEditingRow ? (
                                                                    <input
                                                                        type="number"
                                                                        value={rowData.ucs}
                                                                        onChange={e => handleUpdateEditField(price.id, 'ucs', Number(e.target.value), price, tool)}
                                                                        className="w-16 sm:w-20 text-right px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                        {price.ucs_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-center">
                                                                {isEditingRow ? (
                                                                    editingCategory === category ? (
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
                                                                                    disabled={loading !== null || isOffline}
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
                                                                            {price.sub_key ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteSubtype(price)}
                                                                                    disabled={loading !== null || isOffline}
                                                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                                                                                    title={`Delete Subtype "${price.sub_key}"`}
                                                                                >
                                                                                    <Trash2 size={13} />
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteTool(price.tool_id)}
                                                                                    disabled={loading !== null || isOffline}
                                                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                                                                                    title="Delete Tool"
                                                                                >
                                                                                    <Trash2 size={13} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSavePriceRow(price.id)}
                                                                                disabled={loading !== null}
                                                                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                                                                title="Save"
                                                                            >
                                                                                <Save size={13} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (hasPriceRowChanges(price.id)) {
                                                                                        const confirmCancel = window.confirm('Are you sure you want to discard your unsaved changes?');
                                                                                        if (!confirmCancel) return;
                                                                                    }
                                                                                    setEditingPriceId(null);
                                                                                }}
                                                                                disabled={loading !== null}
                                                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                                                title="Cancel"
                                                                            >
                                                                                <X size={13} />
                                                                            </button>
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
                                                                                    disabled={loading !== null || isOffline}
                                                                                    onChange={async (e) => {
                                                                                        const newCat = e.target.value;
                                                                                        if (newCat !== "move") {
                                                                                            await handleMoveToolToPosition(price.tool_id, 'end', category, newCat);
                                                                                            setEditingPriceId(null);
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
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (hasUnsavedChanges()) {
                                                                                    alert('You have unsaved changes. Please save or cancel your edits first.');
                                                                                    return;
                                                                                }
                                                                                handleStartEditPriceRow(price);
                                                                            }}
                                                                            disabled={isOffline || editingPriceId !== null || editingCategory !== null}
                                                                            className="p-1 text-gray-500 hover:text-[#fcb7f0] dark:text-slate-400 dark:hover:text-[#fcb7f0] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                                                                            title="Edit tool prices"
                                                                        >
                                                                            <Edit size={13} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        </React.Fragment>
                                                );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            );
                        })
                    }

                    {priceSearch.trim() && Object.keys(categorizedPrices).filter(cat => selectedCategory === 'All' || cat === selectedCategory).every(cat => categorizedPrices[cat].length === 0) && (
                        <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                            No tools found matching search term "{priceSearch}"
                        </div>
                    )}
                </div>
            )}

            {/* Surgery Logic / Rule Management View */}
            {adminTab === 'logic' && (
                <div className="space-y-4">
                    <AdminFeatureToolbar
                        categories={['All', ...categories]}
                        selectedCategory={selectedLogicCategory}
                        onCategoryChange={category => {
                            if (editingPriceId !== null && hasPriceRowChanges(editingPriceId)) {
                                alert('You have unsaved changes. Please save or cancel your edits first.');
                                return;
                            }
                            setEditingPriceId(null);
                            setSelectedLogicCategory(category);
                        }}
                        search={logicSearch}
                        onSearchChange={setLogicSearch}
                        searchPlaceholder="Search operations, keys..."
                        addLabel="Add"
                        addOpen={showAddOpForm}
                        disabled={isOffline}
                        onAddToggle={() => {
                            if (editingPriceId !== null && hasPriceRowChanges(editingPriceId)) {
                                alert('You have unsaved changes. Please save or cancel your edits first.');
                                return;
                            }
                            setEditingPriceId(null);
                            if (showAddOpForm) handleCloseAddOpForm();
                            else setShowAddOpForm(true);
                        }}
                    />
                               {/* Add Operation Form Modal */}
                    {showAddOpForm && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
                            <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-xl border border-gray-150 dark:border-slate-800 p-5 sm:p-6 w-full max-w-xl animate-scaleUp overflow-y-auto max-h-[90vh]">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
                                    <h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                        <Plus size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
                                        Add Surgery Operation
                                    </h3>
                                    <button 
                                        type="button"
                                        onClick={handleCloseAddOpForm}
                                        className="text-gray-400 hover:text-gray-500 transition-colors p-1"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateOperation} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
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
                                            <div className="relative">
                                                <select
                                                    value={newOpCategory}
                                                    onChange={e => setNewOpCategory(e.target.value)}
                                                    className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                                >
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Trigger Keywords</label>
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            {newOpKeywords.map((kw, idx) => (
                                                <span 
                                                    key={idx} 
                                                    className="inline-flex items-center gap-1 bg-[#fcb7f0]/35 dark:bg-[#fcb7f0]/15 text-[#8e5a7d] dark:text-[#fcb7f0] border border-[#fcb7f0]/35 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                >
                                                    {kw}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveKeywordFromNewOp(idx)}
                                                        className="hover:bg-[#fcb7f0]/50 dark:hover:bg-[#fcb7f0]/30 rounded-full p-0.5 transition-all text-[#8e5a7d] dark:text-[#fcb7f0]"
                                                    >
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                </span>
                                            ))}
                                            
                                            {isAddingNewOpKeyword ? (
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={newOpKeywordInput}
                                                    onChange={e => setNewOpKeywordInput(e.target.value)}
                                                    onBlur={() => {
                                                        if (newOpKeywordInput.trim()) {
                                                            handleAddKeywordToNewOp(newOpKeywordInput);
                                                        }
                                                        setIsAddingNewOpKeyword(false);
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (newOpKeywordInput.trim()) {
                                                                handleAddKeywordToNewOp(newOpKeywordInput);
                                                            }
                                                            setIsAddingNewOpKeyword(false);
                                                        } else if (e.key === 'Escape') {
                                                            setIsAddingNewOpKeyword(false);
                                                            setNewOpKeywordInput('');
                                                        }
                                                    }}
                                                    placeholder="Keyword..."
                                                    className="bg-transparent border-b border-[#fcb7f0] px-1 py-0 text-[10px] font-bold outline-none text-[#8e5a7d] dark:text-[#fcb7f0] w-20 transition-all"
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingNewOpKeyword(true);
                                                        setNewOpKeywordInput('');
                                                    }}
                                                    className="inline-flex items-center gap-0.5 bg-white hover:bg-[#fcb7f0]/10 dark:bg-slate-900 dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                >
                                                    <Plus size={10} strokeWidth={3} /> Add
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-400 dark:text-slate-555 mt-1 block font-medium">Keywords are case-insensitive. Small keywords (≤2 characters) will match whole words only.</span>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={handleCloseAddOpForm}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                        >
                                            <Save size={14} />
                                            Save Operation
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Operations Accordion List */}
                    <div className="space-y-4">
                        {categories.map(category => {
                            if (selectedLogicCategory !== 'All' && category !== selectedLogicCategory) {
                                return null;
                            }
                            const operations = groupedOperations[category];
                            if (operations.length === 0) return null;

                            return (
                                <div key={category} className="space-y-2.5">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e5a7d] dark:text-pink-400/80 px-1 flex items-center gap-2 mt-4">
                                        <span className="w-1.5 h-3 bg-[#fcb7f0] rounded-full"></span>
                                        {(() => {
                                            if (category.toLowerCase().includes('surgery')) return category;
                                            if (category === 'Others') return 'Other Surgery';
                                            return `${category} Surgery`;
                                        })()}
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
                                                    <OperationHeader
                                                        operation={op}
                                                        ruleCount={opRules.length}
                                                        expanded={isExpanded}
                                                        disabled={isOffline}
                                                        onToggle={() => handleOpClick(op.id)}
                                                        onEdit={() => handleStartEditOp(op)}
                                                        onDelete={() => handleDeleteOperation(op.id)}
                                                    />

                                                    {/* Expanded Operation Body */}
                                                    {isExpanded && (
                                                        <div className="p-3 sm:p-4 border-t border-gray-50 dark:border-slate-800/80 bg-gray-50/30 dark:bg-slate-900/10 animate-slideDown">
                                                            <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm">
                                                                {/* Top Details Section */}
                                                                {isEditingDetails ? (
                                                                    <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-slate-800/80">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-extrabold text-[#8e5a7d] dark:text-[#fcb7f0] uppercase tracking-wider">
                                                                                Edit Operation Details & Triggers
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSaveOperationDetails(op.id)}
                                                                                    className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                                                                    title="Save all changes"
                                                                                >
                                                                                    <Save size={16} />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (hasOpEditChanges(op.id)) {
                                                                                            const confirmCancel = window.confirm('Are you sure you want to discard your unsaved changes?');
                                                                                            if (!confirmCancel) return;
                                                                                        }
                                                                                        setEditOpId(null);
                                                                                        setEditOpRules([]);
                                                                                    }}
                                                                                    className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
                                                                                    title="Cancel"
                                                                                >
                                                                                    <X size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            <div>
                                                                                <label className="text-[9px] font-bold text-gray-450 dark:text-slate-500 block mb-1">Name</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editOpName}
                                                                                    onChange={e => setEditOpName(e.target.value)}
                                                                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[9px] font-bold text-gray-455 dark:text-slate-500 block mb-1">Category</label>
                                                                                <div className="relative">
                                                                                    <select
                                                                                        value={editOpCategory}
                                                                                        onChange={e => setEditOpCategory(e.target.value)}
                                                                                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                                                                    >
                                                                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                                                    </select>
                                                                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[9px] font-bold text-gray-450 dark:text-slate-500 block mb-1">Trigger Keywords</label>
                                                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                                {editOpKeywords.map((kw, idx) => (
                                                                                    <span 
                                                                                        key={idx} 
                                                                                        className="inline-flex items-center gap-1 bg-[#fcb7f0]/35 dark:bg-[#fcb7f0]/15 text-[#8e5a7d] dark:text-[#fcb7f0] border border-[#fcb7f0]/35 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                                                    >
                                                                                        {kw}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRemoveKeywordFromEditOp(idx)}
                                                                                            className="hover:text-red-500 transition-colors"
                                                                                        >
                                                                                            <X size={10} />
                                                                                        </button>
                                                                                    </span>
                                                                                ))}
                                                                                {isAddingEditOpKeyword ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        autoFocus
                                                                                        value={editOpKeywordInput}
                                                                                        onChange={e => setEditOpKeywordInput(e.target.value)}
                                                                                        onKeyDown={e => {
                                                                                            if (e.key === 'Enter') {
                                                                                                e.preventDefault();
                                                                                                if (handleAddKeywordToEditOp(editOpKeywordInput, op.id)) {
                                                                                                    setIsAddingEditOpKeyword(false);
                                                                                                }
                                                                                            } else if (e.key === 'Escape') {
                                                                                                setIsAddingEditOpKeyword(false);
                                                                                                setEditOpKeywordInput('');
                                                                                            }
                                                                                        }}
                                                                                        onBlur={() => {
                                                                                            if (editOpKeywordInput.trim()) {
                                                                                                handleAddKeywordToEditOp(editOpKeywordInput, op.id);
                                                                                            }
                                                                                            setIsAddingEditOpKeyword(false);
                                                                                        }}
                                                                                        className="bg-white dark:bg-slate-900 border border-[#fcb7f0] text-xs font-semibold px-2 py-0.5 rounded-full outline-none w-24 text-gray-800 dark:text-slate-200"
                                                                                        placeholder="Keyword..."
                                                                                    />
                                                                                ) : (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setIsAddingEditOpKeyword(true);
                                                                                            setEditOpKeywordInput('');
                                                                                        }}
                                                                                        className="inline-flex items-center gap-0.5 bg-white hover:bg-[#fcb7f0]/10 dark:bg-slate-900 dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                                                    >
                                                                                        <Plus size={10} strokeWidth={3} /> Add
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <OperationSummary
                                                                        operation={op}
                                                                        disabled={isOffline}
                                                                        onEdit={() => handleStartEditOp(op)}
                                                                        onDelete={() => handleDeleteOperation(op.id)}
                                                                    />
                                                                )}

                                                                {/* Bottom Rules Columns */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                                                    {/* 1. Surgical Tools Column (Left) */}
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="flex items-center gap-1.5 mb-3 pb-1 border-b border-gray-100 dark:border-slate-800/80">
                                                                            <span className="w-1 h-2 bg-sky-400 dark:bg-sky-500 rounded-full"></span>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">Surgical Tools</span>
                                                                        </div>
                                                                        
                                                                        <div className="flex-1 space-y-2 mb-3">
                                                                            {!isEditingDetails ? (
                                                                                <OperationRuleSummary
                                                                                    rules={opRules}
                                                                                    targetType="tool"
                                                                                    tools={config.tools}
                                                                                    actions={config.actions}
                                                                                />
                                                                            ) : (
                                                                                <OperationRuleEditor
                                                                                    rules={editOpRules}
                                                                                    targetType="tool"
                                                                                    toolOptions={toolRuleOptions}
                                                                                    actionOptions={actionRuleOptions}
                                                                                    categories={CATEGORY_ORDER}
                                                                                    onChange={(index, changes) => setEditOpRules(prev => prev.map((rule, i) => i === index ? { ...rule, ...changes } : rule))}
                                                                                    onRemove={index => setEditOpRules(prev => prev.filter((_, i) => i !== index))}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {isEditingDetails && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={isOffline}
                                                                                onClick={() => {
                                                                                    setEditOpRules(prev => [...prev, { operation_id: op.id, target_type: 'tool', target_id: '', default_selected_value: null }]);
                                                                                }}
                                                                                className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-[#fcb7f0]/10 dark:bg-[#111827] dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-auto"
                                                                            >
                                                                                <Plus size={12} strokeWidth={3} className="text-[#8e5a7d] dark:text-[#fcb7f0]" /> Add Surgical Tool
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* 2. Pre-Op Actions Column (Right) */}
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="flex items-center gap-1.5 mb-3 pb-1 border-b border-gray-100 dark:border-slate-800/80">
                                                                            <span className="w-1 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full"></span>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Pre-Op Actions</span>
                                                                        </div>
                                                                        <div className="flex-1 space-y-2 mb-3">
                                                                            {!isEditingDetails ? (
                                                                                <OperationRuleSummary
                                                                                    rules={opRules}
                                                                                    targetType="action"
                                                                                    tools={config.tools}
                                                                                    actions={config.actions}
                                                                                />
                                                                            ) : (
                                                                                <OperationRuleEditor
                                                                                    rules={editOpRules}
                                                                                    targetType="action"
                                                                                    toolOptions={toolRuleOptions}
                                                                                    actionOptions={actionRuleOptions}
                                                                                    categories={CATEGORY_ORDER}
                                                                                    onChange={(index, changes) => setEditOpRules(prev => prev.map((rule, i) => i === index ? { ...rule, ...changes } : rule))}
                                                                                    onRemove={index => setEditOpRules(prev => prev.filter((_, i) => i !== index))}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {isEditingDetails && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={isOffline}
                                                                                onClick={() => {
                                                                                    setEditOpRules(prev => [...prev, { operation_id: op.id, target_type: 'action', target_id: '', default_selected_value: null }]);
                                                                                }}
                                                                                className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-[#fcb7f0]/10 dark:bg-[#111827] dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-auto"
                                                                            >
                                                                                <Plus size={12} strokeWidth={3} className="text-[#8e5a7d] dark:text-[#fcb7f0]" /> Add Pre-Op Action
                                                                            </button>
                                                                        )}
                                                                    </div>
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

                        {logicSearch.trim() && Object.keys(groupedOperations).filter(cat => selectedLogicCategory === 'All' || cat === selectedLogicCategory).every(cat => groupedOperations[cat].length === 0) && (
                            <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                                No surgery operations found matching search term "{logicSearch}"
                            </div>
                        )}
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
        </AdminShell>
    );
}
