-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  specifications JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, slug)
);

-- Create index on shop_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create index on active for filtering active products
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Create index on filters for filtering by age and other criteria
CREATE INDEX IF NOT EXISTS idx_products_filters ON products USING GIN (filters);

-- Create index on specifications for future filtering capabilities
CREATE INDEX IF NOT EXISTS idx_products_specifications ON products USING GIN (specifications);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Add comment to table
COMMENT ON TABLE products IS 'Stores product information from shops';

-- Add comments to columns
COMMENT ON COLUMN products.shop_id IS 'Reference to the shop this product belongs to';
COMMENT ON COLUMN products.title IS 'Product title/name';
COMMENT ON COLUMN products.slug IS 'URL-friendly unique identifier for the product (unique per shop)';
COMMENT ON COLUMN products.url IS 'Original product URL/link from the shop website';
COMMENT ON COLUMN products.description IS 'Product description (generated, not copied from website)';
COMMENT ON COLUMN products.specifications IS 'JSON object with product specifications (dimensions, materials, features, etc.)';
COMMENT ON COLUMN products.images IS 'JSON array of product image URLs';
COMMENT ON COLUMN products.filters IS 'JSON object with filter criteria (e.g., age groups)';
COMMENT ON COLUMN products.active IS 'Whether the product is active and should be displayed';

