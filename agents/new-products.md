# New Products Agent Instructions

## Overview
This agent processes products from a shop that is already registered in the Supabase `shops` table. It visits the shop's website, systematically crawls through categories and products, collects product information, and saves it to the Supabase `products` table with proper category and filter associations.

## Process

### 1. Shop Lookup
When a user provides a shop identifier (ID, title, or domain):
- Query the Supabase `shops` table to find the shop record
- Extract the `domain` field from the shop record
- Verify the shop exists and is active
- If shop not found, inform the user and request clarification

### 2. Website Navigation
- Visit the shop's website using the domain from the database
- **IMPORTANT**: If the user specifies a specific country/market, you MUST only search for products available in that country and MUST NOT search for products from other countries
- If no specific country is provided by the user, then proceed with the standard navigation process below
- Navigate through the website systematically:
  - Start from the homepage
  - Identify category navigation (menu, sidebar, category pages)
  - Visit each category page sequentially
  - Within each category, visit each product page

### 3. Product Information Collection

For each product found, collect the following information:

#### **shop_id** (required)
- The UUID of the shop from the `shops` table
- Use the shop ID retrieved in step 1

#### **title** (required)
- Product title/name
- **IMPORTANT**: Do not use the exact title from the website verbatim
- **IMPORTANT**: Do NOT include the shop name or branding (e.g., " | YourSurprise", " - ShopName", etc.)
- Remove any shop name suffixes or branding from the title
- You may use the website title as a base, but adapt it if needed and remove shop branding
- Ensure it's clear, descriptive, and SEO-friendly
- Example: If website has "Baby Gift Set #123 | YourSurprise", adapt to "Personalized Baby Gift Set with Name" (remove " | YourSurprise")

#### **slug** (required)
- URL-friendly version of the title
- Generate from the title: lowercase, replace spaces with hyphens, remove special characters
- Must be unique per shop (or globally unique depending on schema)
- Example: "personalized-baby-gift-set-with-name"

#### **url** (required)
- Original product URL/link from the shop's website
- Full absolute URL to the product page
- This is the direct link to the product on the original shop website
- Example: "https://example-shop.com/products/personalized-baby-gift-set"

#### **price** (required)
- Product price from the shop's website
- Extract the current price displayed on the product page
- Look for price information in:
  - Price elements (e.g., `<span class="price">`, `<div class="product-price">`)
  - Meta tags (e.g., `og:price:amount`, `product:price:amount`)
  - JSON-LD structured data
  - Common price selectors and patterns
- Store as a numeric value (decimal number)
- If multiple prices are found (e.g., regular price and sale price), use the current/active price
- If price is not available or cannot be determined, use null (but try to find it)
- Example: 29.99, 15.50, 99.00

#### **description** (required)
- **CRITICAL**: This MUST be generated, not copied directly from the website
- The description must be 100% truthful and accurate
- Should include:
  - What the product is
  - Key features and capabilities
  - Why this gift is needed/useful
  - Who it's suitable for
  - How it can be used
  - Benefits and value proposition
- Write in a compelling, informative style
- **FORMATTING**: 
  - Structure the description into clear **paragraphs**.
  - Use `<strong>` tags to highlight key features or benefits (e.g., `<strong>Durable Material</strong>: Made from high-quality...`).
- Minimum 150-200 words recommended
- Example structure:
  ```html
  <p>This [product name] is perfect for [target audience]. It features <strong>[key feature]</strong> 
  and offers [benefits]. Ideal for [use cases], this gift [value proposition].</p>
  
  <p>The product is designed to <strong>[functionality]</strong> and can be used for [applications].
  It stands out because of its [unique selling point].</p>
  ```

#### **specifications** (required)
- Very specific product parameters
- Store as JSON format for future filtering capabilities
- Include technical details, dimensions, materials, features, etc.
- Example JSON structure:
  ```json
  {
    "dimensions": {
      "length": "10cm",
      "width": "5cm",
      "height": "3cm"
    },
    "materials": ["cotton", "polyester"],
    "weight": "200g",
    "age_range": "0-12 months",
    "features": ["washable", "personalizable"],
    "colors": ["blue", "pink", "white"]
  }
  ```

