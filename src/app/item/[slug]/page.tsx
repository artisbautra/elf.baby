import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Star, Share2, Check, Gift } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products';
import { ProductGallery } from '@/components/product/ProductGallery';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />

      <main className="flex-1 py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <Link 
            href="/shop" 
            className="inline-flex items-center text-sm text-slate-500 hover:text-secondary-600 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Gallery Section */}
            <ProductGallery 
              images={product.images || [product.image]} 
              title={product.title} 
              isNew={product.isNew} 
            />

            {/* Details Section */}
            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 uppercase tracking-wider font-medium">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.ageGroup}</span>
              </div>

              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                {product.title}
              </h1>

              <div className="prose prose-slate mb-8 text-slate-600 leading-relaxed">
                <p>{product.description || "Experience the joy of giving with this carefully curated gift. Perfect for making special moments even more memorable."}</p>
              </div>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-4xl font-bold text-slate-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-slate-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>In Stock & Ready to Ship</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Gift Wrapping Available</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-8 bg-slate-900 text-white text-lg font-medium rounded-xl hover:bg-secondary-600 transition-all shadow-lg hover:shadow-secondary-200 flex items-center justify-center gap-2 group"
                >
                  <Gift className="w-5 h-5 group-hover:animate-bounce" />
                  View Gift
                </a>
                <button className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
              
              <p className="mt-6 text-xs text-slate-400 text-center sm:text-left">
                *This link will take you to our partner store to complete your purchase.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

