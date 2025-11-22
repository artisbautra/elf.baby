#!/usr/bin/env tsx

/**
 * New Shop Script
 * 
 * This script analyzes a shop website and creates a record in the Supabase shops table.
 * Follows the instructions from agents/new-shop.md
 * 
 * Usage: tsx scripts/new-shop.ts <shop-url>
 * Example: tsx scripts/new-shop.ts https://example-shop.com
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

interface ShopData {
  title: string
  description: string
  logo: string
  domain: string
  markets: string[]
  category: string | string[]
  shipping: string | object
}

interface ExtractedInfo {
  title?: string
  description?: string
  logo?: string
  domain?: string
  markets?: string[]
  categories?: string[]
  shipping?: string
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
 * Extract basic information from HTML
 */
function extractBasicInfo(html: string, url: string): ExtractedInfo {
  const info: ExtractedInfo = {}
  
  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    info.title = titleMatch[1].trim()
  }
  
  // Extract logo - look for common logo patterns
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*logo[^"]*)"[^>]*>/i,
    /<link[^>]*rel="icon"[^>]*href="([^"]+)"/i,
    /<link[^>]*rel="shortcut icon"[^>]*href="([^"]+)"/i,
  ]
  
  for (const pattern of logoPatterns) {
    const match = html.match(pattern)
    if (match) {
      const logoUrl = match[1]
      if (logoUrl.startsWith('http')) {
        info.logo = logoUrl
      } else if (logoUrl.startsWith('//')) {
        info.logo = `https:${logoUrl}`
      } else {
        const baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
        info.logo = new URL(logoUrl, baseUrl.origin).href
      }
      break
    }
  }
  
  // Extract domain
  info.domain = extractDomain(url)
  
  return info
}

/**
 * Extract text content from HTML for analysis
 */
function extractTextContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) return ''
  
  return bodyMatch[1]
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000) // Keep more text for AI analysis
}

/**
 * Extract categories from HTML (simplified - looks for navigation, category links)
 */
function extractCategories(html: string): string[] {
  const categories: string[] = []
  
  // Look for common category patterns in navigation
  const categoryPatterns = [
    /<a[^>]*href="[^"]*categor[^"]*"[^>]*>([^<]+)<\/a>/gi,
    /<a[^>]*class="[^"]*categor[^"]*"[^>]*>([^<]+)<\/a>/gi,
    /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
  ]
  
  const foundCategories = new Set<string>()
  
  for (const pattern of categoryPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const text = match[1]?.replace(/<[^>]+>/g, '').trim()
      if (text && text.length > 2 && text.length < 50) {
        foundCategories.add(text)
      }
    }
  }
  
  return Array.from(foundCategories).slice(0, 10) // Limit to 10 categories
}

/**
 * Extract shipping information (simplified)
 */
function extractShippingInfo(html: string): string {
  // Look for shipping-related content
  const shippingPatterns = [
    /shipping[^<]*:?\s*\$?([\d.]+)/gi,
    /free shipping/i,
    /delivery[^<]*:?\s*(\d+[^<]*days?)/gi,
  ]
  
  const shippingInfo: string[] = []
  
  // Try to find shipping policy page links
  const shippingLinkMatch = html.match(/<a[^>]*href="[^"]*shipping[^"]*"[^>]*>([^<]+)<\/a>/i)
  if (shippingLinkMatch) {
    shippingInfo.push('Shipping information available on website')
  }
  
  // Look for common shipping text
  if (html.match(/free shipping/i)) {
    shippingInfo.push('Free shipping available')
  }
  
  if (shippingInfo.length === 0) {
    return 'Shipping information: Please check website for details'
  }
  
  return shippingInfo.join('. ')
}

/**
 * Extract markets from HTML (looks for country/region mentions)
 */
function extractMarkets(html: string): string[] {
  const markets: string[] = []
  const marketKeywords: Record<string, string> = {
    'europe': 'europe',
    'europa': 'europe',
    'america': 'america',
    'usa': 'usa',
    'united states': 'usa',
    'canada': 'canada',
    'uk': 'uk',
    'united kingdom': 'uk',
    'latvia': 'latvia',
    'lithuania': 'lithuania',
    'estonia': 'estonia',
  }
  
  const lowerHtml = html.toLowerCase()
  
  for (const [keyword, market] of Object.entries(marketKeywords)) {
    if (lowerHtml.includes(keyword)) {
      markets.push(market)
    }
  }
  
  // If no markets found, default to common ones
  if (markets.length === 0) {
    markets.push('europe', 'america')
  }
  
  return [...new Set(markets)]
}

/**
 * Read existing categories from categories.md
 */
