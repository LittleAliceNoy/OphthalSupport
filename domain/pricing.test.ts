import { describe, expect, it } from 'vitest';
import { PatientSession, ChecklistItemData } from '../constants';
import { DBPrice } from '../configService';
import { calculateCostAndBreakdown } from './pricing';

const session = (diagnosis = ''): PatientSession => ({
  id: 'test-session',
  diagnosis,
  operationInput: '',
  surgeonName: '',
  anesthesiaType: 'LA',
  healthCoverage: 'CSMBS',
  actions: [],
  tools: [],
  mpSelectedTypes: [],
  updatedAt: new Date(),
});

const tool = (overrides: Partial<ChecklistItemData>): ChecklistItemData => ({
  id: 'glaucoma-device',
  item: 'Glaucoma Drainage Device',
  type: 'checkbox',
  checked: true,
  ...overrides,
});

const price = (overrides: Partial<DBPrice>): DBPrice => ({
  id: 'price-1',
  tool_id: 'glaucoma-device',
  sub_key: null,
  csmbs_price: 0,
  sss_price: 0,
  ucs_price: 0,
  ...overrides,
});

describe('calculateCostAndBreakdown', () => {
  it('uses the selected subtype price for checkbox-based GDI tools', () => {
    const result = calculateCostAndBreakdown(
      [tool({ selectedValue: 'gdi-xen-room' })],
      'CSMBS',
      session(),
      [price({ sub_key: 'gdi-xen-room', csmbs_price: 17785, display_name: 'XEN implant' })],
    );

    expect(result.total).toBe(17785);
    expect(result.breakdown[0]).toMatchObject({ id: 'glaucoma-device', name: 'XEN implant', price: 17785 });
  });

  it('charges zero for reused tools', () => {
    const result = calculateCostAndBreakdown(
      [tool({ selectedValue: 'Reused' })],
      'CSMBS',
      session(),
      [price({ csmbs_price: 500 })],
    );

    expect(result.total).toBe(0);
    expect(result.breakdown[0].isReused).toBe(true);
  });

  it('selects the PPV price row using the diagnosis gauge and machine', () => {
    const result = calculateCostAndBreakdown(
      [{ ...tool({ id: 'ppv-set', item: 'PPV set', selectedValue: 'Constellation' }) }],
      'UCS',
      session('25G'),
      [price({ tool_id: 'ppv-set', sub_key: '25G_Constellation', ucs_price: 2150, display_name: '25G PPV' })],
    );

    expect(result.total).toBe(2150);
    expect(result.breakdown[0].name).toBe('25G PPV');
  });
});
