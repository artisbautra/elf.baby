#!/usr/bin/env tsx

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

async function listCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, title, slug, parent_id');

  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }

  // Build a map of parent categories
  const categoryMap = new Map<string, { id: string; title: string; slug: string; parent_id: string | null }>();
  categories?.forEach(cat => {
    categoryMap.set(cat.id, cat);
  });

  // Build full paths
  function getCategoryPath(categoryId: string): string {
    const cat = categoryMap.get(categoryId);
    if (!cat) return '';
    
    if (cat.parent_id) {
      const parentPath = getCategoryPath(cat.parent_id);
      return parentPath ? `${parentPath} > ${cat.title}` : cat.title;
    }
    return cat.title;
  }

  console.log('Categories:');
  categories?.forEach(cat => {
    const path = getCategoryPath(cat.id);
    console.log(`- ${path} [${cat.id}]`);
  });
}

listCategories();

