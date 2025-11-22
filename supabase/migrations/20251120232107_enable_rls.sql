-- Enable Row Level Security on all tables
-- RLS is enabled but NO policies are created, meaning:
-- - Only SERVICE_ROLE_KEY can access data (bypasses RLS)
-- - ANON_KEY cannot access data (blocked by RLS without policies)
-- This is perfect for server-side only access using admin client

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- No policies are created - all access is blocked except via SERVICE_ROLE_KEY
-- Use createAdminClient() from src/lib/supabase/admin.ts for all database queries

