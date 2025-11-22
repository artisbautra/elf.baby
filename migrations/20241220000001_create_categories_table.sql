-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Create index on parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Create index on parent_id where it's NULL for root categories
CREATE INDEX IF NOT EXISTS idx_categories_root ON categories(parent_id) WHERE parent_id IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Add comment to table
COMMENT ON TABLE categories IS 'Stores hierarchical product categories';

-- Add comments to columns
COMMENT ON COLUMN categories.title IS 'Category name/title';
COMMENT ON COLUMN categories.slug IS 'URL-friendly unique identifier for the category';
COMMENT ON COLUMN categories.parent_id IS 'Reference to parent category (NULL for root level categories)';
COMMENT ON COLUMN categories.description IS 'Optional category description';

