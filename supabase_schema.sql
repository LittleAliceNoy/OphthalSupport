-- Supabase Database Schema and Initial Seed Data
-- Copy and paste this script directly into the Supabase SQL Editor to configure your database.

-- 1. Create Tables
create table if not exists tools (
    id text primary key,
    item text not null,
    type text not null,
    options jsonb,
    default_value jsonb,
    sort_order integer,
    category text,
    is_active boolean default true
);

create table if not exists actions (
    id text primary key,
    item text not null,
    is_active boolean default true
);

create table if not exists operations (
    id text primary key default gen_random_uuid(),
    name text not null,
    category text not null,
    keywords text[] not null,
    sort_order integer
);
alter table operations add column if not exists sort_order integer;

create table if not exists operation_rules (
    id text primary key default gen_random_uuid(),
    operation_id text references operations(id) on delete cascade,
    target_type text not null check (target_type in ('tool', 'action')),
    target_id text not null,
    default_selected_value text
);

create table if not exists tool_prices (
    id text primary key default gen_random_uuid(),
    tool_id text references tools(id) on delete cascade,
    sub_key text,
    csmbs_price numeric not null default 0,
    sss_price numeric not null default 0,
    ucs_price numeric not null default 0,
    display_name text
);

-- Enable Row Level Security (RLS) or public access if desired.
-- For a quick demo/testing setup, we can disable RLS or allow all public reads/writes:
alter table tools disable row level security;
alter table actions disable row level security;
alter table operations disable row level security;
alter table operation_rules disable row level security;
alter table tool_prices disable row level security;

-- 2. Clear Existing Data (Optional/Fresh Start)
truncate table operation_rules cascade;
truncate table tool_prices cascade;
truncate table operations cascade;
truncate table actions cascade;
truncate table tools cascade;

-- 3. Seed Actions Table
insert into actions (id, item) values
('axl', 'วัด AXL'),
('iol', 'วัด IOL'),
('b-scan', 'B-scan'),
('oct-macula', 'OCT macula / ONH / GCC'),
('anterior-photo', 'Anterior photo'),
('posterior-photo', 'posterior photo'),
('sclera-amnion-eye-bank', 'จอง Sclera/Amnion (Eye bank)'),
('iop', 'วัด IOP'),
('measure-strabismus', 'ส่งวัดมุมเข'),
('photo-oculoplastic', 'ถ่ายรูป oculoplastic'),
('irrigation-probing', 'Irrigation & Probing'),
('key-mmc', 'Key MMC');

-- 4. Seed Tools Table
-- Keep this seed aligned with toolCatalog.ts (the application canonical catalog).
-- The SQL mirror intentionally contains no legacy `mm` tool.
insert into tools (id, item, type, options, default_value, sort_order, category) values
('ppv-set', 'PPV set', 'radio', '[{"label": "Constellation", "value": "Constellation"}, {"label": "Stellaris", "value": "Stellaris"}]'::jsonb, '"Stellaris"'::jsonb, 1, 'Retinal Surgery'),
('soft-tip', 'Soft tip', 'checkbox', null, null, 2, 'Retinal Surgery'),
('15-degree-blade', '15 degree blade', 'checkbox', null, null, 3, 'Generals'),
('slit-knife', 'Slit Knife', 'checkbox', null, null, 4, 'Generals'),
('crescent-knife', 'Crescent Knife', 'checkbox', null, null, 5, 'Generals'),
('punch-trephine', 'Punch & Trephine', 'number-input', null, '["", ""]'::jsonb, 6, 'Cornea'),
('cts', 'CTS', 'checkbox', null, null, 7, 'Lens Surgery'),
('glaucoma-device', 'Glaucoma Drainage Device (GDD)', 'checkbox', null, null, 8, 'Glaucoma'),
('ctr-no', 'CTR No.', 'checkbox', null, null, 9, 'Lens Surgery'),
('micro-scissor', 'Micro-scissor', 'radio', '[{"label": "New", "value": "New"}, {"label": "Reused", "value": "Reused"}]'::jsonb, null, 10, 'Retinal Surgery'),
('bbg', 'BBG', 'checkbox', null, null, 11, 'Retinal Surgery'),
('ilm-forceps', 'ILM forceps', 'radio', '[{"label": "New", "value": "New"}, {"label": "Reused", "value": "Reused"}]'::jsonb, null, 12, 'Retinal Surgery'),
('silicone-oil', 'Silicone oil', 'checkbox', null, null, 13, 'Retinal Surgery'),
('silicone-oil-hd', 'Silicone Oil HD', 'checkbox', null, null, 14, 'Retinal Surgery'),
('endolaser', 'Endolaser', 'checkbox', null, null, 15, 'Retinal Surgery'),
('phaco-machine', 'Phaco Machine', 'radio', '[{"label": "Centurion", "value": "Centurion"}, {"label": "Legion", "value": "Legion"}, {"label": "Stellaris", "value": "Stellaris"}]'::jsonb, null, 16, 'Lens Surgery'),
('iris-retractor', 'Iris retractor', 'radio', '[{"label": "New", "value": "New"}, {"label": "Reused", "value": "Reused"}]'::jsonb, null, 17, 'Lens Surgery'),
('5fu', '5FU', 'checkbox', null, null, 18, 'Generals'),
('fibrin-glue', 'Fibrin glue', 'checkbox', null, null, 19, 'Generals');

