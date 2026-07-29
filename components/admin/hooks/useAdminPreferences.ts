import React, { useState } from 'react';
import { SurgeonPreference } from '../adminRulesCatalog';
import {
    loadCenturionSurgeons,
    loadSurgeonPreferences,
    saveCenturionSurgeons,
    saveSurgeonPreferences as persistSurgeonPreferences,
} from '../../../repositories/adminPreferences';
import { CLINICAL_CATALOG } from '../../../domain/catalog';

interface UseAdminPreferencesArgs {
    showToast: (message: string, type: 'success' | 'error') => void;
}

export function useAdminPreferences({ showToast }: UseAdminPreferencesArgs) {
    const [surgeonPreferences, setSurgeonPreferences] = useState<SurgeonPreference[]>(loadSurgeonPreferences);
    const [showAddPrefModal, setShowAddPrefModal] = useState(false);
    const [newPrefSurgeon, setNewPrefSurgeon] = useState('');
    const [newPrefTool, setNewPrefTool] = useState('Phaco Machine');
    const [newPrefValue, setNewPrefValue] = useState(CLINICAL_CATALOG.machineTypes.CENTURION);
    const [editingPrefId, setEditingPrefId] = useState<string | null>(null);
    const [editPrefSurgeon, setEditPrefSurgeon] = useState('');
    const [editPrefTool, setEditPrefTool] = useState('');
    const [editPrefValue, setEditPrefValue] = useState('');
    const [centurionSurgeons, setCenturionSurgeons] = useState<string[]>(loadCenturionSurgeons);
    const [newSurgeonName, setNewSurgeonName] = useState('');
    const [isEditingSurgeonPrefs, setIsEditingSurgeonPrefs] = useState(false);
    const [editSurgeonPrefsList, setEditSurgeonPrefsList] = useState<SurgeonPreference[]>([]);

    const persistPreferences = (preferences: SurgeonPreference[]) => {
        setSurgeonPreferences(preferences);
        persistSurgeonPreferences(preferences);
        saveCenturionSurgeons(
            preferences
                .filter(pref => pref.tool.toLowerCase().includes('phaco') && pref.value.toLowerCase().includes('centurion'))
                .map(pref => pref.surgeon)
        );
        window.dispatchEvent(new Event('surgeonPreferencesUpdated'));
    };

    const handleCreatePreference = (event: React.FormEvent) => {
        event.preventDefault();
        if (!newPrefSurgeon.trim() || !newPrefTool.trim() || !newPrefValue.trim()) return;

        const newPreference: SurgeonPreference = {
            id: `pref-${Date.now()}`,
            surgeon: newPrefSurgeon.trim(),
            tool: newPrefTool.trim(),
            value: newPrefValue.trim(),
        };
        persistPreferences([...surgeonPreferences, newPreference]);
        setShowAddPrefModal(false);
        setNewPrefSurgeon('');
        showToast(`Added preference for ${newPreference.surgeon}`, 'success');
    };

    const handleCloseAddPrefModal = () => {
        const hasInputs = newPrefSurgeon.trim()
            || newPrefTool !== 'Phaco Machine'
            || newPrefValue !== CLINICAL_CATALOG.machineTypes.CENTURION;
        if (hasInputs && !window.confirm('You have unsaved surgeon-preference changes. Discard them?')) return;
        setShowAddPrefModal(false);
        setNewPrefSurgeon('');
    };

    const handleStartEditPref = (preference: SurgeonPreference) => {
        setEditingPrefId(preference.id);
        setEditPrefSurgeon(preference.surgeon);
        setEditPrefTool(preference.tool);
        setEditPrefValue(preference.value);
    };

    const handleCancelEditPref = () => setEditingPrefId(null);

    const handleSaveEditPref = (id: string) => {
        const updated = surgeonPreferences.map(preference => preference.id === id ? {
            ...preference,
            surgeon: editPrefSurgeon.trim(),
            tool: editPrefTool.trim(),
            value: editPrefValue.trim(),
        } : preference);
        persistPreferences(updated);
        setEditingPrefId(null);
        showToast('Updated surgeon preference', 'success');
    };

    const handleStartEditSurgeonPrefs = () => {
        setEditSurgeonPrefsList(structuredClone(surgeonPreferences));
        setIsEditingSurgeonPrefs(true);
    };

    const handleCancelEditSurgeonPrefs = () => {
        if (
            JSON.stringify(editSurgeonPrefsList) !== JSON.stringify(surgeonPreferences)
            && !window.confirm('You have unsaved surgeon-preference changes. Discard them?')
        ) return;
        setIsEditingSurgeonPrefs(false);
        setEditSurgeonPrefsList([]);
    };

    const handleSaveSurgeonPrefs = () => {
        const cleaned = editSurgeonPrefsList
            .map(preference => ({
                ...preference,
                surgeon: preference.surgeon.trim(),
                tool: preference.tool.trim(),
                value: preference.value.trim(),
            }))
            .filter(preference => preference.surgeon && preference.tool && preference.value);
        persistPreferences(cleaned);
        setIsEditingSurgeonPrefs(false);
        setEditSurgeonPrefsList([]);
        showToast('Surgeon preferences saved successfully', 'success');
    };

    const handleAddPrefRowInEdit = (defaultSurgeon: string) => {
        setEditSurgeonPrefsList(previous => [...previous, {
            id: `pref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            surgeon: defaultSurgeon || '',
            tool: 'Phaco Machine',
            value: CLINICAL_CATALOG.machineTypes.CENTURION,
        }]);
    };

    const handleRemovePrefRowInEdit = (index: number) => {
        setEditSurgeonPrefsList(previous => previous.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleUpdatePrefRowInEdit = (index: number, field: keyof SurgeonPreference, value: string) => {
        setEditSurgeonPrefsList(previous => {
            const next = [...previous];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleDeletePref = (id: string, surgeonName: string) => {
        if (!window.confirm(`Delete preference for "${surgeonName}"?`)) return;
        persistPreferences(surgeonPreferences.filter(preference => preference.id !== id));
        showToast(`Removed preference for ${surgeonName}`, 'success');
    };

    const handleAddCenturionSurgeon = (event: React.FormEvent) => {
        event.preventDefault();
        const name = newSurgeonName.trim();
        if (!name) return;
        if (centurionSurgeons.some(surgeon => surgeon.toLowerCase() === name.toLowerCase())) {
            showToast(`Surgeon "${name}" is already in Centurion preference list.`, 'error');
            return;
        }
        const updated = [...centurionSurgeons, name];
        setCenturionSurgeons(updated);
        saveCenturionSurgeons(updated);
        setNewSurgeonName('');
        showToast(`Added "${name}" to Centurion preference list`, 'success');
    };

    const handleRemoveCenturionSurgeon = (name: string) => {
        const updated = centurionSurgeons.filter(surgeon => surgeon !== name);
        setCenturionSurgeons(updated);
        saveCenturionSurgeons(updated);
        showToast(`Removed "${name}" from Centurion preference list`, 'success');
    };

    return {
        state: {
            surgeonPreferences, showAddPrefModal, newPrefSurgeon, newPrefTool, newPrefValue,
            editingPrefId, editPrefSurgeon, editPrefTool, editPrefValue, centurionSurgeons,
            newSurgeonName, isEditingSurgeonPrefs, editSurgeonPrefsList,
        },
        actions: {
            setShowAddPrefModal, setNewPrefSurgeon, setNewPrefTool, setNewPrefValue,
            handleCreatePreference, handleCloseAddPrefModal, handleStartEditPref,
            handleCancelEditPref, setEditPrefSurgeon, setEditPrefTool, setEditPrefValue,
            handleSaveEditPref, handleDeletePref, setNewSurgeonName, handleAddCenturionSurgeon,
            handleRemoveCenturionSurgeon, handleStartEditSurgeonPrefs, handleCancelEditSurgeonPrefs,
            handleSaveSurgeonPrefs, handleAddPrefRowInEdit, handleRemovePrefRowInEdit,
            handleUpdatePrefRowInEdit,
        },
        hasUnsavedChanges: () => (
            (showAddPrefModal && Boolean(newPrefSurgeon.trim() || newPrefTool !== 'Phaco Machine' || newPrefValue !== CLINICAL_CATALOG.machineTypes.CENTURION))
            || editingPrefId !== null
            || isEditingSurgeonPrefs
        ),
    };
}

export type AdminPreferencesHook = ReturnType<typeof useAdminPreferences>;
