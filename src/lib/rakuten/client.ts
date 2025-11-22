/**
 * Rakuten Advertising API Client
 * 
 * Based on documentation: https://developers.rakutenadvertising.com/documentation/en-US/affiliate_apis
 */

interface RakutenTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

interface RakutenProduct {
  mid: string
  merchantname: string
  merchantcategorypath: string
  merchantproductid: string
  productname: string
  producturl: string
  imageurl: string
  price: string
  currency: string
  instock: string
  description?: string
  category?: string
  manufacturer?: string
  sku?: string
  [key: string]: any
}

interface RakutenProductSearchResponse {
  products?: RakutenProduct[]
  totalresults?: number
  totalpages?: number
  page?: number
  [key: string]: any
}

export class RakutenAPIClient {
  private clientId: string
  private clientSecret: string
  private baseUrl = 'https://api.linksynergy.com'
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  /**
   * Get OAuth access token
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    // Request new token
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

    try {
      const tokenUrl = `${this.baseUrl}/token`
      console.log(`[DEBUG] Requesting token from: ${tokenUrl}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=PRODUCTION',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const responseText = await response.text()
      let data: RakutenTokenResponse
      
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Token endpoint returned invalid JSON: ${responseText.substring(0, 500)}`)
      }
      
      if (!data.access_token) {
        throw new Error(`Token endpoint did not return access_token. Response: ${responseText.substring(0, 500)}`)
      }
      
      console.log(`[DEBUG] Token obtained successfully, expires in: ${data.expires_in}s`)
      this.accessToken = data.access_token
      
      // Set expiry to 1 hour before actual expiry for safety
      const expiresInMs = (data.expires_in - 3600) * 1000
      this.tokenExpiry = new Date(Date.now() + expiresInMs)

      return this.accessToken
    } catch (error: any) {
      const errorMessage = error?.message || String(error)
      const errorName = error?.name || 'UnknownError'
      const errorStack = error?.stack || ''
      
      // Check if it's a network error
      if (errorName === 'AbortError' || errorMessage.includes('fetch failed')) {
        throw new Error(
          `Network error connecting to Rakuten API.\n` +
          `URL: ${this.baseUrl}/token\n` +
          `This could be due to:\n` +
          `- Network connectivity issues\n` +
          `- Firewall blocking the request\n` +
          `- SSL certificate issues\n` +
          `- Incorrect API base URL\n` +
          `Original error: ${errorMessage}`
        )
      }
      
      throw new Error(`Error getting Rakuten access token: ${errorMessage}\nURL: ${this.baseUrl}/token\nError name: ${errorName}\nStack: ${errorStack}`)
    }
  }

  /**
   * Search products by Merchant ID (MID)
   */
  async searchProductsByMid(
    mid: string,
    options: {
      keyword?: string
      page?: number
      pageSize?: number
      category?: string
      instock?: boolean
    } = {}
  ): Promise<RakutenProductSearchResponse> {
    const token = await this.getAccessToken()

    const params = new URLSearchParams({
      mid: mid,
    })

    if (options.keyword) {
      params.append('keyword', options.keyword)
    }
    if (options.page) {
      params.append('page', options.page.toString())
    }
    if (options.pageSize) {
      params.append('pagesize', options.pageSize.toString())
    }
    if (options.category) {
      params.append('category', options.category)
    }
    if (options.instock !== undefined) {
      params.append('instock', options.instock ? '1' : '0')
    }

    try {
      // Try both query parameter and Authorization header
      params.append('token', token)
      const searchUrl = `${this.baseUrl}/productsearch/1.0?${params.toString()}`
      console.log(`[DEBUG] Searching products: ${searchUrl.replace(token, '[TOKEN]')}`)
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        
        // Check for 401 Unauthorized - likely means affiliate not approved
        if (response.status === 401) {
          throw new Error(
            `Unauthorized (401). This usually means:\n` +
            `- The merchant (MID: ${mid}) has not approved your affiliate partnership\n` +
            `- Your affiliate account doesn't have access to this merchant's products\n` +
            `- Please verify your affiliate partnership status with merchant MID ${mid}\n\n` +
            `Error details: ${errorText.substring(0, 500)}`
          )
        }
        
        throw new Error(`Failed to search products: ${response.status} ${response.statusText} - ${errorText.substring(0, 500)}`)
      }

      // Check content type
      const contentType = response.headers.get('content-type') || ''
      const responseText = await response.text()
      
      // If XML response, check for specific error messages
      if (contentType.includes('xml') || responseText.trim().startsWith('<')) {
        console.log('[DEBUG] API returned XML response. Full response:', responseText)
        
        // Check for common error messages
        if (responseText.includes('Invalid token') || responseText.includes('718619')) {
          throw new Error(
            `Invalid token error. This usually means:\n` +
            `- The merchant (MID: ${mid}) has not approved your affiliate partnership\n` +
            `- Your affiliate account doesn't have access to this merchant's products\n` +
            `- The API credentials may not have the required permissions\n\n` +
            `Please verify that your affiliate partnership with merchant MID ${mid} is approved.`
          )
        }
        
        if (responseText.includes('No token') || responseText.includes('718614')) {
          throw new Error(
            `No token specified. Authentication issue with the API request.`
          )
        }
        
        // Generic XML error
        throw new Error(
          `Rakuten API returned XML instead of JSON. This may indicate:\n` +
          `- The merchant (MID: ${mid}) has not approved your affiliate partnership\n` +
          `- Your affiliate account doesn't have access to this merchant's products\n` +
          `- The API endpoint or format is different\n` +
          `- Different API version or parameters are needed\n\n` +
          `Response preview: ${responseText.substring(0, 500)}...`
        )
      }

      // Try to parse as JSON
      let data: RakutenProductSearchResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Failed to parse API response as JSON. Response: ${responseText.substring(0, 500)}...`)
      }
      
      return data
    } catch (error: any) {
      if (error.message && !error.message.includes('Rakuten API')) {
        throw new Error(`Error searching Rakuten products: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get all products for a merchant (paginated)
   */
  async getAllProductsByMid(
    mid: string,
    options: {
      keyword?: string
      category?: string
      instock?: boolean
      maxProducts?: number
    } = {}
  ): Promise<RakutenProduct[]> {
    const allProducts: RakutenProduct[] = []
    let page = 1
    const pageSize = 100 // Max page size typically
    const maxProducts = options.maxProducts || Infinity

    try {
      while (true) {
        const response = await this.searchProductsByMid(mid, {
          ...options,
          page,
          pageSize,
        })

        const products = response.products || []
        allProducts.push(...products)

        // Check if we've reached the limit
        if (allProducts.length >= maxProducts) {
          return allProducts.slice(0, maxProducts)
        }

        // Check if there are more pages
        const totalPages = response.totalpages || 1
        if (page >= totalPages || products.length === 0) {
          break
        }

        page++
      }

      return allProducts
    } catch (error) {
      throw new Error(`Error getting all products: ${error}`)
    }
  }

  /**
   * Get merchant information by MID
   */
  async getMerchantInfo(mid: string): Promise<any> {
    // Try to get merchant info from first product
    const response = await this.searchProductsByMid(mid, { pageSize: 1 })
    const products = response.products || []
    
    if (products.length > 0) {
      const firstProduct = products[0]
      return {
        mid: firstProduct.mid,
        merchantname: firstProduct.merchantname,
        merchantcategorypath: firstProduct.merchantcategorypath,
      }
    }

    throw new Error(`No products found for merchant MID: ${mid}`)
  }
}

