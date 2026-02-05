-- Add badge fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
