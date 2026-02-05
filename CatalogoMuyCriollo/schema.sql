-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Brands
create table if not exists brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- 2. Categories
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- 3. Products
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric not null,
  category_id uuid references categories(id),
  brand_id uuid references brands(id),
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. Product Variants
create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  type text not null, -- e.g. 'Color'
  value text not null, -- e.g. 'Red'
  stock integer default 1
);

-- 5. Product Images
create table if not exists product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  display_order integer default 0
);

-- RLS Policies
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;

-- Public Read Access
create policy "Public Read Brands" on brands for select using (true);
create policy "Public Read Categories" on categories for select using (true);
create policy "Public Read Products" on products for select using (true);
create policy "Public Read Variants" on product_variants for select using (true);
create policy "Public Read Images" on product_images for select using (true);

-- Admin Write Access (We assume any authenticated user is an admin for this simple app)
create policy "Admin Full Access Brands" on brands for all using (auth.role() = 'authenticated');
create policy "Admin Full Access Categories" on categories for all using (auth.role() = 'authenticated');
create policy "Admin Full Access Products" on products for all using (auth.role() = 'authenticated');
create policy "Admin Full Access Variants" on product_variants for all using (auth.role() = 'authenticated');
create policy "Admin Full Access Images" on product_images for all using (auth.role() = 'authenticated');

-- Storage for Product Images (Create bucket and policies)
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Public Access Product Images"
on storage.objects for select
using ( bucket_id = 'products' );

create policy "Admin Upload Product Images"
on storage.objects for insert
with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

create policy "Admin Update Product Images"
on storage.objects for update
using ( bucket_id = 'products' and auth.role() = 'authenticated' );

create policy "Admin Delete Product Images"
on storage.objects for delete
using ( bucket_id = 'products' and auth.role() = 'authenticated' );
