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
      <div className="relative aspect-[4/5] overflow-hidden rounded-[5px] bg-white mb-3 border border-slate-100 transition-all duration-500">
        {/* Product Image */}
        <div className="w-full h-full relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
          {product.image && product.image.startsWith('http') ? (
            <Image 
              src={product.image}
              alt={product.title}
              fill
              className="object-contain p-4"
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
            <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white px-4 py-2 rounded-[3px] text-xs font-bold uppercase tracking-wider text-festive-green flex items-center gap-2 border border-festive-green/20 shadow-sm">
              View gift <Eye className="w-3 h-3" />
            </div>
        </Link>
      </div>

      {/* Details */}
      <div className="text-center px-1">
        <h3 className="font-serif text-lg font-medium text-primary-950 mb-1 group-hover:text-festive-red transition-colors line-clamp-2 leading-tight">
          {product.title}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {product.price_discount ? (
            <>
              <span className="text-base font-medium text-festive-red">
                ${product.price_discount.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-medium text-slate-900">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
