-- Backfill missing tool price display names.
-- Safe to run on an existing database: existing display names are preserved.

begin;

update tool_prices as price
set display_name = case
    when price.tool_id = '15-degree-blade' then 'Knife-15 degree (Mani)'
    when price.tool_id = 'crescent-knife' then 'Crescent Bevel Up 2.3 mm'
    when price.tool_id = '5fu' then '5FU'
    when price.tool_id = 'fibrin-glue' then 'Fibrin glue'
    when price.tool_id = 'ctr-no' then 'Capsular Tension Ring'
    when price.tool_id = 'cts' then 'Capsular Tension Segment'
    when price.tool_id = 'soft-tip' then 'Soft tip'
    when price.tool_id = 'glaucoma-device' and price.sub_key = 'ahmed-valve' then 'Ahmed Glaucoma Valve'
    when price.tool_id = 'glaucoma-device' and price.sub_key = 'gdi-xen-room' then 'XEN glaucoma gel implant'
    when price.tool_id = 'glaucoma-device' and price.sub_key = 'gfd-express' then 'Express GFD'
    when price.tool_id = 'glaucoma-device' and price.sub_key = 'preserflo-shunt' then 'Preserflo Microshunt'
    when price.tool_id = 'glaucoma-device' and price.sub_key = 'aadi-shunt' then 'AADI shunt'
    when price.tool_id = 'phaco-machine' and price.sub_key is not null then initcap(price.sub_key) || ' phaco machine'
    when price.tool_id = 'ppv-set' and price.sub_key is not null then '23G/25G ' || initcap(split_part(price.sub_key, '_', 2))
    else tool.item
end
from tools as tool
where tool.id = price.tool_id
  and (price.display_name is null or trim(price.display_name) = '');

commit;
