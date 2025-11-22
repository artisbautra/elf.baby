-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  domain TEXT NOT NULL UNIQUE,
  affiliate TEXT,
  markets JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  shipping JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_domain ON shops(domain);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);

-- Create index on markets for filtering by region
CREATE INDEX IF NOT EXISTS idx_shops_markets ON shops USING GIN (markets);

-- Create index on active for filtering active shops
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE shops IS 'Stores information about shops/retailers';

-- Add comments to columns
COMMENT ON COLUMN shops.title IS 'Shop name/title';
COMMENT ON COLUMN shops.description IS 'Shop description - what products they sell, what makes them special, etc.';
COMMENT ON COLUMN shops.logo IS 'URL to shop logo image';
COMMENT ON COLUMN shops.domain IS 'Shop domain/website URL';
COMMENT ON COLUMN shops.markets IS 'JSON array of markets/countries where shop operates (e.g., ["europe", "america", "latvia"])';
COMMENT ON COLUMN shops.category IS 'Shop category (e.g., personalized gifts, printed clothing, toys)';
COMMENT ON COLUMN shops.shipping IS 'JSON object with shipping methods and costs information';
COMMENT ON COLUMN shops.active IS 'Whether the shop is active and should be displayed';
COMMENT ON COLUMN shops.affiliate IS 'Affiliate program URL/address for this shop';

