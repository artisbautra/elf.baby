import Link from 'next/link';
import { Search, ShoppingBag, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-cream border-b border-dashed border-slate-300">
      <div className="container mx-auto grid grid-cols-12 h-24">
        
        {/* Logo Section */}
        <div className="col-span-6 md:col-span-3 flex items-center pl-6 md:pl-8 border-r border-dashed border-slate-300 relative">
           {/* Festive Decoration */}
           <div className="absolute top-6 left-4 md:left-6 -rotate-12 text-xl">🎄</div>
           <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-3xl font-bold text-primary-950 tracking-tight">elf.baby</span>
          </Link>
        </div>

        {/* Navigation - Desktop */}
        <div className="hidden md:flex col-span-6 items-center justify-center border-r border-dashed border-slate-300 px-8">
          <nav className="flex items-center gap-10">
            <Link href="/" className="text-sm font-medium text-primary-950 hover:text-primary-700 tracking-wide uppercase">Home</Link>
            <Link href="/shop" className="text-sm font-medium text-primary-950 hover:text-primary-700 tracking-wide uppercase">Shop</Link>
            <Link href="/about" className="text-sm font-medium text-primary-950 hover:text-primary-700 tracking-wide uppercase">About</Link>
          </nav>
        </div>

        {/* Mobile Menu Button */}
         <div className="md:hidden col-span-6 flex items-center justify-end pr-6">
            <button className="p-2 text-primary-950">
              <Menu className="w-6 h-6" />
            </button>
         </div>

        {/* Actions - Desktop */}
        <div className="hidden md:flex col-span-3 items-center justify-end pr-8 gap-6">
           <button className="text-primary-950 hover:text-primary-700 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/shop" className="px-6 py-2.5 bg-festive-red text-white text-xs font-bold uppercase tracking-widest hover:bg-festive-red/90 transition-colors shadow-sm">
            Find Gift
          </Link>
        </div>

      </div>
    </header>
  );
}
