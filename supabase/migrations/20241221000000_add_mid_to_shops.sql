-- Add MID (Merchant ID) field to shops table for Rakuten API integration
ALTER TABLE shops ADD COLUMN IF NOT EXISTS rakuten_mid TEXT;

-- Create index on rakuten_mid for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_rakuten_mid ON shops(rakuten_mid);

-- Add comment
COMMENT ON COLUMN shops.rakuten_mid IS 'Rakuten Advertising Merchant ID (MID) for API product searches';

