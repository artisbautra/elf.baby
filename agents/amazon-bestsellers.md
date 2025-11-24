# Amazon Bestsellers Agent Instructions

## Overview
This agent searches for Amazon bestseller products in specific age groups or categories, automatically extracts affiliate links, and processes them through the product pipeline. The agent uses `scripts/amazon-bestsellers.ts` to find products and then processes each product through the `agents/new-products.md` agent workflow.

## Process

### 1. User Request
When a user requests to find Amazon bestseller products, you MUST ask for or identify:

- **Category** (required): The Amazon category to search in
  - Examples: "baby-products", "toys-and-games", "baby-clothing"
  - If user specifies "rotaļlietas" or "toys", use "toys-and-games"
  - If user specifies "bērniem" or "baby", use "baby-products"
  
- **Age Group** (required): The target age range for products
  - Examples: "0 to 12 months", "1-3 years", "0-12 months"
  - Must match the format in `agents/data/filters.md`
  
- **Limit** (required): Number of products to find and process
  - Default: 3 if not specified
  - Must be a positive number

**Example user request:**
- "Atrodi bestseller rotaļlietas mazuļiem līdz 1 gadam, limits 1"
- Translation: Find bestseller toys for babies up to 1 year, limit 1
- Parameters: category="toys-and-games", age="0 to 12 months", limit=1

### 2. Check Existing Products Checklist
Before searching for new products, check the checklist file `agents/data/amazon-bestsellers-checklist.md` to see which products have already been processed. The script `scripts/amazon-bestsellers.ts` automatically skips products that are already in this checklist.

**Important:** All products successfully added to the database are automatically recorded in this checklist. When searching for bestseller products, the script will automatically skip any products that match URLs in the checklist to avoid duplicate processing.

### 3. Execute Amazon Bestsellers Script
Run the `scripts/amazon-bestsellers.ts` script with the provided parameters:

```bash
npm run amazon-bestsellers -- --age "0 to 12 months" --category "toys-and-games" --limit 1
```

**Script behavior:**
1. Finds or creates Amazon shop in the database
2. Fetches Amazon bestseller page for the specified category
3. Extracts product URLs and titles
4. **Automatically opens each product page in Firefox**
5. **Automatically clicks "Get Link" button** (if available)
6. **Automatically extracts affiliate links** from Amazon Associates textarea
7. Displays numbered list of found products with affiliate links

**Note:** The script uses Firefox with persistent context, so it will use the user's existing Firefox profile and Amazon Associates login session.

### 4. Product Processing via agents/new-products.md
**CRITICAL**: After products are found and affiliate links are extracted, you MUST process each product through the `agents/new-products.md` agent workflow.

**IMPORTANT**: Before processing a product, you MUST verify that it matches the requested category and age group. If a product does NOT match:
- **DO NOT** process the product further
- **DO NOT** insert it into the database
- **Find another product** from the bestseller list that matches the criteria
- Continue searching until you find the required number of matching products

For each product found by the script:

#### Step 3.1: Extract Product Information and Verify Category Match
Using the affiliate link URL, follow the `agents/new-products.md` instructions to:
1. **Fetch the product page** from the affiliate link
2. **Extract product information**:
   - Title (remove Amazon branding)
   - Slug (generate from title)
   - URL (use the affiliate link)
   - Price (extract from product page)
   - Description (generate original description, minimum 150-200 words)
   - Specifications (extract as JSON)
   - **Images (CRITICAL)**: 
     - **ONLY extract images from product-specific containers** (`id="landingImage"` and `id="altImages"`)
     - **DO NOT extract images from other products, advertisements, or generic page elements**
     - Verify all images are from `media-amazon.com` domain
     - Ensure images are full-size (not thumbnails)
     - **CRITICAL**: Verify that extracted images actually belong to THIS product, not to other products that may appear on the page
3. **VERIFY CATEGORY MATCH**:
   - Analyze the product title, description, and specifications
   - Check if the product matches the requested category (e.g., "toys-and-games" = must be a toy)
   - Check if the product matches the requested age group
   - **If product does NOT match**: Skip this product, find another from the list, and repeat this step
   - **If product matches**: Continue to Step 3.2

#### Step 3.2: Category Assignment
Follow `agents/new-products.md` section 4 (Category Assignment), but **automatically assign categories without user confirmation**:
1. Query all categories from Supabase `categories` table
2. Analyze the product features, type, and purpose
3. Match against category titles/slugs in the database
4. **Automatically assign all matching categories**:
   - Find all categories that match the product
   - Create `product_categories` records for ALL matching categories automatically
   - No user confirmation required
