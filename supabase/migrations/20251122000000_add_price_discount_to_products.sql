-- Add price_discount column to products table
ALTER TABLE products
ADD COLUMN price_discount NUMERIC(10, 2);

-- Add comment to column
COMMENT ON COLUMN products.price_discount IS 'Discounted price of the product';

