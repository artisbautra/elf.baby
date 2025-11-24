'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useHeader } from '@/contexts/HeaderContext';

export function Header() {
  const { isHeaderVisible } = useHeader();

  return (
    <div 
      className={`sticky top-0 z-50 w-full h-24 box-border bg-white relative overflow-hidden transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <header className="absolute inset-0 w-full h-24 bg-white">
        <div className="container mx-auto h-24 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="elf.baby"
              width={600}
              height={180}
              className="h-[120px] w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>
      </header>
    </div>
  );
}
