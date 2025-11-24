import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-white border-t border-dashed border-slate-300 pt-8 pb-8">
      <div className="container mx-auto px-6">
        <div className="hidden grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
             <Link href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="elf.baby"
                width={200}
                height={60}
                className="h-10 w-auto object-contain"
                unoptimized
              />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-light">
              Gifts are part of the bond of love. That's why I, your little elf, am here to help you find the perfect gifts for your loved ones.
            </p>
          </div>
          
          {/* Links */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-xs uppercase tracking-widest text-primary-950 mb-6">Shop</h3>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">New Arrivals</Link></li>
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Best Sellers</Link></li>
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Gift Sets</Link></li>
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Sale</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-bold text-xs uppercase tracking-widest text-primary-950 mb-6">Company</h3>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Our Story</Link></li>
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Sustainability</Link></li>
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-secondary-600 transition-colors">Careers</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-slate-400 font-medium">
          <p>&copy; 2025 elf.baby. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
