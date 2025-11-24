import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getActiveProducts } from '@/lib/products';
import { ProductsGrid } from './ProductsGrid';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const products = await getActiveProducts();

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto">
          <ProductsGrid initialProducts={products} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