-- 5. Seed Operations and Rules (Use transaction to map rules to operation IDs)
do $$
declare
    op_phaco text;
    op_iol text;
    op_ecce text;
    op_sfiol text;
    op_ctr text;
    op_cts text;
    op_iris text;
    op_ppv text;
    op_mp text;
    op_so text;
    op_hdso text;
    op_el text;
    op_gdi text;
    op_txmmc text;
    op_pkp text;
    op_sclera text;
    op_edcr text;
    op_oculo text;
    op_strab text;
begin
    -- Operations
    insert into operations (name, category, keywords) values ('Phaco', 'Lens Surgery', ARRAY['Phaco', 'PHACO']) returning id into op_phaco;
    insert into operations (name, category, keywords) values ('IOL', 'Lens Surgery', ARRAY['IOL']) returning id into op_iol;
    insert into operations (name, category, keywords) values ('ECCE', 'Lens Surgery', ARRAY['ECCE']) returning id into op_ecce;
    insert into operations (name, category, keywords) values ('SF-IOL', 'Lens Surgery', ARRAY['SF-IOL', 'Sf + iol', 'SF IOL', 'SFIOL']) returning id into op_sfiol;
    insert into operations (name, category, keywords) values ('CTR', 'Lens Surgery', ARRAY['CTR', 'Capsular tension ring']) returning id into op_ctr;
    insert into operations (name, category, keywords) values ('CTS', 'Lens Surgery', ARRAY['CTS', 'Capsular tension segment']) returning id into op_cts;
    insert into operations (name, category, keywords) values ('Iris retractor', 'Lens Surgery', ARRAY['Iris retractor', 'Iris retractors']) returning id into op_iris;
    insert into operations (name, category, keywords) values ('PPV', 'Retinal Surgery', ARRAY['PPV', 'Vitrectomy']) returning id into op_ppv;
    insert into operations (name, category, keywords) values ('MP', 'Retinal Surgery', ARRAY['MP', 'Membrane peeling', 'ILM']) returning id into op_mp;
    insert into operations (name, category, keywords) values ('SO', 'Retinal Surgery', ARRAY['SO', 'SOI', 'Silicone oil injection']) returning id into op_so;
    insert into operations (name, category, keywords) values ('HD SO', 'Retinal Surgery', ARRAY['HD SO', 'Heavy SO', 'Heavy Silicone Oil']) returning id into op_hdso;
    insert into operations (name, category, keywords) values ('EL', 'Retinal Surgery', ARRAY['EL', 'Endolaser']) returning id into op_el;
    insert into operations (name, category, keywords) values ('GDI', 'Glaucoma', ARRAY['GDI', 'GD', 'Drainage implant', 'XEN', 'Ahmed', 'Preserflo', 'gfd express', 'aadi shunt']) returning id into op_gdi;
    insert into operations (name, category, keywords) values ('Tx + MMC', 'Glaucoma', ARRAY['Tx+MMC', 'Tx + MMC']) returning id into op_txmmc;
    insert into operations (name, category, keywords) values ('PKP', 'Cornea', ARRAY['PKP', 'Keratoplasty']) returning id into op_pkp;
    insert into operations (name, category, keywords) values ('Sclera/Amnion', 'Cornea', ARRAY['Sclera graft', 'Scleral graft', 'Amnion graft', 'AMT']) returning id into op_sclera;
    insert into operations (name, category, keywords) values ('EDCR', 'Oculoplastics and Strabismus', ARRAY['EDCR', 'DCR']) returning id into op_edcr;
    insert into operations (name, category, keywords) values ('Oculoplastic', 'Oculoplastics and Strabismus', ARRAY['Oculoplastic', 'Frontalis', 'Sling', 'Ptosis', 'Lid', 'Entropion', 'Ectropion', 'Blepharoplasty']) returning id into op_oculo;
    insert into operations (name, category, keywords) values ('Strabismus', 'Oculoplastics and Strabismus', ARRAY['Strabismus', 'Squint', 'Muscle', 'Recession', 'Resection']) returning id into op_strab;

    -- Rules
    -- Phaco
    insert into operation_rules (operation_id, target_type, target_id) values (op_phaco, 'action', 'axl'), (op_phaco, 'tool', 'slit-knife'), (op_phaco, 'tool', 'phaco-machine');
    -- IOL
    insert into operation_rules (operation_id, target_type, target_id) values (op_iol, 'action', 'iol');
    -- ECCE
    insert into operation_rules (operation_id, target_type, target_id) values (op_ecce, 'action', 'axl'), (op_ecce, 'tool', 'slit-knife'), (op_ecce, 'tool', '15-degree-blade');
    -- SF-IOL
    insert into operation_rules (operation_id, target_type, target_id) values (op_sfiol, 'action', 'iol'), (op_sfiol, 'tool', 'slit-knife'), (op_sfiol, 'tool', '15-degree-blade');
    -- CTR, CTS, Iris
    insert into operation_rules (operation_id, target_type, target_id) values (op_ctr, 'tool', 'ctr-no'), (op_cts, 'tool', 'cts'), (op_iris, 'tool', 'iris-retractor');
    -- PPV, SO, HDSO, EL
    insert into operation_rules (operation_id, target_type, target_id) values (op_ppv, 'tool', 'ppv-set'), (op_so, 'tool', 'silicone-oil'), (op_hdso, 'tool', 'silicone-oil-hd'), (op_el, 'tool', 'endolaser');
    -- GDI
    insert into operation_rules (operation_id, target_type, target_id) values (op_gdi, 'action', 'iop'), (op_gdi, 'action', 'sclera-amnion-eye-bank'), (op_gdi, 'tool', 'glaucoma-device'), (op_gdi, 'tool', '15-degree-blade');
    -- Tx + MMC
    insert into operation_rules (operation_id, target_type, target_id) values (op_txmmc, 'action', 'iop'), (op_txmmc, 'action', 'key-mmc'), (op_txmmc, 'tool', '15-degree-blade');
    -- PKP
    insert into operation_rules (operation_id, target_type, target_id) values (op_pkp, 'action', 'sclera-amnion-eye-bank'), (op_pkp, 'action', 'anterior-photo'), (op_pkp, 'tool', '15-degree-blade'), (op_pkp, 'tool', 'punch-trephine');
    -- Sclera
    insert into operation_rules (operation_id, target_type, target_id) values (op_sclera, 'action', 'sclera-amnion-eye-bank');
    -- EDCR
    insert into operation_rules (operation_id, target_type, target_id) values (op_edcr, 'action', 'irrigation-probing'), (op_edcr, 'tool', 'slit-knife'), (op_edcr, 'tool', 'crescent-knife');
    -- Oculo & Strab
    insert into operation_rules (operation_id, target_type, target_id) values (op_oculo, 'action', 'photo-oculoplastic'), (op_strab, 'action', 'measure-strabismus');
