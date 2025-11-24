import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-12 md:py-20 max-w-4xl">
        <h1 className="font-serif text-4xl md:text-5xl text-primary-950 mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using elf.baby ("the Website"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by these terms, please do not use this Website.
            </p>
          </section>

          <section className="bg-white p-6 rounded-[5px] border border-dashed border-slate-300 my-8">
            <h2 className="font-serif text-2xl text-primary-950 mb-4">2. Affiliate Disclosure & Disclaimer</h2>
            <p className="mb-4">
              <strong>Amazon Associates Disclosure:</strong> elf.baby is a participant in the Amazon Services LLC Associates Program, 
              an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
            </p>
            <p className="mb-4">
              <strong>Nature of Our Service:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>We are Curators, Not Sellers:</strong> elf.baby is a product discovery and curation platform. We act as an affiliate marketer.</li>
              <li><strong>No Direct Sales:</strong> We do not manufacture, store, sell, or ship any physical products. All products listed on this site are sold and shipped by third-party retailers.</li>
              <li><strong>Commissions:</strong> We may earn a commission when you click on our links and make a qualifying purchase. This comes at no extra cost to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">3. Limitation of Liability</h2>
            <p>
              Because we are not the seller or manufacturer of the products listed:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Product Quality & Safety:</strong> We do not guarantee the quality, safety, or legality of any products advertised. Any claims, statistics, or other representations about a product should be verified with the manufacturer or seller.</li>
              <li><strong>Transactions:</strong> Your dealings with third-party merchants found on or through our website, including payment and delivery of goods, are solely between you and such merchants.</li>
              <li><strong>Damages:</strong> elf.baby shall not be liable for any damages, losses, or disputes arising from your purchase or use of products from third-party sellers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">4. Product Information</h2>
            <p>
              We strive to keep product information (such as price and availability) up to date, but these details are subject to change by the seller without notice. 
              The price and availability information displayed on the seller's site at the time of purchase will apply.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">5. Intellectual Property</h2>
            <p>
              The content on elf.baby (layout, design, curation text) is the property of elf.baby. Product images and names are the property of their respective owners 
              and are used for identification and promotional purposes under fair use or affiliate agreements.
            </p>
          </section>

          <div className="text-sm text-slate-400 mt-12 pt-8 border-t border-dashed border-slate-200">
            Last Updated: November 2025
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

