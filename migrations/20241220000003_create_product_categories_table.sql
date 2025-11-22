-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Add comment to table
COMMENT ON TABLE product_categories IS 'Junction table linking products to categories (many-to-many relationship)';

-- Add comments to columns
COMMENT ON COLUMN product_categories.product_id IS 'Reference to the product';
COMMENT ON COLUMN product_categories.category_id IS 'Reference to the category';
COMMENT ON COLUMN product_categories.created_at IS 'Timestamp when the association was created';

