'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  onSearch: (query: string) => void;
}

export function ProductSearch({ onSearch }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center gap-4 w-full px-4 py-4 border border-slate-200 rounded-[5px] bg-white">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for gifts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-lg text-primary-950 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

