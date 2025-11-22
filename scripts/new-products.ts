#!/usr/bin/env tsx

/**
 * New Products Script
 * 
 * This script processes products from a shop and creates records in the Supabase products table.
 * Follows the instructions from agents/new-products.md
 * 
 * Usage: 
 *   tsx scripts/new-products.ts <shop-identifier> [product-url-1] [product-url-2] ...
 *   tsx scripts/new-products.ts <shop-identifier> --limit 2
 * 
 * Examples:
 *   tsx scripts/new-products.ts yoursurprise.com https://www.yoursurprise.com/product1 https://www.yoursurprise.com/product2
 *   tsx scripts/new-products.ts yoursurprise.com --limit 2
 *   npm run new-products yoursurprise.com
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

interface ProductData {
  shop_id: string
  title: string
  slug: string
  url: string
  price: number | null
  description: string
  specifications: object
  images: string[]
  filters: object
  categories: string[] // Category slugs or titles to match
}

interface ExtractedProductInfo {
  title?: string
  url: string
  price?: number | null
  images?: string[]
  specifications?: object
  textContent?: string
  categories?: string[]
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

/**
 * Fetch and parse HTML from URL
 */
async function fetchWebsite(url: string): Promise<string> {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  console.log(`Fetching: ${fullUrl}`)
  
  try {
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.text()
  } catch (error) {
    console.error(`Error fetching website: ${error}`)
    throw error
  }
}

/**
 * Extract product information from HTML
 */