end $$;

-- 6. Seed Prices Table
insert into tool_prices (tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name) values
('15-degree-blade', null, 220, 220, 220, 'Knife-15 degree (Mani)'),
('slit-knife', null, 0, 0, 0, 'Slit Knife'),
('crescent-knife', null, 325, 325, 325, 'Crescent Bevel Up 2.3 mm'),
('phaco-machine', 'Centurion', 2140, 2140, 2140, 'Centurion Gravity Pack'),
('phaco-machine', 'Legion', 0, 0, 0, 'Legion FMS Basic Pack'),
('phaco-machine', 'Stellaris', 1875, 1875, 1875, 'Basic Phaco Pack'),
('ctr-no', null, 0, 1381, 1381, 'AuroRing/CTR/CTS'),
('cts', null, 0, 1381, 1381, 'AuroRing/CTR/CTS'),
('iris-retractor', null, 1565, 1565, 1565, 'Iris Retractors'),
('glaucoma-device', 'ahmed-valve', 1660, 1660, 1660, 'Ahmed Glaucoma Valve'),
('glaucoma-device', 'gdi-xen-room', 17785, 19785, 19785, 'Xen Glaucoma gel Implant'),
('glaucoma-device', 'gfd-express', 8190, 10190, 10190, 'Express GFD / Alcon'),
('glaucoma-device', 'preserflo-shunt', 23061, 25061, 25061, 'Preserflo Microshunt'),
('glaucoma-device', 'aadi-shunt', 0, 0, 0, 'Glaucoma shunt AADI (Sale ฿6,500)'),
('ppv-set', '23G_Constellation', 2150, 2150, 2150, 'Constellation 23G Vitrectomy'),
('ppv-set', '25G_Constellation', 2150, 2150, 2150, 'Constellation 25G Vitrectomy'),
('ppv-set', '23G_Stellaris', 2150, 2150, 2150, 'Stellaris Vitrectomy Set 23 G'),
('ppv-set', '25G_Stellaris', 2150, 2150, 2150, 'Stellaris Vitrectomy Set 25 G'),
('ilm-forceps', null, 3600, 6300, 6300, 'ILM Forcep Tip'),
('micro-scissor', null, 3600, 6300, 6300, 'Microscissors'),
('bbg', null, 910, 910, 910, 'Ocublue 0.05% (BBG Solution)'),
('silicone-oil', null, 400, 400, 400, 'Oxane Silicone Oil'),
('silicone-oil-hd', null, 8500, 8500, 8500, 'Oxane HD (Heavy Oil)'),
('endolaser', null, 2500, 2500, 2500, 'Endolaser'),
('dk-line', null, 0, 0, 0, 'DK Line 5 ml (Sale ฿5,700)'),
('soft-tip', null, 514, 514, 514, 'Soft Tip'),
('punch-trephine', null, 0, 0, 0, 'Punch & Trephine'),
('5fu', null, 0, 0, 0, '5FU'),
('fibrin-glue', null, 0, 0, 0, 'Fibrin glue');

