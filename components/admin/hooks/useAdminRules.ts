import { DBAction, DBOperation, DBRule, DBTool } from '../../../configService';
import { useAdminPreferences } from './useAdminPreferences';
import { useSurgeonGroups } from './useSurgeonGroups';

import { useAdminActions } from './useAdminActions';
import { useAdminReusableTools } from './useAdminReusableTools';

type OperationConfig = { tools: DBTool[]; actions: DBAction[]; operations: DBOperation[]; rules: DBRule[] };

interface UseAdminRulesArgs {
    config: OperationConfig;
    onRefresh: () => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    setLoading: (value: string | null) => void;
}

export function useAdminRules({ config, onRefresh, showToast, setLoading }: UseAdminRulesArgs) {
    const actionsFeature = useAdminActions({
        actions: config.actions,
        rules: config.rules,
        onRefresh,
        showToast,
        setLoading,
    });
    const { state: actionsState, actions: actionsHandlers } = actionsFeature;
    const {
        actionSearch,
        showAddActionModal,
        newActionId,
        newActionItem,
        newActionActive,
        editingActionId,
        editActionItem,
        editActionActive,
        filteredActions,
    } = actionsState;
    const {
        setActionSearch,
        handleOpenAddModal,
        handleCloseAddModal,
        setNewActionId,
        setNewActionItem,
        handleNewActionItemChange,
        setNewActionActive,
        handleCreateAction,
        handleStartEditAction,
        handleCancelEditAction,
        setEditActionItem,
        setEditActionActive,
        handleSaveEditAction,
        handleToggleActionActive,
        handleSetActionActive,
        handleDeleteAction,
    } = actionsHandlers;

    const preferencesFeature = useAdminPreferences({ showToast });
    const { state: preferencesState, actions: preferencesActions } = preferencesFeature;

    const surgeonGroupsFeature = useSurgeonGroups({ showToast });
    const { state: surgeonGroupsState, actions: surgeonGroupsActions } = surgeonGroupsFeature;
    const {
        surgeonGroups,
        isEditingSurgeonGroups,
        editSurgeonGroupsText,
        initialSurgeonGroupsText,
        newSurgeonGroupName,
        addingSurgeonGroup,
    } = surgeonGroupsState;
    const {
        setNewSurgeonGroupName,
        setEditSurgeonGroupsText,
        handleStartEditSurgeonGroups,
        handleCancelEditSurgeonGroups,
        handleStartAddingSurgeon,
        handleCancelAddingSurgeon,
        handleAddSurgeonToGroup,
        handleRemoveSurgeonFromGroup,
        handleSaveSurgeonGroups,
    } = surgeonGroupsActions;

    const {
        surgeonPreferences,
        showAddPrefModal,
        newPrefSurgeon,
        newPrefTool,
        newPrefValue,
        editingPrefId,
        editPrefSurgeon,
        editPrefTool,
        editPrefValue,
        centurionSurgeons,
        newSurgeonName,
        isEditingSurgeonPrefs,
        editSurgeonPrefsList,
    } = preferencesState;
    const {
        setShowAddPrefModal,
        setNewPrefSurgeon,
        setNewPrefTool,
        setNewPrefValue,
        handleCreatePreference,
        handleCloseAddPrefModal,
        handleStartEditPref,
        handleCancelEditPref,
        setEditPrefSurgeon,
        setEditPrefTool,
        setEditPrefValue,
        handleSaveEditPref,
        handleDeletePref,
        setNewSurgeonName,
        handleAddCenturionSurgeon,
        handleRemoveCenturionSurgeon,
        handleStartEditSurgeonPrefs,
        handleCancelEditSurgeonPrefs,
        handleSaveSurgeonPrefs,
        handleAddPrefRowInEdit,
        handleRemovePrefRowInEdit,
        handleUpdatePrefRowInEdit,
    } = preferencesActions;

    const reusableToolsFeature = useAdminReusableTools({
        tools: config.tools,
        onRefresh,
        showToast,
        setLoading,
    });
    const { state: reusableToolsState, actions: reusableToolsHandlers } = reusableToolsFeature;
    const {
        reusableTools,
        availableExistingTools,
        showAddReusableToolModal,
        selectedExistingToolId,
        isEditingReusableTools,
    } = reusableToolsState;
    const {
        handleUpdateToolDefault,
        setShowAddReusableToolModal,
        setSelectedExistingToolId,
        handleAddExistingToolAsReusable,
        handleRemoveReusableTool,
        handleStartEditReusableTools,
        handleCancelEditReusableTools,
    } = reusableToolsHandlers;



    const hasUnsavedChanges = () => {
        if (actionsFeature.hasUnsavedChanges()) return true;
        if (preferencesFeature.hasUnsavedChanges()) return true;
        if (surgeonGroupsFeature.hasUnsavedChanges()) return true;
        if (reusableToolsFeature.hasUnsavedChanges()) return true;
        return false;
    };

    return {
        actionsState: {
            actionSearch,
            showAddActionModal,
            newActionId,
            newActionItem,
            newActionActive,
            editingActionId,
            editActionItem,
            editActionActive,
            filteredActions,
        },
        actionsHandlers: {
            setActionSearch,
            handleOpenAddModal,
            handleCloseAddModal,
            setNewActionId,
            setNewActionItem,
            handleNewActionItemChange,
            setNewActionActive,
            handleCreateAction,
            handleStartEditAction,
            handleCancelEditAction,
            setEditActionItem,
            setEditActionActive,
            handleSaveEditAction,
            handleToggleActionActive,
            handleSetActionActive,
            handleDeleteAction,
        },
        surgeonsState: {
            surgeonPreferences,
            showAddPrefModal,
            newPrefSurgeon,
            newPrefTool,
            newPrefValue,
            editingPrefId,
            editPrefSurgeon,
            editPrefTool,
            editPrefValue,
            centurionSurgeons,
            newSurgeonName,
            surgeonGroups,
            isEditingSurgeonGroups,
            editSurgeonGroupsText,
            initialSurgeonGroupsText,
            newSurgeonGroupName,
            addingSurgeonGroup,
            isEditingSurgeonPrefs,
            editSurgeonPrefsList,
        },
        surgeonsHandlers: {
            setShowAddPrefModal,
            setNewPrefSurgeon,
            setNewPrefTool,
            setNewPrefValue,
            handleCreatePreference,
            handleCloseAddPrefModal,
            handleStartEditPref,
            handleCancelEditPref,
            setEditPrefSurgeon,
            setEditPrefTool,
            setEditPrefValue,
            handleSaveEditPref,
            handleDeletePref,
            setNewSurgeonName,
            handleAddCenturionSurgeon,
            handleRemoveCenturionSurgeon,
            handleStartEditSurgeonGroups,
            handleCancelEditSurgeonGroups,
            setEditSurgeonGroupsText,
            setNewSurgeonGroupName,
            handleStartAddingSurgeon,
            handleCancelAddingSurgeon,
            handleAddSurgeonToGroup,
            handleRemoveSurgeonFromGroup,
            handleSaveSurgeonGroups,
            handleStartEditSurgeonPrefs,
            handleCancelEditSurgeonPrefs,
            handleSaveSurgeonPrefs,
            handleAddPrefRowInEdit,
            handleRemovePrefRowInEdit,
            handleUpdatePrefRowInEdit,
        },

        reusableToolsState: {
            reusableTools,
            availableExistingTools,
            showAddReusableToolModal,
            selectedExistingToolId,
            isEditingReusableTools,
        },
        reusableToolsHandlers: {
            handleUpdateToolDefault,
            setShowAddReusableToolModal,
            setSelectedExistingToolId,
            handleAddExistingToolAsReusable,
            handleRemoveReusableTool,
            handleStartEditReusableTools,
            handleCancelEditReusableTools,
        },
        hasUnsavedChanges,
    };
}

export type AdminRulesHook = ReturnType<typeof useAdminRules>;
