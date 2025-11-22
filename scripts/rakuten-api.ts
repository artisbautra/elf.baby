#!/usr/bin/env tsx

/**
 * Rakuten API Integration Script
 * 
 * This script connects to Rakuten Advertising API, searches for products by Merchant ID (MID),
 * and processes them through the product pipeline.
 * 
 * Usage: tsx scripts/rakuten-api.ts <mid>
 * Example: tsx scripts/rakuten-api.ts 12345
 * 
 * The script will:
 * 1. Connect to Rakuten API using credentials from .env
 * 2. Ask for or use provided MID number
 * 3. Check if shop exists in database, create if needed
 * 4. Search for products from that merchant
 * 5. Process products one by one using new-products.ts (hybrid mode)
 * 6. Generate threads for each product using new-product-threads.ts
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../src/lib/supabase/admin'
import { RakutenAPIClient } from '../src/lib/rakuten/client'
import { spawn } from 'child_process'
import { promisify } from 'util'
import * as readline from 'readline'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

/**
 * Ask user for input
 */
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

/**
 * Run a script and wait for it to complete
 */
async function runScript(
  script: string,
  args: string[],
  env: Record<string, string> = {}
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn('tsx', [script, ...args], {
      env: { ...process.env, ...env },
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
      })
    })

    child.on('error', (error) => {
      resolve({
        success: false,
        output: stdout,
        error: error.message,
      })
    })
  })
}

/**
 * Check if shop exists by MID
 */
async function findShopByMid(supabase: ReturnType<typeof createAdminClient>, mid: string) {
  const { data, error } = await supabase
    .from('shops')
    .select('id, domain, title, rakuten_mid')
    .eq('rakuten_mid', mid)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    throw new Error(`Error finding shop: ${error.message}`)
  }

  return data
}

/**
 * Create shop from Rakuten merchant info
 */
async function createShopFromRakuten(
  supabase: ReturnType<typeof createAdminClient>,
  rakutenClient: RakutenAPIClient,
  mid: string
) {
  console.log(`\n🏪 Fetching merchant information for MID: ${mid}...`)

  try {
    const merchantInfo = await rakutenClient.getMerchantInfo(mid)
    
    console.log(`✓ Found merchant: ${merchantInfo.merchantname}`)

    // Ask user for domain if not available
    let domain = ''
    while (!domain) {
      domain = await askQuestion(`\nEnter the merchant website domain (e.g., example.com): `)
      domain = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '')
      
      if (!domain) {
        console.log('⚠️  Domain is required. Please enter a valid domain.')
      }
    }

    // Ask for description
    const description = await askQuestion(`\nEnter a description for this shop (or press Enter to skip): `)

    // Extract domain from merchant category path if available
    const merchantCategory = merchantInfo.merchantcategorypath || 'General'

    // Create shop record
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        title: merchantInfo.merchantname,
        description: description || `Merchant from Rakuten Advertising with MID ${mid}`,
        domain: domain,
        rakuten_mid: mid,
        category: merchantCategory,
        markets: ['europe', 'america'], // Default, can be updated later
        active: true,
      })
      .select()
      .single()

    if (shopError) {
      // Check if it's a unique constraint violation (domain already exists)
      if (shopError.code === '23505') {
        // Update existing shop with MID
        const { data: updatedShop } = await supabase
          .from('shops')
          .update({ rakuten_mid: mid })
          .eq('domain', domain)
          .select()
          .single()

        if (updatedShop) {
          console.log(`✓ Updated existing shop with MID: ${updatedShop.title}`)
          return updatedShop
        }
      }
      throw new Error(`Failed to create shop: ${shopError.message}`)
    }

    console.log(`✅ Created shop: ${shop.title} (ID: ${shop.id})`)
    return shop
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    
    // Check if it's an affiliate approval issue
    if (errorMessage.includes('affiliate partnership') || errorMessage.includes('not approved')) {
      throw new Error(
        `\n⚠️  Affiliate Partnership Issue:\n` +
        `The merchant (MID: ${mid}) has not approved your affiliate partnership.\n` +
        `\nPlease:\n` +
        `1. Check your Rakuten Advertising affiliate dashboard\n` +
        `2. Verify that your partnership with this merchant is approved\n` +
        `3. Wait for approval if you've just applied\n` +
        `4. Try with a different merchant MID if you have other partnerships\n\n` +
        `Original error: ${errorMessage}`
      )
    }
    
    throw new Error(`Error creating shop from Rakuten: ${errorMessage}`)
  }
}

