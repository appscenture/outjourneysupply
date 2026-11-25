alter table public.products
  add column price_idr bigint not null default 0 check (price_idr >= 0),
  add column is_featured boolean not null default false;

update public.products p
set price_idr = product.price_idr,
    is_featured = product.is_featured
from (
  values
    ('OJ-OTAK-001', 20000::bigint, true),
    ('OJ-BAKSO-001', 25000::bigint, true),
    ('OJ-BASRENG-001', 30000::bigint, true),
    ('OJ-CIMOL-001', 15000::bigint, false),
    ('OJ-KWETIAU-001', 15000::bigint, true)
) as product(sku, price_idr, is_featured)
where p.sku = product.sku;

insert into public.products (
  id, sku, name, category, description, unit, image_path, is_active, price_idr, is_featured
)
values
  (
    '20000000-0000-4000-8000-000000000006',
    'OJ-STIK-BAWANG-001',
    'Savory Onion Sticks',
    'Snacks',
    'Stik bawang gurih renyah.',
    '250 g / pack',
    'img/products/5.webp',
    true,
    30000,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    'OJ-BASRENG-ORIGINAL-001',
    'Original Chicken Basreng',
    'Snacks',
    'Basreng ayam original.',
    '250 g / pack',
    'img/products/6.webp',
    true,
    30000,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    'OJ-BAKSO-URAT-001',
    'Beef Tendon Meatballs',
    'Frozen',
    'Bakso sapi urat.',
    '15 pcs / pack',
    'img/menu/baso.webp',
    true,
    28000,
    false
  )
on conflict (sku) do nothing;

create index products_storefront_active_sort_idx
  on public.products(is_active, is_featured desc, name);

create policy "public can read active storefront products"
  on public.products for select to anon
  using (is_active);

grant select on public.products to anon;
