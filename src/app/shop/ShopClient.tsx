'use client';

import { useState, useMemo } from 'react';
import { FilterSection } from '@/components/home/FilterSection';
import { ProductCard } from '@/components/home/ProductCard';
import { DisplayProduct } from '@/lib/products';

interface ShopClientProps {
  initialProducts: DisplayProduct[];
}

export function ShopClient({ initialProducts }: ShopClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(product => {
      const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
      const ageMatch = selectedAge === 'all' || product.ageGroup === selectedAge || product.ageGroup === 'all';
      return categoryMatch && ageMatch;
    });
  }, [initialProducts, selectedCategory, selectedAge]);

  return (
    <>
      <FilterSection 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedAge={selectedAge}
        setSelectedAge={setSelectedAge}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">No gifts found for this combination.</p>
          <button 
            onClick={() => {setSelectedCategory('all'); setSelectedAge('all');}}
            className="mt-4 text-secondary-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}

