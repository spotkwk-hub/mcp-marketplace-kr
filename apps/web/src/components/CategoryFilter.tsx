'use client';

import { CATEGORIES, type Category } from '@mcp-kr/registry';
import { cn } from '@/lib/utils';

interface Props {
  selected: Category | 'all';
  onSelect: (c: Category | 'all') => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
            selected === cat.id
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
          )}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
