'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { DisplayProduct } from '@/lib/products';

// Mock data for Top 5 products in a category
const TOP_TOYS = [
  { id: '1', title: 'Smart Robot', price: 120, image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=150&q=80' },
  { id: '2', title: 'Wood Blocks', price: 45, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=150&q=80' },
  { id: '3', title: 'Plush Bear', price: 25, image: 'https://images.unsplash.com/photo-1559454403-b8fb9850e01f?auto=format&fit=crop&w=150&q=80' },
  { id: '4', title: 'Building Set', price: 65, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=150&q=80' },
  { id: '5', title: 'Puzzle Game', price: 35, image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?auto=format&fit=crop&w=150&q=80' },
];

// Placeholder images from Pexels for personalised gifts - Christmas themed
const PLACEHOLDER_PERSONALISED_IMAGES = [
  'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Christmas gift box
  'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Wrapped present
  'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Gift with ribbon
  'https://images.pexels.com/photos/1598509/pexels-photo-1598509.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Christmas gift bag
  'https://images.pexels.com/photos/1598510/pexels-photo-1598510.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Wrapped gift box
  'https://images.pexels.com/photos/1598511/pexels-photo-1598511.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Special gift
  'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Christmas gift box
  'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Wrapped present
  'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Gift with ribbon
  'https://images.pexels.com/photos/1598509/pexels-photo-1598509.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Christmas gift bag
  'https://images.pexels.com/photos/1598510/pexels-photo-1598510.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Wrapped gift box
  'https://images.pexels.com/photos/1598511/pexels-photo-1598511.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Special gift
  'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Christmas gift box
  'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Wrapped present
  'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', // Gift with ribbon
];

export function CategoryGrid() {
  const [personalisedProducts, setPersonalisedProducts] = useState<DisplayProduct[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselElement, setCarouselElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchPersonalisedProducts() {
      const supabase = createClient();
      
      // First, find the category ID for "personalised-gifts"
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'personalised-gifts')
        .single();

      if (categoryError || !categoryData) {
        // Fallback: try to find products with category in filters
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .or('filters->>category.eq.personalised-gifts,filters->>category.eq.personalised')
          .limit(6)
          .order('created_at', { ascending: false });

        if (error || !data) {
          console.error('Error fetching personalised products:', error);
          return;
        }

        const products: DisplayProduct[] = data.map((product: any) => {
          const image = product.images && Array.isArray(product.images) && product.images.length > 0 
            ? product.images[0] 
            : '/placeholder-product.jpg';

          const category = product.filters?.category || 'all';
          const ageGroup = product.filters?.ageGroup || 'all';

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

        setPersonalisedProducts(products);
        return;
      }

      // Use product_categories junction table to find products
      const { data, error } = await supabase
        .from('product_categories')
        .select(`
          product_id,
          products (
            id,
            slug,
            title,
            price,
            specifications,
            images,
            filters,
            description,
            url,
            created_at,
            active
          )
        `)
        .eq('category_id', categoryData.id)
        .eq('products.active', true)
        .limit(6)
        .order('products.created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching personalised products:', error);
        return;
      }

      const products: DisplayProduct[] = data
        .filter((item: any) => item.products && item.products.active)
        .map((item: any) => {
          const product = item.products;
          const image = product.images && Array.isArray(product.images) && product.images.length > 0 
            ? product.images[0] 
            : '/placeholder-product.jpg';

          const category = product.filters?.category || 'all';
          const ageGroup = product.filters?.ageGroup || 'all';

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

      setPersonalisedProducts(products);
    }

    fetchPersonalisedProducts();
  }, []);

  // Get available products/images - extend to 15 items
  const availableProducts = personalisedProducts.length > 0 
    ? personalisedProducts.filter((p) => p.image && p.image.startsWith('http'))
    : [];
  
  // Extend to 15 items by repeating if needed
  const extendTo15 = (items: string[]) => {
    if (items.length >= 15) return items.slice(0, 15);
    const extended = [...items];
    while (extended.length < 15) {
      extended.push(...items);
    }
    return extended.slice(0, 15);
  };

  const allImages = availableProducts.length > 0
    ? extendTo15(availableProducts.map((p) => p.image!))
    : extendTo15(PLACEHOLDER_PERSONALISED_IMAGES);

  const allProductsExtended = availableProducts.length > 0
    ? (() => {
        const extended = [...availableProducts];
        while (extended.length < 15) {
          extended.push(...availableProducts);
        }
        return extended.slice(0, 15);
      })()
    : [];

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselElement) return;
    const scrollAmount = 200;
    carouselElement.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Auto-rotate images
  useEffect(() => {
    if (allImages.length === 0) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allImages.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [allImages.length]);

  // Auto-scroll carousel to center active image
  useEffect(() => {
    if (!carouselElement || allImages.length === 0) return;

    const scrollToActive = () => {
      const itemWidth = 80 + 12; // w-20 (80px) + gap-3 (12px)
      const containerWidth = carouselElement.offsetWidth;
      const scrollPosition = (activeImageIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
      
      carouselElement.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    };

    scrollToActive();
  }, [activeImageIndex, carouselElement, allImages.length]);
  return (
    <section className="py-20 px-4 bg-cream" id="categories">
      <div className="container mx-auto">
        <div className="text-center mb-12">
           <span className="text-xs font-bold uppercase tracking-widest text-secondary-600">Collections</span>
           <h2 className="font-serif text-4xl md:text-5xl font-medium text-primary-950 mt-2">Gift categories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* 1. Large Feature Block - Personalised Gifts (Span 8) */}
          <div className="col-span-1 md:col-span-8 row-span-1 md:row-span-2 rounded-[5px] overflow-hidden bg-secondary-100 border border-white/50">
            {/* Top Section - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pb-2">
              {/* Left Column - Text Content */}
              <div className="flex flex-col justify-center">
                <span className="px-3 py-1 bg-white/80 backdrop-blur rounded-[5px] text-xs font-bold uppercase tracking-wider text-secondary-800 mb-3 inline-block w-fit">Trending</span>
                <h3 className="font-serif text-4xl lg:text-5xl font-bold text-primary-950 mb-3 leading-tight">Personalised gifts</h3>
                <p className="text-slate-600 mb-4 font-light">Unique gifts that speak from the heart, customized just for your loved ones.</p>
                <Link href="/shop?category=personalised-gifts" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-950 hover:text-secondary-700 transition-colors w-fit">
                  Shop Personalised <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right Column - Active Product */}
              <div className="flex flex-col justify-center">
                {(() => {
                  const activeImage = allImages[activeImageIndex];
                  const activeProduct = allProductsExtended[activeImageIndex] || null;
                  const productLink = activeProduct?.slug 
                    ? `/item/${activeProduct.slug}` 
                    : activeProduct?.id 
                    ? `/item/${activeProduct.id}`
                    : '/shop?category=personalised-gifts';
                  
                  return (
                    <Link 
                      href={productLink}
                      className="relative w-full aspect-square rounded-[5px] overflow-hidden transition-all duration-300 group"
                    >
                      {activeImage && (
                        <Image
                          src={activeImage}
                          alt={activeProduct?.title || `Personalised gift ${activeImageIndex + 1}`}
                          fill
                          className="object-cover transition-opacity duration-500 group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-b-[5px]">
                        <h4 className="font-serif text-lg font-bold text-primary-950 mb-1">
                          {activeProduct?.title || `Personalised Gift ${activeImageIndex + 1}`}
                        </h4>
                        <p className="text-base font-semibold text-primary-950">
                          {activeProduct?.price ? (
                            <>
                              €{activeProduct.price.toFixed(2)}
                              {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                                <span className="ml-2 text-sm text-slate-400 line-through">
                                  €{activeProduct.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </>
                          ) : (
                            <>€{(29.99 + activeImageIndex * 5).toFixed(2)}</>
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </div>

            {/* Bottom Section - Product Carousel */}
            <div className="px-6 pb-4 pt-2 flex items-center relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-4 z-10 p-2 bg-white/80 backdrop-blur rounded-[3px] hover:bg-primary-700 transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 text-primary-950 group-hover:text-white transition-colors" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-4 z-10 p-2 bg-white/80 backdrop-blur rounded-[3px] hover:bg-primary-700 transition-colors group"
              >
                <ChevronRight className="w-5 h-5 text-primary-950 group-hover:text-white transition-colors" />
              </button>

              <div 
                ref={setCarouselElement}
                className="flex gap-3 w-full overflow-x-auto pb-2 ml-14 mr-14 hide-scrollbar"
              >
                {allImages.map((imageUrl, index) => {
                  const product = allProductsExtended[index] || null;
                  const isActive = activeImageIndex === index;
                  return (
                    <button
                      key={product?.id || `placeholder-${index}`}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative w-20 h-20 rounded-[3px] overflow-hidden transition-all duration-300 flex-shrink-0 ${
                        isActive ? '' : 'opacity-60'
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={product?.title || `Personalised gift ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {!isActive && (
                        <div className="absolute inset-0 bg-white/40"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Vertical List Block - Toys (Span 4) */}
          <div className="col-span-1 md:col-span-4 row-span-1 md:row-span-2 rounded-[5px] bg-white border border-slate-100 p-8 flex flex-col transition-all duration-300">
            <div className="mb-4">
                <h3 className="font-serif text-2xl font-bold text-primary-950">Top toys</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Most wished for</p>
            </div>
            
            <div className="flex-1 flex flex-col gap-2 mb-4">
              {TOP_TOYS.map((item, index) => (
                <Link key={item.id} href="#" className="flex items-center gap-3 p-2 rounded-[3px] hover:bg-slate-50 transition-colors group/item">
                  <div className="w-12 h-12 rounded-[5px] bg-slate-100 flex-shrink-0 overflow-hidden relative border border-slate-200">
                    <Image 
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-300 flex-shrink-0">0{index + 1}</span>
                       <h4 className="font-serif text-sm font-bold text-primary-950 group-hover/item:text-secondary-600 transition-colors truncate">{item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500">€{item.price}</p>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-auto">
              <p className="text-xs text-slate-500 mb-2">View all 42 toys</p>
              <Link href="/shop?category=toys" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-950 hover:text-secondary-700 transition-colors w-fit">
                Shop toys <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 3. Square Image Block - For Mom (Span 4) */}
          <div className="group relative col-span-1 md:col-span-4 row-span-1 rounded-[5px] overflow-hidden bg-festive-red text-white transition-all duration-300 min-h-[300px]">
             <div className="absolute inset-0 z-0">
                <Image 
                  src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=600&q=80"
                  alt="Gift for Mom"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
             
             <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-20 p-6 text-center">
                <h3 className="font-serif text-3xl font-bold mb-2 transform translate-y-2 group-hover:-translate-y-2 transition-transform duration-300">For mom</h3>
                <p className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-light">Pampering gifts she deserves</p>
             </div>
          </div>

           {/* 4. Square Image Block - For Dad (Span 4) */}
           <div className="group relative col-span-1 md:col-span-4 row-span-1 rounded-[5px] overflow-hidden bg-primary-900 text-white transition-all duration-300 min-h-[300px]">
             <div className="absolute inset-0 z-0">
                <Image 
                  src="https://images.unsplash.com/photo-1617317376997-8748e6862c01?auto=format&fit=crop&w=600&q=80"
                  alt="Gift for Dad"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-transparent to-transparent z-10"></div>
             
             <div className="absolute bottom-6 left-6 z-20">
                <h3 className="font-serif text-2xl font-bold mb-1">For dad</h3>
                <div className="h-0.5 w-8 bg-festive-gold group-hover:w-16 transition-all duration-300"></div>
             </div>
              <div className="absolute top-4 right-4 z-20">
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              </div>
          </div>

          {/* 5. Wide Horizontal Block - Clothing (Span 4) */}
          <div className="group relative col-span-1 md:col-span-4 row-span-1 rounded-[5px] overflow-hidden bg-secondary-200 transition-all duration-300 border-4 border-white min-h-[300px]">
             <div className="absolute inset-0 z-0">
                <Image 
                  src="https://images.unsplash.com/photo-1519238263496-63f7245af483?auto=format&fit=crop&w=600&q=80"
                  alt="Baby Clothing"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
             </div>
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors z-10"></div>
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center bg-white/90 backdrop-blur-sm px-6 py-4 rounded-[5px] border border-white">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-800 mb-1 block">New collection</span>
                 <h3 className="font-serif text-2xl font-bold text-primary-950 leading-none">Cozy clothing</h3>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
