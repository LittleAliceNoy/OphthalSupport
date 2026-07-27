import React, { useMemo, useState } from 'react';
import { DBAction, DBOperation, DBRule, DBTool } from '../../../configService';
import { createOperation, deleteOperation, updateOperationPlacement, updateOperationWithRules } from '../../../adminService';
import { CATEGORY_ORDER } from '../adminCatalog';
import { getOperationCategory, OPERATION_CATEGORY_ORDER } from '../../../toolCatalog';
import { filterOperations, groupOperations } from '../adminSelectors';
import { EditableOperationRule } from '../OperationRuleEditor';
import { LogicViewActions, LogicViewState } from '../AdminOperationsPage';

type OperationConfig = { tools: DBTool[]; actions: DBAction[]; operations: DBOperation[]; rules: DBRule[] };
const categories = OPERATION_CATEGORY_ORDER;

interface UseAdminOperationsArgs { config: OperationConfig; onRefresh: () => Promise<void>; showToast: (message: string, type: 'success' | 'error') => void; setLoading: (value: string | null) => void; }

export function useAdminOperations({ config, onRefresh, showToast, setLoading }: UseAdminOperationsArgs) {
    const [logicSearch, setLogicSearch] = useState('');
    const [selectedLogicCategory, setSelectedLogicCategory] = useState('All');
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [showAddOpForm, setShowAddOpForm] = useState(false);
    const [newOpName, setNewOpName] = useState('');
    const [newOpCategory, setNewOpCategory] = useState('Lens Surgery');
    const [newOpKeywords, setNewOpKeywords] = useState<string[]>([]);
    const [newOpKeywordInput, setNewOpKeywordInput] = useState('');
    const [isAddingNewOpKeyword, setIsAddingNewOpKeyword] = useState(false);
    const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
    const [editOpId, setEditOpId] = useState<string | null>(null);
    const [editOpName, setEditOpName] = useState('');
    const [editOpCategory, setEditOpCategory] = useState('');
    const [editOpKeywords, setEditOpKeywords] = useState<string[]>([]);
    const [editOpKeywordInput, setEditOpKeywordInput] = useState('');
    const [isAddingEditOpKeyword, setIsAddingEditOpKeyword] = useState(false);
    const [editOpRules, setEditOpRules] = useState<EditableOperationRule[]>([]);
    const [draggedOperationId, setDraggedOperationId] = useState<string | null>(null);
    const [draggedOperationCategory, setDraggedOperationCategory] = useState<string | null>(null);
    const [dragOverOperationId, setDragOverOperationId] = useState<string | null>(null);

    const filteredOperations = useMemo(() => filterOperations(config.operations, logicSearch), [config.operations, logicSearch]);
    const groupedOperations = useMemo(() => {
        const groups = groupOperations(filteredOperations, categories);
        Object.values(groups).forEach(group => group.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
        return groups;
    }, [filteredOperations]);
    const toolRuleOptions = useMemo(() => [...config.tools].sort((a, b) => { const catA = CATEGORY_ORDER.indexOf(a.category || 'Generals'); const catB = CATEGORY_ORDER.indexOf(b.category || 'Generals'); if ((catA < 0 ? 999 : catA) !== (catB < 0 ? 999 : catB)) return (catA < 0 ? 999 : catA) - (catB < 0 ? 999 : catB); return (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.item.localeCompare(b.item); }).filter(tool => tool.id.toLowerCase() !== 'mm' && tool.item.trim().toLowerCase() !== 'mm').map(tool => ({ id: tool.id, name: tool.item, options: tool.options, category: tool.category || 'Generals' })), [config.tools]);
    const actionRuleOptions = useMemo(() => config.actions.map(action => ({ id: action.id, name: action.item })), [config.actions]);

    const handleCloseAddOpForm = () => { if ((newOpName.trim() || newOpKeywords.length || newOpKeywordInput.trim()) && !window.confirm('You have unsaved changes in the Add Surgery Operation form. Are you sure you want to discard them?')) return; setShowAddOpForm(false); setNewOpName(''); setNewOpKeywords([]); setNewOpKeywordInput(''); setIsAddingNewOpKeyword(false); setNewOpCategory('Lens Surgery'); };
    const findDuplicateKeyword = (keyword: string, operationId?: string) => config.operations.find(operation => operation.id !== operationId && operation.keywords.some(item => item.toLowerCase() === keyword.toLowerCase()));
    const handleAddKeywordToNewOp = (keyword: string) => { const trimmed = keyword.trim(); if (!trimmed) return false; if (newOpKeywords.some(item => item.toLowerCase() === trimmed.toLowerCase())) { showToast(`Duplicate keyword: "${trimmed}" is already added.`, 'error'); return false; } const matched = findDuplicateKeyword(trimmed); if (matched) { showToast(`Duplicate keyword: "${trimmed}" is already defined in operation "${matched.name}".`, 'error'); return false; } setNewOpKeywords(prev => [...prev, trimmed]); setNewOpKeywordInput(''); return true; };
    const handleRemoveKeywordFromNewOp = (index: number) => setNewOpKeywords(prev => prev.filter((_, i) => i !== index));
    const handleAddKeywordToEditOp = (keyword: string, operationId: string) => { const trimmed = keyword.trim(); if (!trimmed) return false; if (editOpKeywords.some(item => item.toLowerCase() === trimmed.toLowerCase())) { showToast(`Duplicate keyword: "${trimmed}" is already added.`, 'error'); return false; } const matched = findDuplicateKeyword(trimmed, operationId); if (matched) { showToast(`Duplicate keyword: "${trimmed}" is already defined in operation "${matched.name}".`, 'error'); return false; } setEditOpKeywords(prev => [...prev, trimmed]); setEditOpKeywordInput(''); return true; };
    const handleRemoveKeywordFromEditOp = (index: number) => setEditOpKeywords(prev => prev.filter((_, i) => i !== index));
    const handleCreateOperation = async (event: React.FormEvent) => { event.preventDefault(); if (!newOpName.trim()) { showToast('Operation name is required', 'error'); return; } let keywords = [...newOpKeywords]; if (newOpKeywordInput.trim()) { if (!handleAddKeywordToNewOp(newOpKeywordInput)) return; keywords = [...newOpKeywords, newOpKeywordInput.trim()]; } setLoading('Creating operation...'); try { await createOperation({ name: newOpName.trim(), category: newOpCategory, keywords }); showToast('Operation created successfully', 'success'); setNewOpName(''); setNewOpKeywords([]); setNewOpKeywordInput(''); setShowAddOpForm(false); await onRefresh(); } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error creating operation', 'error'); } finally { setLoading(null); } };
    const handleStartEditOp = (operation: DBOperation) => { setEditOpId(operation.id); setEditOpName(operation.name); setEditOpCategory(operation.category); setEditOpKeywords([...operation.keywords]); setEditOpKeywordInput(''); setEditOpRules(config.rules.filter(rule => rule.operation_id === operation.id).map(rule => ({ id: rule.id, operation_id: rule.operation_id, target_type: rule.target_type, target_id: rule.target_id, default_selected_value: rule.default_selected_value || null }))); };
    const hasOpEditChanges = (operationId: string) => { if (editOpId !== operationId) return false; const operation = config.operations.find(item => item.id === operationId); if (!operation) return false; if (editOpName.trim() !== operation.name || editOpCategory !== operation.category || editOpKeywords.join(', ') !== operation.keywords.join(', ')) return true; const dbRules = config.rules.filter(rule => rule.operation_id === operationId); const validRules = editOpRules.filter(rule => rule.target_id.trim()); return validRules.length !== dbRules.length || validRules.some((rule, index) => { const original = dbRules[index]; return !original || rule.id !== original.id || rule.target_type !== original.target_type || rule.target_id !== original.target_id || (rule.default_selected_value || null) !== (original.default_selected_value || null); }); };
    const handleSaveOperationDetails = async (operationId: string) => { if (!editOpName.trim()) { showToast('Operation name is required', 'error'); return; } let keywords = [...editOpKeywords]; if (editOpKeywordInput.trim()) { if (!handleAddKeywordToEditOp(editOpKeywordInput, operationId)) return; keywords = [...editOpKeywords, editOpKeywordInput.trim()]; } const validRules = editOpRules.filter(rule => rule.target_id.trim()); const seen = new Set<string>(); for (const rule of validRules) { const key = `${rule.target_type}:${rule.target_id}`; if (seen.has(key)) { const name = rule.target_type === 'tool' ? config.tools.find(tool => tool.id === rule.target_id)?.item : config.actions.find(action => action.id === rule.target_id)?.item; showToast(`${rule.target_type === 'tool' ? 'Surgical tool' : 'Pre-Op action'} "${name || rule.target_id}" is selected more than once.`, 'error'); return; } seen.add(key); } setLoading('Saving operation details...'); try { const dbRules = config.rules.filter(rule => rule.operation_id === operationId); const idsToDelete = dbRules.map(rule => rule.id).filter(id => !validRules.some(rule => rule.id === id)); const newRules = validRules.filter(rule => !rule.id).map(rule => ({ operation_id: operationId, target_type: rule.target_type, target_id: rule.target_id, default_selected_value: rule.default_selected_value?.trim() || null })); const updates = validRules.filter(rule => rule.id).flatMap(rule => { const original = dbRules.find(item => item.id === rule.id); return original && (original.target_id !== rule.target_id || (original.default_selected_value || null) !== (rule.default_selected_value || null)) ? [{ id: rule.id as string, target_id: rule.target_id, default_selected_value: rule.default_selected_value?.trim() || null }] : []; }); await updateOperationWithRules({ id: operationId, name: editOpName.trim(), category: editOpCategory, keywords }, idsToDelete, newRules, updates); showToast('Operation updated successfully', 'success'); setEditOpId(null); setEditOpRules([]); await onRefresh(); } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error updating operation', 'error'); } finally { setLoading(null); } };
    const handleDeleteOperation = async (operationId: string) => { if (!window.confirm('Are you sure you want to delete this operation? This will also delete all associated rules.')) return; setLoading('Deleting operation...'); try { await deleteOperation(operationId); showToast('Operation and its rules deleted successfully', 'success'); setExpandedOpId(null); await onRefresh(); } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error deleting operation', 'error'); } finally { setLoading(null); } };
    const handleOpClick = (operationId: string) => { if (editOpId && hasOpEditChanges(editOpId) && !window.confirm('You have unsaved operation changes. Do you want to discard them?')) return; if (editOpId) { setEditOpId(null); setEditOpRules([]); } setExpandedOpId(expandedOpId === operationId ? null : operationId); };
    const handleMoveOperation = async (draggedId: string, targetId: string, sourceCategory: string, targetCategory: string) => {
        setLoading('Moving operation...');
        try {
            const targetOperations = groupedOperations[targetCategory] || [];
            const orderedIds = targetOperations.map(operation => operation.id).filter(id => id !== draggedId);
            const targetIndex = orderedIds.indexOf(targetId);
            orderedIds.splice(targetIndex < 0 ? orderedIds.length : targetIndex, 0, draggedId);
            await updateOperationPlacement(draggedId, sourceCategory === targetCategory ? null : targetCategory, orderedIds.map((id, index) => ({ id, sort_order: (index + 1) * 10 })));
            showToast(targetCategory === sourceCategory ? 'Operation order updated successfully' : `Operation moved to ${targetCategory} successfully`, 'success');
            await onRefresh();
        } catch (error: unknown) { showToast(error instanceof Error ? error.message : 'Error updating operation order', 'error'); } finally { setLoading(null); }
    };

    const state: LogicViewState = { logicSearch, selectedLogicCategory, selectedCategory: 'All', editingPriceId, showAddOpForm, newOpName, newOpCategory, newOpKeywords, newOpKeywordInput, isAddingNewOpKeyword, expandedOpId, editOpId, editOpName, editOpCategory, editOpKeywords, editOpKeywordInput, isAddingEditOpKeyword, editOpRules, draggedOperationId, draggedOperationCategory, dragOverOperationId };
    const actions: LogicViewActions = { setLogicSearch, setSelectedLogicCategory, setEditingPriceId, setShowAddOpForm, setNewOpName, setNewOpCategory, setNewOpKeywords, setNewOpKeywordInput, setIsAddingNewOpKeyword, setEditOpId, setEditOpName, setEditOpCategory, setEditOpKeywords, setEditOpKeywordInput, setIsAddingEditOpKeyword, setEditOpRules, setDraggedOperationId, setDraggedOperationCategory, setDragOverOperationId, handleCloseAddOpForm, handleAddKeywordToNewOp, handleRemoveKeywordFromNewOp, handleCreateOperation, handleAddKeywordToEditOp, handleRemoveKeywordFromEditOp, handleStartEditOp, handleSaveOperationDetails, handleDeleteOperation, handleOpClick, handleMoveOperation, hasOpEditChanges, hasPriceRowChanges: () => false };
    return { state, actions, categories, groupedOperations, toolRuleOptions, actionRuleOptions, hasUnsavedChanges: () => !!(editOpId && hasOpEditChanges(editOpId)) };
}