function extractProductInfo(html: string, url: string): ExtractedProductInfo {
  const info: ExtractedProductInfo = { url }
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
  if (titleMatch) {
    let title = titleMatch[1].trim()
    // Remove shop name suffixes like " | YourSurprise", " - ShopName", etc.
    title = title.replace(/\s*[|\-–—]\s*[^|]+$/, '').trim()
    // Remove common shop branding patterns
    title = title.replace(/\s*-\s*(YourSurprise|Shop|Store|Gifts?)$/i, '').trim()
    info.title = title
  }
  
  // Extract price - comprehensive search for product price
  const pricePatterns = [
    // Meta tags
    /<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i,
    // JSON-LD structured data
    /"price":\s*["']?([0-9]+\.?[0-9]*)["']?/i,
    /"price":\s*([0-9]+\.?[0-9]*)/i,
    // Common price class patterns
    /<[^>]*class=["'][^"']*price[^"']*["'][^>]*>[\s\S]*?([0-9]+[.,][0-9]{2})/i,
    /<[^>]*class=["'][^"']*product[^"']*price[^"']*["'][^>]*>[\s\S]*?([0-9]+[.,][0-9]{2})/i,
    // Price in various formats (€, $, etc.)
    /(?:€|EUR|USD|\$)\s*([0-9]+[.,][0-9]{2})/i,
    /([0-9]+[.,][0-9]{2})\s*(?:€|EUR|USD|\$)/i,
    // Data attributes
    /data-price=["']([0-9]+\.?[0-9]*)["']/i,
    /data-product-price=["']([0-9]+\.?[0-9]*)["']/i,
  ]
  
  let extractedPrice: number | null = null
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match) {
      const priceStr = match[1].replace(',', '.').trim()
      const price = parseFloat(priceStr)
      if (!isNaN(price) && price > 0) {
        extractedPrice = price
        break
      }
    }
  }
  
  // Also try to find price in text content (fallback)
  if (!extractedPrice) {
    const priceInText = html.match(/(?:price|Price|PRICE)[\s:]*([0-9]+[.,][0-9]{2})/i)
    if (priceInText) {
      const priceStr = priceInText[1].replace(',', '.').trim()
      const price = parseFloat(priceStr)
      if (!isNaN(price) && price > 0) {
        extractedPrice = price
      }
    }
  }
  
  info.price = extractedPrice
  
  // Extract images - comprehensive search for all product images
  const images: string[] = []
  const baseUrlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
  
  // Multiple patterns to find images in various formats
  const imagePatterns = [
    // Standard img tags with src
    /<img[^>]*src=["']([^"']+)["'][^>]*>/gi,
    // Lazy-loaded images with data-src
    /<img[^>]*data-src=["']([^"']+)["'][^>]*>/gi,
    // data-lazy-src
    /<img[^>]*data-lazy-src=["']([^"']+)["'][^>]*>/gi,
    // data-original
    /<img[^>]*data-original=["']([^"']+)["'][^>]*>/gi,
    // srcset attribute
    /<img[^>]*srcset=["']([^"']+)["'][^>]*>/gi,
    // Background images in style attributes
    /style=["'][^"']*background-image:\s*url\(["']?([^"')]+)["']?\)/gi,
    // Meta og:image
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi,
    // JSON data structures (common in modern e-commerce)
    /"image":\s*["']([^"']+)["']/gi,
    /"images":\s*\[([^\]]+)\]/gi,
    // Gallery images
    /<div[^>]*class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
    // Product image containers
    /<div[^>]*class="[^"]*product[^"]*image[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
  ]
  
  // Also search for image URLs in common CDN patterns
  const cdnPatterns = [
    /https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp|gif)(\?[^"'\s<>]*)?/gi,
  ]
  
  // Extract from all patterns
  for (const pattern of imagePatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      let imgUrl = match[1] || match[0]
      
      // Handle srcset (comma-separated URLs)
      if (imgUrl.includes(',')) {
        const urls = imgUrl.split(',').map(u => u.trim().split(/\s+/)[0])
        for (const u of urls) {
          processImageUrl(u, images, baseUrlObj)
        }
      } else {
        processImageUrl(imgUrl, images, baseUrlObj)
      }
    }
  }
  
  // Extract from CDN patterns
  for (const pattern of cdnPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      processImageUrl(match[0], images, baseUrlObj)
    }
  }
  
  // Helper function to process and add image URL
  function processImageUrl(imgUrl: string, imagesArray: string[], baseUrl: URL) {
    if (!imgUrl) return
    
    // Clean up URL (remove query params that are just for sizing if needed)
    imgUrl = imgUrl.trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    
    // Skip logos, icons, flags, and non-product images
    const skipPatterns = [
      /logo/i,
      /icon/i,
      /avatar/i,
      /profile/i,
      /banner/i,
      /header/i,
      /footer/i,
      /social/i,
      /favicon/i,
      /\.svg/i,
      /flag/i,
      /country/i,
      /payment/i,
      /badge/i,
      /button/i,
    ]
    
    if (skipPatterns.some(p => p.test(imgUrl))) {
      return
    }
    
    // Convert to absolute URL
    let fullUrl = imgUrl
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      fullUrl = imgUrl
    } else if (imgUrl.startsWith('//')) {
      fullUrl = `https:${imgUrl}`
    } else if (imgUrl.startsWith('/')) {
      fullUrl = `${baseUrl.origin}${imgUrl}`
    } else {
      fullUrl = new URL(imgUrl, baseUrl.origin).href
    }
    
    // Only add if it looks like a product image
    // Must contain product-related keywords AND be from image CDN/static domain
    const productImageIndicators = [
      /galleryimage/i,
      /product/i,
      /gallery/i,
      /static\./i,
      /cdn\./i,
      /media\./i,
      /img\./i,
    ]
    
    // Check if URL is from a known image CDN or contains product keywords
    const isFromImageCDN = /(static|cdn|media|img|galleryimage|assets)\./i.test(fullUrl)
    const hasProductKeywords = /(product|gallery|mug|gift|item)/i.test(fullUrl)
    const isImageFile = fullUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
    
    // Prioritize images from galleryimage or product-specific paths
    if ((isFromImageCDN && (hasProductKeywords || isImageFile)) || 
        (hasProductKeywords && isImageFile)) {
      // Remove duplicates
      if (!imagesArray.includes(fullUrl)) {
        imagesArray.push(fullUrl)
      }
    }
  }
  
  // Remove duplicates and filter out thumbnails
  const uniqueImages = [...new Set(images)]
  
  // Filter out thumbnails and video play buttons - prioritize full-size images
  const fullSizeImages = uniqueImages.filter(url => {
    // Skip thumbnails (contain _thumb or small width parameters)
    if (/_thumb/i.test(url) || /width=(58|100|150|200)/i.test(url)) {
      return false
    }
    // Skip video play buttons
    if (/play-thumb|play-button|video.*thumb/i.test(url)) {
      return false
    }
    return true
  })
  
  // If we have full-size images, use those; otherwise use all images
  info.images = fullSizeImages.length > 0 ? fullSizeImages.slice(0, 20) : uniqueImages.slice(0, 20)
  
  // Extract text content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    info.textContent = bodyMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000)
  }
  
  return info
}

/**
 * Find product URLs from shop homepage or category pages
 */
async function findProductUrls(shopDomain: string, limit: number = 10): Promise<string[]> {
  const baseUrl = `https://${shopDomain}`
  const html = await fetchWebsite(baseUrl)
  
  const productUrls: string[] = []
  const urlPatterns = [
    /<a[^>]*href="([^"]*\/product[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*\/p\/[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*\/item[^"]*)"[^>]*>/gi,
  ]
  
  for (const pattern of urlPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      let productUrl = match[1]
      if (productUrl && !productUrl.startsWith('http')) {
        productUrl = new URL(productUrl, baseUrl).href
      }
      if (productUrl && !productUrls.includes(productUrl) && productUrls.length < limit) {
        productUrls.push(productUrl)
      }
    }
  }
  
  return productUrls.slice(0, limit)
}

/**
 * Read available filters from filters.md
 */
function readAvailableFilters(): string[] {
  try {
    const filePath = join(process.cwd(), 'agents/data/filters.md')
    const content = readFileSync(filePath, 'utf-8')
    const filterMatches = content.matchAll(/- \*\*([^\*]+)\*\*/g)
    const filters: string[] = []
    
    for (const match of filterMatches) {
      filters.push(match[1].trim())
    }
    
    return filters
  } catch (error) {
    console.warn('Could not read filters.md:', error)
    return []
  }
}

/**
 * Get all categories from Supabase
 */
async function getAllCategories(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, title, slug, parent_id')
  
  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }
  
  return data || []
}

/**
 * Match product to categories
 */
function matchCategories(
  productInfo: ExtractedProductInfo,
  allCategories: Array<{ id: string; title: string; slug: string }>
): string[] {
  const matchedCategoryIds: string[] = []
  const searchText = `${productInfo.title} ${productInfo.textContent || ''}`.toLowerCase()
  
  for (const category of allCategories) {
    const categoryTitle = category.title.toLowerCase()
    if (searchText.includes(categoryTitle) || categoryTitle.includes(searchText.substring(0, 20))) {
      // Only add if not already in the array (prevent duplicates)
      if (!matchedCategoryIds.includes(category.id)) {
        matchedCategoryIds.push(category.id)
      }
    }
  }
  
  // Return unique category IDs (additional safety check)
  return [...new Set(matchedCategoryIds)]
}


/**
 * Determine age filters based on product info
 */
function determineAgeFilters(
  productInfo: ExtractedProductInfo,
  availableFilters: string[]
): string[] {
  const ageFilters: string[] = []
  const searchText = `${productInfo.title} ${productInfo.textContent || ''}`.toLowerCase()
  
  // Simple keyword matching
  if (searchText.includes('baby') || searchText.includes('newborn') || searchText.includes('0-12')) {
    ageFilters.push('0 to 12 months')
  }
  if (searchText.includes('toddler') || searchText.includes('1-3') || searchText.includes('1 to 3')) {
    ageFilters.push('1 - 3 years')
  }
  if (searchText.includes('preschool') || searchText.includes('3-5') || searchText.includes('3 to 5')) {
    ageFilters.push('3 - 5 years')
  }
  if (searchText.includes('child') || searchText.includes('kid') || searchText.includes('5-7')) {
    ageFilters.push('5 - 7 years')
  }
  if (searchText.includes('teen') || searchText.includes('13-17')) {
    ageFilters.push('13 - 17 years')
  }
  if (searchText.includes('adult') || searchText.includes('18+')) {
    ageFilters.push('Adults')
  }
  
  // Filter to only include valid filters
  return ageFilters.filter(f => availableFilters.includes(f))
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/new-products.ts <shop-identifier> [product-url-1] [product-url-2] ...')
    console.error('   or: tsx scripts/new-products.ts <shop-identifier> --limit <number>')
    console.error('Examples:')
    console.error('  tsx scripts/new-products.ts yoursurprise.com https://www.yoursurprise.com/product1')
    console.error('  tsx scripts/new-products.ts yoursurprise.com --limit 2')
    process.exit(1)
  }
  
  const shopIdentifier = args[0]
  let productUrls: string[] = []
  let limit = 10
  let fromJsonFile: string | null = null
  
  // Parse arguments
  if (args.includes('--from-json')) {
    const jsonIndex = args.indexOf('--from-json')
    fromJsonFile = args[jsonIndex + 1]
  } else if (args.includes('--limit')) {
    const limitIndex = args.indexOf('--limit')
    limit = parseInt(args[limitIndex + 1]) || 10
    productUrls = []
  } else {
    // Check if second argument is a JSON file (ends with .json) or URL
    if (args.length > 1) {
      if (args[1].endsWith('.json')) {
        fromJsonFile = args[1]
      } else if (args[1].startsWith('http')) {
        productUrls = args.slice(1).filter(arg => arg.startsWith('http') && !arg.startsWith('--'))
      }
    }
  }
  
  console.log('Starting product processing...')
  console.log(`Shop identifier: ${shopIdentifier}`)
  
  try {
    const supabase = createAdminClient()
    
    // Step 1: Find shop in Supabase
    console.log('\n🔍 Looking up shop...')
    
    // Try to find by domain first
    let { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, domain, title')
      .eq('domain', shopIdentifier)
      .eq('active', true)
      .maybeSingle()
    
    // If not found, try by ID
    if (!shop && shopIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: shopById } = await supabase
        .from('shops')
        .select('id, domain, title')
        .eq('id', shopIdentifier)
        .eq('active', true)
        .maybeSingle()
      shop = shopById
    }
    
    // If still not found, try by title
    if (!shop) {
      const { data: shopByTitle } = await supabase
        .from('shops')
        .select('id, domain, title')
        .ilike('title', `%${shopIdentifier}%`)
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      shop = shopByTitle
    }
    
    if (!shop) {
      throw new Error(`Shop not found: ${shopIdentifier}. Please check the domain, ID, or title.`)
    }
    
    console.log(`✓ Found shop: ${shop.title} (${shop.domain})`)
    
    // Step 2: Load products from JSON file if provided
    let products: Array<ProductData & { extractedInfo: ExtractedProductInfo }> = []
    
    if (fromJsonFile) {
      console.log(`\n📂 Loading products from JSON file: ${fromJsonFile}`)
      try {
        const jsonContent = readFileSync(join(process.cwd(), fromJsonFile), 'utf-8')
        const jsonProducts = JSON.parse(jsonContent)
        
        products = jsonProducts.map((p: any) => {
          // Remove duplicate categories from JSON data
          const uniqueCategories = p.categories ? [...new Set(p.categories)] : []
          
          if (p.categories && uniqueCategories.length !== p.categories.length) {
            console.log(`   ⚠️  Product "${p.title}": Removed ${p.categories.length - uniqueCategories.length} duplicate categories from JSON`)
          }
          
          return {
            shop_id: shop.id,
            title: p.title,
            slug: p.slug || generateSlug(p.title),
            url: p.url,
            price: p.price !== undefined ? (typeof p.price === 'number' ? p.price : parseFloat(p.price)) : null,
            description: p.description || '',
            specifications: p.specifications || {},
            images: p.images || [],
            filters: p.filters || {},
            categories: uniqueCategories,
            extractedInfo: {
              title: p.title,
              url: p.url,
              price: p.price !== undefined ? (typeof p.price === 'number' ? p.price : parseFloat(p.price)) : null,
              images: p.images || [],
              textContent: p.textContent || ''
            }
          }
        })
        
        console.log(`✓ Loaded ${products.length} products from JSON`)
      } catch (error) {
        throw new Error(`Failed to load JSON file: ${error}`)
      }
    }
    
    // Step 2b: Get product URLs if not loading from JSON
    if (products.length === 0) {
      if (productUrls.length === 0) {
        console.log(`\n🔍 Finding products (limit: ${limit})...`)
        productUrls = await findProductUrls(shop.domain, limit)
        console.log(`✓ Found ${productUrls.length} product URLs`)
      } else {
        console.log(`\n📋 Using provided product URLs: ${productUrls.length}`)
      }
      
      if (productUrls.length === 0) {
        console.warn('⚠️  No products found. Please provide product URLs manually.')
        process.exit(0)
      }
    }
    
    // Step 3: Get categories and filters
    const allCategories = await getAllCategories(supabase)
    const availableFilters = readAvailableFilters()
    
    console.log(`\n📦 Processing ${productUrls.length} products...\n`)
    
    // Step 3: Process each product (if not loaded from JSON)
    if (products.length === 0) {
      for (let i = 0; i < productUrls.length; i++) {
        const productUrl = productUrls[i]
        console.log(`\n[${i + 1}/${productUrls.length}] Processing: ${productUrl}`)
        
        try {
          const html = await fetchWebsite(productUrl)
          const extractedInfo = extractProductInfo(html, productUrl)
          
          if (!extractedInfo.title) {
            console.warn('⚠️  Could not extract title, skipping...')
            continue
          }
          
          // Match categories
          const matchedCategoryIds = matchCategories(extractedInfo, allCategories)
          
          // Determine age filters
          const ageFilters = determineAgeFilters(extractedInfo, availableFilters)
          
          const product: ProductData & { extractedInfo: ExtractedProductInfo } = {
            shop_id: shop.id,
            title: extractedInfo.title,
            slug: generateSlug(extractedInfo.title),
            url: productUrl,
            price: extractedInfo.price ?? null,
            description: '', // Will be generated by AI
            specifications: extractedInfo.specifications || {},
            images: extractedInfo.images || [],
            filters: ageFilters.length > 0 ? { age: ageFilters } : {},
            categories: matchedCategoryIds,
            extractedInfo
          }
          
          products.push(product)
          
          console.log(`✓ Extracted: ${product.title}`)
          console.log(`  Price: ${product.price !== null ? `€${product.price.toFixed(2)}` : 'not found'}`)
          console.log(`  Images: ${product.images.length}`)
          console.log(`  Categories: ${matchedCategoryIds.length}`)
          console.log(`  Age filters: ${ageFilters.length > 0 ? ageFilters.join(', ') : 'none'}`)
          
        } catch (error) {
          console.error(`❌ Error processing product: ${error}`)
          continue
        }
      }
    }
    
    // Step 4: Check if we should insert or just extract
    const withDescriptions = args.includes('--with-descriptions') || fromJsonFile !== null
    
    if (!withDescriptions) {
      // Output product information for AI to generate descriptions
      if (products.length > 0) {
        console.log('\n\n📄 Product Information (for AI description generation):')
        console.log('='.repeat(80))
        
        // Prepare products for JSON output (without extractedInfo)
        const productsForOutput = products.map(p => ({
          title: p.title,
          url: p.url,
          slug: p.slug,
          price: p.price,
          images: p.images,
          specifications: p.specifications,
          filters: p.filters,
          categories: p.categories,
          textContent: p.extractedInfo.textContent?.substring(0, 2000),
          description: '' // To be filled by AI
        }))
        
        // Save to JSON file
        const jsonFilePath = join(process.cwd(), 'products-temp.json')
        writeFileSync(jsonFilePath, JSON.stringify(productsForOutput, null, 2), 'utf-8')
        console.log(`\n💾 Product data saved to: ${jsonFilePath}`)
        
        for (const product of products) {
          console.log(`\nProduct: ${product.title}`)
          console.log(`URL: ${product.url}`)
          console.log(`Price: ${product.price !== null ? `€${product.price.toFixed(2)}` : 'not found'}`)
          console.log(`Text content preview: ${product.extractedInfo.textContent?.substring(0, 500)}...`)
          console.log(`Images: ${product.images.length} found`)
          console.log(`Categories matched: ${product.categories.length}`)
          console.log(`Age filters: ${JSON.stringify(product.filters)}`)
        }
        
        console.log('\n\n⚠️  Descriptions not provided. Edit products-temp.json to add descriptions,')
        console.log('then run: npm run new-products yoursurprise.com --from-json products-temp.json')
      }
    } else {
      // Step 6: Insert products into Supabase (descriptions should be provided interactively or via JSON)
      console.log('\n\n💾 Inserting products into Supabase...')
      
      for (const product of products) {
        if (!product.description || product.description.trim().length < 100) {
          console.warn(`⚠️  Product "${product.title}" missing description, skipping...`)
          continue
        }
        
        try {
          // Insert product
          const { data: insertedProduct, error: productError } = await supabase
            .from('products')
            .insert({
              shop_id: product.shop_id,
              title: product.title,
              slug: product.slug,
              url: product.url,
              price: product.price,
              description: product.description,
              specifications: product.specifications,
              images: product.images,
              filters: product.filters
            })
            .select()
            .single()
          
          if (productError) {
            if (productError.code === '23505') { // Unique constraint violation
              console.warn(`⚠️  Product "${product.title}" already exists (slug: ${product.slug})`)
            } else {
              throw productError
            }
            continue
          }
          
          console.log(`✅ Created product: ${product.title} (ID: ${insertedProduct.id})`)
          
          // Insert category associations
          if (product.categories.length > 0) {
            // Remove duplicates before inserting (additional safety check)
            const uniqueCategoryIds = [...new Set(product.categories)]
            
            if (uniqueCategoryIds.length !== product.categories.length) {
              console.log(`   ⚠️  Removed ${product.categories.length - uniqueCategoryIds.length} duplicate category associations`)
            }
            
            const categoryInserts = uniqueCategoryIds.map(categoryId => ({
              product_id: insertedProduct.id,
              category_id: categoryId
            }))
            
            const { error: categoryError } = await supabase
              .from('product_categories')
              .upsert(categoryInserts, { onConflict: 'product_id,category_id' })
            
            if (categoryError) {
              console.warn(`⚠️  Error linking categories: ${categoryError.message}`)
            } else {
              console.log(`   Linked to ${uniqueCategoryIds.length} categories`)
            }
          }
          
          // Output product information for AI to generate threads
          console.log(`\n📝 Thread generation needed for: ${product.title}`)
          console.log(`   Product ID: ${insertedProduct.id}`)
          console.log(`   Description: ${product.description.substring(0, 200)}...`)
          console.log(`   Categories: ${product.categories.length}`)
          console.log(`   Please generate 1-3 unique thread texts for this product`)
          
        } catch (error) {
          console.error(`❌ Error inserting product "${product.title}": ${error}`)
          continue
        }
      }
      
      console.log('\n✅ Product processing complete!')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

