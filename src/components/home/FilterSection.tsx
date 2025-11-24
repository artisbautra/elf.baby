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
    <div className="flex flex-col gap-6" id="categories">
      {/* Categories Section */}
      <div className="flex flex-col gap-1">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={clsx(
              "px-4 py-2.5 rounded-[3px] text-sm transition-all duration-200 text-left w-full flex items-center justify-between group",
              selectedCategory === category.id
                ? "bg-primary-950 text-white font-medium"
                : "text-slate-600 hover:text-primary-950"
            )}
          >
            <span>{category.label}</span>
            <span className={clsx(
              "text-xs transition-colors duration-200",
              selectedCategory === category.id 
                ? "text-white/60" 
                : "text-transparent group-hover:text-primary-950/30"
            )}>→</span>
          </button>
        ))}
      </div>

      {/* Age Filter Section */}
      <div className="flex flex-col gap-1 pt-6 border-t border-slate-200">
        {AGE_GROUPS.map((age) => (
          <button
            key={age.id}
            onClick={() => setSelectedAge(age.id)}
            className={clsx(
              "px-4 py-2.5 rounded-[3px] text-sm transition-all duration-200 text-left w-full flex items-center justify-between group",
              selectedAge === age.id
                ? "bg-primary-950 text-white font-medium"
                : "text-slate-600 hover:text-primary-950"
            )}
          >
            <span>{age.label}</span>
            <span className={clsx(
              "text-xs transition-colors duration-200",
              selectedAge === age.id 
                ? "text-white/60" 
                : "text-transparent group-hover:text-primary-950/30"
            )}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
