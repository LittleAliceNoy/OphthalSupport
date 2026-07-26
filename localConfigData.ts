import { DBTool, DBAction, DBOperation, DBRule, DBPrice } from './configService';

export const FALLBACK_ACTIONS: DBAction[] = [
  {
    "id": "axl",
    "item": "วัด AXL",
    "is_active": true
  },
  {
    "id": "iol",
    "item": "วัด IOL",
    "is_active": true
  },
  {
    "id": "b-scan",
    "item": "B-scan",
    "is_active": true
  },
  {
    "id": "oct-macula",
    "item": "OCT macula / ONH / GCC",
    "is_active": true
  },
  {
    "id": "anterior-photo",
    "item": "Anterior photo",
    "is_active": true
  },
  {
    "id": "posterior-photo",
    "item": "posterior photo",
    "is_active": true
  },
  {
    "id": "sclera-amnion-eye-bank",
    "item": "จอง Sclera/Amnion (Eye bank)",
    "is_active": true
  },
  {
    "id": "iop",
    "item": "วัด IOP",
    "is_active": true
  },
  {
    "id": "measure-strabismus",
    "item": "ส่งวัดมุมเข",
    "is_active": true
  },
  {
    "id": "photo-oculoplastic",
    "item": "ถ่ายรูป oculoplastic",
    "is_active": true
  },
  {
    "id": "irrigation-probing",
    "item": "Irrigation & Probing",
    "is_active": true
  },
  {
    "id": "key-mmc",
    "item": "Key MMC",
    "is_active": true
  }
];

export const FALLBACK_TOOLS: DBTool[] = [
  {
    "id": "soft-tip",
    "item": "Soft tip",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "ppv-set",
    "item": "PPV set",
    "type": "radio",
    "options": [
      {
        "label": "Constellation",
        "value": "Constellation"
      },
      {
        "label": "Stellaris",
        "value": "Stellaris"
      }
    ],
    "default_value": "Stellaris",
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "glaucoma-device",
    "item": "Glaucoma Drainage Device (GDD)",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Glaucoma"
  },
  {
    "id": "endolaser",
    "item": "Endolaser",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "silicone-oil-hd",
    "item": "Silicone Oil HD",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "silicone-oil",
    "item": "Silicone oil",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "ilm-forceps",
    "item": "ILM forceps",
    "type": "radio",
    "options": [
      {
        "label": "New",
        "value": "New"
      },
      {
        "label": "Reused",
        "value": "Reused"
      }
    ],
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "bbg",
    "item": "BBG",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "micro-scissor",
    "item": "Micro-scissor",
    "type": "radio",
    "options": [
      {
        "label": "New",
        "value": "New"
      },
      {
        "label": "Reused",
        "value": "Reused"
      }
    ],
    "default_value": null,
    "is_active": true,
    "sort_order": 0,
    "category": "Retinal Surgery"
  },
  {
    "id": "phaco-machine",
    "item": "Phaco Machine",
    "type": "radio",
    "options": [
      {
        "label": "Centurion",
        "value": "Centurion"
      },
      {
        "label": "Legion",
        "value": "Legion"
      },
      {
        "label": "Stellaris",
        "value": "Stellaris"
      }
    ],
    "default_value": null,
    "is_active": true,
    "sort_order": 10,
    "category": "Lens Surgery"
  },
  {
    "id": "15-degree-blade",
    "item": "15 degree blade",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 10,
    "category": "Generals"
  },
  {
    "id": "punch-trephine",
    "item": "Punch & Trephine",
    "type": "number-input",
    "options": [
      {
        "label": "New",
        "value": "New"
      },
      {
        "label": "Reused",
        "value": "Reused"
      }
    ],
    "default_value": [
      "",
      ""
    ],
    "is_active": true,
    "sort_order": 20,
    "category": "Cornea"
  },
  {
    "id": "ctr-no",
    "item": "CTR",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 20,
    "category": "Lens Surgery"
  },
  {
    "id": "crescent-knife",
    "item": "Crescent Knife",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 20,
    "category": "Generals"
  },
  {
    "id": "slit-knife",
    "item": "Slit Knife",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 30,
    "category": "Generals"
  },
  {
    "id": "cts",
    "item": "CTS",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 30,
    "category": "Lens Surgery"
  },
  {
    "id": "iris-retractor",
    "item": "Iris retractor",
    "type": "radio",
    "options": [
      {
        "label": "New",
        "value": "New"
      },
      {
        "label": "Reused",
        "value": "Reused"
      }
    ],
    "default_value": null,
    "is_active": true,
    "sort_order": 40,
    "category": "Lens Surgery"
  },
  {
    "id": "5fu",
    "item": "5FU",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 40,
    "category": "Generals"
  },
  {
    "id": "fibrin-glue",
    "item": "Fibrin glue",
    "type": "checkbox",
    "options": null,
    "default_value": null,
    "is_active": true,
    "sort_order": 50,
    "category": "Generals"
  }
];