-- 7. Transactional admin mutations
-- These functions keep related changes atomic: if any statement fails, the
-- whole mutation is rolled back instead of leaving partial admin data.
create or replace function public.admin_create_tool_with_prices(p_tool jsonb, p_prices jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
    insert into tools (id, item, type, category, is_active, sort_order, options, default_value)
    values (p_tool->>'id', p_tool->>'item', p_tool->>'type', p_tool->>'category',
        coalesce((p_tool->>'is_active')::boolean, true), coalesce((p_tool->>'sort_order')::integer, 999),
        p_tool->'options', p_tool->'default_value');

    insert into tool_prices (tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name)
    select tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name
    from jsonb_to_recordset(p_prices) as price(tool_id text, sub_key text, csmbs_price numeric, sss_price numeric, ucs_price numeric, display_name text);

    return jsonb_build_object('category_supported', true, 'display_name_supported', true);
end;
$$;

create or replace function public.admin_delete_tool(p_tool_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
    delete from tool_prices where tool_id = p_tool_id;
    delete from operation_rules where target_type = 'tool' and target_id = p_tool_id;
    delete from tools where id = p_tool_id;
end;
$$;

create or replace function public.admin_delete_action(p_action_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
    delete from operation_rules
    where target_type = 'action' and target_id = p_action_id;
    delete from actions where id = p_action_id;
end;
$$;

create or replace function public.admin_add_subtype_to_tool(p_tool_id text, p_options jsonb, p_price jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
    update tools set options = p_options, type = 'radio' where id = p_tool_id;
    insert into tool_prices (tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name)
    values (p_price->>'tool_id', p_price->>'sub_key', (p_price->>'csmbs_price')::numeric,
        (p_price->>'sss_price')::numeric, (p_price->>'ucs_price')::numeric, p_price->>'display_name');
end;
$$;

create or replace function public.admin_delete_subtype_and_update_tool(
    p_price_id text, p_tool_id text, p_options jsonb, p_type text, p_default_value jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
    delete from tool_prices where id::text = p_price_id;
    update tools set options = p_options, type = p_type, default_value = p_default_value where id = p_tool_id;
end;
$$;

create or replace function public.admin_update_tool_placement(p_tool_id text, p_category text, p_order_updates jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
    if p_category is not null then
        update tools set category = p_category where id = p_tool_id;
    end if;
    update tools as tool
    set sort_order = changes.sort_order
    from jsonb_to_recordset(p_order_updates) as changes(id text, sort_order integer)
    where tool.id = changes.id;
    return jsonb_build_object('category_supported', true);
end;
$$;

create or replace function public.admin_update_operation_with_rules(
    p_operation jsonb, p_delete_rule_ids text[], p_insert_rules jsonb, p_update_rules jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
    update operations set name = p_operation->>'name', category = p_operation->>'category',
        keywords = array(select jsonb_array_elements_text(p_operation->'keywords'))
    where id::text = p_operation->>'id';

    if coalesce(array_length(p_delete_rule_ids, 1), 0) > 0 then
        delete from operation_rules where id::text = any(p_delete_rule_ids);
    end if;
    insert into operation_rules (operation_id, target_type, target_id, default_selected_value)
    select operation_id::uuid, target_type, target_id, default_selected_value
    from jsonb_to_recordset(p_insert_rules) as added(operation_id text, target_type text, target_id text, default_selected_value text);
    update operation_rules as rule
    set target_id = changes.target_id, default_selected_value = changes.default_selected_value
    from jsonb_to_recordset(p_update_rules) as changes(id text, target_id text, default_selected_value text)
    where rule.id::text = changes.id;
end;
$$;

create or replace function public.admin_update_operation_placement(
    p_operation_id text,
    p_category text,
    p_order_updates jsonb
)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
    if p_category is not null then
        update operations set category = p_category where id::text = p_operation_id;
    end if;
    update operations as operation
    set sort_order = changes.sort_order
    from jsonb_to_recordset(p_order_updates) as changes(id text, sort_order integer)
    where operation.id::text = changes.id;
    return jsonb_build_object('sort_order_supported', true);
end;
$$;

grant execute on function public.admin_create_tool_with_prices(jsonb, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_tool(text) to anon, authenticated;
grant execute on function public.admin_delete_action(text) to anon, authenticated;
grant execute on function public.admin_add_subtype_to_tool(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_subtype_and_update_tool(text, text, jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_tool_placement(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_operation_with_rules(jsonb, text[], jsonb, jsonb) to anon, authenticated;
grant execute on function public.admin_update_operation_placement(text, text, jsonb) to anon, authenticated;
