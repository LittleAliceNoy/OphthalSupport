import React, { useMemo, useState } from 'react';
import { DBAction, DBRule } from '../../../configService';
import { createAction, deleteAction, updateAction } from '../../../adminService';
import { FALLBACK_ACTIONS } from '../../../localConfigData';

interface UseAdminActionsArgs {
    actions: DBAction[];
    rules: DBRule[];
    onRefresh: () => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    setLoading: (value: string | null) => void;
}

export function useAdminActions({ actions, rules, onRefresh, showToast, setLoading }: UseAdminActionsArgs) {
    const [actionSearch, setActionSearch] = useState('');
    const [showAddActionModal, setShowAddActionModal] = useState(false);
    const [newActionId, setNewActionId] = useState('');
    const [newActionItem, setNewActionItem] = useState('');
    const [newActionActive, setNewActionActive] = useState(true);
    const [editingActionId, setEditingActionId] = useState<string | null>(null);
    const [editActionItem, setEditActionItem] = useState('');
    const [editActionActive, setEditActionActive] = useState(true);
    const [optimisticActionActive, setOptimisticActionActive] = useState<Record<string, boolean>>({});

    const filteredActions = useMemo(() => {
        const fallbackOrder = FALLBACK_ACTIONS.map(action => action.id);
        const sorted = actions.map(action => ({
            ...action,
            is_active: optimisticActionActive[action.id] !== undefined
                ? optimisticActionActive[action.id]
                : action.is_active !== false,
        })).sort((a, b) => {
            const indexA = fallbackOrder.indexOf(a.id);
            const indexB = fallbackOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.id.localeCompare(b.id);
        });

        const query = actionSearch.toLowerCase().trim();
        return query
            ? sorted.filter(action => action.item.toLowerCase().includes(query) || action.id.toLowerCase().includes(query))
            : sorted;
    }, [actions, actionSearch, optimisticActionActive]);

    const hasUnsavedChanges = () => {
        if (showAddActionModal && (newActionId.trim() || newActionItem.trim())) return true;
        if (!editingActionId) return false;
        const original = actions.find(action => action.id === editingActionId);
        return !original || editActionItem !== original.item || editActionActive !== (original.is_active !== false);
    };

    const handleNewActionItemChange = (itemText: string) => {
        setNewActionItem(itemText);
        setNewActionId(itemText.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'));
    };

    const handleOpenAddModal = () => {
        setNewActionId('');
        setNewActionItem('');
        setNewActionActive(true);
        setShowAddActionModal(true);
    };

    const handleCloseAddModal = () => {
        if ((newActionId.trim() || newActionItem.trim()) && !window.confirm('Discard unsaved Action form data?')) return;
        setShowAddActionModal(false);
        setNewActionId('');
        setNewActionItem('');
    };

    const handleCreateAction = async (event: React.FormEvent) => {
        event.preventDefault();
        const id = newActionId.trim().toLowerCase().replace(/\s+/g, '-');
        const item = newActionItem.trim();
        if (!id || !item) return showToast('Action ID and Name are required.', 'error');
        if (actions.some(action => action.id.toLowerCase() === id)) return showToast(`Action ID "${id}" already exists.`, 'error');

        setLoading('Creating Action...');
        try {
            await createAction({ id, item, is_active: newActionActive });
            showToast('Action created successfully', 'success');
            setShowAddActionModal(false);
            setNewActionId('');
            setNewActionItem('');
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to create action', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleStartEditAction = (action: DBAction) => {
        setEditingActionId(action.id);
        setEditActionItem(action.item);
        setEditActionActive(action.is_active !== false);
    };

    const handleCancelEditAction = () => {
        if (hasUnsavedChanges() && !window.confirm('You have unsaved action changes. Discard them?')) return;
        setEditingActionId(null);
        setEditActionItem('');
    };

    const handleSaveEditAction = async (actionId: string) => {
        const item = editActionItem.trim();
        if (!item) return showToast('Action Name cannot be empty.', 'error');
        setLoading('Updating Action...');
        try {
            await updateAction(actionId, { item, is_active: editActionActive });
            showToast('Action updated successfully', 'success');
            setEditingActionId(null);
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to update action', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleSetActionActive = async (action: DBAction, targetStatus: boolean) => {
        const currentStatus = optimisticActionActive[action.id] !== undefined
            ? optimisticActionActive[action.id]
            : action.is_active !== false;
        if (currentStatus === targetStatus) return;
        setOptimisticActionActive(previous => ({ ...previous, [action.id]: targetStatus }));
        try {
            await updateAction(action.id, { is_active: targetStatus });
            await onRefresh();
        } catch (error) {
            setOptimisticActionActive(previous => ({ ...previous, [action.id]: currentStatus }));
            showToast(error instanceof Error ? error.message : 'Failed to update action status', 'error');
        }
    };

    const handleToggleActionActive = async (action: DBAction) => {
        const currentStatus = optimisticActionActive[action.id] !== undefined
            ? optimisticActionActive[action.id]
            : action.is_active !== false;
        await handleSetActionActive(action, !currentStatus);
    };

    const handleDeleteAction = async (actionId: string, actionItem: string) => {
        const linkedRules = rules.filter(rule => rule.target_type === 'action' && rule.target_id === actionId);
        let message = `Are you sure you want to delete action "${actionItem}" (${actionId})?`;
        if (linkedRules.length > 0) {
            message += `\nWarning: This action is currently used in ${linkedRules.length} surgery operation rule(s). Deleting will remove those rule links as well.`;
        }
        if (!window.confirm(message)) return;
        setLoading('Deleting Action...');
        try {
            await deleteAction(actionId);
            showToast('Action deleted successfully', 'success');
            if (editingActionId === actionId) setEditingActionId(null);
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete action', 'error');
        } finally {
            setLoading(null);
        }
    };

    return {
        state: { actionSearch, showAddActionModal, newActionId, newActionItem, newActionActive, editingActionId, editActionItem, editActionActive, filteredActions },
        actions: {
            setActionSearch, handleOpenAddModal, handleCloseAddModal, setNewActionId, setNewActionItem,
            handleNewActionItemChange, setNewActionActive, handleCreateAction, handleStartEditAction,
            handleCancelEditAction, setEditActionItem, setEditActionActive, handleSaveEditAction,
            handleToggleActionActive, handleSetActionActive, handleDeleteAction,
        },
        hasUnsavedChanges,
    };
}

export type AdminActionsHook = ReturnType<typeof useAdminActions>;
