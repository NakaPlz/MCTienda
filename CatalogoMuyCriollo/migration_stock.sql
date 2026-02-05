-- Add stock column for simple product inventory management
alter table products 
add column if not exists stock integer default 0;
