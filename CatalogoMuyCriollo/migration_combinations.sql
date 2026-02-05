-- Enable pgcrypto for gen_random_uuid() if not already enabled (though usually available)
create extension if not exists "pgcrypto";

-- Create table if not exists
create table if not exists product_combinations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  attributes jsonb not null, -- e.g. {"Color": "Red", "Size": "M"}
  stock integer default 0,
  created_at timestamp with time zone default now()
);

-- Ensure default is gen_random_uuid() for existing table
alter table product_combinations alter column id set default gen_random_uuid();

-- RLS
alter table product_combinations enable row level security;

-- Drop existing policies to avoid "already exists" error
drop policy if exists "Public Read Combinations" on product_combinations;
drop policy if exists "Admin Full Access Combinations" on product_combinations;

-- Re-create policies
create policy "Public Read Combinations" on product_combinations for select using (true);
create policy "Admin Full Access Combinations" on product_combinations for all using (auth.role() = 'authenticated');
