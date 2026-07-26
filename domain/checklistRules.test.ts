import { describe, expect, it } from 'vitest';
import { ChecklistItemData } from '../constants';
import { applyMpToolsLogic } from './checklistRules';

const item = (id: string): ChecklistItemData => ({
  id,
  item: id,
  type: 'checkbox',
  checked: false,
});

describe('applyMpToolsLogic', () => {
  it('adds BBG and ILM forceps for ERM and forces new 25G instruments', () => {
    const result = applyMpToolsLogic(
      [item('bbg'), { ...item('ilm-forceps'), type: 'radio' }],
      ['ERM'],
      '25G',
    );

    expect(result.find(tool => tool.id === 'bbg')).toMatchObject({ checked: true });
    expect(result.find(tool => tool.id === 'ilm-forceps')).toMatchObject({
      checked: true,
      selectedValue: 'New',
      disabled: true,
    });
  });

  it('adds micro-scissors only for TRD and preserves non-MP tools', () => {
    const unrelated = item('soft-tip');
    const result = applyMpToolsLogic(
      [unrelated, { ...item('micro-scissor'), selectedValue: 'Reused' }],
      ['TRD'],
      '23G',
    );

    expect(result.find(tool => tool.id === 'micro-scissor')).toMatchObject({ checked: true, selectedValue: 'Reused' });
    expect(result.find(tool => tool.id === 'soft-tip')).toEqual(unrelated);
  });
});
