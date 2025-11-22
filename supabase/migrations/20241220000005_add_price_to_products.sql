-- Add price column to products table
ALTER TABLE products
ADD COLUMN price NUMERIC(10, 2);

-- Add comment to column
COMMENT ON COLUMN products.price IS 'Product price in the shop currency';

