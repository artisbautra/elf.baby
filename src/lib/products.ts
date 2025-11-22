import { createClient } from '@/lib/supabase/server';

export interface DatabaseProduct {
  id: string;
  shop_id: string;
  title: string;
  slug: string;
  url: string;
  description: string;
  price?: number;
  specifications: Record<string, any>;
  images: string[];
  filters: {
    category?: string;
    ageGroup?: string;
    [key: string]: any;
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisplayProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  ageGroup: string;
  isNew?: boolean;
  rating?: number;
  description?: string;
  url: string;
  images?: string[];
  specifications?: Record<string, any>;
}

export async function getActiveProducts(): Promise<DisplayProduct[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Transform database products to display format
  return data.map((product: DatabaseProduct) => {
    // Extract first image or use placeholder
    const image = product.images && product.images.length > 0 
      ? product.images[0] 
      : '/placeholder-product.jpg';

    // Extract category and ageGroup from filters
    const category = product.filters?.category || 'all';
    const ageGroup = product.filters?.ageGroup || 'all';

    // Determine if product is new (created within last 30 days)
    const createdAt = new Date(product.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isNew = createdAt > thirtyDaysAgo;

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price || product.specifications?.price || 0,
      originalPrice: product.specifications?.originalPrice,
      image,
      category,
      ageGroup,
      isNew,
      description: product.description,
      url: product.url,
      images: product.images,
      specifications: product.specifications,
    };
  });
}

export async function getProductBySlug(slug: string): Promise<DisplayProduct | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !data) {
    console.error('Error fetching product by slug:', error);
    return null;
  }

  const product: DatabaseProduct = data;

  // Extract first image or use placeholder
  const image = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder-product.jpg';

  // Extract category and ageGroup from filters
  const category = product.filters?.category || 'all';
  const ageGroup = product.filters?.ageGroup || 'all';

  // Determine if product is new (created within last 30 days)
  const createdAt = new Date(product.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isNew = createdAt > thirtyDaysAgo;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price || product.specifications?.price || 0,
    originalPrice: product.specifications?.originalPrice,
    image,
    category,
    ageGroup,
    isNew,
    description: product.description,
    url: product.url,
    images: product.images,
    specifications: product.specifications,
  };
}

