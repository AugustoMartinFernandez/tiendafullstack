"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
}

export function Pagination({ totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageUrl = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generar array de páginas con elipsis
  const generatePagination = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        onMouseEnter={() => router.prefetch(createPageUrl(currentPage - 1))}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex gap-1 overflow-x-auto pb-1 max-w-[200px] sm:max-w-none scrollbar-hide">
        {generatePagination().map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-400 font-bold">
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onMouseEnter={() => router.prefetch(createPageUrl(Number(page)))}
              onClick={() => handlePageChange(Number(page))}
              className={cn(
                "w-10 h-10 flex-shrink-0 rounded-lg text-sm font-bold transition-all",
                currentPage === page
                  ? "bg-indigo-600 text-white shadow-md"
                  : "border border-gray-200 hover:bg-gray-50 text-gray-700"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        onMouseEnter={() => router.prefetch(createPageUrl(currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}