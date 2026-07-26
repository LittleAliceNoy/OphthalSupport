import { describe, expect, it } from 'vitest';
import { clearPpvGaugeSelections, ensureDefaultPpvGauge, formatPpvProcedureDisplay, isPpvProcedureSelected, isRetinalProcedureKeyword, normalizePpvOperationInput, shouldAutoSelectPpv, togglePpvGaugeDiagnosis } from './ppvSelection';

describe('PPV selection state', () => {
  it('recognizes PPV with or without a legacy gauge prefix', () => {
    expect(isPpvProcedureSelected('PPV')).toBe(true);
    expect(isPpvProcedureSelected('23GPPV')).toBe(true);
    expect(isPpvProcedureSelected('Phaco')).toBe(false);
  });

  it('removes PPV gauges without removing unrelated diagnosis values', () => {
    expect(clearPpvGaugeSelections('23G, MH, left eye')).toBe('MH, left eye');
  });

  it('normalizes legacy gauge-prefixed operation values to PPV', () => {
    expect(normalizePpvOperationInput('Phaco + 25GPPV')).toBe('Phaco + PPV');
  });

  it('adds a PPV gauge to diagnosis without changing the operation', () => {
    expect(togglePpvGaugeDiagnosis('', '23G', 'PPV')).toBe('23G');
    expect(togglePpvGaugeDiagnosis('23G', '25G', 'PPV')).toBe('25G');
    expect(togglePpvGaugeDiagnosis('', '23G', 'Phaco')).toBe('');
  });

  it('shows the selected gauge in the procedure text without duplicating PPV', () => {
    expect(formatPpvProcedureDisplay('PPV', '23G')).toBe('23G PPV');
    expect(formatPpvProcedureDisplay('Phaco + PPV', '25G')).toBe('Phaco + 25G PPV');
    expect(formatPpvProcedureDisplay('PPV', '')).toBe('PPV');
  });

  it('defaults PPV to 23G without replacing an explicit gauge', () => {
    expect(ensureDefaultPpvGauge('')).toBe('23G');
    expect(ensureDefaultPpvGauge('MH')).toBe('MH, 23G');
    expect(ensureDefaultPpvGauge('25G')).toBe('25G');
  });

  it('does not re-add PPV after the user dismisses it', () => {
    expect(shouldAutoSelectPpv(true, false, false)).toBe(true);
    expect(shouldAutoSelectPpv(true, false, true)).toBe(false);
    expect(shouldAutoSelectPpv(true, true, true)).toBe(false);
  });

  it('identifies retinal procedures that should trigger PPV auto-selection', () => {
    expect(isRetinalProcedureKeyword('MP')).toBe(true);
    expect(isRetinalProcedureKeyword('Endolaser')).toBe(true);
    expect(isRetinalProcedureKeyword('Phaco')).toBe(false);
  });
});