#### **images** (required)
- **IMPORTANT**: If the user specifies specific images that are allowed to be used, you MUST use ONLY those images and MUST NOT save any other images
- If no specific images are provided by the user, then proceed with the standard image collection process below
- **CRITICAL**: Collect ALL available product image URLs, not just one (only when user hasn't specified specific images)
- **CRITICAL FOR AMAZON PRODUCTS**: When extracting images from Amazon product pages, you MUST:
  1. **Only extract images from product-specific containers**:
     - Extract from `id="landingImage"` element (main product image)
     - Extract from `id="altImages"` container (product gallery images)
     - Extract from JSON-LD structured data with `@type: "Product"` (product-specific schema)
  2. **DO NOT extract images from**:
     - Generic page elements (headers, footers, navigation)
     - Related products sections
     - Advertisement sections
     - Other products' images that may appear on the page
  3. **Verify images belong to the product**:
     - Images must be from `media-amazon.com` or `images-na.ssl-images-amazon.com` domains
     - Images must contain valid Amazon image identifiers (`/I/[A-Z0-9]+`)
     - Filter out sprites, placeholders, and thumbnails
  4. **Extract full-size images**:
     - Use `data-a-dynamic-image` attributes which contain multiple sizes
     - Select the largest available size (typically `._AC_SL1500_` or larger)
     - Clean Amazon-specific size parameters to get full-resolution images
- For non-Amazon products, thoroughly search the product page for all images:
  - Main product image (hero/featured image)
  - Gallery images (if there's an image gallery or carousel)
  - Additional angles and views
  - Detail shots and close-ups
  - Alternative views (different colors, variations)
  - Lifestyle images showing the product in use
  - Any images in product image sliders, galleries, or carousels
- Look for:
  - `<img>` tags with product images
  - Image gallery/carousel components
  - Thumbnail images that link to full-size images
  - JavaScript-loaded images (check for image URLs in page source or API responses)
  - Image URLs in data attributes or JSON data structures
- Store as JSON array with all found images
- Ensure URLs are absolute (full URLs, not relative paths)
- Remove duplicates if the same image appears multiple times
- Minimum expectation: 2-3 images per product (main + details)
- If only one image is found, double-check the page for hidden galleries or lazy-loaded images
- **CRITICAL**: Always verify that extracted images actually belong to the product being processed, not to other products on the page
- Example:
  ```json
  [
    "https://example.com/products/main-image.jpg",
    "https://example.com/products/detail-1.jpg",
    "https://example.com/products/detail-2.jpg",
    "https://example.com/products/angle-view.jpg",
    "https://example.com/products/lifestyle.jpg"
  ]
  ```

### 4. Category Assignment

- **MANDATORY**: After extracting product information, you MUST query the Supabase `categories` table to find appropriate categories.
- **Process**:
  1. Query all categories from `categories` table.
  2. Analyze the product features, type, and purpose.
  3. Match against category titles/slugs in the database.
  4. **Present matching categories to user**:
     - Display all categories that you found to be appropriate for the product.
     - List them clearly with their full paths (e.g., "Baby Products > Toys").
     - Wait for user confirmation.
  5. **User confirmation**:
     - User will confirm which categories to use (all of them, or just some of them).
     - Create `product_categories` records only for the categories that the user confirmed.
  6. **If user doesn't confirm any categories**:
     - Propose a new category structure (e.g., "Parent Category > New Child Category") based on the product type.
     - Ask the user for confirmation to create this new category.
     - Upon user confirmation, use `scripts/new-category.ts` to create the category.
     - **ONLY THEN** link the product to the newly created category.

### 5. Filter Assignment

- Read available filters from `agents/data/filters.md`
- Currently, only age filters are available:
  - 0 to 12 months
  - 1 - 3 years
  - 3 - 5 years
  - 5 - 7 years
  - 8 - 12 years
  - 13 - 17 years
  - 18 - 24 years
  - Adults
- Analyze the product to determine appropriate age groups
- A product can match multiple age ranges
- Store filters as JSON in the `filters` field
- Example:
  ```json
  {
    "age": ["0 to 12 months", "1 - 3 years"]
  }
  ```

**Process**:
1. Read `agents/data/filters.md` to get available filter options
2. Analyze product description, specifications, and intended use
3. Determine which age groups the product is suitable for
4. Store as JSON object in the `filters` field

### 6. Data Processing Workflow

For each product:

1. **Extract basic information**:
   - Title (adapt if needed)
   - Generate slug
   - Capture original product URL
   - Collect images

2. **Generate description**:
   - Analyze product features from the website
   - Write original, truthful description
   - Include why it's needed, who it's for, how it's used

3. **Extract specifications**:
   - Gather technical details, dimensions, materials
   - Format as JSON

4. **Assign categories**:
   - Query `categories` table
   - Match product to appropriate categories
   - Present matching categories to user for confirmation
   - Wait for user to confirm which categories to use
   - Create `product_categories` entries only for confirmed categories

5. **Assign filters**:
   - Read `agents/data/filters.md`
   - Determine age groups
   - Format as JSON

6. **Validate data**:
   - All required fields present
   - Slug is unique and valid
   - URL is a valid absolute URL
   - Images are valid URLs
   - Specifications are valid JSON
   - Filters are valid JSON and use only allowed values
   - Categories exist in database

7. **Insert into database**:
   - Insert product into `products` table
   - Insert category associations into `product_categories` table

8. **Thread Text Generation (Mandatory)**:
   - **IMMEDIATELY** after collecting all product information, you MUST generate thread text and keywords.
   - Do not wait for user prompt or confirmation.
   - **Process**:
     1. Analyze the extracted product information (title, description, categories, URL).
     2. **CRITICAL - Thread Text Length**: Generate 1 unique, compelling social media post (thread) tailored to the product.
        - **Maximum length**: The thread text must NOT exceed 460 characters (500 - 40 safety margin for affiliate link).
        - **IMPORTANT**: Do NOT include the affiliate link in the thread text. The affiliate link will be added later when posting to threads.com platform.
        - **Format**: `[Thread text only]` (no link included)
        - Generate thread text that fits within 460 characters from the start (don't truncate long text, generate short text).
     3. Generate keywords based on product title, category, and target audience.
        - Format: Comma-separated keywords (e.g., "personalized gift, baby gift, custom mug")
     4. **Provide thread text and keywords to scripts**:
        - When calling `scripts/new-products.ts`, include thread text and keywords as part of the product data.
        - The script will then pass this information to `scripts/new-product-threads.ts` after product insertion.
   - **CRITICAL**: Thread text MUST be generated by AI assistant (not using templates or pre-written text)
   - Threads are social media posts (for threads.com platform) that will be published with a link to the product page and keywords
   - The thread should be:
     - **Unique and original** - generated specifically for this product based on its characteristics
     - Interesting and engaging
     - Relevant to the product
     - Include context about why the product is useful or who it's for
     - Written in English
     - **Maximum 460 characters** (affiliate link will be added separately when posting)
   - After product is inserted into database, `scripts/new-products.ts` will automatically call `scripts/new-product-threads.ts` with the generated thread text and keywords to insert into `product_threads` table.

### 7. Error Handling

- If a product page is inaccessible, skip it and continue with next product
- If required information cannot be extracted, mark field appropriately or skip product
- If category matching fails, assign to a generic category or skip category assignment
- If filter determination is unclear, use best judgment or leave empty
- Log errors but continue processing remaining products
- Report summary of successful and failed product imports

## Example Workflow

1. User provides: Shop ID or "Baby Gift Shop"
2. Agent queries Supabase `shops` table: `SELECT * FROM shops WHERE id = '...' OR title = '...'`
3. Agent retrieves domain: "babygiftshop.com"
4. Agent visits "https://babygiftshop.com"
5. Agent identifies categories: "Toys", "Clothing", "Gift Sets"
6. Agent visits "Toys" category page
7. Agent finds product: "Personalized Wooden Name Puzzle"
8. Agent extracts:
   - Title: "Personalized Wooden Name Puzzle for Babies"
   - Slug: "personalized-wooden-name-puzzle-for-babies"
   - URL: "https://babygiftshop.com/products/personalized-wooden-name-puzzle"
   - Price: 24.99
   - Description: [Generated 200-word description about the product]
   - Specifications: `{"materials": ["wood"], "dimensions": {...}, "age_range": "0-12 months"}`
   - Images: `["https://.../main.jpg", "https://.../detail.jpg"]`
9. Agent queries categories table and finds matches: "Baby Products > Toys", "Educational Toys"
10. Agent presents these categories to user for confirmation
11. User confirms: "Baby Products > Toys" (only one category)
12. Agent reads filters.md and determines age: "0 to 12 months", "1 - 3 years"
13. Agent stores filters: `{"age": ["0 to 12 months", "1 - 3 years"]}`
14. Agent inserts into `products` table
15. Agent inserts into `product_categories` table linking product to confirmed category
16. **Agent automatically generates thread content based on product info**
17. **Agent runs `scripts/new-product-threads.ts` to insert the thread**
18. Agent continues with next product
19. Agent reports completion summary

## Notes

- Process products systematically - don't skip categories
- Generate original descriptions - never copy-paste from website
- Be thorough in specification extraction
- Match categories accurately using database records
- Use only filters defined in `agents/data/filters.md`
- Prioritize accuracy and completeness over speed
- Handle errors gracefully and continue processing
