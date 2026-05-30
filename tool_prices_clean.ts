import { MACHINE_TYPES, NEW_REUSED_OPTIONS } from './constants';

export const TOOL_PRICES: any = {
  '15-degree-blade': { name: 'Knife-15 degree (Mani)', CSMBS: 220, SSS: 220, UCS: 220 },
  'slit-knife': { name: 'Slit Knife', CSMBS: 0, SSS: 0, UCS: 0 },
  'crescent-knife': { name: 'Crescent Bevel Up 2.3 mm', CSMBS: 325, SSS: 325, UCS: 325 },
  'centurion-legion': {
    [MACHINE_TYPES.CENTURION]: { name: 'Centurion Gravity Pack', CSMBS: 2140, SSS: 2140, UCS: 2140 },
    [MACHINE_TYPES.LEGION]: { name: 'Legion FMS Basic Pack', CSMBS: 0, SSS: 0, UCS: 0 },
  },
  'zeiss-quattro': {
    'quattro-cassette': { name: 'Quattro Cassette / Zeiss', CSMBS: 1875, SSS: 1875, UCS: 1875 },
    'phaco-set-plus': { name: 'Phaco Set plus 21G Flared 30', CSMBS: 1250, SSS: 1250, UCS: 1250 },
  },
  'basic-phaco-pack': { name: 'Basic Vacuum Phaco Pack BL5111', CSMBS: 1875, SSS: 1875, UCS: 1875 },
  'ctr-no': { name: 'AuroRing/CTR/CTS', CSMBS: 0, SSS: 1381, UCS: 1381 },
  'cts': { name: 'AuroRing/CTR/CTS', CSMBS: 0, SSS: 1381, UCS: 1381 },
  'iris-retractor': { name: 'Iris Retractors', CSMBS: 1565, SSS: 1565, UCS: 1565 },
  'glaucoma-device': {
    'gdi-xen-room': { name: 'Xen Glaucoma gel Implant', CSMBS: 17785, SSS: 19785, UCS: 19785 },
    'ahmed-valve': { name: 'Ahmed Glaucoma Valve', CSMBS: 1660, SSS: 1660, UCS: 1660 },
    'preserflo-shunt': { name: 'Preserflo Microshunt', CSMBS: 23061, SSS: 25061, UCS: 25061 },
    'gfd-express': { name: 'Express GFD / Alcon', CSMBS: 8190, SSS: 10190, UCS: 10190 },
    'aadi-shunt': { name: 'Glaucoma shunt AADI (Sale ฿6,500)', CSMBS: 0, SSS: 0, UCS: 0 },
  },
  'ppv-set': {
    '23G_Constellation': { name: 'Constellation 23G Vitrectomy', CSMBS: 2150, SSS: 2150, UCS: 2150 },
    '25G_Constellation': { name: 'Constellation 25G Vitrectomy', CSMBS: 2150, SSS: 2150, UCS: 2150 },
    '23G_Stellaris': { name: 'Stellaris Vitrectomy Set 23 G', CSMBS: 2150, SSS: 2150, UCS: 2150 },
    '25G_Stellaris': { name: 'Stellaris Vitrectomy Set 25 G', CSMBS: 2150, SSS: 2150, UCS: 2150 },
  },
  'ilm-forceps': { name: 'ILM Forcep Tip', CSMBS: 3600, SSS: 6300, UCS: 6300 },
  'micro-scissor': { name: 'Microscissors', CSMBS: 3600, SSS: 6300, UCS: 6300 },
  'bbg': { name: 'Ocublue 0.05% (BBG Solution)', CSMBS: 910, SSS: 910, UCS: 910 },
  'silicone-oil': { name: 'Oxane Silicone Oil', CSMBS: 400, SSS: 400, UCS: 400 },
  'silicone-oil-hd': { name: 'Oxane HD (Heavy Oil)', CSMBS: 8500, SSS: 8500, UCS: 8500 },
  'endolaser': { name: 'Endolaser', CSMBS: 2500, SSS: 2500, UCS: 2500 },
  'dk-line': { name: 'DK Line 5 ml (Sale ฿5,700)', CSMBS: 0, SSS: 0, UCS: 0 },
  'soft-tip': { name: 'Soft Tip', CSMBS: 514, SSS: 514, UCS: 514 },
  'punch-trephine': { name: 'Punch & Trephine', CSMBS: 0, SSS: 0, UCS: 0 },
  '5fu': { name: '5FU', CSMBS: 0, SSS: 0, UCS: 0 },
  'fibrin-glue': { name: 'Fibrin glue', CSMBS: 0, SSS: 0, UCS: 0 },
};