#!/usr/bin/env tsx

/**
 * Amazon Bestsellers Script
 * 
 * This script searches for Amazon bestseller products in a specific age group or category,
 * extracts the TOP 3 products, and processes them through the product pipeline.
 * 
 * Usage: 
 *   tsx scripts/amazon-bestsellers.ts --age "0-12 months"
 *   tsx scripts/amazon-bestsellers.ts --category "baby-toys"
 *   tsx scripts/amazon-bestsellers.ts --age "0-12 months" --limit 3
 * 
 * Examples:
 *   tsx scripts/amazon-bestsellers.ts --age "0 to 12 months"
 *   tsx scripts/amazon-bestsellers.ts --category "baby-products"
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../src/lib/supabase/admin'
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'
import { chromium, firefox } from 'playwright'

interface AmazonProduct {
  title: string
  url: string
  rank: number
}

/**
 * Ask user for input
 */
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

/**
 * Extract affiliate link from Amazon product page using Playwright Firefox
 */
async function extractAffiliateLink(productUrl: string): Promise<string | null> {
  console.log(`   🌐 Opening product page in Firefox...`)
  
  let context: any = null
  let page: any = null
  
  try {
    // Use Playwright Firefox with persistent context to use your existing profile
    console.log(`   🔄 Launching Firefox with your profile...`)
    
    const os = require('os')
    const fs = require('fs')
    const path = require('path')
    
    // Find Firefox profile directory - need to find the actual profile folder
    const firefoxProfilesBase = process.platform === 'darwin'
      ? `${os.homedir()}/Library/Application Support/Firefox/Profiles`
      : `${os.homedir()}/.mozilla/firefox`
    
    // Find the default profile folder (usually ends with .default-release or .default)
    let profilePath = firefoxProfilesBase
    try {
      if (fs.existsSync(firefoxProfilesBase)) {
        const profiles = fs.readdirSync(firefoxProfilesBase)
        const defaultProfile = profiles.find((p: string) => p.includes('.default'))
        if (defaultProfile) {
          profilePath = path.join(firefoxProfilesBase, defaultProfile)
          console.log(`   📁 Using Firefox profile: ${defaultProfile}`)
        } else if (profiles.length > 0) {
          profilePath = path.join(firefoxProfilesBase, profiles[0])
          console.log(`   📁 Using Firefox profile: ${profiles[0]}`)
        }
      } else {
        console.log(`   ⚠️  Firefox profiles directory not found: ${firefoxProfilesBase}`)
      }
    } catch (e: any) {
      console.log(`   ⚠️  Could not find Firefox profile: ${e?.message || e}`)
    }
    
    // Import Playwright Firefox
    const { firefox } = require('playwright')
    
    // Launch Firefox with persistent context (uses your existing profile and sessions)
    // Use launchPersistentContext to use your Firefox profile
    console.log(`   🚀 Launching Firefox (this may take a moment)...`)
    try {
      context = await firefox.launchPersistentContext(profilePath || undefined, {
        headless: false,
        viewport: null,
        timeout: 60000, // 60 second timeout for launch
      })
      
      // Verify context is still open
      const browser = context.browser()
      if (!context || !browser || !browser.isConnected()) {
        throw new Error('Browser context was closed immediately after launch')
      }
      
      // Get the first page or create new one
      const pages = context.pages()
      page = pages.length > 0 ? pages[0] : await context.newPage()
      
      // Verify page is valid
      if (!page || page.isClosed()) {
        throw new Error('Page was closed immediately after creation')
      }
      
      console.log(`   ✓ Launched Firefox browser successfully`)
      console.log(`   💡 Using your Firefox profile (Amazon Associates login should be preserved)`)
    } catch (launchError: any) {
      console.error(`   ❌ Error launching Firefox: ${launchError?.message || launchError}`)
      console.error(`   💡 Make sure Firefox is not already running or try closing other Firefox instances`)
      throw launchError
    }
    
    // Verify context and page are still valid before navigation
    if (!context || context.browser() === null) {
      throw new Error('Browser context was closed before navigation')
    }
    if (!page || page.isClosed()) {
      throw new Error('Page was closed before navigation')
    }
    
    // Navigate to product page
    console.log(`   📍 Navigating to product page...`)
    try {
      await page.goto(productUrl, { 
        waitUntil: 'networkidle',
        timeout: 60000 // Increased timeout
      })
      console.log(`   ✓ Page loaded successfully`)
    } catch (navError: any) {
      console.error(`   ⚠️  Navigation error: ${navError.message}`)
      // Continue anyway - page might still be usable
    }
    
    // Wait a moment for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Verify page is still valid after navigation
    if (!page || page.isClosed()) {
      throw new Error('Page was closed after navigation')
    }
    
    // Try to find and click the "Get Link" button
    // Amazon Associates button has ID: amzn-ss-get-link-button
    console.log(`   ⏳ Looking for "Get Link" button (ID: amzn-ss-get-link-button)...`)
    
    try {
      // Wait a bit for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Primary method: Use the known ID
      let buttonClicked = false
      try {
        const button = page.locator('#amzn-ss-get-link-button')
        if (await button.isVisible({ timeout: 5000 })) {
          console.log(`   🔘 Found "Get Link" button by ID, clicking...`)
          await button.click()
          buttonClicked = true
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (e) {
        console.log(`   ⚠️  Button with ID not found, trying alternative selectors...`)
      }
      
      // Fallback: Try other selectors if ID method fails
      if (!buttonClicked) {
        const buttonSelectors = [
          'button:has-text("Get Link")',
          'a:has-text("Get Link")',
          'button[id*="get-link"]',
          'a[id*="get-link"]',
          'button[aria-label*="Get Link"]',
          'a[aria-label*="Get Link"]',
          '.amzn-ss-text-shortlink-button',
          '#amzn-ss-text-shortlink-button'
        ]
        
        for (const selector of buttonSelectors) {
          try {
            const button = await page.locator(selector).first()
            if (await button.isVisible({ timeout: 2000 })) {
              console.log(`   🔘 Found "Get Link" button with selector: ${selector}`)
              await button.click()
              buttonClicked = true
              await new Promise(resolve => setTimeout(resolve, 3000))
              break
            }
          } catch (e) {
            // Try next selector
            continue
          }
        }
      }
      
      if (!buttonClicked) {
        console.log(`   ⚠️  "Get Link" button not found. You may need to click it manually.`)
      }
    } catch (e) {
      console.log(`   ⚠️  Could not automatically click "Get Link" button: ${e}`)
    }
    
    // Wait for the affiliate link textarea to appear
    console.log(`   ⏳ Waiting for affiliate link to generate (up to 60 seconds)...`)
    
    try {
      // Wait for the textarea element with id="amzn-ss-text-shortlink-textarea"
      await page.waitForSelector('#amzn-ss-text-shortlink-textarea', { 
        timeout: 60000 
      })
      
      // Extract the affiliate link from the textarea
      const affiliateLink = await page.evaluate(() => {
        const textarea = document.getElementById('amzn-ss-text-shortlink-textarea') as HTMLTextAreaElement
        return textarea ? textarea.value.trim() : null
      })
      
      if (affiliateLink && affiliateLink.length > 0) {
        console.log(`   ✓ Affiliate link extracted`)
        return affiliateLink
      } else {
        console.log(`   ⚠️  Textarea found but empty`)
        return null
      }
    } catch (error) {
      // Try alternative selectors
      console.log(`   ⏳ Trying alternative methods...`)
      
      const alternativeLink = await page.evaluate(() => {
        // Try other possible selectors
        const selectors = [
          '#amzn-ss-text-shortlink-textarea',
          'textarea[id*="shortlink"]',
          'textarea[id*="affiliate"]',
          'textarea[class*="shortlink"]'
        ]
        
        for (const selector of selectors) {
          const element = document.querySelector(selector) as HTMLTextAreaElement
          if (element && element.value && element.value.trim().length > 0) {
            return element.value.trim()
          }
        }
        return null
      })
      
      if (alternativeLink) {
        console.log(`   ✓ Affiliate link extracted (alternative method)`)
        return alternativeLink
      }
      
      console.log(`   ⚠️  Affiliate link textarea not found.`)
      console.log(`   💡 IMPORTANT: You need to be logged into Amazon Associates!`)
      console.log(`      Steps:`)
      console.log(`      1. Make sure you're logged into Amazon Associates in this browser`)
      console.log(`      2. Go to the product page and click "Get Link" or "Generate Link"`)
      console.log(`      3. The affiliate link will appear in the textarea`)
      console.log(`      4. The browser will stay open for 60 seconds for you to log in and copy the link manually`)
      
      // Keep browser open longer so user can manually log in and copy if needed
      await new Promise(resolve => setTimeout(resolve, 60000))
      
      // Try one more time to find the affiliate link after waiting
      console.log(`   🔄 Checking one more time for affiliate link...`)
      const finalCheck = await page.evaluate(() => {
        const textarea = document.getElementById('amzn-ss-text-shortlink-textarea') as HTMLTextAreaElement
        return textarea ? textarea.value.trim() : null
      })
      
      if (finalCheck && finalCheck.length > 0) {
        console.log(`   ✓ Affiliate link found after waiting!`)
        return finalCheck
      }
      
      return null
    }
  } catch (error: any) {
    console.error(`   ❌ Error extracting affiliate link: ${error?.message || error}`)
    if (error?.stack) {
      console.error(`   Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n')}`)
    }
    return null
  } finally {
    // Close context only if it's still open (async cleanup)
    if (context) {
      (async () => {
        try {
          // Check if context is still valid before closing
          const browser = context.browser()
          if (browser && browser.isConnected()) {
            await context.close()
            console.log(`   🔒 Browser context closed`)
          } else {
            console.log(`   ℹ️  Browser context already closed`)
          }
        } catch (closeError: any) {
          console.log(`   ⚠️  Error closing browser context: ${closeError?.message || closeError}`)
        }
      })().catch((err) => {
        console.log(`   ⚠️  Error in cleanup: ${err?.message || err}`)
      })
    }
    // Note: browser is not used when using launchPersistentContext
  }
}

/**
 * Find or create Amazon shop in database
 */
async function findOrCreateAmazonShop(supabase: ReturnType<typeof createAdminClient>) {
  // Known Amazon shop ID (use as primary method)
  const KNOWN_AMAZON_SHOP_ID = '9f947e90-eae1-4651-ba9f-7f8174375be8'
  
  // First, try known ID (most reliable)
  console.log(`   🔍 Trying known Amazon shop ID: ${KNOWN_AMAZON_SHOP_ID}`)
  const { data: shopById } = await supabase
    .from('shops')
    .select('id, title, domain, active')
    .eq('id', KNOWN_AMAZON_SHOP_ID)
    .maybeSingle()
  
  if (shopById) {
    console.log(`✓ Found Amazon shop by ID: ${shopById.title} (ID: ${shopById.id})`)
    // If shop is inactive, activate it
    if (shopById.active === false) {
      await supabase
        .from('shops')
        .update({ active: true })
        .eq('id', shopById.id)
      console.log(`   ✓ Activated Amazon shop`)
    }
    return shopById
  }
  
  // If not found by ID, try other methods
  let existingShop = null
  
  // Method 1: Search by exact domain
  const { data: shopByDomain } = await supabase
    .from('shops')
    .select('id, title, domain, active')
    .eq('domain', 'amazon.com')
    .maybeSingle()
  
  if (shopByDomain) {
    existingShop = shopByDomain
  }
  
  // Method 2: Search by title if not found
  if (!existingShop) {
    const { data: shopByTitle } = await supabase
      .from('shops')
      .select('id, title, domain, active')
      .ilike('title', '%Amazon%')
      .maybeSingle()
    
    if (shopByTitle) {
      existingShop = shopByTitle
    }
  }
  
  // Method 3: Try known ID as fallback
  if (!existingShop) {
    const { data: shopById } = await supabase
      .from('shops')
      .select('id, title, domain, active')
      .eq('id', KNOWN_AMAZON_SHOP_ID)
      .maybeSingle()
    
    if (shopById) {
      existingShop = shopById
      console.log(`   ℹ️  Found Amazon shop by known ID`)
    }
  }
  
  if (existingShop) {
    console.log(`✓ Found existing Amazon shop: ${existingShop.title} (ID: ${existingShop.id})`)
    // If shop is inactive, activate it
    if (existingShop.active === false) {
      await supabase
        .from('shops')
        .update({ active: true })
        .eq('id', existingShop.id)
      console.log(`   ✓ Activated Amazon shop`)
    }
    return existingShop
  }
  
  // If still not found, use known ID directly (shop exists but query might be failing)
  console.log(`   ⚠️  Shop not found by search methods. Using known ID directly: ${KNOWN_AMAZON_SHOP_ID}`)
  console.log(`✓ Using Amazon shop with known ID: ${KNOWN_AMAZON_SHOP_ID}`)
  return {
    id: KNOWN_AMAZON_SHOP_ID,
    title: 'Amazon',
    domain: 'amazon.com',
    active: true
  } as any

  // If not found, create it (commented out since shop exists)
  // console.log('📝 Amazon shop not found in database. Creating...')
  
  const { data: newShop, error } = await supabase
    .from('shops')
    .insert({
      title: 'Amazon',
      description: 'Amazon.com is the world\'s largest online retailer, offering millions of products across various categories including baby products, toys, electronics, and more.',
      domain: 'amazon.com',
      logo: 'https://www.amazon.com/favicon.ico',
      markets: ['usa', 'europe', 'america'],
      category: 'General',
      shipping: { info: 'Shipping varies by product and location. Check individual product pages for shipping details.' },
      active: true
    })
    .select()
    .single()

  if (error) {
    // If error is about duplicate or internal server error, try to find it one more time
    if (error.message.includes('duplicate') || error.message.includes('unique') || error.message.includes('Internal server error')) {
      console.log('   ⚠️  Shop might already exist. Trying to find it one more time...')
      const { data: foundShop } = await supabase
        .from('shops')
        .select('id, title, domain, active')
        .or('domain.eq.amazon.com,title.ilike.%Amazon%')
        .maybeSingle()
      
      if (foundShop) {
        console.log(`✓ Found Amazon shop: ${foundShop.title} (ID: ${foundShop.id})`)
        await supabase
          .from('shops')
          .update({ active: true })
          .eq('id', foundShop.id)
        return foundShop
      }
      // If still not found but error suggests it exists, try known Amazon shop ID again
      console.log(`   ⚠️  Trying fallback: using known Amazon shop ID...`)
      const { data: fallbackShop } = await supabase
        .from('shops')
        .select('id, title, domain, active')
        .eq('id', KNOWN_AMAZON_SHOP_ID)
        .maybeSingle()
      
      if (fallbackShop) {
        console.log(`✓ Found Amazon shop by known ID: ${fallbackShop.title} (ID: ${fallbackShop.id})`)
        await supabase
          .from('shops')
          .update({ active: true })
          .eq('id', fallbackShop.id)
        return fallbackShop
      }
      
      // If all else fails, throw error
      throw new Error(`Amazon shop might already exist but could not be found. Please check the database manually. Original error: ${error.message}`)
    }
    throw new Error(`Failed to create Amazon shop: ${error.message}`)
  }

  console.log(`✅ Created Amazon shop: ${newShop.title} (ID: ${newShop.id})`)
  return newShop
}

/**
 * Map age group to Amazon bestseller category URL
 */
function getAmazonBestsellerUrl(ageGroup?: string, category?: string, keyword?: string): string {
  if (category) {
    // Direct category URL
    return `https://www.amazon.com/gp/bestsellers/${category}/`
  }

  // If keyword is provided, still use bestseller page but we'll filter by keyword
  // Amazon search pages are harder to scrape, so we use bestseller + filtering
  if (keyword && keyword.toLowerCase().includes('toy')) {
    // Use baby-products bestseller page, we'll filter for toys
    return `https://www.amazon.com/gp/bestsellers/baby-products/`
  }

  // Map age groups to Amazon baby product categories
  const ageToCategory: Record<string, string> = {
    '0 to 12 months': 'baby-products',
    '0-12 months': 'baby-products',
    '0-12': 'baby-products',
  }

  const categorySlug = ageGroup ? ageToCategory[ageGroup.toLowerCase()] || 'baby-products' : 'baby-products'
  
  return `https://www.amazon.com/gp/bestsellers/${categorySlug}/`
}

/**
 * Get Amazon search URL for regular product search (not just bestsellers)
 */
function getAmazonSearchUrl(keyword: string, category?: string, excludedAsins: string[] = [], page: number = 1): string {
  // Build search query
  let searchQuery = keyword
  
  // Add excluded ASINs
  if (excludedAsins.length > 0) {
    searchQuery += ' ' + excludedAsins.map(asin => `-${asin}`).join(' ')
  }
  
  // Build base URL
  let baseUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`
  
  // Add category filter if provided
  if (category) {
    // Map category to Amazon search category
    const categoryMap: Record<string, string> = {
      'toys-and-games': 'toys-and-games',
      'baby-products': 'baby-products',
    }
    const amazonCategory = categoryMap[category] || category
    baseUrl += `&i=${amazonCategory}`
  }
  
  // Add page parameter if page > 1
  if (page > 1) {
    baseUrl += `&page=${page}`
  }
  
  return baseUrl
}

/**
 * Read checklist of already processed products
 */
function readChecklist(): Set<string> {
  const checklistPath = join(process.cwd(), 'agents/data/amazon-bestsellers-checklist.md')
  const processedUrls = new Set<string>()
  
  if (!existsSync(checklistPath)) {
    return processedUrls
  }
  
  try {
    const content = readFileSync(checklistPath, 'utf-8')
    // Extract URLs from checklist (lines starting with http:// or https://)
    const urlMatches = content.matchAll(/^(https?:\/\/[^\s]+)$/gm)
    for (const match of urlMatches) {
      const url = match[1].trim()
      // Normalize URL - extract base URL without query params for comparison
      const normalizedUrl = url.split('?')[0]
      processedUrls.add(normalizedUrl)
      
      // Extract ASIN from various URL formats
      // Pattern 1: /dp/ASIN or /gp/product/ASIN
      let asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/)
      if (asinMatch) {
        const asin = asinMatch[1]
        processedUrls.add(`https://www.amazon.com/dp/${asin}`)
      } else {
        // Pattern 2: Try to extract from amzn.to links by following redirect (but we can't do that here)
        // Instead, we'll check if URL contains ASIN in any form
        // For amzn.to links, we need to check the actual product URL when we process it
        // For now, just add the normalized URL
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read checklist: ${error}`)
  }
  
  return processedUrls
}

/**
 * Add product to checklist
 */
function addToChecklist(productUrl: string, productTitle: string, productId: string, ageFilters: string[], category: string): void {
  const checklistPath = join(process.cwd(), 'agents/data/amazon-bestsellers-checklist.md')
  
  // Extract ASIN from URL for reference
  const asinMatch = productUrl.match(/\/([A-Z0-9]{10})(?:[/?]|$)/)
  const asin = asinMatch ? asinMatch[1] : 'unknown'
  
  // Get current date
  const date = new Date().toISOString().split('T')[0]
  
  // Read existing content
  let content = ''
  if (existsSync(checklistPath)) {
    content = readFileSync(checklistPath, 'utf-8')
  } else {
    content = `# Amazon Bestsellers Checklist

This file tracks all products that have been successfully added to the database from Amazon bestseller searches. When searching for new bestseller products, check this list first to avoid processing the same products again.

## Format
Each entry includes:
- Product URL (affiliate link if available, or direct Amazon URL)
- Product Title
- Product ID (from database)
- Date Added
- Age Filters (actual age range, not requested)

## Products Added

`
  }
  
  // Find the last product number
  const productMatches = content.matchAll(/^### (\d+)\./gm)
  let lastNumber = 0
  for (const match of productMatches) {
    const num = parseInt(match[1])
    if (num > lastNumber) {
      lastNumber = num
    }
  }
  
  const nextNumber = lastNumber + 1
  const ageFiltersStr = ageFilters.length > 0 ? ageFilters.join(', ') : 'none'
  const categoryStr = category || '(none assigned)'
  
  // Add new product entry
  const newEntry = `### ${nextNumber}. ${productTitle}
- **URL:** ${productUrl}
- **Product ID:** ${productId}
- **Date Added:** ${date}
- **Age Filters:** ${ageFiltersStr}
- **Category:** ${categoryStr}

`
  
  // Append to content
  content += newEntry
  
  // Write back to file
  writeFileSync(checklistPath, content, 'utf-8')
  console.log(`   📝 Added to checklist: ${productTitle.substring(0, 50)}...`)
}

/**
 * Sleep/delay function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch Amazon bestseller page with retry logic
 */
async function fetchAmazonBestsellerPage(url: string, retries: number = 3): Promise<string> {
  console.log(`📥 Fetching: ${url}`)
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add delay before request (except first attempt)
      if (attempt > 1) {
        const delayMs = attempt * 2000 // 2s, 4s, 6s delays
        console.log(`   ⏳ Waiting ${delayMs / 1000}s before retry ${attempt}/${retries}...`)
        await sleep(delayMs)
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        }
      })
      
      if (response.status === 429) {
        if (attempt < retries) {
          console.warn(`   ⚠️  Rate limited (429). Retrying...`)
          continue
        } else {
          throw new Error(
            `HTTP 429: Amazon is rate limiting requests.\n` +
            `This is common when scraping Amazon. Please try:\n` +
            `1. Wait a few minutes and try again\n` +
            `2. Use a VPN or different network\n` +
            `3. Manually provide product URLs instead\n` +
            `\nYou can manually find products on Amazon and run:\n` +
            `npm run new-products amazon.com <product-url-1> <product-url-2> ...`
          )
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
      }
      
      return await response.text()
    } catch (error: any) {
      if (attempt === retries) {
        if (error.message && error.message.includes('429')) {
          throw error
        }
        throw new Error(`Failed to fetch after ${retries} attempts: ${error.message || error}`)
      }
      // Continue to next retry
    }
  }
  
  throw new Error('Failed to fetch Amazon page')
}

/**
 * Extract product URLs from Amazon bestseller page or search results
 * Note: Category and age group filtering is done by agents/amazon-bestsellers.md agent, not here
 * This function only extracts products from the page without filtering
 * Products already in the checklist are skipped
 */
function extractProductUrls(html: string, limit: number = 3, keyword?: string, category?: string): AmazonProduct[] {
  const products: AmazonProduct[] = []
  const processedUrls = readChecklist()
  
  // Amazon bestseller pages have products in specific structures
  // Look for product links in the bestseller list
  // Common patterns:
  // 1. Links with /dp/ (product detail pages)
  // 2. Links with /gp/product/
  // 3. Links in bestseller grid/list
  
  const productUrlPatterns = [
    // Pattern 1: Direct product links /dp/ASIN
    /<a[^>]*href="([^"]*\/dp\/[A-Z0-9]{10}[^"]*)"[^>]*>/gi,
    // Pattern 2: Product links /gp/product/
    /<a[^>]*href="([^"]*\/gp\/product\/[A-Z0-9]{10}[^"]*)"[^>]*>/gi,
    // Pattern 3: Links in bestseller items
    /<div[^>]*class="[^"]*zg-item[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*\/dp\/[A-Z0-9]{10}[^"]*)"[^>]*>/gi,
  ]
  
  const foundUrls = new Set<string>()
  
  for (const pattern of productUrlPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      let url = match[1]
      
      // Clean up URL - remove query parameters that might interfere
      if (url.includes('?')) {
        url = url.split('?')[0]
      }
      
      // Ensure it's a full URL
      if (!url.startsWith('http')) {
        url = `https://www.amazon.com${url}`
      }
      
      // Extract ASIN from URL for uniqueness
      const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/)
      if (asinMatch) {
        const asin = asinMatch[1]
        // Always use clean /dp/ASIN URL format (avoid redirect URLs)
        const cleanUrl = `https://www.amazon.com/dp/${asin}`
        
        // Skip if already processed (check before extracting title)
        if (processedUrls.has(cleanUrl) || foundUrls.has(cleanUrl)) {
          console.log(`   ⏭️  Skipping already processed product: ${cleanUrl}`)
          continue
        }
        
        foundUrls.add(cleanUrl)
        
        // Use clean URL for the product
        url = cleanUrl
        
        // Try to extract title from surrounding context
        let title = 'Amazon Product'
        const contextBefore = html.substring(Math.max(0, match.index! - 500), match.index)
        const contextAfter = html.substring(match.index! + match[0].length, match.index! + match[0].length + 500)
        const fullContext = contextBefore + match[0] + contextAfter
        
        // Look for title in various patterns
        // Pattern 1: In the link text itself
        const linkTextMatch = match[0].match(/>([^<]{10,150})</)
        if (linkTextMatch && linkTextMatch[1].trim().length > 10) {
          title = linkTextMatch[1].trim().replace(/\s+/g, ' ')
        }
        
        // Pattern 2: In alt text or aria-label
        if (title === 'Amazon Product') {
          const titleMatch = fullContext.match(/(?:alt|aria-label|title)=["']([^"']{10,150})["']/i)
          if (titleMatch && titleMatch[1].trim().length > 10) {
            title = titleMatch[1].trim()
          }
        }
        
        // Pattern 3: Look for span with class containing "text" or "title"
        if (title === 'Amazon Product') {
          const spanMatch = fullContext.match(/<span[^>]*class="[^"]*(?:text|title|name)[^"]*"[^>]*>([^<]{10,150})<\/span>/i)
          if (spanMatch && spanMatch[1].trim().length > 10) {
            title = spanMatch[1].trim().replace(/\s+/g, ' ')
          }
        }
        
        // Pattern 4: Look for div with product name (bestseller page)
        if (title === 'Amazon Product') {
          const divMatch = fullContext.match(/<div[^>]*class="[^"]*p13n-sc-truncate[^"]*"[^>]*>([^<]{10,150})<\/div>/i)
          if (divMatch && divMatch[1].trim().length > 10) {
            title = divMatch[1].trim().replace(/\s+/g, ' ')
          }
        }
        
        // Pattern 5: Look for h2 with product title (search results page)
        if (title === 'Amazon Product') {
          const h2Match = fullContext.match(/<h2[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]{10,150})<\/span>/i)
          if (h2Match && h2Match[1].trim().length > 10) {
            title = h2Match[1].trim().replace(/\s+/g, ' ')
          }
        }
        
        // Pattern 6: Look for span with class "a-text-normal" (search results)
        if (title === 'Amazon Product') {
          const spanMatch = fullContext.match(/<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([^<]{10,150})<\/span>/i)
          if (spanMatch && spanMatch[1].trim().length > 10) {
            title = spanMatch[1].trim().replace(/\s+/g, ' ')
          }
        }
        
        // Clean up title
        title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
        
        // Note: Category filtering is done by agents/amazon-bestsellers.md agent, not here
        // This script only finds products from the bestseller page
        // The agent will determine if the product matches the requested category and age group
        
        products.push({
          title,
          url,
          rank: products.length + 1
        })
        
        if (products.length >= limit) {
          break
        }
      }
    }
    
    if (products.length >= limit) {
      break
    }
  }
  
  // If we didn't find enough products, try a more aggressive search
  if (products.length < limit) {
    // Look for any /dp/ links in the page
    const allDpLinks = html.matchAll(/href="([^"]*\/dp\/[A-Z0-9]{10}[^"]*)"/gi)
    for (const match of allDpLinks) {
      let url = match[1]
      if (url.includes('?')) {
        url = url.split('?')[0]
      }
      if (!url.startsWith('http')) {
        url = `https://www.amazon.com${url}`
      }
      
      if (!foundUrls.has(url)) {
        foundUrls.add(url)
        products.push({
          title: 'Amazon Product',
          url,
          rank: products.length + 1
        })
        
        if (products.length >= limit) {
          break
        }
      }
    }
  }
  
  return products.slice(0, limit)
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  let ageGroup: string | undefined
  let category: string | undefined
  let keyword: string | undefined
  let limit = 3
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--age' && args[i + 1]) {
      ageGroup = args[i + 1]
      i++
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1]
      i++
    } else if (args[i] === '--keyword' && args[i + 1]) {
      keyword = args[i + 1]
      i++
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1]) || 3
      i++
    }
  }
  
  // Auto-generate keyword for baby toys if age group is specified
  if (ageGroup && !keyword && !category) {
    if (ageGroup.toLowerCase().includes('0') && ageGroup.toLowerCase().includes('12')) {
      keyword = 'baby toys 0-12 months'
    }
  }
  
  // No parameters required - will use default keywords for diverse product search
  // Parameters are optional and can be used to narrow down search
  
  console.log('🔍 Amazon Bestsellers Search')
  console.log('='.repeat(50))
  if (ageGroup) {
    console.log(`Age Group: ${ageGroup}`)
  }
  if (category) {
    console.log(`Category: ${category}`)
  }
  if (keyword) {
    console.log(`Keyword: ${keyword}`)
  }
  console.log(`Limit: ${limit} products per batch`)
  console.log('   Mode: Continuous cycle (process one, then search for next)')
  console.log('')
  
  try {
    const supabase = createAdminClient()
    
    // Step 1: Find or create Amazon shop
    console.log('🏪 Looking up Amazon shop...')
    const shop = await findOrCreateAmazonShop(supabase)
    
    // Continuous cycle: search for one product, process it, then search for next
    let cycleCount = 0
    const searchKeywords = keyword 
      ? [keyword] 
      : [
          'popular gifts for kids',
          'best selling toys',
          'popular baby products',
          'best gifts for children',
          'popular kids items',
          'best selling baby items',
          'popular children products',
          'best kids gifts',
          'popular baby gifts',
          'best selling children items',
          'popular household items',
          'best selling home products',
          'popular kitchen items',
          'best selling electronics',
          'popular gadgets',
          'best selling accessories',
          'popular health products',
          'best selling beauty items',
          'popular sports items',
          'best selling outdoor products'
        ]
    
    let keywordIndex = 0
    // Keep track of ASINs found in this session/cycle to exclude from future searches
    const excludedAsins: string[] = []
    const maxPagesPerKeyword = 10 // Maximum pages to search per keyword
    
    while (cycleCount < limit) {
      cycleCount++
      console.log(`\n${'='.repeat(80)}`)
      console.log(`🔄 CYCLE ${cycleCount}/${limit} - Searching for next product...`)
      console.log(`${'='.repeat(80)}\n`)
      
      // Rotate through keywords to find diverse products
      const currentKeyword = searchKeywords[keywordIndex % searchKeywords.length]
      keywordIndex++
      
      let products: AmazonProduct[] = []
      let currentPage = 1
      let foundProduct = false
      
      // Try multiple pages for this keyword until we find a product
      while (currentPage <= maxPagesPerKeyword && !foundProduct) {
      // Search for products
        console.log(`🔍 Searching Amazon by keyword: "${currentKeyword}" (Page ${currentPage})`)
        if (excludedAsins.length > 0) {
          console.log(`   Excluding ${excludedAsins.length} previously found ASINs`)
        }
        const searchUrl = getAmazonSearchUrl(currentKeyword, category, excludedAsins, currentPage)
      console.log(`📊 Amazon Search URL: ${searchUrl}`)
      
      // Fetch search results page
      console.log('\n📥 Fetching Amazon search results...')
      const html = await fetchAmazonBestsellerPage(searchUrl)
      
      // Extract ONE product from search results
      console.log(`\n🔍 Extracting 1 product from search results...`)
      products = extractProductUrls(html, 1, currentKeyword, category)
      
      if (products.length === 0) {
          console.log(`\n⚠️  No new products found on page ${currentPage} with keyword "${currentKeyword}"`)
          if (currentPage < maxPagesPerKeyword) {
            console.log(`   Trying next page (${currentPage + 1})...\n`)
            currentPage++
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before next page
            continue
          } else {
            console.log(`   Reached maximum pages (${maxPagesPerKeyword}) for this keyword`)
        console.log(`   Trying next keyword...\n`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before next keyword
            break
          }
        } else {
          foundProduct = true
        }
      }
      
      if (!foundProduct || products.length === 0) {
        continue
      }
      
      // Process the first product found
      const product = products[0]
      console.log(`\n📦 Found product: ${product.title.substring(0, 60)}...`)
      console.log(`URL: ${product.url}\n`)
      
      // Extract affiliate link first (needed for checklist check)
      console.log('🤖 Extracting affiliate link...')
      let affiliateLink = await extractAffiliateLink(product.url)
      
      if (!affiliateLink) {
        console.log(`   ⚠️  Could not extract affiliate link (Firefox issue)`)
        console.log(`   ℹ️  Using product URL directly as affiliate link for processing...`)
        // Use product URL directly if affiliate link extraction fails
        // This allows processing to continue even if Firefox can't launch
        affiliateLink = product.url
      }
      
      console.log(`   ✅ Affiliate link: ${affiliateLink.substring(0, 60)}...`)
      
      // Check checklist for affiliate links (primary check method)
      const processedUrls = readChecklist()
      const affiliateLinkNormalized = affiliateLink.split('?')[0]
      
      // Extract ASIN first to add to excluded list even if product is already processed
      // This ensures we don't find the same product again in this session
      const asinMatchForExclusion = product.url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/)
      if (asinMatchForExclusion) {
        const asin = asinMatchForExclusion[1]
        if (!excludedAsins.includes(asin)) {
          excludedAsins.push(asin)
          console.log(`   📝 Added ASIN ${asin} to exclusion list for this session`)
        }
      }
      
      // Check if affiliate link is already in checklist
      if (processedUrls.has(affiliateLinkNormalized)) {
        console.log(`   ⏭️  Product already in checklist (by affiliate link), skipping...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      
      // Also check product URL and /dp/ASIN format as fallback
      const productUrlNormalized = product.url.split('?')[0]
      if (processedUrls.has(productUrlNormalized)) {
        console.log(`   ⏭️  Product already in checklist (by URL), skipping...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      
      // Extract ASIN to check /dp/ASIN format
      if (asinMatchForExclusion) {
        const asin = asinMatchForExclusion[1]
        const dpUrl = `https://www.amazon.com/dp/${asin}`
        if (processedUrls.has(dpUrl)) {
          console.log(`   ⏭️  Product already in checklist (by ASIN), skipping...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
      }
      
      // Process product through new-products.ts
      console.log(`\n🚀 Processing product through new-products.ts...`)
      console.log(`   Command: npm run new-products ${shop.id} ${affiliateLink.substring(0, 60)}...`)
      console.log(`   Waiting for process to complete...\n`)
      
      const { spawn } = require('child_process')
      const newProductsArgs = [
        shop.id,
        affiliateLink
      ]
      
      let processCompleted = false
      let processExitCode: number | null = null
      
      await new Promise<void>((resolve) => {
        const child = spawn('npm', ['run', 'new-products', ...newProductsArgs], {
          stdio: 'inherit',
          shell: true
        })
        
        child.on('close', (code: number | null) => {
          processCompleted = true
          processExitCode = code
          console.log(`\n${'='.repeat(80)}`)
          if (code === 0) {
            console.log(`✅ Successfully processed product in cycle ${cycleCount}!`)
            console.log(`   Product should now be in database with thread.`)
          } else {
            console.error(`❌ Error processing product. Exit code: ${code}`)
            console.error(`   Product may not have been inserted.`)
          }
          console.log(`${'='.repeat(80)}\n`)
          resolve() // Always continue to next product
        })
        
        child.on('error', (error: Error) => {
          processCompleted = true
          processExitCode = -1
          console.error(`\n❌ Error spawning new-products process: ${error}`)
          resolve() // Always continue to next product
        })
      })
      
      // Verify process completed
      if (!processCompleted) {
        console.error(`\n⚠️  WARNING: Process completion status unclear!`)
      }
      
      // Small delay to ensure database writes are complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`\n📊 Cycle ${cycleCount} complete. Continuing to next product...\n`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before next search
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()