export const FALLBACK_OPERATIONS: DBOperation[] = [
  {
    "id": "0f0070c4-9cf4-46fc-8b9e-a22812154b69",
    "name": "Phaco",
    "category": "Lens Surgery",
    "keywords": [
      "Phaco",
      "PHACO"
    ]
  },
  {
    "id": "f6272761-f9a1-4d03-81c5-e5e566b22bfb",
    "name": "IOL",
    "category": "Lens Surgery",
    "keywords": [
      "IOL"
    ]
  },
  {
    "id": "ab8587d7-0be0-4bf1-9166-a97da17dea82",
    "name": "ECCE",
    "category": "Lens Surgery",
    "keywords": [
      "ECCE"
    ]
  },
  {
    "id": "afdc2a7f-34ba-4de7-9e2a-7f08435baf95",
    "name": "SF-IOL",
    "category": "Lens Surgery",
    "keywords": [
      "SF-IOL",
      "Sf + iol",
      "SF IOL",
      "SFIOL"
    ]
  },
  {
    "id": "84f5ab9f-7544-4345-a6f3-ca8f63f4bac0",
    "name": "CTR",
    "category": "Lens Surgery",
    "keywords": [
      "CTR",
      "Capsular tension ring"
    ]
  },
  {
    "id": "463d998d-e616-4fa9-a6d6-36619995ed70",
    "name": "CTS",
    "category": "Lens Surgery",
    "keywords": [
      "CTS",
      "Capsular tension segment"
    ]
  },
  {
    "id": "469c2b5f-56b6-4517-b82a-025600e81cfc",
    "name": "Iris retractor",
    "category": "Lens Surgery",
    "keywords": [
      "Iris retractor",
      "Iris retractors"
    ]
  },
  {
    "id": "e38965a9-0b1a-4aa2-8cc3-c4363caee185",
    "name": "PPV",
    "category": "Retinal Surgery",
    "keywords": [
      "PPV",
      "Vitrectomy"
    ]
  },
  {
    "id": "ab87aa65-e35c-42cd-8780-953b607d5b1e",
    "name": "MP",
    "category": "Retinal Surgery",
    "keywords": [
      "MP",
      "Membrane peeling",
      "ILM"
    ]
  },
  {
    "id": "121250f6-3947-41a3-9faa-a4ac980aa8e3",
    "name": "SO",
    "category": "Retinal Surgery",
    "keywords": [
      "SO",
      "SOI",
      "Silicone oil injection"
    ]
  },
  {
    "id": "3540dc5c-56fa-42d7-8132-3ee3d8fc803b",
    "name": "HD SO",
    "category": "Retinal Surgery",
    "keywords": [
      "HD SO",
      "Heavy SO",
      "Heavy Silicone Oil"
    ]
  },
  {
    "id": "7f72ab40-d3c3-44f9-99a2-6ec9511179fd",
    "name": "EL",
    "category": "Retinal Surgery",
    "keywords": [
      "EL",
      "Endolaser"
    ]
  },
  {
    "id": "26a03aa4-7293-4fb1-b0e1-098bdb1a2db1",
    "name": "GDI",
    "category": "Glaucoma",
    "keywords": [
      "GDI",
      "GD",
      "Drainage implant",
      "XEN",
      "Ahmed",
      "Preserflo",
      "gfd express",
      "aadi shunt"
    ]
  },
  {
    "id": "886305d2-e492-4393-b66b-e9ad17268599",
    "name": "Tx + MMC",
    "category": "Glaucoma",
    "keywords": [
      "Tx+MMC",
      "Tx + MMC"
    ]
  },
  {
    "id": "1ae1c05a-a51e-4fa4-ae7a-99e93cfb9e9c",
    "name": "PKP",
    "category": "Cornea",
    "keywords": [
      "PKP",
      "Keratoplasty"
    ]
  },
  {
    "id": "f40a74b6-fa76-4b39-bdb1-0a4cc52cfd30",
    "name": "Sclera/Amnion",
    "category": "Cornea",
    "keywords": [
      "Sclera graft",
      "Scleral graft",
      "Amnion graft",
      "AMT"
    ]
  },
  {
    "id": "39cabb14-f483-440a-8ad4-cb921f4bbe8c",
    "name": "EDCR",
    "category": "Oculoplastics and Strabismus",
    "keywords": [
      "EDCR",
      "DCR"
    ]
  },
  {
    "id": "4202600b-6ed6-44c3-b2a5-6fec07809768",
    "name": "Oculoplastic",
    "category": "Oculoplastics and Strabismus",
    "keywords": [
      "Oculoplastic",
      "Frontalis",
      "Sling",
      "Ptosis",
      "Lid",
      "Entropion",
      "Ectropion",
      "Blepharoplasty"
    ]
  },
  {
    "id": "f53a7264-a603-41d9-b799-5034aa91986b",
    "name": "Strabismus",
    "category": "Oculoplastics and Strabismus",
    "keywords": [
      "Strabismus",
      "Squint",
      "Muscle",
      "Recession",
      "Resection"
    ]
  }
];

