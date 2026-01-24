// src/components/shop/product-tags.tsx
import Link from "next/link";
import { Tag } from "lucide-react";

interface ProductTagsProps {
  tags?: string[];
}

export function ProductTags({ tags }: ProductTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-6 border-t border-gray-100 pt-6">
      <span className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Etiquetas:</span>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/tienda?tag=${encodeURIComponent(tag)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm transition-all border border-gray-100 hover:border-indigo-100"
        >
          <Tag className="w-3 h-3" />
          {tag}
        </Link>
      ))}
    </div>
  );
}
