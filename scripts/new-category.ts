#!/usr/bin/env tsx

/**
 * New Category Script
 * 
 * This script creates category records in the Supabase categories table.
 * Supports hierarchical categories (up to 2 levels).
 * 
 * Usage: tsx scripts/new-category.ts "Category Name" "Parent > Child" ...
 * Examples:
 *   tsx scripts/new-category.ts "Toys"
 *   tsx scripts/new-category.ts "Baby Products" "Baby Products > Toys" "Baby Products > Clothing"
 *   npm run new-category "Personalized Gifts" "Gifts > Personalized"
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../src/lib/supabase/admin'

interface CategoryInput {
  title: string
  parentTitle?: string
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Parse category string into CategoryInput
 * Supports formats:
 * - "Category Name" (single level)
 * - "Parent > Child" (two levels)
 */
function parseCategory(categoryStr: string): CategoryInput {
  const trimmed = categoryStr.trim()
  
  if (trimmed.includes(' > ')) {
    const parts = trimmed.split(' > ').map(p => p.trim())
    if (parts.length === 2) {
      return {
        title: parts[1],
        parentTitle: parts[0]
      }
    }
    // If more than 2 levels, take first as parent and last as child
    return {
      title: parts[parts.length - 1],
      parentTitle: parts[0]
    }
  }
  
  return {
    title: trimmed
  }
}

/**
 * Find or create parent category
 */
async function findOrCreateParent(
  supabase: ReturnType<typeof createAdminClient>,
  parentTitle: string
): Promise<string | null> {
  const parentSlug = generateSlug(parentTitle)
  
  // Try to find existing parent
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', parentSlug)
    .eq('parent_id', null)
    .single()
  
  if (existing) {
    console.log(`✓ Found existing parent category: ${parentTitle}`)
    return existing.id
  }
  
  // Create new parent category
  const { data, error } = await supabase
    .from('categories')
    .insert({
      title: parentTitle,
      slug: parentSlug,
      parent_id: null
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create parent category "${parentTitle}": ${error.message}`)
  }
  
  console.log(`✓ Created parent category: ${parentTitle} (ID: ${data.id})`)
  return data.id
}

/**
 * Create category in database
 */
async function createCategory(
  supabase: ReturnType<typeof createAdminClient>,
  category: CategoryInput
): Promise<void> {
  const slug = generateSlug(category.title)
  
  // Check if category already exists
  const { data: existing } = await supabase
    .from('categories')
    .select('id, title, parent_id')
    .eq('slug', slug)
    .single()
  
  if (existing) {
    // Check if parent matches
    if (category.parentTitle) {
      const parentId = await findOrCreateParent(supabase, category.parentTitle)
      if (existing.parent_id === parentId) {
        console.log(`⚠️  Category already exists: ${category.title}`)
        return
      }
    } else if (!existing.parent_id) {
      console.log(`⚠️  Category already exists: ${category.title}`)
      return
    }
  }
  
  // Get parent ID if needed
  let parentId: string | null = null
  if (category.parentTitle) {
    parentId = await findOrCreateParent(supabase, category.parentTitle)
  }
  
  // Create category
  const { data, error } = await supabase
    .from('categories')
    .insert({
      title: category.title,
      slug: slug,
      parent_id: parentId
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create category "${category.title}": ${error.message}`)
  }
  
  const categoryPath = category.parentTitle 
    ? `${category.parentTitle} > ${category.title}`
    : category.title
  console.log(`✅ Created category: ${categoryPath} (ID: ${data.id}, Slug: ${slug})`)
}

/**
 * Main function
 */
async function main() {
  const categories = process.argv.slice(2)
  
  if (categories.length === 0) {
    console.error('Usage: tsx scripts/new-category.ts "Category Name" ["Parent > Child"] ...')
    console.error('Examples:')
    console.error('  tsx scripts/new-category.ts "Toys"')
    console.error('  tsx scripts/new-category.ts "Baby Products" "Baby Products > Toys"')
    console.error('  npm run new-category "Personalized Gifts" "Gifts > Personalized"')
    process.exit(1)
  }
  
  console.log('Creating categories in Supabase...')
  console.log(`Categories to create: ${categories.length}\n`)
  
  try {
    const supabase = createAdminClient()
    
    // Parse all categories first
    const parsedCategories = categories.map(parseCategory)
    
    // First, create all parent categories (if any)
    const parentTitles = new Set<string>()
    for (const cat of parsedCategories) {
      if (cat.parentTitle) {
        parentTitles.add(cat.parentTitle)
      }
    }
    
    // Create parents first
    for (const parentTitle of parentTitles) {
      await findOrCreateParent(supabase, parentTitle)
    }
    
    // Then create all categories
    console.log('\nCreating categories:')
    for (const category of parsedCategories) {
      await createCategory(supabase, category)
    }
    
    console.log('\n✅ Successfully processed all categories!')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

