import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) {
  if (totalPages <= 1 && !totalItems) return null;

  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      pages.push(i);
    }
  }

  const pagesWithEllipsis = [];
  let prev = null;
  for (const page of pages) {
    if (prev && page - prev > 1) {
      pagesWithEllipsis.push('...');
    }
    pagesWithEllipsis.push(page);
    prev = page;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        {totalItems !== undefined && (
          <span className="text-sm text-gray-500">
            {totalItems} registro{totalItems !== 1 ? 's' : ''}
          </span>
        )}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pagesWithEllipsis.map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
