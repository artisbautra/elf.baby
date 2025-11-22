-- Create product_threads table
CREATE TABLE IF NOT EXISTS product_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  keywords TEXT,
  processed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_threads_product_id ON product_threads(product_id);

-- Create index on keywords for searching (using full-text search if needed)
CREATE INDEX IF NOT EXISTS idx_product_threads_keywords ON product_threads(keywords);

-- Create index on processed for filtering and sorting by processing date
CREATE INDEX IF NOT EXISTS idx_product_threads_processed ON product_threads(processed);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_product_threads_updated_at
  BEFORE UPDATE ON product_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_product_threads_updated_at();

-- Add comment to table
COMMENT ON TABLE product_threads IS 'Stores product threads with text and keywords';

-- Add comments to columns
COMMENT ON COLUMN product_threads.product_id IS 'Reference to the product this thread belongs to';
COMMENT ON COLUMN product_threads.text IS 'Thread text content';
COMMENT ON COLUMN product_threads.keywords IS 'Keywords associated with this thread';
COMMENT ON COLUMN product_threads.processed IS 'Timestamp when this thread was sent to threads.com platform (NULL if not yet sent)';

