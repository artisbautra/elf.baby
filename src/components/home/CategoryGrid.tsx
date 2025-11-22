'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

// Mock data for Top 3 products in a category
const TOP_TOYS = [
  { id: '1', title: 'Smart Robot', price: 120, image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=150&q=80' },
  { id: '2', title: 'Wood Blocks', price: 45, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=150&q=80' },
  { id: '3', title: 'Plush Bear', price: 25, image: 'https://images.unsplash.com/photo-1559454403-b8fb9850e01f?auto=format&fit=crop&w=150&q=80' },
];

export function CategoryGrid() {
  return (
    <section className="py-20 px-4 bg-cream" id="categories">
      <div className="container mx-auto">
        <div className="text-center mb-12">
           <span className="text-xs font-bold uppercase tracking-widest text-secondary-600">Collections</span>
           <h2 className="font-serif text-4xl md:text-5xl font-medium text-primary-950 mt-2">Gift Categories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
          
          {/* 1. Large Feature Block - Nursery (Span 8) */}
          <div className="group relative col-span-1 md:col-span-8 row-span-1 md:row-span-2 rounded-3xl overflow-hidden bg-secondary-100 border border-white/50 hover:shadow-xl transition-all duration-500">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary-100 via-secondary-100/80 to-transparent z-10 pointer-events-none"></div>
            
            {/* Content */}
            <div className="absolute top-10 left-10 z-20 max-w-xs">
               <span className="px-3 py-1 bg-white/80 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider text-secondary-800 mb-4 inline-block">Trending</span>
               <h3 className="font-serif text-4xl lg:text-5xl font-bold text-primary-950 mb-4 leading-tight">Magical Nursery Essentials</h3>
               <p className="text-slate-600 mb-6 font-light">Create a dreamy sanctuary for the little ones with our hand-picked decor and comfort items.</p>
               <Link href="#" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-950 hover:text-secondary-700 transition-colors group-hover:translate-x-2 duration-300">
                 Shop Nursery <ArrowRight className="w-4 h-4" />
               </Link>
            </div>

            {/* Irregular Shape Image Container */}
            <div className="absolute right-[-50px] top-[-20px] bottom-[-20px] w-2/3 h-[120%] overflow-hidden z-0">
              <div className="w-full h-full relative transform rotate-3 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-105">
                  <div className="absolute inset-0 rounded-l-[30%] rounded-tr-[20%] rounded-br-[50%] overflow-hidden border-4 border-white/50 shadow-2xl">
                      <Image 
                        src="https://images.unsplash.com/photo-1522771753035-5a5b95374511?auto=format&fit=crop&w=800&q=80"
                        alt="Nursery"
                        fill
                        className="object-cover"
                      />
                  </div>
              </div>
            </div>
          </div>

          {/* 2. Vertical List Block - Toys (Span 4) */}
          <div className="col-span-1 md:col-span-4 row-span-1 md:row-span-2 rounded-3xl bg-white border border-slate-100 p-8 flex flex-col hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-primary-950">Top Toys</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Most wished for</p>
              </div>
              <Link href="#" className="p-2 bg-slate-50 rounded-full hover:bg-secondary-50 transition-colors">
                <ArrowRight className="w-4 h-4 text-primary-950" />
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {TOP_TOYS.map((item, index) => (
                <Link key={item.id} href="#" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden relative shadow-inner border border-slate-200">
                    <Image 
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-bold text-slate-300">0{index + 1}</span>
                       <h4 className="font-serif font-bold text-primary-950 group-hover/item:text-secondary-600 transition-colors">{item.title}</h4>
                    </div>
                    <p className="text-sm text-slate-500">${item.price}</p>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              ))}
            </div>
             <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center">
                <span className="text-xs font-medium text-slate-400">View all 42 toys</span>
             </div>
          </div>

          {/* 3. Square Image Block - For Mom (Span 4) */}
          <div className="group relative col-span-1 md:col-span-4 row-span-1 rounded-3xl overflow-hidden bg-festive-red text-white hover:shadow-xl transition-all duration-300">
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
                <h3 className="font-serif text-3xl font-bold mb-2 transform translate-y-2 group-hover:-translate-y-2 transition-transform duration-300">For Mom</h3>
                <p className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-light">Pampering gifts she deserves</p>
             </div>
          </div>

           {/* 4. Square Image Block - For Dad (Span 4) */}
           <div className="group relative col-span-1 md:col-span-4 row-span-1 rounded-3xl overflow-hidden bg-primary-900 text-white hover:shadow-xl transition-all duration-300">
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
                <h3 className="font-serif text-2xl font-bold mb-1">For Dad</h3>
                <div className="h-0.5 w-8 bg-festive-gold group-hover:w-16 transition-all duration-300"></div>
             </div>
              <div className="absolute top-4 right-4 z-20">
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              </div>
          </div>

          {/* 5. Wide Horizontal Block - Clothing (Span 4) */}
          <div className="group relative col-span-1 md:col-span-4 row-span-1 rounded-3xl overflow-hidden bg-secondary-200 hover:shadow-xl transition-all duration-300 border-4 border-white">
             <div className="absolute inset-0 z-0">
                <Image 
                  src="https://images.unsplash.com/photo-1519238263496-63f7245af483?auto=format&fit=crop&w=600&q=80"
                  alt="Baby Clothing"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
             </div>
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors z-10"></div>
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl border border-white shadow-lg">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-800 mb-1 block">New Collection</span>
                 <h3 className="font-serif text-2xl font-bold text-primary-950 leading-none">Cozy Clothing</h3>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