/**
 * Get categories for product assignment
 */
async function getCategoriesToAssign(
  supabase: ReturnType<typeof createAdminClient>
): Promise<string[]> {
  // Fetch all categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, title, slug')
    .order('title')

  if (error) {
    console.warn(`⚠️  Could not fetch categories: ${error.message}`)
    return []
  }

  if (!categories || categories.length === 0) {
    console.warn('⚠️  No categories found in database')
    return []
  }

  console.log('\n📋 Available categories:')
  categories.forEach((cat, index) => {
    console.log(`   ${index + 1}. ${cat.title} (${cat.slug})`)
  })

  const categoryInput = await askQuestion(
    `\nEnter category numbers to assign (comma-separated, e.g., 1,3,5) or press Enter to skip: `
  )

  if (!categoryInput.trim()) {
    return []
  }

  const selectedIndices = categoryInput
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0 && n <= categories.length)

  return selectedIndices.map(index => categories[index - 1].id)
}

/**
 * Convert Rakuten product to product data format
 */
function convertRakutenProductToProductData(
  rakutenProduct: any,
  shopId: string,
  categories: string[]
) {
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const price = rakutenProduct.price ? parseFloat(rakutenProduct.price) : null

  return {
    shop_id: shopId,
    title: rakutenProduct.productname || 'Unknown Product',
    slug: generateSlug(rakutenProduct.productname || 'unknown-product'),
    url: rakutenProduct.producturl || '',
    price: price,
    description: rakutenProduct.description || '',
    specifications: {
      merchantproductid: rakutenProduct.merchantproductid,
      sku: rakutenProduct.sku || rakutenProduct.merchantproductid,
      manufacturer: rakutenProduct.manufacturer || null,
      category: rakutenProduct.category || null,
      instock: rakutenProduct.instock === '1' || rakutenProduct.instock === 'true',
    },
    images: rakutenProduct.imageurl ? [rakutenProduct.imageurl] : [],
    filters: {},
    categories: categories,
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)

  // Get MID from arguments or ask user
  let mid = args[0]

  if (!mid) {
    mid = await askQuestion('Enter Rakuten Merchant ID (MID): ')
    mid = mid.trim()
  }

  if (!mid) {
    console.error('❌ MID is required')
    process.exit(1)
  }

  console.log(`\n🚀 Starting Rakuten API integration for MID: ${mid}`)

  // Check environment variables
  const clientId = process.env.RAKUTEN_CLIENT_ID
  const clientSecret = process.env.RAKUTEN_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('❌ Missing Rakuten API credentials')
    console.error('   Please set RAKUTEN_CLIENT_ID and RAKUTEN_CLIENT_SECRET in .env')
    process.exit(1)
  }

  try {
    // Initialize Rakuten API client
    console.log('\n🔌 Connecting to Rakuten API...')
    const rakutenClient = new RakutenAPIClient(clientId, clientSecret)
    
    // Test connection by getting token
    await rakutenClient.getAccessToken()
    console.log('✅ Connected to Rakuten API')

    // Initialize Supabase client
    const supabase = createAdminClient()

    // Step 1: Check if shop exists
    console.log(`\n🔍 Checking if shop with MID ${mid} exists...`)
    let shop = await findShopByMid(supabase, mid)

    // Step 2: Create shop if it doesn't exist
    if (!shop) {
      console.log(`⚠️  Shop with MID ${mid} not found in database`)
      const shouldCreate = await askQuestion('Create new shop? (y/n): ')
      
      if (shouldCreate.toLowerCase() === 'y' || shouldCreate.toLowerCase() === 'yes') {
        shop = await createShopFromRakuten(supabase, rakutenClient, mid)
      } else {
        // Try using new-shop.ts script
        console.log('\n📝 You can create the shop manually using:')
        console.log(`   npm run new-shop <shop-url>`)
        console.log(`   Then update the shop's rakuten_mid field to: ${mid}`)
        process.exit(0)
      }
    } else {
      console.log(`✓ Found existing shop: ${shop.title} (${shop.domain})`)
    }

    if (!shop) {
      console.error('❌ Shop is required to continue')
      process.exit(1)
    }

    // Step 3: Search for products
    console.log(`\n🔍 Searching for products from merchant ${shop.title}...`)
    
    const askForLimit = await askQuestion('Enter maximum number of products to process (or press Enter for all): ')
    const maxProducts = askForLimit.trim() ? parseInt(askForLimit.trim()) : undefined

    const products = await rakutenClient.getAllProductsByMid(mid, {
      instock: true,
      maxProducts: maxProducts,
    })

    if (!products || products.length === 0) {
      console.log('⚠️  No products found for this merchant')
      process.exit(0)
    }

    console.log(`✓ Found ${products.length} products`)

    // Step 4: Ask for categories to assign
    const categories = await getCategoriesToAssign(supabase)

    // Step 5: Process products one by one
    console.log(`\n📦 Processing ${products.length} products...\n`)

    for (let i = 0; i < products.length; i++) {
      const rakutenProduct = products[i]
      console.log(`\n[${i + 1}/${products.length}] Processing: ${rakutenProduct.productname}`)

      try {
        // Convert Rakuten product to our format
        const productData = convertRakutenProductToProductData(rakutenProduct, shop.id, categories)

        // Generate description if missing
        if (!productData.description || productData.description.trim().length < 10) {
          const specs = productData.specifications as any
          productData.description = `${productData.title}. ${specs.manufacturer ? `Manufactured by ${specs.manufacturer}. ` : ''}${specs.category ? `Category: ${specs.category}. ` : ''}${specs.instock !== undefined ? `Stock status: ${specs.instock ? 'Currently in stock' : 'Out of stock'}.` : 'Available through Rakuten Advertising.'}`
        }

        // Create a temporary JSON file for this product
        const tempJsonFile = `temp-product-${Date.now()}-${i}.json`

        writeFileSync(
          join(process.cwd(), tempJsonFile),
          JSON.stringify([productData], null, 2),
          'utf-8'
        )

        // Call new-products.ts in hybrid mode (API mode)
        console.log(`   📥 Importing product via API...`)
        const result = await runScript(
          'scripts/new-products.ts',
          [shop.id, '--from-json', tempJsonFile, '--with-descriptions', '--api-mode']
        )

        if (!result.success) {
          console.error(`   ❌ Error processing product: ${result.error}`)
          continue
        }

        // Extract product ID from output (we'll need to modify new-products.ts to return it)
        // For now, we'll query the database
        const { data: insertedProduct } = await supabase
          .from('products')
          .select('id, title')
          .eq('shop_id', shop.id)
          .eq('slug', productData.slug)
          .maybeSingle()

        if (!insertedProduct) {
          console.warn(`   ⚠️  Could not find inserted product, skipping thread generation`)
          continue
        }

        console.log(`   ✅ Product imported: ${insertedProduct.title} (ID: ${insertedProduct.id})`)

        // Step 6: Generate threads for this product
        // Note: new-product-threads.ts will output information for manual thread generation
        console.log(`   📝 Generating thread information for product...`)
        const threadResult = await runScript(
          'scripts/new-product-threads.ts',
          [insertedProduct.id]
        )

        if (threadResult.success || (!threadResult.success && threadResult.output.includes('Product Information'))) {
          // Script ran and output product info (expected when no JSON provided)
          console.log(`   ℹ️  Thread generation information displayed above`)
          console.log(`   💡 To complete thread generation, create a JSON file and run:`)
          console.log(`      npm run new-product-threads ${insertedProduct.id} --from-json <json-file>`)
        } else {
          console.warn(`   ⚠️  Could not generate thread information: ${threadResult.error}`)
        }

        // Clean up temp file
        try {
          unlinkSync(join(process.cwd(), tempJsonFile))
        } catch (e) {
          // Ignore cleanup errors
        }

      } catch (error) {
        console.error(`   ❌ Error processing product: ${error}`)
        continue
      }
    }

    console.log('\n✅ All products processed!')
    console.log(`   Total processed: ${products.length}`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

