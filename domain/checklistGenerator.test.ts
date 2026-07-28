import { describe, expect, it } from 'vitest';
import { ChecklistItemData, PatientSession } from '../constants';
import { DBOperation, DBRule } from '../configService';
import { generateChecklist } from './checklistGenerator';

const action = (id: string): ChecklistItemData => ({
  id,
  item: id,
  type: 'checkbox',
  checked: false,
});

const session = (operationInput: string): PatientSession => ({
  id: 'session',
  diagnosis: '',
  operationInput,
  surgeonName: '',
  anesthesiaType: 'LA',
  healthCoverage: 'UCS',
  actions: [action('normal-so-action'), action('hd-so-action')],
  tools: [],
  mpSelectedTypes: [],
  updatedAt: new Date(),
});

const operations: DBOperation[] = [
  { id: 'so', name: 'SO', category: 'Retinal Surgery', keywords: ['SO'] },
  { id: 'hd-so', name: 'HD SO', category: 'Retinal Surgery', keywords: ['HD SO'] },
];

const rules: DBRule[] = [
  {
    id: 'normal-so-rule',
    operation_id: 'so',
    target_type: 'action',
    target_id: 'normal-so-action',
    default_selected_value: null,
  },
  {
    id: 'hd-so-rule',
    operation_id: 'hd-so',
    target_type: 'action',
    target_id: 'hd-so-action',
    default_selected_value: null,
  },
];

describe('generateChecklist', () => {
  it('does not apply normal SO rules when HD SO is selected', () => {
    const result = generateChecklist(session('HD SO'), { operations, rules });

    expect(result.actions.find(item => item.id === 'normal-so-action')?.checked).toBe(false);
    expect(result.actions.find(item => item.id === 'hd-so-action')?.checked).toBe(true);
  });

  it('applies both SO and HD SO rules when both are selected', () => {
    const result = generateChecklist(session('SO + HD SO'), { operations, rules });

    expect(result.actions.find(item => item.id === 'normal-so-action')?.checked).toBe(true);
    expect(result.actions.find(item => item.id === 'hd-so-action')?.checked).toBe(true);
  });
});
