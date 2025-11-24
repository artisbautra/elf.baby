'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ProductSearch } from '@/components/home/ProductSearch';
import { DisplayProduct } from '@/lib/products';

interface ProductsGridProps {
  initialProducts: DisplayProduct[];
}

export function ProductsGrid({ initialProducts }: ProductsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialProducts;
    }

    const query = searchQuery.toLowerCase().trim();
    return initialProducts.filter((product) =>
      product.title.toLowerCase().includes(query)
    );
  }, [initialProducts, searchQuery]);

  return (
    <>
      <ProductSearch onSearch={setSearchQuery} />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredProducts.map((product) => (
          <a
            key={product.id}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col cursor-pointer"
          >
            {/* Image */}
            <div className="relative aspect-square rounded-[3px] overflow-hidden bg-white mb-2 border border-slate-100">
              {product.image && product.image.startsWith('http') ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <div className="text-4xl">🎁</div>
                </div>
              )}
            </div>
            
            {/* Title */}
            <h3 className="text-sm font-medium text-primary-950 text-center line-clamp-2 group-hover:text-primary-700 transition-colors">
              {product.title}
            </h3>
          </a>
        ))}
      </div>
    </>
  );
}