5. **If no matching categories found**:
   - Propose a new category structure based on the product type
   - Automatically use `scripts/new-category.ts` to create the category
   - Link the product to the newly created category

#### Step 3.3: Filter Assignment
Follow `agents/new-products.md` section 5 (Filter Assignment):
1. Read available filters from `agents/data/filters.md`
2. Analyze the product to determine appropriate age groups
3. A product can match multiple age ranges
4. Store filters as JSON in the `filters` field
5. Example: `{"age": ["0 to 12 months", "1 - 3 years"]}`

#### Step 3.4: Insert Product into Database
Follow `agents/new-products.md` section 6 (Data Processing Workflow):
1. Validate all required fields are present
2. Insert product into `products` table
3. Insert category associations into `product_categories` table
4. Verify the product was created successfully

#### Step 3.5: Automatic Thread Generation (Mandatory)
Follow `agents/new-products.md` section 8 (Automatic Thread Generation):
- **IMMEDIATELY** after successfully inserting a product, you MUST automatically proceed to generate and insert a thread
- Do not wait for user prompt or confirmation
- **Process**:
  1. Analyze the extracted product information (title, description, categories)
  2. Generate 1 unique, compelling social media post (thread) tailored to the product
     3. Create a temporary JSON file in `tmp/` folder (e.g., `tmp/threads-temp-<product-id>.json`) with the generated content
     4. Run `scripts/new-product-threads.ts <product_id> --from-json tmp/threads-temp-<product-id>.json` to insert the thread
  5. Delete the temporary JSON file after success
- This ensures every product immediately has social media content ready
- **CRITICAL**: Thread text MUST be generated by AI assistant (not using templates or pre-written text)
- Threads are social media posts (for threads.com platform) that will be published with a link to the product page and keywords
- The thread should be:
  - **Unique and original** - generated specifically for this product based on its characteristics
  - Interesting and engaging
  - Relevant to the product
  - Include context about why the product is useful or who it's for
  - Written in English
- Generate keywords based on product title, category, and target audience
- Store the thread in `product_threads` table with:
  - `product_id`: UUID of the product
  - `text`: The AI-generated thread text content (unique for each product)
  - `keywords`: Comma-separated keywords (e.g., "baby toy, sensory play, 0-12 months")

### 4. Completion
After all products are processed:
- Report summary of successful and failed product imports
- List all product IDs that were created
- Confirm that threads were generated for each product
- Provide any error messages or warnings

## Complete Workflow Example

### User Request
"Atrodi bestseller rotaļlietas mazuļiem līdz 1 gadam, limits 1"

### Step-by-Step Execution

**Step 1: Parse Request**
- Category: "toys-and-games" (rotaļlietas)
- Age Group: "0 to 12 months" (mazuļiem līdz 1 gadam)
- Limit: 1

**Step 2: Execute Amazon Bestsellers Script**
```bash
npm run amazon-bestsellers -- --age "0 to 12 months" --category "toys-and-games" --limit 1
```

**Step 3: Script Output**
The script will:
1. Find Amazon shop in database
2. Fetch bestseller page
3. Extract product: "Baby Montessori Sensory Toys for 0-6 6-12 Months"
4. Open product page in Firefox
5. Automatically click "Get Link" button
6. Extract affiliate link: `https://amzn.to/48jifc0`
7. Display: `1. https://amzn.to/48jifc0`

**Step 4: Process Product via agents/new-products.md**

4.1. **Extract Product Information**
- Fetch product page from affiliate link: `https://amzn.to/48jifc0`
- Extract:
  - Title: "Baby Montessori Sensory Toys for 0-6 6-12 Months" (remove Amazon branding if any)
  - Slug: "baby-montessori-sensory-toys-for-0-6-6-12-months"
  - URL: `https://amzn.to/48jifc0` (affiliate link)
  - Price: Extract from product page
  - Description: Generate original 150-200 word description
  - Specifications: Extract as JSON
  - Images: Collect all product images

4.2. **Category Assignment**
- Query categories from database
- Analyze product: It's a sensory toy for babies
- Find matching categories: "Baby Products > Toys", "Educational Toys"
- **Automatically assign all matching categories** (no user confirmation needed)
- Create `product_categories` records for all found categories

4.3. **Filter Assignment**
- Read filters from `agents/data/filters.md`
- Analyze product: Suitable for babies 0-12 months
- Store: `{"age": ["0 to 12 months"]}`

4.4. **Insert Product**
- Insert into `products` table with all extracted information
- Insert into `product_categories` table
- Verify success

