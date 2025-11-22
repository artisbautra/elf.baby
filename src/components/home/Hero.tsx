import Link from 'next/link';
import { ChristmasCountdown } from './ChristmasCountdown';
import { InteractiveSparkles } from '@/components/ui/InteractiveSparkles';

export function Hero() {
  return (
    <section className="relative border-b border-dashed border-slate-300 overflow-hidden">
      {/* Full width festive green background for the right side (desktop only) */}
      <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-1/2 bg-festive-green z-0">
         {/* Modern Abstract Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-tr from-festive-green via-transparent to-festive-gold/20 opacity-60 mix-blend-overlay"></div>
         <div className="absolute -top-24 -right-24 w-96 h-96 bg-festive-gold/10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[700px] relative z-10">
        
        {/* Left Content */}
        <div className="flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-0 border-r border-dashed border-slate-300 bg-cream/50 backdrop-blur-sm lg:bg-transparent relative">
          {/* Subtle background element for left side */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-festive-red/5 rounded-full blur-2xl -z-10"></div>

          <h1 className="font-serif text-6xl lg:text-8xl text-primary-950 leading-[1.1] mb-8 relative">
            Blooming <br/>
            <span className="italic font-light relative inline-block">
              Gifts
              <span className="absolute -top-2 -right-4 text-2xl animate-bounce">✨</span>
            </span> – <br/>
            Delivered
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-md leading-relaxed font-light">
            We craft curated gift collections that speak from the heart. Find the perfect surprise for your little elves and loved ones.
          </p>

          <div className="flex flex-wrap gap-4">
             <Link 
                href="/shop" 
                className="px-8 py-4 bg-primary-950 text-white text-sm font-bold tracking-widest uppercase hover:bg-primary-800 transition-all shadow-lg hover:shadow-primary-900/20 hover:-translate-y-1"
              >
                Shop Now
              </Link>
          </div>

          {/* Testimonial/Quote */}
          <div className="mt-16 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
               {/* Avatar placeholder */}
               <div className="w-full h-full bg-secondary-200"></div>
            </div>
            <div>
               <p className="font-serif text-lg italic text-slate-800 mb-2">
                "The gifts are always magical, and the curation is truly artistic. I wouldn't go anywhere else."
               </p>
               <p className="text-xs font-bold uppercase tracking-wider text-slate-500">— Sophia Carter, Mom</p>
            </div>
          </div>
        </div>

        {/* Right Content (Countdown) */}
        <div className="relative bg-festive-green lg:bg-transparent overflow-hidden flex items-center justify-center p-10 lg:p-20 group cursor-crosshair">
           {/* Interactive Sparkles Layer */}
           <InteractiveSparkles />

           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

           {/* Content Container */}
           <div className="relative w-full h-full max-w-md max-h-[600px] mx-auto flex flex-col items-center justify-center z-30 pointer-events-none">
               {/* Content */}
                <div className="w-full flex flex-col items-center justify-center text-white p-8 text-center relative">
                   
                   {/* Decorative glowing ring */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/10 rounded-full blur-sm animate-[spin_10s_linear_infinite]"></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-white/5 rounded-full blur-md animate-[spin_15s_linear_infinite_reverse]"></div>

                   {/* Snowflakes decoration */}
                   <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60 text-4xl select-none">
                     <div className="absolute top-10 left-10 animate-float text-white drop-shadow-glow">❄️</div>
                     <div className="absolute top-20 right-20 animate-float-delayed text-white drop-shadow-glow">❄️</div>
                     <div className="absolute bottom-20 left-1/3 animate-float text-white drop-shadow-glow">❄️</div>
                   </div>

                   <div className="text-6xl mb-8 font-serif italic font-light text-white/90 animate-pulse">Magic is coming</div>
                   
                   <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
                      <ChristmasCountdown />
                   </div>
                   
                   <p className="font-serif italic text-xl text-white/90 mt-10 tracking-wide drop-shadow-md">Make it magical.</p>
                </div>
           </div>
        </div>

      </div>
    </section>
  );
}
