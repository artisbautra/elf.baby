import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FilterSection } from '@/components/home/FilterSection';
import { ProductCard } from '@/components/home/ProductCard';
import { getActiveProducts } from '@/lib/products';
import { ShopClient } from './ShopClient';

export default async function ShopPage() {
  // Fetch products server-side
  const products = await getActiveProducts();

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 px-4 container mx-auto" id="gifts">
          <ShopClient initialProducts={products} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
