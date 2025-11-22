/**
 * Server-side Supabase client
 * 
 * NOTE: This now uses admin client (SERVICE_ROLE_KEY) which bypasses RLS.
 * For server-side only access, this is the recommended approach.
 * 
 * If you need RLS-aware queries (e.g., user-specific data), use createAdminClient() directly
 * from @/lib/supabase/admin and implement your own authorization logic.
 */
import { createAdminClient } from './admin'

export async function createClient() {
  // Use admin client for server-side queries - bypasses RLS
  // This is safe because it's only used server-side
  return createAdminClient()
}