export const FALLBACK_RULES: DBRule[] = [
  {
    "id": "d965258d-ca60-4393-af74-77dace76df0b",
    "operation_id": "0f0070c4-9cf4-46fc-8b9e-a22812154b69",
    "target_type": "tool",
    "target_id": "slit-knife",
    "default_selected_value": null
  },
  {
    "id": "5b598882-8d6d-4746-a8f8-3f6ceef8b9c8",
    "operation_id": "0f0070c4-9cf4-46fc-8b9e-a22812154b69",
    "target_type": "action",
    "target_id": "axl",
    "default_selected_value": null
  },
  {
    "id": "83dab063-3b4d-48d7-9245-dc972a42ebc1",
    "operation_id": "f6272761-f9a1-4d03-81c5-e5e566b22bfb",
    "target_type": "action",
    "target_id": "iol",
    "default_selected_value": null
  },
  {
    "id": "eaeec71f-48ba-4775-804c-ddbae629f951",
    "operation_id": "ab8587d7-0be0-4bf1-9166-a97da17dea82",
    "target_type": "tool",
    "target_id": "slit-knife",
    "default_selected_value": null
  },
  {
    "id": "c6ff19bc-93ae-4352-a7f9-fe0bc31f3e04",
    "operation_id": "ab8587d7-0be0-4bf1-9166-a97da17dea82",
    "target_type": "tool",
    "target_id": "15-degree-blade",
    "default_selected_value": null
  },
  {
    "id": "df65b966-401a-4523-9acf-54c9c3d9df40",
    "operation_id": "ab8587d7-0be0-4bf1-9166-a97da17dea82",
    "target_type": "action",
    "target_id": "axl",
    "default_selected_value": null
  },
  {
    "id": "3f859298-9e9c-4108-a4a9-6420b48de077",
    "operation_id": "afdc2a7f-34ba-4de7-9e2a-7f08435baf95",
    "target_type": "tool",
    "target_id": "slit-knife",
    "default_selected_value": null
  },
  {
    "id": "6cc310f4-763b-49ad-8cf0-1ef4179bf757",
    "operation_id": "afdc2a7f-34ba-4de7-9e2a-7f08435baf95",
    "target_type": "tool",
    "target_id": "15-degree-blade",
    "default_selected_value": null
  },
  {
    "id": "dc96e8a7-8940-41cd-b405-d65610e19797",
    "operation_id": "afdc2a7f-34ba-4de7-9e2a-7f08435baf95",
    "target_type": "action",
    "target_id": "iol",
    "default_selected_value": null
  },
  {
    "id": "3c7ddae8-00f7-4d46-b0f4-6935850aecec",
    "operation_id": "84f5ab9f-7544-4345-a6f3-ca8f63f4bac0",
    "target_type": "tool",
    "target_id": "ctr-no",
    "default_selected_value": null
  },
  {
    "id": "7b91d504-7b55-4882-98cf-7639c0fde987",
    "operation_id": "463d998d-e616-4fa9-a6d6-36619995ed70",
    "target_type": "tool",
    "target_id": "cts",
    "default_selected_value": null
  },
  {
    "id": "f68f14e4-e27b-4761-b873-14bb228e2fda",
    "operation_id": "469c2b5f-56b6-4517-b82a-025600e81cfc",
    "target_type": "tool",
    "target_id": "iris-retractor",
    "default_selected_value": null
  },
  {
    "id": "d504cad1-7ddc-412b-a126-9ced16638952",
    "operation_id": "e38965a9-0b1a-4aa2-8cc3-c4363caee185",
    "target_type": "tool",
    "target_id": "ppv-set",
    "default_selected_value": null
  },
  {
    "id": "47c4cfce-a3b0-40ac-894b-98b766640882",
    "operation_id": "121250f6-3947-41a3-9faa-a4ac980aa8e3",
    "target_type": "tool",
    "target_id": "silicone-oil",
    "default_selected_value": null
  },
  {
    "id": "3b945cdc-8403-4113-9ec1-e120521fd02d",
    "operation_id": "3540dc5c-56fa-42d7-8132-3ee3d8fc803b",
    "target_type": "tool",
    "target_id": "silicone-oil-hd",
    "default_selected_value": null
  },
  {
    "id": "50f69230-b3f6-40c0-b17b-1d24fa1ecf17",
    "operation_id": "7f72ab40-d3c3-44f9-99a2-6ec9511179fd",
    "target_type": "tool",
    "target_id": "endolaser",
    "default_selected_value": null
  },
  {
    "id": "12cef008-eb7b-4ca4-bb54-d4d4a60cc361",
    "operation_id": "26a03aa4-7293-4fb1-b0e1-098bdb1a2db1",
    "target_type": "tool",
    "target_id": "glaucoma-device",
    "default_selected_value": null
  },
  {
    "id": "5bc3a03d-02e6-4ec2-bd51-9133d053143d",
    "operation_id": "26a03aa4-7293-4fb1-b0e1-098bdb1a2db1",
    "target_type": "tool",
    "target_id": "15-degree-blade",
    "default_selected_value": null
  },
  {
    "id": "c9f0d026-60d2-46f2-af86-ada9bde61d35",
    "operation_id": "26a03aa4-7293-4fb1-b0e1-098bdb1a2db1",
    "target_type": "action",
    "target_id": "iop",
    "default_selected_value": null
  },
  {
    "id": "b34d4fa1-9fa0-4f1c-b2f4-54aede53c9ab",
    "operation_id": "26a03aa4-7293-4fb1-b0e1-098bdb1a2db1",
    "target_type": "action",
    "target_id": "sclera-amnion-eye-bank",
    "default_selected_value": null
  },
  {
    "id": "37f8c84d-6fe7-4e35-aa48-893a736e0482",
    "operation_id": "886305d2-e492-4393-b66b-e9ad17268599",
    "target_type": "tool",
    "target_id": "15-degree-blade",
    "default_selected_value": null
  },
  {
    "id": "d032c7d0-c5dc-4d30-9049-df3de3067379",
    "operation_id": "886305d2-e492-4393-b66b-e9ad17268599",
    "target_type": "action",
    "target_id": "iop",
    "default_selected_value": null
  },
  {
    "id": "8c46a12d-62cc-4a96-9601-c868816b5514",
    "operation_id": "886305d2-e492-4393-b66b-e9ad17268599",
    "target_type": "action",
    "target_id": "key-mmc",
    "default_selected_value": null
  },
  {
    "id": "9fe01bcc-38d7-47ca-a664-5bb13ed87b39",
    "operation_id": "1ae1c05a-a51e-4fa4-ae7a-99e93cfb9e9c",
    "target_type": "tool",
    "target_id": "15-degree-blade",
    "default_selected_value": null
  },
  {
    "id": "4d4cda37-88c6-4693-a9d5-43ba1483f280",
    "operation_id": "1ae1c05a-a51e-4fa4-ae7a-99e93cfb9e9c",
    "target_type": "tool",
    "target_id": "punch-trephine",
    "default_selected_value": null
  },
  {
    "id": "075148c9-481a-4597-bb17-b1b8df8abbc5",
    "operation_id": "1ae1c05a-a51e-4fa4-ae7a-99e93cfb9e9c",
    "target_type": "action",
    "target_id": "sclera-amnion-eye-bank",
    "default_selected_value": null
  },
  {
    "id": "345f7780-2b8b-4c0a-86e3-8bce10a8f2e3",
    "operation_id": "1ae1c05a-a51e-4fa4-ae7a-99e93cfb9e9c",
    "target_type": "action",
    "target_id": "anterior-photo",
    "default_selected_value": null
  },
  {
    "id": "e68f754b-dc92-4315-b362-dde01d4dc46d",
    "operation_id": "f40a74b6-fa76-4b39-bdb1-0a4cc52cfd30",
    "target_type": "action",
    "target_id": "sclera-amnion-eye-bank",
    "default_selected_value": null
  },
  {
    "id": "c228bdf8-29a3-4b22-ad87-d0258d466578",
    "operation_id": "39cabb14-f483-440a-8ad4-cb921f4bbe8c",
    "target_type": "tool",
    "target_id": "slit-knife",
    "default_selected_value": null
  },
  {
    "id": "c928eaf1-d957-4132-afa0-464dc074fe90",
    "operation_id": "39cabb14-f483-440a-8ad4-cb921f4bbe8c",
    "target_type": "tool",
    "target_id": "crescent-knife",
    "default_selected_value": null
  },
  {
    "id": "05f45653-4595-4df7-832e-b3554bf74c76",
    "operation_id": "39cabb14-f483-440a-8ad4-cb921f4bbe8c",
    "target_type": "action",
    "target_id": "irrigation-probing",
    "default_selected_value": null
  },
  {
    "id": "c68e9d65-f1b0-4235-93fa-50f527a2bb8a",
    "operation_id": "4202600b-6ed6-44c3-b2a5-6fec07809768",
    "target_type": "action",
    "target_id": "photo-oculoplastic",
    "default_selected_value": null
  },
  {
    "id": "2a7785ed-b10a-4b1c-bcc3-06b42d0f3b57",
    "operation_id": "f53a7264-a603-41d9-b799-5034aa91986b",
    "target_type": "action",
    "target_id": "measure-strabismus",
    "default_selected_value": null
  },
  {
    "id": "1523d787-8041-47bb-899e-d5656665d742",
    "operation_id": "0f0070c4-9cf4-46fc-8b9e-a22812154b69",
    "target_type": "tool",
    "target_id": "phaco-machine",
    "default_selected_value": null
  }
];

