import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listShops() {
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, title, domain');

  if (error) {
    console.error('Error fetching shops:', error);
    return;
  }

  console.log('Shops:');
  shops.forEach(shop => {
    console.log(`- ${shop.title} (${shop.domain}) [${shop.id}]`);
  });
}

listShops();

