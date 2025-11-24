#!/usr/bin/env tsx

/**
 * Generate Missing Threads Script
 * 
 * This script finds all products without threads and generates threads for them.
 * 
 * Usage: 
 *   tsx scripts/generate-missing-threads.ts
 *   npm run generate-missing-threads
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../src/lib/supabase/admin'

/**
 * Generate keywords from product information
 */
function generateKeywords(
  productTitle: string,
  productCategories: string[]
): string {
  const titleWords = productTitle.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 3)
  
  const keywords = [
    ...titleWords,
    ...productCategories.map(c => c.toLowerCase()).slice(0, 2)
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5)
  
  return keywords.join(', ')
}

/**
 * Generate thread text from product information
 */
function generateThreadText(
  productTitle: string,
  productDescription: string,
  categories: string[]
): string {
  // Clean description from HTML tags
  const cleanDescription = productDescription
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
  
  // Extract key features from description (first 300 chars)
  const descriptionPreview = cleanDescription.substring(0, 300)
  
  // Build thread text
  let threadText = `${productTitle} 🎁\n\n`
  
  if (descriptionPreview) {
    threadText += `${descriptionPreview}...\n\n`
  }
  
  // Add category context
  if (categories.length > 0) {
    threadText += `Perfect ${categories[0].toLowerCase()} gift for kids! ✨\n\n`
  }
  
  threadText += `#KidsToys #GiftsForKids`
  
  // Limit to reasonable length (Threads.com has character limits)
  if (threadText.length > 500) {
    threadText = threadText.substring(0, 497) + '...'
  }
  
  return threadText
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Finding products without threads...\n')
  
  try {
    const supabase = createAdminClient()
    
    // Get all products from Amazon shop
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, description, url')
      .eq('shop_id', '9f947e90-eae1-4651-ba9f-7f8174375be8')
      .order('created_at', { ascending: false })
    
    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }
    
    if (!products || products.length === 0) {
      console.log('No products found')
      return
    }
    
    console.log(`Found ${products.length} products\n`)
    
    // Check which products don't have threads
    const productsWithoutThreads = []
    for (const product of products) {
      const { data: threads } = await supabase
        .from('product_threads')
        .select('id')
        .eq('product_id', product.id)
        .limit(1)
      
      if (!threads || threads.length === 0) {
        productsWithoutThreads.push(product)
      }
    }
    
    console.log(`Products without threads: ${productsWithoutThreads.length}\n`)
    
    if (productsWithoutThreads.length === 0) {
      console.log('✅ All products have threads!')
      return
    }
    
    // Generate threads for products without them
    console.log('📝 Generating threads...\n')
    
    for (let i = 0; i < productsWithoutThreads.length; i++) {
      const product = productsWithoutThreads[i]
      console.log(`[${i + 1}/${productsWithoutThreads.length}] Processing: ${product.title.substring(0, 60)}...`)
      
      try {
        // Get product categories
        const { data: productCategories } = await supabase
          .from('product_categories')
          .select('categories(title)')
          .eq('product_id', product.id)
        
        const categoryTitles = (productCategories || [])
          .map((c: any) => c.categories?.title)
          .filter(Boolean)
        
        // Generate keywords
        const keywords = generateKeywords(product.title, categoryTitles)
        
        // Generate thread text
        const threadText = generateThreadText(
          product.title,
          product.description || '',
          categoryTitles
        )
        
        // Insert thread
        const { data: insertedThread, error: threadError } = await supabase
          .from('product_threads')
          .insert({
            product_id: product.id,
            text: threadText,
            keywords: keywords
          })
          .select()
          .single()
        
        if (threadError) {
          console.error(`   ❌ Error: ${threadError.message}`)
          continue
        }
        
        console.log(`   ✅ Thread created`)
        console.log(`   Keywords: ${keywords}`)
      } catch (error) {
        console.error(`   ❌ Error processing product: ${error}`)
        continue
      }
    }
    
    console.log(`\n✅ Successfully generated threads for ${productsWithoutThreads.length} product(s)!`)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

