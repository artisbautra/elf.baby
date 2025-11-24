import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-12 md:py-20 max-w-4xl">
        <h1 className="font-serif text-4xl md:text-5xl text-primary-950 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">1. Introduction</h2>
            <p>
              Welcome to elf.baby. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="bg-white p-6 rounded-[5px] border border-dashed border-slate-300 my-8">
            <h2 className="font-serif text-2xl text-primary-950 mb-4">2. Affiliate Disclosure</h2>
            <p className="mb-4 font-medium text-primary-950">
              elf.baby is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
            </p>
            <p className="mb-4">
              <strong>Important Notice Regarding Our Role:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We are a curation and discovery platform, not a direct retailer.</li>
              <li>We do not manufacture, stock, sell, or ship any of the products listed on this website.</li>
              <li>When you click on a link to a product, you will be directed to a third-party seller (such as Amazon.com or other retailers) to complete your purchase.</li>
              <li>We may earn a commission from qualifying purchases made through these links at no additional cost to you.</li>
              <li>Because we do not process transactions directly, we do not collect or store your payment information, shipping address, or order details.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">3. Information We Collect</h2>
            <p>
              Since we do not process sales directly, the information we collect is limited. We may collect:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Usage Data:</strong> Information about how you use our website, such as pages visited and time spent on the site.</li>
              <li><strong>Cookies:</strong> We use cookies to improve your browsing experience and to track affiliate referrals. These cookies help us understand which products our visitors are interested in.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">4. Third-Party Links</h2>
            <p>
              Our website contains links to third-party websites. Clicking on those links may allow third parties to collect or share data about you. 
              We do not control these third-party websites and are not responsible for their privacy statements. When you leave our website, 
              we encourage you to read the privacy policy of every website you visit.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-primary-950 mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us.
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

