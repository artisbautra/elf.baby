#!/usr/bin/env tsx

/**
 * Fix Product Images Script
 * 
 * This script updates product images in the database
 * 
 * Usage: 
 *   tsx scripts/fix-product-images.ts <product-id> <image-url-1> [image-url-2] ...
 *   tsx scripts/fix-product-images.ts <product-id> --from-json <json-file>
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../src/lib/supabase/admin'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.error('Usage: tsx scripts/fix-product-images.ts <product-id> <image-url-1> [image-url-2] ...')
    console.error('   or: tsx scripts/fix-product-images.ts <product-id> --from-json <json-file>')
    process.exit(1)
  }
  
  const productId = args[0]
  const supabase = createAdminClient()
  
  let images: string[] = []
  
  if (args[1] === '--from-json' && args[2]) {
    // Load from JSON file
    // If path doesn't start with tmp/, add it
    let jsonFile = args[2]
    if (!jsonFile.startsWith('tmp/') && !jsonFile.startsWith('/')) {
      jsonFile = `tmp/${jsonFile}`
    }
    const jsonPath = join(process.cwd(), jsonFile)
    const jsonContent = readFileSync(jsonPath, 'utf-8')
    const jsonData = JSON.parse(jsonContent)
    
    if (jsonData.id && jsonData.id !== productId) {
      console.warn(`⚠️  Warning: JSON file has different product ID (${jsonData.id}) than provided (${productId})`)
    }
    
    images = jsonData.images || []
  } else {
    // Load from command line arguments
    images = args.slice(1)
  }
  
  if (images.length === 0) {
    console.error('❌ No images provided')
    process.exit(1)
  }
  
  console.log(`🔧 Updating product images for ID: ${productId}`)
  console.log(`   Images to set: ${images.length}`)
  
  // Update product images
  const { data, error } = await supabase
    .from('products')
    .update({ images })
    .eq('id', productId)
    .select()
    .single()
  
  if (error) {
    console.error(`❌ Error updating product: ${error.message}`)
    process.exit(1)
  }
  
  if (!data) {
    console.error(`❌ Product not found: ${productId}`)
    process.exit(1)
  }
  
  console.log(`✅ Successfully updated product: ${data.title}`)
  console.log(`   Product ID: ${data.id}`)
  console.log(`   Images: ${data.images.length}`)
  console.log(`   First image: ${data.images[0]}`)
}

main().catch(console.error)

