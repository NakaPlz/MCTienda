-- Add priority column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Update existing products to have 0 (already covered by default, but good for clarity)
UPDATE products SET priority = 0 WHERE priority IS NULL;

-- Policy allow admin to update priority (already covered by "Enable update for users based on email" if it selects all columns)
-- Just in case, ensure the column is visible to public
GRANT SELECT ON products TO anon, authenticated;
GRANT ALL ON products TO service_role;
