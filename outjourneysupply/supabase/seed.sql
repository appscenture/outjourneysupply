insert into public.suppliers (id, name, slug, description, status)
values
  ('10000000-0000-4000-8000-000000000001', 'Demo Cold Kitchen Supply', 'demo-cold-kitchen-supply', 'Local-only sample supplier for frozen foods.', 'active'),
  ('10000000-0000-4000-8000-000000000002', 'Demo Fresh Market', 'demo-fresh-market', 'Local-only sample supplier for fresh goods.', 'active')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    status = excluded.status;

insert into public.products (id, sku, name, category, description, unit, image_path, is_active)
values
  ('20000000-0000-4000-8000-000000000001', 'OJ-OTAK-001', 'Premium Fish Cake', 'Frozen', 'Demo catalog item.', '10 pcs / pack', 'img/products/1.webp', true),
  ('20000000-0000-4000-8000-000000000002', 'OJ-BAKSO-001', 'Beef Meatballs', 'Frozen', 'Demo catalog item.', '20 pcs / pack', 'img/products/2.webp', true),
  ('20000000-0000-4000-8000-000000000003', 'OJ-BASRENG-001', 'Spicy Crispy Basreng', 'Snacks', 'Demo catalog item.', '250 g / pack', 'img/products/3.webp', true),
  ('20000000-0000-4000-8000-000000000004', 'OJ-CIMOL-001', 'Crispy Chicken Cimol', 'Snacks', 'Demo catalog item.', '300 g / pack', 'img/products/4.webp', true),
  ('20000000-0000-4000-8000-000000000005', 'OJ-KWETIAU-001', 'Fresh Kwetiau', 'Fresh', 'Demo catalog item.', '500 g / pack', 'img/menu/kwetiau.webp', true)
on conflict (id) do update
set sku = excluded.sku,
    name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    unit = excluded.unit,
    image_path = excluded.image_path,
    is_active = excluded.is_active;

insert into public.supplier_products (
  id, supplier_id, product_id, supplier_sku, price_idr, minimum_quantity, lead_time_days, is_available
)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'DKS-OTAK-01', 20000, 1, 1, true),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'DKS-BAKSO-01', 25000, 1, 1, true),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'DKS-BASRENG-01', 30000, 1, 1, true),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'DKS-CIMOL-01', 15000, 1, 1, true),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000005', 'DFM-KWETIAU-01', 15000, 1, 0, true)
on conflict (id) do update
set supplier_id = excluded.supplier_id,
    product_id = excluded.product_id,
    supplier_sku = excluded.supplier_sku,
    price_idr = excluded.price_idr,
    minimum_quantity = excluded.minimum_quantity,
    lead_time_days = excluded.lead_time_days,
    is_available = excluded.is_available;
