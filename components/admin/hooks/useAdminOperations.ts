import React, { useMemo, useState } from 'react';
import { DBAction, DBOperation, DBRule, DBTool } from '../../../configService';
import {
    createOperation,
    deleteOperation,
    updateOperationPlacement,
    updateOperationWithRules,
} from '../../../adminService';
import { filterOperations, groupOperations } from '../adminSelectors';
import { EditableOperationRule } from '../OperationRuleEditor';
import {
    buildOrderedIds,
    buildRuleChanges,
    findDuplicateRuleName,
    findKeywordConflict,
    getToolRuleOptions,
    isOperationEditDirty,
} from '../operationEditorUtils';
import { LogicViewActions, LogicViewState } from '../AdminOperationsPage';
import { OPERATION_CATEGORY_ORDER } from '../../../toolCatalog';

type OperationConfig = {
    tools: DBTool[];
    actions: DBAction[];
    operations: DBOperation[];
    rules: DBRule[];
};

interface UseAdminOperationsArgs {
    config: OperationConfig;
    onRefresh: () => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    setLoading: (value: string | null) => void;
}

const categories = OPERATION_CATEGORY_ORDER;

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

    const filteredOperations = useMemo(
        () => filterOperations(config.operations, logicSearch),
        [config.operations, logicSearch],
    );
    const groupedOperations = useMemo(() => {
        const groups = groupOperations(filteredOperations, categories);
        Object.values(groups).forEach(group => group.sort(
            (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
        ));
        return groups;
    }, [filteredOperations]);
    const toolRuleOptions = useMemo(() => getToolRuleOptions(config.tools), [config.tools]);
    const actionRuleOptions = useMemo(
        () => config.actions.map(action => ({ id: action.id, name: action.item })),
        [config.actions],
    );

    const resetAddOperationForm = () => {
        setShowAddOpForm(false);
        setNewOpName('');
        setNewOpCategory('Lens Surgery');
        setNewOpKeywords([]);
        setNewOpKeywordInput('');
        setIsAddingNewOpKeyword(false);
    };

    const handleCloseAddOpForm = () => {
        const hasChanges = Boolean(newOpName.trim() || newOpKeywords.length || newOpKeywordInput.trim());
        if (hasChanges && !window.confirm('You have unsaved changes in the Add Surgery Operation form. Are you sure you want to discard them?')) return;
        resetAddOperationForm();
    };

    const addKeyword = (keyword: string, keywords: string[], operationId?: string): string | null => {
        const trimmed = keyword.trim();
        if (!trimmed) return null;
        if (keywords.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
            showToast(`Duplicate keyword: "${trimmed}" is already added.`, 'error');
            return null;
        }
        const matched = findKeywordConflict(config.operations, trimmed, operationId);
        if (matched) {
            showToast(`Duplicate keyword: "${trimmed}" is already defined in operation "${matched.name}".`, 'error');
            return null;
        }
        return trimmed;
    };

    const handleAddKeywordToNewOp = (keyword: string) => {
        const added = addKeyword(keyword, newOpKeywords);
        if (!added) return false;
        setNewOpKeywords(previous => [...previous, added]);
        setNewOpKeywordInput('');
        return true;
    };

    const handleAddKeywordToEditOp = (keyword: string, operationId: string) => {
        const added = addKeyword(keyword, editOpKeywords, operationId);
        if (!added) return false;
        setEditOpKeywords(previous => [...previous, added]);
        setEditOpKeywordInput('');
        return true;
    };

    const handleCreateOperation = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newOpName.trim()) return showToast('Operation name is required', 'error');

        const pendingKeyword = newOpKeywordInput.trim();
        const addedKeyword = pendingKeyword ? addKeyword(pendingKeyword, newOpKeywords) : null;
        if (pendingKeyword && !addedKeyword) return;
        const keywords = addedKeyword ? [...newOpKeywords, addedKeyword] : newOpKeywords;

        setLoading('Creating operation...');
        try {
            await createOperation({ name: newOpName.trim(), category: newOpCategory, keywords });
            showToast('Operation created successfully', 'success');
            resetAddOperationForm();
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error creating operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleStartEditOp = (operation: DBOperation) => {
        setEditOpId(operation.id);
        setEditOpName(operation.name);
        setEditOpCategory(operation.category);
        setEditOpKeywords([...operation.keywords]);
        setEditOpKeywordInput('');
        setEditOpRules(config.rules
            .filter(rule => rule.operation_id === operation.id)
            .map(rule => ({ ...rule, default_selected_value: rule.default_selected_value || null })));
    };

    const hasOpEditChanges = (operationId: string) => isOperationEditDirty(
        config.operations.find(operation => operation.id === operationId),
        config.rules.filter(rule => rule.operation_id === operationId),
        { name: editOpName, category: editOpCategory, keywords: editOpKeywords, rules: editOpRules },
    );

    const handleSaveOperationDetails = async (operationId: string) => {
        if (!editOpName.trim()) return showToast('Operation name is required', 'error');

        const pendingKeyword = editOpKeywordInput.trim();
        const addedKeyword = pendingKeyword ? addKeyword(pendingKeyword, editOpKeywords, operationId) : null;
        if (pendingKeyword && !addedKeyword) return;
        const keywords = addedKeyword ? [...editOpKeywords, addedKeyword] : editOpKeywords;
        const existingRules = config.rules.filter(rule => rule.operation_id === operationId);
        const ruleChanges = buildRuleChanges(operationId, existingRules, editOpRules);
        const duplicateMessage = findDuplicateRuleName(ruleChanges.validRules, config.tools, config.actions);
        if (duplicateMessage) return showToast(duplicateMessage, 'error');

        setLoading('Saving operation details...');
        try {
            await updateOperationWithRules(
                { id: operationId, name: editOpName.trim(), category: editOpCategory, keywords },
                ruleChanges.deleteIds,
                ruleChanges.inserts,
                ruleChanges.updates,
            );
            showToast('Operation updated successfully', 'success');
            setEditOpId(null);
            setEditOpRules([]);
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error updating operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteOperation = async (operationId: string) => {
        if (!window.confirm('Are you sure you want to delete this operation? This will also delete all associated rules.')) return;
        setLoading('Deleting operation...');
        try {
            await deleteOperation(operationId);
            showToast('Operation and its rules deleted successfully', 'success');
            setExpandedOpId(null);
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error deleting operation', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleOpClick = (operationId: string) => {
        if (editOpId && hasOpEditChanges(editOpId) && !window.confirm('You have unsaved operation changes. Do you want to discard them?')) return;
        if (editOpId) {
            setEditOpId(null);
            setEditOpRules([]);
        }
        setExpandedOpId(current => current === operationId ? null : operationId);
    };

    const handleMoveOperation = async (
        draggedId: string,
        targetId: string,
        sourceCategory: string,
        targetCategory: string,
    ) => {
        const targetOperations = groupedOperations[targetCategory] || [];
        const orderedIds = buildOrderedIds(targetOperations.map(operation => operation.id), draggedId, targetId);
        setLoading('Moving operation...');
        try {
            await updateOperationPlacement(
                draggedId,
                sourceCategory === targetCategory ? null : targetCategory,
                orderedIds.map((id, index) => ({ id, sort_order: (index + 1) * 10 })),
            );
            showToast(
                targetCategory === sourceCategory
                    ? 'Operation order updated successfully'
                    : `Operation moved to ${targetCategory} successfully`,
                'success',
            );
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error updating operation order', 'error');
        } finally {
            setLoading(null);
        }
    };

    const state: LogicViewState = {
        logicSearch, selectedLogicCategory, selectedCategory: 'All', editingPriceId, showAddOpForm,
        newOpName, newOpCategory, newOpKeywords, newOpKeywordInput, isAddingNewOpKeyword,
        expandedOpId, editOpId, editOpName, editOpCategory, editOpKeywords, editOpKeywordInput,
        isAddingEditOpKeyword, editOpRules, draggedOperationId, draggedOperationCategory, dragOverOperationId,
    };
    const actions: LogicViewActions = {
        setLogicSearch, setSelectedLogicCategory, setEditingPriceId, setShowAddOpForm, setNewOpName,
        setNewOpCategory, setNewOpKeywords, setNewOpKeywordInput, setIsAddingNewOpKeyword,
        setEditOpId, setEditOpName, setEditOpCategory, setEditOpKeywords, setEditOpKeywordInput,
        setIsAddingEditOpKeyword, setEditOpRules, setDraggedOperationId, setDraggedOperationCategory,
        setDragOverOperationId, handleCloseAddOpForm, handleAddKeywordToNewOp, handleRemoveKeywordFromNewOp: index => setNewOpKeywords(previous => previous.filter((_, currentIndex) => currentIndex !== index)),
        handleCreateOperation, handleAddKeywordToEditOp, handleRemoveKeywordFromEditOp: index => setEditOpKeywords(previous => previous.filter((_, currentIndex) => currentIndex !== index)),
        handleStartEditOp, handleSaveOperationDetails, handleDeleteOperation, handleOpClick,
        handleMoveOperation, hasOpEditChanges, hasPriceRowChanges: () => false,
    };

    return {
        state,
        actions,
        categories,
        groupedOperations,
        toolRuleOptions,
        actionRuleOptions,
        hasUnsavedChanges: () => Boolean(editOpId && hasOpEditChanges(editOpId)),
    };
}
