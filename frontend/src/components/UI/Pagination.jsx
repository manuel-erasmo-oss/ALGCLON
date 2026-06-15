import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, currentPage, totalPages, onPageChange, totalItems }) {
  page = page ?? currentPage ?? 1

  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5
  let start = Math.max(1, page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <div className="text-sm text-gray-500">
        Página {page} de {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100">1</button>
            {start > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-sm rounded-md ${p === page ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
