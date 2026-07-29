import { ChecklistItemData, NEW_REUSED_OPTIONS } from '../constants';
import { CLINICAL_CATALOG } from './catalog';

/**
 * Applies the tool dependencies for membrane-peeling procedures.
 * The function is deliberately pure so the clinical rules can be tested
 * without rendering the React application.
 */
export function applyMpToolsLogic(
  tools: ChecklistItemData[],
  mpTypes: string[],
  diagnosis: string,
): ChecklistItemData[] {
  const needBbgIlm = mpTypes.includes('ERM') || mpTypes.includes('MH');
  const needScissors = mpTypes.includes('TRD');
  const is25G = diagnosis.includes(CLINICAL_CATALOG.ppvGauges[1]);

  return tools.map((tool) => {
    if (tool.id === 'bbg') {
      return { ...tool, checked: needBbgIlm };
    }

    if (tool.id === 'ilm-forceps') {
      if (!needBbgIlm) {
        return { ...tool, checked: false, disabled: false };
      }

      return {
        ...tool,
        checked: true,
        selectedValue: is25G
          ? NEW_REUSED_OPTIONS.NEW
          : tool.selectedValue || NEW_REUSED_OPTIONS.NEW,
        disabled: is25G,
        note: is25G ? '25G items must be NEW' : tool.note,
      };
    }

    if (tool.id === 'micro-scissor') {
      return {
        ...tool,
        checked: needScissors,
        selectedValue: is25G && needScissors
          ? NEW_REUSED_OPTIONS.NEW
          : tool.selectedValue,
        disabled: is25G && needScissors,
        note: is25G && needScissors ? '25G items must be NEW' : tool.note,
      };
    }

    return { ...tool };
  });
}
