# New Shop Agent Instructions

## Overview
This agent analyzes a website provided by the user, collects relevant information, and creates a record in the Supabase `shops` table with the shop's details.

## Process

### 1. Website Analysis
When a user provides a website URL, the agent should:
- Visit and analyze the website
- Extract relevant information from the homepage, about page, shipping information, and product pages
- Identify the shop's main characteristics and offerings

### 2. Information Collection

The agent must collect and extract the following information:

#### **title** (required)
- The shop's name or title
- Usually found in the page title, header, or logo area
- **IMPORTANT**: Do NOT include additional text like " | YourSurprise" or similar suffixes from page titles
- Extract only the clean shop name without any website branding or separators
- Example: "Personalized Baby Gifts Co." (NOT "Personalized Baby Gifts Co. | YourSurprise")

#### **description** (required)
- A comprehensive description of the shop
- **IMPORTANT**: This should be generated based on analysis, not copied verbatim from the website
- Should include:
  - What products the shop sells
  - What makes the shop special or unique
  - Key features, specialties, or unique selling points
  - Target audience
  - Any notable characteristics or values
- Write in an informative, engaging style
- Minimum 100-150 words recommended
- Analyze the homepage, about page, product listings, and any "About Us" sections
- Example structure:
  ```
  [Shop name] specializes in [main product types]. The shop is known for 
  [unique features/specialties]. They offer [key product categories] and 
  are particularly notable for [what makes them special]. The shop caters to 
  [target audience] and focuses on [values/characteristics]. [Additional 
  relevant information about the shop's offerings and uniqueness].
  ```

#### **logo** (required)
- URL or path to the shop's logo image
- Look for logo in header, footer, or favicon
- Should be a direct image URL (preferably high resolution)
- Example: "https://example.com/logo.png"

#### **domain** (required)
- The shop's domain name (without protocol)
- Extract from the provided URL
- Example: "example.com" or "shop.example.com"

#### **markets** (required)
- List of markets/regions where the shop operates
- Common values: "europe", "america", or specific countries
- Can be multiple values (array)
- Look for shipping information, "we ship to" sections, or country selectors
- Examples:
  - ["europe", "america"]
  - ["latvia", "lithuania", "estonia"]
  - ["usa", "canada"]

#### **category** (required)
- The shop's main category or product type
- Determine categories up to 2 levels (hierarchical structure)
  - Level 1: Main category (e.g., "Baby Products", "Clothing", "Gifts")
  - Level 2: Subcategory (e.g., "Toys", "Printed Clothing", "Personalized Gifts")
- Format examples:
  - Single level: "Personalized Gifts"
  - Two levels: "Baby Products > Toys" or "Clothing > Printed Clothing"
- Analyze product listings, navigation menus, and category pages to identify all relevant categories
- A shop can have multiple categories if it spans different product types
- **IMPORTANT**: After determining categories, save them to `agents/data/categories.md`:
  - Read the existing `agents/data/categories.md` file
  - Check if each discovered category already exists in the file
  - Only add categories that are NOT already present
  - Maintain the hierarchical format: "Level 1 > Level 2" or just "Level 1"
  - Add new categories to the "Categories" section in alphabetical order

#### **shipping** (required)
- Information about shipping methods and costs
- Extract from shipping policy pages, checkout pages, or footer links
- Should include:
  - Available shipping methods (standard, express, international, etc.)
  - Shipping costs or cost ranges
  - Delivery timeframes
  - Free shipping thresholds (if applicable)
- Format as structured text or JSON
- Example:
  ```
  Standard Shipping: $5.99 (5-7 business days)
  Express Shipping: $12.99 (2-3 business days)
  Free Shipping: Orders over $50
  International Shipping: Available to select countries, $15.99+
  ```

### 3. Category Management

After identifying the shop's categories:

1. **Read existing categories**: Open `agents/data/categories.md` and read all existing categories
2. **Check for duplicates**: Compare discovered categories with existing ones
   - Categories are considered duplicates if they match exactly (case-insensitive)
   - Both single-level and two-level categories should be checked
3. **Add new categories**: For each new category that doesn't exist:
   - Add it to the "Categories" section in `agents/data/categories.md`
   - Use the format: `- **Level 1 Category** > **Level 2 Category**` for two-level categories
   - Use the format: `- **Category Name**` for single-level categories
   - Maintain alphabetical order within the categories list
4. **Save the file**: Update `agents/data/categories.md` with any new categories

**Example**:
- If shop has categories: "Baby Products > Toys" and "Gift Sets"
- Check if these exist in `agents/data/categories.md`
- If "Baby Products > Toys" exists but "Gift Sets" doesn't, only add "Gift Sets"

### 4. Data Validation

Before inserting into Supabase, validate:
- All required fields are present and non-empty
- Description is comprehensive and informative (minimum 100 words)
- Domain is properly formatted (no http:// or https://)
- Logo URL is accessible and valid
- Markets array contains valid values
- Category is one of the recognized categories
- Shipping information is complete and readable

### 5. Supabase Insertion

Insert the collected data into the `shops` table with the following structure:

```typescript
{
  title: string,
  description: string,
  logo: string,
  domain: string,
  markets: string[],
  category: string | string[],
  shipping: string
}
```

### 6. Error Handling

- If information cannot be found, mark fields as "Unknown" or use best-effort extraction
- If the website is inaccessible, inform the user and request manual input
- If Supabase insertion fails, log the error and retry with validation

## Example Workflow

1. User provides: "https://example-shop.com"
2. Agent visits the website
3. Agent extracts:
   - Title: "Baby Gift Shop"
   - Description: [Generated comprehensive description about the shop - what products they sell, what makes them special, etc.]
   - Logo: "https://example-shop.com/images/logo.png"
   - Domain: "example-shop.com"
   - Markets: ["europe", "america"]
   - Categories: "Baby Products > Toys", "Personalized Gifts"
   - Shipping: "Standard: €5.99 (5-7 days), Express: €12.99 (2-3 days), Free over €50"
4. Agent reads `agents/data/categories.md` to check existing categories
5. Agent adds new categories (if any) to `agents/data/categories.md`, avoiding duplicates
6. Agent validates all fields
7. Agent inserts into Supabase `shops` table
8. Agent confirms success to user

## Notes

- Be thorough in analysis - check multiple pages if needed
- Prioritize accuracy over speed
- If uncertain about a field, make reasonable inferences based on available data
- Always confirm successful insertion with the user

