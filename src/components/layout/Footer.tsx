import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-dashed border-slate-300 pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
             <Link href="/" className="inline-block">
              <span className="font-serif text-4xl font-bold text-primary-950 tracking-tight">elf.baby</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-light">
              We curate magical moments and thoughtful gifts for the little ones and the ones who love them.
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

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-primary-950 mb-6">Stay Updated</h3>
            <p className="text-slate-500 text-sm mb-6 font-light">Join our newsletter for exclusive offers and magical gift ideas.</p>
            <div className="flex border-b border-slate-300 pb-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 bg-transparent text-sm focus:outline-none text-primary-950 placeholder-slate-400"
              />
              <button className="text-xs font-bold uppercase tracking-widest text-secondary-600 hover:text-secondary-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-slate-400 font-medium">
          <p>&copy; 2025 elf.baby. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
