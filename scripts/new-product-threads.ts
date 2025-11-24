#!/usr/bin/env tsx

/**
 * New Product Threads Script
 * 
 * This script generates and inserts thread entries for products in the product_threads table.
 * Threads are social media posts (for threads.com) that will be published with product links.
 * 
 * Usage: 
 *   tsx scripts/new-product-threads.ts <product-id>
 *   tsx scripts/new-product-threads.ts <product-id> --from-json threads.json
 *   npm run new-product-threads <product-id>
 * 
 * Examples:
 *   tsx scripts/new-product-threads.ts 5bcea2a4-0aff-4ebb-86ee-707d264a2291
 *   npm run new-product-threads <product-id> --from-json threads.json
 * 
 * The script will output product information for AI to generate unique thread texts.
 * Then you can provide the threads via JSON file or the script will wait for input.
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../src/lib/supabase/admin'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface ThreadData {
  product_id: string
  text: string
  keywords: string
}

interface ThreadInput {
  text: string
  keywords: string
}

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
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/new-product-threads.ts <product-id> [--text "<thread text>"] [--keywords "<keywords>"] [--from-json <json-file>]')
    console.error('Examples:')
    console.error('  tsx scripts/new-product-threads.ts 5bcea2a4-0aff-4ebb-86ee-707d264a2291')
    console.error('  tsx scripts/new-product-threads.ts <product-id> --text "Thread text here" --keywords "keyword1, keyword2"')
    console.error('  tsx scripts/new-product-threads.ts <product-id> --from-json threads.json')
    console.error('  npm run new-product-threads <product-id> --text "Thread text" --keywords "keywords"')
    process.exit(1)
  }
  
  const productId = args[0]
  let threadText: string | null = null
  let threadKeywords: string | null = null
  let fromJsonFile: string | null = null
  
  // Parse --text argument (collect all arguments until --keywords or end)
  if (args.includes('--text')) {
    const textIndex = args.indexOf('--text')
    const keywordsIndex = args.indexOf('--keywords')
    const endIndex = keywordsIndex !== -1 ? keywordsIndex : args.length
    // Join all arguments between --text and --keywords (or end)
    threadText = args.slice(textIndex + 1, endIndex).join(' ')
  }
  
  // Parse --keywords argument (collect all arguments until end or next --)
  if (args.includes('--keywords')) {
    const keywordsIndex = args.indexOf('--keywords')
    // Join all remaining arguments after --keywords
    threadKeywords = args.slice(keywordsIndex + 1).join(' ')
  }
  
  // Parse --from-json argument
  if (args.includes('--from-json')) {
    const jsonIndex = args.indexOf('--from-json')
    fromJsonFile = args[jsonIndex + 1]
    // If path doesn't start with tmp/, add it
    if (fromJsonFile && !fromJsonFile.startsWith('tmp/') && !fromJsonFile.startsWith('/')) {
      fromJsonFile = `tmp/${fromJsonFile}`
    }
  }
  
  console.log('Product Threads Script')
  console.log(`Product ID: ${productId}\n`)
  
  try {
    const supabase = createAdminClient()
    
    // Step 1: Fetch product information
    console.log('🔍 Fetching product information...')
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, description, url')
      .eq('id', productId)
      .single()
    
    if (productError || !product) {
      throw new Error(`Product not found: ${productId}`)
    }
    
    console.log(`✓ Found product: ${product.title}`)
    
    // Step 2: Fetch product categories
    const { data: categories } = await supabase
      .from('product_categories')
      .select('categories(title)')
      .eq('product_id', productId)
    
    const categoryTitles = (categories || [])
      .map((c: any) => c.categories?.title)
      .filter(Boolean)
    
    console.log(`✓ Found ${categoryTitles.length} categories`)
    
    // Step 3: Generate keywords (fallback if not provided)
    const defaultKeywords = generateKeywords(product.title, categoryTitles)
    const keywords = threadKeywords || defaultKeywords
    
    // Step 4: Load threads from direct parameters, JSON, or output information for AI
    let threads: ThreadInput[] = []
    
    if (threadText) {
      // Use thread text and keywords provided directly as parameters
      console.log(`\n📝 Using provided thread text and keywords`)
      threads = [{
        text: threadText,
        keywords: keywords
      }]
      console.log(`✓ Thread text length: ${threadText.length} characters`)
      console.log(`✓ Keywords: ${keywords}`)
    } else if (fromJsonFile) {
      // Load threads from JSON file
      console.log(`\n📂 Loading threads from JSON file: ${fromJsonFile}`)
      try {
        const jsonContent = readFileSync(join(process.cwd(), fromJsonFile), 'utf-8')
        const jsonThreads = JSON.parse(jsonContent)
        
        if (Array.isArray(jsonThreads)) {
          threads = jsonThreads
        } else if (jsonThreads.threads && Array.isArray(jsonThreads.threads)) {
          threads = jsonThreads.threads
        } else {
          throw new Error('Invalid JSON format. Expected array of threads or object with "threads" array')
        }
        
        console.log(`✓ Loaded ${threads.length} thread(s) from JSON`)
      } catch (error) {
        throw new Error(`Failed to load JSON file: ${error}`)
      }
    } else {
      // Output product information for AI to generate threads
      console.log('\n\n📄 Product Information (for AI thread generation):')
      console.log('='.repeat(80))
      console.log(`\nProduct: ${product.title}`)
      console.log(`Description: ${product.description?.substring(0, 500)}...`)
      console.log(`Categories: ${categoryTitles.join(', ')}`)
      console.log(`URL: ${product.url}`)
      console.log(`\nSuggested keywords: ${defaultKeywords}`)
      console.log('\n⚠️  Thread not provided. Please provide thread text using:')
      console.log(`   npm run new-product-threads ${productId} --text "<thread text>" --keywords "<keywords>"`)
      console.log(`   OR save to JSON and use: npm run new-product-threads ${productId} --from-json <json-file>`)
      process.exit(0)
    }
    
    // Step 5: Insert threads into database
    if (threads.length === 0) {
      console.warn('⚠️  No threads to insert')
      process.exit(0)
    }
    
    console.log(`\n💾 Inserting ${threads.length} thread(s) into Supabase...`)
    
    for (const thread of threads) {
      if (!thread.text || thread.text.trim().length === 0) {
        console.warn('⚠️  Skipping empty thread')
        continue
      }
      
      const { data: insertedThread, error: threadError } = await supabase
        .from('product_threads')
        .insert({
          product_id: product.id,
          text: thread.text.trim(),
          keywords: thread.keywords || keywords
        })
        .select()
        .single()
      
      if (threadError) {
        console.error(`❌ Error inserting thread: ${threadError.message}`)
        continue
      }
      
      console.log(`✅ Created thread: "${thread.text.substring(0, 60)}..."`)
      console.log(`   Keywords: ${thread.keywords || keywords}`)
    }
    
    console.log('\n✅ Successfully inserted all threads!')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