4.5. **Generate Thread**
- Analyze product: Baby sensory toy, Montessori style, 0-12 months
- Generate unique thread text (English, engaging, product-specific)
- Generate keywords: "baby toy, montessori, sensory play, 0-12 months, teething toy"
- Create JSON file:
  ```json
  [{
    "text": "Looking for the perfect sensory toy for your little one? This Montessori-inspired baby toy is designed for babies 0-12 months...",
    "keywords": "baby toy, montessori, sensory play, 0-12 months, teething toy"
  }]
  ```
- Run: `scripts/new-product-threads.ts <product-id> --from-json threads-temp-<product-id>.json`
- Delete temporary file

**Step 5: Report Completion**
- "✅ Product processed successfully"
- "Product ID: <uuid>"
- "Categories: Baby Products > Toys"
- "Thread generated: Yes"
- "Keywords: baby toy, montessori, sensory play, 0-12 months, teething toy"

## Important Notes

### Affiliate Links
- Affiliate links are **automatically extracted** by the script
- No manual input required from user
- The script uses Firefox with persistent context to access Amazon Associates

### Product Filtering
**IMPORTANT**: The `amazon-bestsellers.ts` script does NOT filter products by category. It only finds products from the bestseller page.

**YOU (the agent) are responsible for filtering**:
- After extracting product information, analyze if the product matches the requested category
- For "toys-and-games" category: Product must be a toy (not diapers, wipes, formula, clothing, etc.)
- For age group "0 to 12 months": Product must be suitable for that age range
- If product does NOT match: Skip it and find another product from the list
- Continue until you find the required number of matching products

### Error Handling
- If Amazon blocks requests (429 error), the script will retry with delays
- If no products are found, suggest manual product URL input
- If a product fails to process, continue with the next product
- If category assignment fails, ask user for guidance
- If thread generation fails, log error but continue

### Integration with agents/new-products.md
- **CRITICAL**: You MUST follow ALL instructions from `agents/new-products.md` when processing products
- This includes:
  - Category assignment (automatically, without user confirmation)
  - Filter assignment
  - Description generation (not copying from website)
  - Thread generation
  - All validation steps
- **NOTE**: Category assignment is automatic in this workflow (no user confirmation required)

## Usage Examples

### Example 1: Baby Toys 0-12 Months
**User**: "Atrodi bestseller rotaļlietas mazuļiem līdz 1 gadam, limits 1"

**Agent actions**:
1. Parse: category="toys-and-games", age="0 to 12 months", limit=1
2. Run: `npm run amazon-bestsellers -- --age "0 to 12 months" --category "toys-and-games" --limit 1`
3. Process product via `agents/new-products.md`
4. Report completion

### Example 2: Baby Products Category
**User**: "Atrodi bestseller produktus bērniem līdz 1 gadam, limits 3"

**Agent actions**:
1. Parse: category="baby-products", age="0 to 12 months", limit=3
2. Run: `npm run amazon-bestsellers -- --age "0 to 12 months" --category "baby-products" --limit 3`
3. Process each product via `agents/new-products.md`
4. Report completion

## Troubleshooting

### No products found
- Amazon may be blocking requests
- Try again after a few minutes
- Or manually provide product URLs using `agents/new-products.md`

### Affiliate link extraction fails
- Ensure Firefox is installed and Playwright Firefox is set up
- Check that user is logged into Amazon Associates in Firefox
- The script will wait 20 seconds for page load and 60 seconds for affiliate link generation

### Product processing fails
- Check that the affiliate link is valid and accessible
- Verify the product page is still available
- Follow `agents/new-products.md` error handling guidelines

### Category assignment issues
- Automatically assign all matching categories without user confirmation
- If no matches found, automatically create new category using `scripts/new-category.ts`
- Log which categories were assigned for reference

## Checklist Management

### Automatic Checklist Update
**CRITICAL**: After successfully inserting a product into the database, the product URL MUST be automatically added to `agents/data/amazon-bestsellers-checklist.md`.

- The `scripts/new-products.ts` script automatically handles this via the `addToChecklist()` function
- Each product URL is added as a single line in the checklist file
- The checklist prevents duplicate processing of the same products
- **No manual action required** - this happens automatically when products are inserted

### Checklist Format
The checklist file contains:
- A header with instructions
- A "## Products Added" section
- Each product URL on a separate line (one URL per line)
- No additional information (no titles, IDs, dates, etc.)

### How It Works
1. When a product is successfully inserted into the database, `addToChecklist()` is called
2. The function checks if the URL is from Amazon (amazon.com or amzn.to)
3. It reads the existing checklist file
4. It checks if the URL already exists (to prevent duplicates)
5. If new, it adds the URL to the checklist file
6. The `scripts/amazon-bestsellers.ts` script reads this checklist before searching and automatically skips products that are already listed

**Important**: The checklist is maintained automatically - you don't need to manually edit it. The script handles all checklist operations.