function readExistingCategories(): string[] {
  try {
    const filePath = join(process.cwd(), 'agents/data/categories.md')
    const content = readFileSync(filePath, 'utf-8')
    const categoryMatches = content.matchAll(/- \*\*([^\*]+)\*\*(?: > \*\*([^\*]+)\*\*)?/g)
    const categories: string[] = []
    
    for (const match of categoryMatches) {
      if (match[2]) {
        categories.push(`${match[1]} > ${match[2]}`)
      } else {
        categories.push(match[1])
      }
    }
    
    return categories
  } catch (error) {
    console.warn('Could not read categories.md:', error)
    return []
  }
}

/**
 * Add new categories to categories.md
 */
function addCategoriesToFile(newCategories: string[]): void {
  try {
    const filePath = join(process.cwd(), 'agents/data/categories.md')
    let content = readFileSync(filePath, 'utf-8')
    
    const existingCategories = readExistingCategories()
    const categoriesToAdd = newCategories.filter(
      cat => !existingCategories.some(existing => 
        existing.toLowerCase() === cat.toLowerCase()
      )
    )
    
    if (categoriesToAdd.length === 0) {
      console.log('No new categories to add')
      return
    }
    
    // Sort categories
    const allCategories = [...existingCategories, ...categoriesToAdd].sort()
    
    // Rebuild categories section
    const categoriesSection = allCategories.map(cat => {
      if (cat.includes(' > ')) {
        const [level1, level2] = cat.split(' > ')
        return `- **${level1}** > **${level2}**`
      }
      return `- **${cat}**`
    }).join('\n')
    
    // Replace categories section
    content = content.replace(
      /## Categories\n\n([\s\S]*?)(?=\n##|\n$)/,
      `## Categories\n\n${categoriesSection}\n\n`
    )
    
    writeFileSync(filePath, content, 'utf-8')
    console.log(`Added ${categoriesToAdd.length} new categories to categories.md`)
  } catch (error) {
    console.error('Error updating categories.md:', error)
  }
}

/**
 * Main function
 */
async function main() {
  const url = process.argv[2]
  const description = process.argv[3] // Optional: description can be provided as second argument
  
  if (!url) {
    console.error('Usage: tsx scripts/new-shop.ts <shop-url> [description]')
    console.error('If description is not provided, the script will output extracted information')
    console.error('for AI assistant to generate the description.')
    process.exit(1)
  }
  
  console.log('Starting shop analysis...')
  console.log(`URL: ${url}`)
  
  try {
    // Step 1: Fetch website
    const html = await fetchWebsite(url)
    
    // Step 2: Extract basic information
    const extractedInfo = extractBasicInfo(html, url)
    console.log('\n📋 Extracted basic info:')
    console.log(JSON.stringify(extractedInfo, null, 2))
    
    // Step 3: Extract additional information
    extractedInfo.categories = extractCategories(html)
    extractedInfo.shipping = extractShippingInfo(html)
    extractedInfo.markets = extractMarkets(html)
    
    // Extract text content for AI analysis
    const textContent = extractTextContent(html)
    
    // Step 4: If description not provided, output information for AI to generate
    if (!description) {
      console.log('\n📄 Website text content (first 2000 chars):')
      console.log(textContent.substring(0, 2000))
      console.log('\n📊 Full extracted information:')
      console.log(JSON.stringify({
        ...extractedInfo,
        textContentPreview: textContent.substring(0, 5000)
      }, null, 2))
      console.log('\n⚠️  Description not provided. Please generate description using the information above')
      console.log('and run the script again with: tsx scripts/new-shop.ts <url> "<description>"')
      process.exit(0)
    }
    
    // Step 5: Prepare shop data
    const shopData: ShopData = {
      title: extractedInfo.title || 'Unknown Shop',
      description: description,
      logo: extractedInfo.logo || '',
      domain: extractedInfo.domain || extractDomain(url),
      markets: extractedInfo.markets || ['europe', 'america'],
      category: extractedInfo.categories?.[0] || 'General',
      shipping: extractedInfo.shipping || 'Shipping information not available'
    }
    
    // Step 6: Validate data
    if (!shopData.title || !shopData.description || !shopData.domain) {
      throw new Error('Missing required fields: title, description, or domain')
    }
    
    if (shopData.description.length < 100) {
      console.warn('⚠️  Description is shorter than recommended (100 words)')
    }
    
    // Step 7: Save categories
    if (extractedInfo.categories && extractedInfo.categories.length > 0) {
      addCategoriesToFile(extractedInfo.categories)
    }
    
    // Step 8: Insert into Supabase
    console.log('\n💾 Inserting into Supabase...')
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('shops')
      .insert({
        title: shopData.title,
        description: shopData.description,
        logo: shopData.logo,
        domain: shopData.domain,
        markets: shopData.markets,
        category: typeof shopData.category === 'string' 
          ? shopData.category 
          : shopData.category.join(', '),
        shipping: typeof shopData.shipping === 'string'
          ? { info: shopData.shipping }
          : shopData.shipping
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    console.log('\n✅ Successfully created shop!')
    console.log('Shop ID:', data.id)
    console.log('Title:', data.title)
    console.log('Domain:', data.domain)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