export const FALLBACK_PRICES: DBPrice[] = [
  {
    "id": "0ed920a9-ec10-4905-8e78-81cd51db1ccb",
    "tool_id": "15-degree-blade",
    "sub_key": null,
    "csmbs_price": 220,
    "sss_price": 220,
    "ucs_price": 220,
    "display_name": null
  },
  {
    "id": "bf468cd9-fe06-49bc-9fc9-17c13f8cd0bb",
    "tool_id": "crescent-knife",
    "sub_key": null,
    "csmbs_price": 325,
    "sss_price": 325,
    "ucs_price": 325,
    "display_name": null
  },
  {
    "id": "e7b7f502-da2f-4ed4-a0a0-39da110b2450",
    "tool_id": "iris-retractor",
    "sub_key": null,
    "csmbs_price": 1565,
    "sss_price": 1565,
    "ucs_price": 1565,
    "display_name": null
  },
  {
    "id": "a2b11a2e-c5bd-48b5-8b30-4b26360fe7a0",
    "tool_id": "glaucoma-device",
    "sub_key": "gdi-xen-room",
    "csmbs_price": 17785,
    "sss_price": 19785,
    "ucs_price": 19785,
    "display_name": null
  },
  {
    "id": "585e45b6-3db8-453c-aeb5-4a17c04e7a2a",
    "tool_id": "glaucoma-device",
    "sub_key": "preserflo-shunt",
    "csmbs_price": 23061,
    "sss_price": 25061,
    "ucs_price": 25061,
    "display_name": null
  },
  {
    "id": "be311baf-52c7-47eb-a99e-cfe7ab0b6f4d",
    "tool_id": "ilm-forceps",
    "sub_key": null,
    "csmbs_price": 3600,
    "sss_price": 6300,
    "ucs_price": 6300,
    "display_name": null
  },
  {
    "id": "0eb5a4d5-43a3-4207-ac18-f747348f1ceb",
    "tool_id": "micro-scissor",
    "sub_key": null,
    "csmbs_price": 3600,
    "sss_price": 6300,
    "ucs_price": 6300,
    "display_name": null
  },
  {
    "id": "f6c3390f-d6e9-4678-be86-554b19a793de",
    "tool_id": "bbg",
    "sub_key": null,
    "csmbs_price": 910,
    "sss_price": 910,
    "ucs_price": 910,
    "display_name": null
  },
  {
    "id": "113d0d32-3ada-4288-b460-1130642614fa",
    "tool_id": "silicone-oil",
    "sub_key": null,
    "csmbs_price": 400,
    "sss_price": 400,
    "ucs_price": 400,
    "display_name": null
  },
  {
    "id": "6e2d2b23-0043-4d50-8ef1-f93d19c12d2f",
    "tool_id": "silicone-oil-hd",
    "sub_key": null,
    "csmbs_price": 8500,
    "sss_price": 8500,
    "ucs_price": 8500,
    "display_name": null
  },
  {
    "id": "97119f2c-a058-414a-a0a3-a77793effbb2",
    "tool_id": "endolaser",
    "sub_key": null,
    "csmbs_price": 2500,
    "sss_price": 2500,
    "ucs_price": 2500,
    "display_name": null
  },
  {
    "id": "7a5343c7-1ccb-4d75-9af5-5dfc38c8bf50",
    "tool_id": "punch-trephine",
    "sub_key": null,
    "csmbs_price": 12000,
    "sss_price": 12000,
    "ucs_price": 12000,
    "display_name": null
  },
  {
    "id": "6848aa64-30c3-4fe3-9bc4-be69860e1536",
    "tool_id": "fibrin-glue",
    "sub_key": null,
    "csmbs_price": 0,
    "sss_price": 0,
    "ucs_price": 0,
    "display_name": null
  },
  {
    "id": "455f972f-35a7-4515-8f88-a0a8b37d55c4",
    "tool_id": "5fu",
    "sub_key": null,
    "csmbs_price": 0,
    "sss_price": 0,
    "ucs_price": 0,
    "display_name": null
  },
  {
    "id": "0f8b73dc-bed1-4e10-a389-0522f18c97ba",
    "tool_id": "ctr-no",
    "sub_key": null,
    "csmbs_price": 0,
    "sss_price": 1381,
    "ucs_price": 1381,
    "display_name": "Capsular Tension Ring"
  },
  {
    "id": "c973ccc5-00dc-4376-846b-ca2887abbeef",
    "tool_id": "cts",
    "sub_key": null,
    "csmbs_price": 0,
    "sss_price": 1381,
    "ucs_price": 1381,
    "display_name": "Capsular Tension Segment"
  },
  {
    "id": "0d705f9e-a2dd-4208-88ed-ccc743dc29cc",
    "tool_id": "soft-tip",
    "sub_key": null,
    "csmbs_price": 514,
    "sss_price": 514,
    "ucs_price": 514,
    "display_name": "Soft tip"
  },
  {
    "id": "d7320b52-f98b-4bdf-81c9-53180760b582",
    "tool_id": "glaucoma-device",
    "sub_key": "ahmed-valve",
    "csmbs_price": 1660,
    "sss_price": 1660,
    "ucs_price": 1660,
    "display_name": "Ahmed Glaucoma Valve"
  },
  {
    "id": "bcb7496d-40d5-4d9e-842c-f1bac38e00b7",
    "tool_id": "glaucoma-device",
    "sub_key": "gfd-express",
    "csmbs_price": 8190,
    "sss_price": 10190,
    "ucs_price": 10190,
    "display_name": "Express GFD"
  },
  {
    "id": "b0e1d689-23d4-4bcf-943f-9f4527438136",
    "tool_id": "glaucoma-device",
    "sub_key": "aadi-shunt",
    "csmbs_price": 0,
    "sss_price": 0,
    "ucs_price": 0,
    "display_name": "AADI shunt"
  },
  {
    "id": "5b73154a-f83c-491f-80e0-b8e3df316f46",
    "tool_id": "phaco-machine",
    "sub_key": "Centurion",
    "csmbs_price": 2140,
    "sss_price": 2140,
    "ucs_price": 2140,
    "display_name": "Centurion"
  },
  {
    "id": "5476a323-b97a-494a-af0f-6f049b1d111f",
    "tool_id": "phaco-machine",
    "sub_key": "Legion",
    "csmbs_price": 0,
    "sss_price": 0,
    "ucs_price": 0,
    "display_name": "Legion"
  },
  {
    "id": "1236552d-6913-4889-9c33-402a4c1ca5d9",
    "tool_id": "phaco-machine",
    "sub_key": "Stellaris",
    "csmbs_price": 1875,
    "sss_price": 1875,
    "ucs_price": 1875,
    "display_name": "Stellaris phaco"
  },
  {
    "id": "23c70856-3494-4cc1-88b8-9442519fd46e",
    "tool_id": "slit-knife",
    "sub_key": null,
    "csmbs_price": 0,
    "sss_price": 0,
    "ucs_price": 0,
    "display_name": "Slit Knife"
  },
  {
    "id": "b0a0c5bb-6829-4c95-ae9d-07622f6084b6",
    "tool_id": "ppv-set",
    "sub_key": "23G_Constellation",
    "csmbs_price": 2150,
    "sss_price": 2150,
    "ucs_price": 2150,
    "display_name": "23G Constellation"
  },
  {
    "id": "2921d198-4040-4d9f-aa06-4a71cadca6fa",
    "tool_id": "ppv-set",
    "sub_key": "23G_Stellaris",
    "csmbs_price": 2150,
    "sss_price": 2150,
    "ucs_price": 2150,
    "display_name": "23G Stellaris"
  },
  {
    "id": "089beefe-0e42-44eb-8580-6038a497e1d7",
    "tool_id": "ppv-set",
    "sub_key": "25G_Stellaris",
    "csmbs_price": 2150,
    "sss_price": 2150,
    "ucs_price": 2150,
    "display_name": "25G Stellaris"
  },
  {
    "id": "41a64013-a8ed-4b22-95e1-0af265159bbc",
    "tool_id": "ppv-set",
    "sub_key": "25G_Constellation",
    "csmbs_price": 2150,
    "sss_price": 2150,
    "ucs_price": 2150,
    "display_name": "25G Constellation"
  }
];
