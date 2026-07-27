import {
  ANESTHESIA_TYPES,
  CENTURION_PREFERRED_SURGEONS,
  MACHINE_TYPES,
  ChecklistItemData,
  PatientSession,
} from '../constants';
import { DBOperation, DBRule } from '../configService';
import { applyMpToolsLogic } from './checklistRules';

export interface ChecklistConfig {
  operations: DBOperation[];
  rules: DBRule[];
}

export interface GeneratedChecklist {
  actions: ChecklistItemData[];
  tools: ChecklistItemData[];
  mpSelectedTypes: string[];
}

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]/g, ' ');
}

function matchesOperationKeyword(keyword: string, normalizedText: string): boolean {
  const normalizedKeyword = normalizeText(keyword).trim();
  if (normalizedKeyword.length <= 2) {
    return new RegExp(`\\b${normalizedKeyword}\\b`).test(normalizedText);
  }
  return normalizedText.includes(normalizedKeyword);
}

function markSelected(item: ChecklistItemData | undefined, selectedValue?: string | null): void {
  if (!item) return;
  item.checked = true;
  item.autoPopulated = true;
  if (selectedValue) item.selectedValue = selectedValue;
}

function applyAnesthesiaRules(actions: ChecklistItemData[], session: PatientSession, normalizedText: string): void {
  if (session.anesthesiaType !== ANESTHESIA_TYPES.LA) return;

  const isTxOrGdi = /\btx\b/.test(normalizedText)
    || normalizedText.includes('trabeculectomy')
    || /\bgdi\b/.test(normalizedText)
    || normalizedText.includes('drainage implant')
    || normalizedText.includes('xen');
  const isOculoOrStrabismus = [
    'oculoplastic', 'strabismus', 'squint', 'ptosis', 'frontalis', 'sling',
    'lid', 'entropion', 'ectropion', 'blepharoplasty', 'edcr', 'dcr',
    'sclera', 'amnion', 'amnion graft', 'sclera graft',
  ].some(keyword => normalizedText.includes(keyword));

  if (!isTxOrGdi && !isOculoOrStrabismus) {
    markSelected(actions.find(item => item.id === 'axl'));
  }
}

function applyOperationRules(
  actions: ChecklistItemData[],
  tools: ChecklistItemData[],
  config: ChecklistConfig,
  normalizedText: string,
): boolean {
  let showMp = false;

  for (const operation of config.operations) {
    const operationMatches = matchesOperationKeyword(operation.name, normalizedText)
      || operation.keywords.some(keyword => matchesOperationKeyword(keyword, normalizedText));
    if (!operationMatches) continue;

    for (const rule of config.rules.filter(rule => rule.operation_id === operation.id)) {
      const list = rule.target_type === 'action' ? actions : tools;
      markSelected(list.find(item => item.id === rule.target_id), rule.default_selected_value);
    }

    if (operation.name === 'MP') showMp = true;
    if (operation.category === 'Lens Surgery' || operation.category === 'Retinal Surgery') {
      markSelected(actions.find(item => item.id === 'axl'));
    }

  }

  return showMp;
}

function getMpTypes(session: PatientSession, normalizedText: string, showMp: boolean): string[] {
  const isMpActive = normalizedText.includes('mp')
    || normalizedText.includes('membrane peeling')
    || normalizedText.includes('ilm')
    || showMp;
  if (!isMpActive) return [];

  const diagnoses = session.diagnosis.split(',').map(value => value.trim());
  const types = ['ERM', 'MH', 'TRD', 'RRD'].filter(type =>
    diagnoses.includes(type) || normalizedText.includes(type.toLowerCase()),
  );

  if (normalizedText.includes('epiretinal')) types.push('ERM');
  if (normalizedText.includes('macular hole')) types.push('MH');
  if (normalizedText.includes('ilm')) types.push('ERM');

  return [...new Set(types)];
}

function applySpecialToolRules(tools: ChecklistItemData[], session: PatientSession, normalizedText: string): void {
  const ctr = tools.find(item => item.id === 'ctr-no');
  if (ctr?.checked) ctr.note = 'AXL<24: no.12, AXL 24-28: no.13, AXL>28: no.14';

  if (normalizedText.includes('phaco')) {
    const machine = tools.find(item => item.id === 'phaco-machine');
    if (machine) {
      markSelected(machine);
      const surgeon = normalizeText(session.surgeonName);
      const prefersCenturion = CENTURION_PREFERRED_SURGEONS.some(name =>
        surgeon.includes(normalizeText(name).trim()),
      );
      machine.selectedValue = normalizedText.includes('stellaris')
        ? MACHINE_TYPES.STELLARIS
        : prefersCenturion ? MACHINE_TYPES.CENTURION : MACHINE_TYPES.LEGION;
    }
  }

  const gdi = tools.find(item => item.id === 'glaucoma-device');
  if (gdi) {
    const gdiKeywords: Record<string, string[]> = {
      'ahmed-valve': ['ahmed'],
      'gdi-xen-room': ['xen'],
      'gfd-express': ['express', 'gfd'],
      'preserflo-shunt': ['preserflo'],
      'aadi-shunt': ['aadi'],
    };
    for (const [value, keywords] of Object.entries(gdiKeywords)) {
      if (keywords.some(keyword => normalizedText.includes(keyword))) {
        markSelected(gdi, value);
        break;
      }
    }
  }

  const ppv = tools.find(item => item.id === 'ppv-set');
  if (ppv?.checked) markSelected(tools.find(item => item.id === 'soft-tip'));
}

export function generateChecklist(
  session: PatientSession,
  config: ChecklistConfig,
): GeneratedChecklist {
  const normalizedText = normalizeText(`${session.operationInput} ${session.diagnosis || ''}`);
  const actions: ChecklistItemData[] = session.actions.map(item => ({ ...item, checked: false, autoPopulated: false }));
  let tools: ChecklistItemData[] = session.tools.map(item => ({ ...item, checked: false, autoPopulated: false }));

  applyAnesthesiaRules(actions, session, normalizedText);
  const showMp = applyOperationRules(actions, tools, config, normalizedText);
  const mpTypes = getMpTypes(session, normalizedText, showMp);
  tools = applyMpToolsLogic(tools, mpTypes, session.diagnosis);
  applySpecialToolRules(tools, session, normalizedText);

  return { actions, tools, mpSelectedTypes: mpTypes };
}
