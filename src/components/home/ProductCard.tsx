import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group flex flex-col">
      {/* Image Container - Arch Shape */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[150px] rounded-b-2xl bg-white mb-6 border border-slate-100 group-hover:shadow-xl transition-all duration-500">
        {product.isNew && (
          <span className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-festive-red text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            Christmas Special
          </span>
        )}
        
        {/* Product Image */}
        <div className="w-full h-full relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
          {product.image && product.image.startsWith('http') ? (
            <Image 
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-5xl mb-4 drop-shadow-md">🎁</div>
              </div>
            </div>
          )}
        </div>

        <Link 
           href={`/item/${product.slug || product.id}`}
           className="absolute inset-0 flex items-center justify-center bg-primary-950/0 group-hover:bg-primary-950/10 transition-colors duration-300"
        >
            <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white px-6 py-3 rounded-full shadow-lg text-sm font-bold uppercase tracking-wider text-festive-green flex items-center gap-2 border border-festive-green/20">
              View Gift <Eye className="w-4 h-4" />
            </div>
        </Link>
      </div>

      {/* Details */}
      <div className="text-center">
        <div className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {product.category}
        </div>
        <h3 className="font-serif text-xl font-medium text-primary-950 mb-2 group-hover:text-festive-red transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center justify-center gap-3">
          <span className="text-lg font-medium text-slate-900">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-slate-400 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
