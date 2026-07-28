import { useState } from 'react';
import { loadStoredSurgeonGroups, saveStoredSurgeonGroups } from '../../../repositories/adminPreferences';
import type { SurgeonGroups } from '../../../domain/toolTypes';

interface UseSurgeonGroupsArgs {
    showToast: (message: string, type: 'success' | 'error') => void;
}

export function useSurgeonGroups({ showToast }: UseSurgeonGroupsArgs) {
    const [surgeonGroups, setSurgeonGroups] = useState<SurgeonGroups>(loadStoredSurgeonGroups);
    const [isEditingSurgeonGroups, setIsEditingSurgeonGroups] = useState(false);
    const [editSurgeonGroupsText, setEditSurgeonGroupsText] = useState<Record<string, string>>({});
    const [initialSurgeonGroupsText, setInitialSurgeonGroupsText] = useState<Record<string, string>>({});
    const [newSurgeonGroupName, setNewSurgeonGroupName] = useState('');
    const [addingSurgeonGroup, setAddingSurgeonGroup] = useState<string | null>(null);

    const handleStartEditSurgeonGroups = () => {
        const formatted: Record<string, string> = Object.fromEntries(
            (Object.entries(surgeonGroups) as [string, string[]][]).map(([group, names]) => [group, names.join(', ')])
        );
        setEditSurgeonGroupsText(formatted);
        setInitialSurgeonGroupsText(formatted);
        setNewSurgeonGroupName('');
        setAddingSurgeonGroup(null);
        setIsEditingSurgeonGroups(true);
    };

    const hasUnsavedSurgeonGroupChanges = () => (
        JSON.stringify(editSurgeonGroupsText) !== JSON.stringify(initialSurgeonGroupsText)
    );

    const handleCancelEditSurgeonGroups = () => {
        if (hasUnsavedSurgeonGroupChanges() && !window.confirm('You have unsaved surgeon-group changes. Discard them?')) return;
        setIsEditingSurgeonGroups(false);
        setEditSurgeonGroupsText({});
        setInitialSurgeonGroupsText({});
        setNewSurgeonGroupName('');
        setAddingSurgeonGroup(null);
    };

    const handleStartAddingSurgeon = (group: string) => {
        setAddingSurgeonGroup(group);
        setNewSurgeonGroupName('');
    };

    const handleCancelAddingSurgeon = () => {
        setAddingSurgeonGroup(null);
        setNewSurgeonGroupName('');
    };

    const handleAddSurgeonToGroup = (group: string) => {
        const name = newSurgeonGroupName.trim();
        if (!name) return;
        const currentNames = (editSurgeonGroupsText[group] || '').split(',').map(surgeon => surgeon.trim()).filter(Boolean);
        if (currentNames.some(surgeon => surgeon.toLowerCase() === name.toLowerCase())) {
            showToast(`Surgeon "${name}" is already in group ${group}.`, 'error');
            return;
        }
        setEditSurgeonGroupsText(prev => ({
            ...prev,
            [group]: [...(prev[group] || '').split(',').map(surgeon => surgeon.trim()).filter(Boolean), name].join(', '),
        }));
        setNewSurgeonGroupName('');
        setAddingSurgeonGroup(null);
    };

    const handleRemoveSurgeonFromGroup = (group: string, name: string) => {
        setEditSurgeonGroupsText(prev => ({
            ...prev,
            [group]: (prev[group] || '').split(',').map(surgeon => surgeon.trim()).filter(surgeon => surgeon && surgeon !== name).join(', '),
        }));
    };

    const handleSaveSurgeonGroups = () => {
        const updated: SurgeonGroups = Object.fromEntries(
            (Object.entries(editSurgeonGroupsText) as [string, string][]).map(([group, text]) => [
                group,
                text.split(',').map(name => name.trim()).filter(Boolean),
            ])
        );
        setSurgeonGroups(updated);
        setInitialSurgeonGroupsText(editSurgeonGroupsText);
        saveStoredSurgeonGroups(updated);
        window.dispatchEvent(new Event('surgeonGroupsUpdated'));
        showToast('Surgeon groups updated successfully', 'success');
        setIsEditingSurgeonGroups(false);
        setNewSurgeonGroupName('');
        setAddingSurgeonGroup(null);
    };

    return {
        state: {
            surgeonGroups,
            isEditingSurgeonGroups,
            editSurgeonGroupsText,
            initialSurgeonGroupsText,
            newSurgeonGroupName,
            addingSurgeonGroup,
        },
        actions: {
            setEditSurgeonGroupsText,
            setNewSurgeonGroupName,
            handleStartEditSurgeonGroups,
            handleCancelEditSurgeonGroups,
            handleStartAddingSurgeon,
            handleCancelAddingSurgeon,
            handleAddSurgeonToGroup,
            handleRemoveSurgeonFromGroup,
            handleSaveSurgeonGroups,
        },
        hasUnsavedChanges: () => isEditingSurgeonGroups && hasUnsavedSurgeonGroupChanges(),
    };
}

export type SurgeonGroupsFeature = ReturnType<typeof useSurgeonGroups>;
