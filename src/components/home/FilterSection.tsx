import { CATEGORIES, AGE_GROUPS } from '@/types';
import { clsx } from 'clsx';

interface FilterSectionProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedAge: string;
  setSelectedAge: (age: string) => void;
}

export function FilterSection({ 
  selectedCategory, 
  setSelectedCategory,
  selectedAge,
  setSelectedAge 
}: FilterSectionProps) {
  return (
    <div className="flex flex-col gap-10 mb-16 max-w-4xl mx-auto" id="categories">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-secondary-600">Curated Collections</span>
        <h2 className="font-serif text-4xl md:text-5xl font-medium text-primary-950">Find the Perfect Gift</h2>
      </div>

      {/* Categories - Minimalist Tabs */}
      <div className="flex justify-center">
         <div className="flex flex-wrap justify-center gap-2 p-2 bg-white border border-dashed border-slate-300 rounded-full">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={clsx(
                "px-6 py-3 rounded-full text-sm font-medium transition-all duration-300",
                selectedCategory === category.id
                  ? "bg-primary-950 text-white shadow-md"
                  : "bg-transparent text-slate-500 hover:text-primary-950 hover:bg-slate-50"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age Filter - Simple Line */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 border-t border-dashed border-slate-300 pt-8 w-full">
          {AGE_GROUPS.map((age) => (
            <button
              key={age.id}
              onClick={() => setSelectedAge(age.id)}
              className={clsx(
                "text-sm font-medium transition-colors relative pb-1",
                selectedAge === age.id
                  ? "text-secondary-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-secondary-600"
                  : "text-slate-400 hover:text-primary-950"
              )}
            >
              {age.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
