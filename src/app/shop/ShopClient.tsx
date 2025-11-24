'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FilterSection } from '@/components/home/FilterSection';
import { ProductCard } from '@/components/home/ProductCard';
import { DisplayProduct } from '@/lib/products';

interface ShopClientProps {
  initialProducts: DisplayProduct[];
}

export function ShopClient({ initialProducts }: ShopClientProps) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [selectedAge, setSelectedAge] = useState('all');

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(product => {
      const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
      const ageMatch = selectedAge === 'all' || product.ageGroup === selectedAge || product.ageGroup === 'all';
      return categoryMatch && ageMatch;
    });
  }, [initialProducts, selectedCategory, selectedAge]);

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Left Sidebar - Filters */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="sticky top-24">
          <FilterSection 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedAge={selectedAge}
            setSelectedAge={setSelectedAge}
          />
        </div>
      </aside>

      {/* Right Side - Products */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No gifts found for this combination.</p>
            <button 
              onClick={() => {setSelectedCategory('all'); setSelectedAge('all');}}
              className="mt-4 px-4 py-2 text-secondary-600 hover:underline rounded-[3px]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

