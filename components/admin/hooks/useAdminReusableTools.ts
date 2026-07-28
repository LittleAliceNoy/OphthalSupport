import React, { useMemo, useState } from 'react';
import { DBTool } from '../../../configService';
import { updateTool } from '../../../adminService';

interface UseAdminReusableToolsArgs {
    tools: DBTool[];
    onRefresh: () => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    setLoading: (value: string | null) => void;
}

export function useAdminReusableTools({ tools, onRefresh, showToast, setLoading }: UseAdminReusableToolsArgs) {
    const [optimisticDefaults, setOptimisticDefaults] = useState<Record<string, string>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedToolId, setSelectedToolId] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const reusableTools = useMemo(() => tools.map(tool => ({
        ...tool,
        default_value: optimisticDefaults[tool.id] !== undefined ? optimisticDefaults[tool.id] : tool.default_value,
    })).filter(tool => {
        if (!Array.isArray(tool.options)) return false;
        const values = tool.options.map(option => option.value.toLowerCase());
        return values.includes('new') && values.includes('reused');
    }), [tools, optimisticDefaults]);

    const availableExistingTools = useMemo(() => {
        const reusableIds = new Set(reusableTools.map(tool => tool.id));
        return tools.filter(tool => !reusableIds.has(tool.id));
    }, [tools, reusableTools]);

    const handleUpdateToolDefault = async (toolId: string, defaultValue: string) => {
        setOptimisticDefaults(previous => ({ ...previous, [toolId]: defaultValue }));
        try {
            await updateTool(toolId, { default_value: defaultValue });
            await onRefresh();
        } catch (error) {
            setOptimisticDefaults(previous => {
                const next = { ...previous };
                delete next[toolId];
                return next;
            });
            showToast(error instanceof Error ? error.message : 'Failed to update tool default', 'error');
        }
    };

    const handleAddExistingToolAsReusable = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedToolId) return showToast('Please select a tool from the list.', 'error');
        setLoading('Setting tool as reusable...');
        try {
            await updateTool(selectedToolId, {
                options: [{ label: 'New', value: 'New' }, { label: 'Reused', value: 'Reused' }],
                default_value: 'New',
            });
            showToast('Tool added to reusable tools', 'success');
            setShowAddModal(false);
            setSelectedToolId('');
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to update tool to reusable', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleRemoveReusableTool = async (toolId: string) => {
        setLoading('Removing reusable tool option...');
        try {
            await updateTool(toolId, { options: null, default_value: null });
            showToast('Tool removed from reusable list', 'success');
            await onRefresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to remove reusable tool', 'error');
        } finally {
            setLoading(null);
        }
    };

    return {
        state: {
            reusableTools,
            availableExistingTools,
            showAddReusableToolModal: showAddModal,
            selectedExistingToolId: selectedToolId,
            isEditingReusableTools: isEditing,
        },
        actions: {
            handleUpdateToolDefault,
            setShowAddReusableToolModal: setShowAddModal,
            setSelectedExistingToolId: setSelectedToolId,
            handleAddExistingToolAsReusable,
            handleRemoveReusableTool,
            handleStartEditReusableTools: () => setIsEditing(true),
            handleCancelEditReusableTools: () => setIsEditing(false),
        },
        hasUnsavedChanges: () => showAddModal && Boolean(selectedToolId),
    };
}

export type AdminReusableToolsHook = ReturnType<typeof useAdminReusableTools>;
