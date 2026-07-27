import React, { useMemo, useState } from 'react';
import { DBPrice, DBTool } from '../../../configService';
import { addSubtypeToTool, createToolWithPrices, deleteTool, deleteSubtypeAndUpdateTool, updatePrice, updateTool, updateToolPlacement, updateToolPrices } from '../../../adminService';
import { getToolDisplayName } from '../adminCatalog';
import { filterAndSortPrices, getPriceDisplayName, groupPricesByCategory } from '../adminSelectors';
import { NewSubtype, PricesViewActions, PricesViewState } from '../AdminPricesPage';

type ToolType = 'checkbox' | 'radio' | 'number-input';
type PriceConfig = { tools: DBTool[]; prices: DBPrice[] };

interface UseAdminPricesArgs {
    config: PriceConfig;
    onRefresh: () => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    setLoading: (value: string | null) => void;
}

export function useAdminPrices({ config, onRefresh, showToast, setLoading }: UseAdminPricesArgs) {
    const [priceSearch, setPriceSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editPricesData, setEditPricesData] = useState<Record<string, { displayName: string; csmbs: number; sss: number; ucs: number }>>({});
    const [editToolNames, setEditToolNames] = useState<Record<string, string>>({});
    const [showAddToolForm, setShowAddToolForm] = useState(false);
    const [newToolId, setNewToolId] = useState('');
    const [newToolDisplayName, setNewToolDisplayName] = useState('');
    const [newToolCategory, setNewToolCategory] = useState('Generals');
    const [newToolCsmbs, setNewToolCsmbs] = useState(0);
    const [newToolSss, setNewToolSss] = useState(0);
    const [newToolUcs, setNewToolUcs] = useState(0);
    const [newToolType, setNewToolType] = useState<ToolType>('checkbox');
    const [newToolSubtypes, setNewToolSubtypes] = useState<NewSubtype[]>([{ subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }]);
    const [activeAddSubtypeTool, setActiveAddSubtypeTool] = useState<DBTool | null>(null);
    const [newSubtypeKey, setNewSubtypeKey] = useState('');
    const [newSubtypeDisplayName, setNewSubtypeDisplayName] = useState('');
    const [newSubtypeCsmbs, setNewSubtypeCsmbs] = useState(0);
    const [newSubtypeSss, setNewSubtypeSss] = useState(0);
    const [newSubtypeUcs, setNewSubtypeUcs] = useState(0);
    const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
    const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
    const [dragOverToolId, setDragOverToolId] = useState<string | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

    const filteredPrices = useMemo(() => filterAndSortPrices(config.prices, config.tools, priceSearch), [config.prices, config.tools, priceSearch]);
    const categorizedPrices = useMemo(() => groupPricesByCategory(filteredPrices, config.tools), [filteredPrices, config.tools]);

    const hasCategoryChanges = (category: string) => {
        const toolIds = new Set((categorizedPrices[category] || []).map(price => price.tool_id));
        return (categorizedPrices[category] || []).some(price => hasPriceRowChanges(price.id)) || [...toolIds].some(toolId => {
            const tool = config.tools.find(item => item.id === toolId);
            return tool && editToolNames[toolId] !== undefined && editToolNames[toolId] !== tool.item;
        });
    };
    const hasPriceRowChanges = (priceId: string) => {
        const original = config.prices.find(price => price.id === priceId);
        const current = editPricesData[priceId];
        if (!original || !current) return false;
        const tool = config.tools.find(item => item.id === original.tool_id);
        const originalName = original.display_name || getToolDisplayName(original.tool_id, tool ? tool.item : original.tool_id, original.sub_key);
        return current.displayName !== originalName || current.csmbs !== original.csmbs_price || current.sss !== original.sss_price || current.ucs !== original.ucs_price;
    };
    const hasUnsavedChanges = () => editingCategory ? hasCategoryChanges(editingCategory) : editingPriceId ? hasPriceRowChanges(editingPriceId) : false;

    const handleStartEditCategory = (category: string) => {
        setEditingCategory(category); setEditingPriceId(null);
        setEditToolNames(prev => {
            const next = { ...prev };
            (categorizedPrices[category] || []).forEach(price => {
                const tool = config.tools.find(item => item.id === price.tool_id);
                if (tool) next[price.tool_id] = tool.item;
            });
            return next;
        });
        const initialData: Record<string, { displayName: string; csmbs: number; sss: number; ucs: number }> = {};
        (categorizedPrices[category] || []).forEach(price => {
            const tool = config.tools.find(item => item.id === price.tool_id);
            initialData[price.id] = { displayName: getPriceDisplayName(price, tool), csmbs: price.csmbs_price, sss: price.sss_price, ucs: price.ucs_price };
        });
        setEditPricesData(initialData);
    };

    const handleSaveCategoryPrices = async (category: string) => {
        const items = categorizedPrices[category] || [];
        for (const item of items) {
            const data = editPricesData[item.id];
            if (!data) continue;
            if (data.csmbs < 0 || data.sss < 0 || data.ucs < 0) { showToast('Prices must be non-negative numbers', 'error'); return; }
            if (!data.displayName.trim()) { showToast('Tool name is required', 'error'); return; }
        }
        setLoading('Saving category prices...');
        try {
            await updateToolPrices(items.map(item => { const data = editPricesData[item.id]; return data ? { id: item.id, csmbs_price: Number(data.csmbs), sss_price: Number(data.sss), ucs_price: Number(data.ucs), display_name: data.displayName.trim() } : null; }).filter((item): item is NonNullable<typeof item> => item !== null));
            const toolIds = Array.from(new Set<string>(items.map(item => String(item.tool_id))));
            await Promise.all(toolIds.flatMap(toolId => {
                const name = editToolNames[toolId]?.trim();
                const original = config.tools.find(tool => tool.id === toolId)?.item;
                return name && name !== original ? [updateTool(toolId, { item: name })] : [];
            }));
            showToast(`All prices in "${category}" updated successfully`, 'success'); setEditingCategory(null); await onRefresh();
        } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error updating details', 'error'); } finally { setLoading(null); }
    };

    const handleStartEditPriceRow = (price: DBPrice) => {
        setEditingPriceId(price.id); setEditingCategory(null);
        const tool = config.tools.find(item => item.id === price.tool_id);
        setEditPricesData(prev => ({ ...prev, [price.id]: { displayName: price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key), csmbs: price.csmbs_price, sss: price.sss_price, ucs: price.ucs_price } }));
    };
    const handleSavePriceRow = async (priceId: string) => {
        const data = editPricesData[priceId]; if (!data) { setEditingPriceId(null); return; }
        if (data.csmbs < 0 || data.sss < 0 || data.ucs < 0) { showToast('Prices must be non-negative numbers', 'error'); return; }
        if (!data.displayName.trim()) { showToast('Tool name is required', 'error'); return; }
        setLoading('Saving tool prices...');
        try { await updatePrice({ id: priceId, csmbs_price: Number(data.csmbs), sss_price: Number(data.sss), ucs_price: Number(data.ucs), display_name: data.displayName.trim() }); showToast('Tool prices updated successfully', 'success'); setEditingPriceId(null); await onRefresh(); }
        catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error updating details', 'error'); } finally { setLoading(null); }
    };
    const handleUpdateEditField = (
        priceId: string,
        field: string,
        value: unknown,
        price: DBPrice,
        tool: DBTool | undefined,
    ) => {
        setEditPricesData(prev => {
            const current = prev[priceId] || {
                displayName: price.display_name || getToolDisplayName(
                    price.tool_id,
                    tool ? tool.item : price.tool_id,
                    price.sub_key,
                ),
                csmbs: price.csmbs_price,
                sss: price.sss_price,
                ucs: price.ucs_price,
            };

            return {
                ...prev,
                [priceId]: { ...current, [field]: value },
            };
        });
    };
    const handleUpdateToolName = (toolId: string, value: string) => setEditToolNames(prev => ({ ...prev, [toolId]: value }));
    const handleDisplayNameChange = (value: string) => { setNewToolDisplayName(value); setNewToolId(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')); };
    const handleAddSubtypeRow = () => setNewToolSubtypes(prev => [...prev, { subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }]);
    const handleRemoveSubtypeRow = (index: number) => setNewToolSubtypes(prev => prev.filter((_, i) => i !== index));
    const handleUpdateSubtypeRow = (
        index: number,
        field: keyof NewSubtype,
        value: string | number,
    ) => {
        setNewToolSubtypes(prev => prev.map((row, rowIndex) => {
            if (rowIndex !== index) return row;

            const generatedSubKey = field === 'displayName' && !row.subKey
                ? String(value)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '')
                : undefined;

            return {
                ...row,
                [field]: value,
                ...(generatedSubKey !== undefined ? { subKey: generatedSubKey } : {}),
            };
        }));
    };
    const resetAddToolForm = () => {
        setShowAddToolForm(false); setNewToolDisplayName(''); setNewToolId(''); setNewToolCategory('Generals'); setNewToolCsmbs(0); setNewToolSss(0); setNewToolUcs(0); setNewToolType('checkbox'); setNewToolSubtypes([{ subKey: '', displayName: '', csmbs: 0, sss: 0, ucs: 0 }]);
    };
    const handleCloseAddToolForm = () => {
        const hasInputs = newToolDisplayName.trim() || newToolId.trim() || newToolCsmbs > 0 || newToolSss > 0 || newToolUcs > 0 || newToolSubtypes.some(row => row.displayName.trim() || row.subKey.trim() || row.csmbs > 0 || row.sss > 0 || row.ucs > 0);
        if (hasInputs && !window.confirm('You have unsaved changes in the Add Tool form. Are you sure you want to discard them?')) return;
        resetAddToolForm();
    };

    const handleAddToolSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); const tid = newToolId.trim(); const displayName = newToolDisplayName.trim();
        if (!tid) { showToast('Tool ID is required', 'error'); return; } if (!displayName) { showToast('Display name is required', 'error'); return; }
        if (newToolType === 'radio') {
            if (!newToolSubtypes.length) { showToast('Please add at least one subtype option', 'error'); return; }
            const subtypeKeys = new Set<string>();
            for (const [index, subtype] of newToolSubtypes.entries()) {
                const subtypeKey = subtype.subKey.trim().toLowerCase();
                if (!subtypeKey || !subtype.displayName.trim()) { showToast(`Subtype ${index + 1}: enter both a Key ID and Name.`, 'error'); return; }
                if (subtypeKeys.has(subtypeKey)) { showToast(`Duplicate subtype key "${subtypeKey}" at row ${index + 1}. Each subtype must have a unique Key ID.`, 'error'); return; }
                subtypeKeys.add(subtypeKey);
                if (subtype.csmbs < 0 || subtype.sss < 0 || subtype.ucs < 0) { showToast(`Subtype "${subtype.displayName}" prices must be non-negative`, 'error'); return; }
            }
        } else if (newToolCsmbs < 0 || newToolSss < 0 || newToolUcs < 0) { showToast('Prices must be non-negative', 'error'); return; }
        if (config.tools.some(tool => tool.id === tid)) { showToast(`Tool with ID "${tid}" already exists`, 'error'); return; }
        setLoading('Adding new tool...');
        try {
            const options = newToolType === 'radio' ? newToolSubtypes.map(row => ({ label: row.displayName.trim(), value: row.subKey.trim() })) : null;
            const prices: import('../../../adminService').PriceInsert[] = newToolType === 'radio'
                ? newToolSubtypes.map(row => ({ tool_id: tid, sub_key: row.subKey.trim(), csmbs_price: Number(row.csmbs), sss_price: Number(row.sss), ucs_price: Number(row.ucs), display_name: row.displayName.trim() }))
                : [{ tool_id: tid, sub_key: null, csmbs_price: Number(newToolCsmbs), sss_price: Number(newToolSss), ucs_price: Number(newToolUcs), display_name: displayName }];
            const result = await createToolWithPrices({ id: tid, item: displayName, type: newToolType, category: newToolCategory, is_active: true, sort_order: 999, options, default_value: options?.[0]?.value || null }, prices);
            if (!result.categorySupported) showToast('Tool added to database! Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'error');
            if (!result.displayNameSupported) showToast('Tool added, but display name not saved in pricing. Run SQL: ALTER TABLE tool_prices ADD COLUMN display_name VARCHAR;', 'error');
            showToast('New tool added successfully', 'success'); resetAddToolForm(); await onRefresh();
        } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error adding new tool', 'error'); } finally { setLoading(null); }
    };
    const handleDeleteTool = async (toolId: string) => { if (!window.confirm(`Are you sure you want to delete the tool "${toolId}"? This will delete all its prices and surgery rules.`)) return; setLoading('Deleting tool...'); try { await deleteTool(toolId); showToast(`Tool "${toolId}" deleted successfully`, 'success'); await onRefresh(); } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error deleting tool', 'error'); } finally { setLoading(null); } };
    const handleDeleteSubtype = async (price: DBPrice) => {
        const toolPrices = config.prices.filter(item => item.tool_id === price.tool_id);
        const isLastSubtype = toolPrices.length <= 1;
        const confirmMessage = isLastSubtype
            ? `This is the last subtype of "${price.tool_id}". Delete the entire tool group?`
            : `Are you sure you want to delete the subtype "${price.sub_key}" of tool "${price.tool_id}"? This will delete this specific subtype price.`;
        if (!window.confirm(confirmMessage)) return;
        setLoading(isLastSubtype ? 'Deleting tool group...' : 'Deleting subtype...');
        try {
            if (isLastSubtype) {
                await deleteTool(price.tool_id);
                showToast(`Tool group "${price.tool_id}" deleted successfully`, 'success');
            } else {
                const tool = config.tools.find(item => item.id === price.tool_id);
                const options = (Array.isArray(tool?.options) ? tool.options : []).filter(option => option.value !== price.sub_key);
                await deleteSubtypeAndUpdateTool(price.id, price.tool_id, options.length ? options : null, options.length ? tool?.type || 'checkbox' : 'checkbox', tool?.default_value === price.sub_key ? options[0]?.value || null : tool?.default_value || null);
                showToast(`Subtype "${price.sub_key}" deleted successfully`, 'success');
            }
            await onRefresh();
        } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error deleting subtype', 'error'); } finally { setLoading(null); }
    };
    const handleAddSubtypeSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!activeAddSubtypeTool) return;

        const subKey = newSubtypeKey
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '');
        const displayName = newSubtypeDisplayName.trim();

        if (!subKey || !displayName) {
            showToast('Please fill out all required subtype fields.', 'error');
            return;
        }

        const subtypeExists = config.prices.some(
            price => price.tool_id === activeAddSubtypeTool.id && price.sub_key === subKey,
        );
        if (subtypeExists) {
            showToast(`Subtype key "${subKey}" already exists for this tool`, 'error');
            return;
        }

        setLoading('Adding subtype...');
        try {
            const existingOptions = Array.isArray(activeAddSubtypeTool.options)
                ? activeAddSubtypeTool.options
                : [];
            const options = [
                ...existingOptions,
                { label: displayName, value: subKey },
            ];

            await addSubtypeToTool(
                activeAddSubtypeTool.id,
                options,
                {
                    tool_id: activeAddSubtypeTool.id,
                    sub_key: subKey,
                    csmbs_price: Number(newSubtypeCsmbs),
                    sss_price: Number(newSubtypeSss),
                    ucs_price: Number(newSubtypeUcs),
                    display_name: displayName,
                },
            );
            showToast(`Subtype "${displayName}" added successfully`, 'success');
            setActiveAddSubtypeTool(null);
            setNewSubtypeKey('');
            setNewSubtypeDisplayName('');
            setNewSubtypeCsmbs(0);
            setNewSubtypeSss(0);
            setNewSubtypeUcs(0);
            await onRefresh();
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Error adding subtype', 'error');
        } finally {
            setLoading(null);
        }
    };
    const handleMoveToolToPosition = async (draggedId: string, targetId: string, sourceCategory: string, targetCategory: string) => { setLoading('Moving tool...'); try { const ids = (categorizedPrices[targetCategory] || []).reduce<string[]>((all, item) => all.includes(item.tool_id) ? all : [...all, item.tool_id], []); const reordered = [...ids.filter(id => id !== draggedId)]; const targetIndex = targetId === 'end' ? reordered.length : reordered.indexOf(targetId); reordered.splice(targetIndex < 0 ? reordered.length : targetIndex, 0, draggedId); const result = await updateToolPlacement(draggedId, sourceCategory === targetCategory ? null : targetCategory, reordered.map((id, index) => ({ id, sort_order: (index + 1) * 10 }))); if (!result.categorySupported) { showToast('Run SQL to enable category changes: ALTER TABLE tools ADD COLUMN category VARCHAR;', 'error'); return; } showToast(sourceCategory === targetCategory ? 'Tool order updated successfully' : `Tool moved to ${targetCategory} successfully`, 'success'); await onRefresh(); } catch (error: any) { showToast(error?.message?.includes('column "sort_order"') || error?.code === '42703' ? 'Enable ordering by running SQL: ALTER TABLE tools ADD COLUMN sort_order INT DEFAULT 0;' : error?.message || 'Error updating order', 'error'); } finally { setLoading(null); } };

    const state: PricesViewState = { priceSearch, selectedCategory, editingCategory, editingPriceId, editPricesData, editToolNames, showAddToolForm, newToolId, newToolDisplayName, newToolCategory, newToolCsmbs, newToolSss, newToolUcs, newToolType, newToolSubtypes, activeAddSubtypeTool, newSubtypeKey, newSubtypeDisplayName, newSubtypeCsmbs, newSubtypeSss, newSubtypeUcs, draggedToolId, draggedCategory, dragOverToolId, dragOverCategory };
    const actions: PricesViewActions = { setPriceSearch, setSelectedCategory, setEditingCategory, setEditingPriceId, setShowAddToolForm, setNewToolId, setNewToolDisplayName, setNewToolCategory, setNewToolCsmbs, setNewToolSss, setNewToolUcs, setNewToolType, setNewSubtypeKey, setNewSubtypeDisplayName, setNewSubtypeCsmbs, setNewSubtypeSss, setNewSubtypeUcs, setActiveAddSubtypeTool, setDraggedToolId, setDraggedCategory, setDragOverToolId, setDragOverCategory, handleCloseAddToolForm, handleDisplayNameChange, handleAddSubtypeRow, handleUpdateSubtypeRow, handleRemoveSubtypeRow, handleAddToolSubmit, handleSaveCategoryPrices, handleSavePriceRow, handleUpdateEditField, handleUpdateToolName, handleStartEditCategory, handleStartEditPriceRow, handleDeleteTool, handleDeleteSubtype, handleAddSubtypeSubmit, handleMoveToolToPosition, hasUnsavedChanges, hasCategoryChanges, hasPriceRowChanges };
    return { state, actions, categorizedPrices, hasUnsavedChanges };
}
