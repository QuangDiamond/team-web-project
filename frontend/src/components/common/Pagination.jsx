import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange, disabled = false, label = 'Phân trang', numbered = false }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages } = pagination;
  const pageNumbers = [];
  if (numbered) {
    const start = Math.max(2, Math.min(page - 1, totalPages - 3));
    const end = Math.min(totalPages - 1, start + 2);
    pageNumbers.push(1);
    if (start > 2) pageNumbers.push('before');
    for (let number = start; number <= end; number += 1) {
      pageNumbers.push(number);
    }
    if (end < totalPages - 1) pageNumbers.push('after');
    pageNumbers.push(totalPages);
  }

  return (
    <nav className="pagination" aria-label={label}>
      <span className="pagination-info">
        Trang {pagination.page} / {pagination.totalPages} · {pagination.total} mục
      </span>
      <div className={numbered ? 'pagination-buttons pagination-buttons-numbered' : 'pagination-buttons'}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled || pagination.page <= 1}
          aria-label="Trang trước"
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {!numbered && <span>Trang trước</span>}
        </button>
        {pageNumbers.map((number) => (
          typeof number === 'string' ? <span key={number} aria-hidden="true">…</span> : (
            <button
              key={number}
              type="button"
              className={number === page ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              aria-label={`Trang ${number}`}
              aria-current={number === page ? 'page' : undefined}
              disabled={disabled}
              onClick={() => { if (number !== page) onPageChange(number); }}
            >
              {number}
            </button>
          )
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled || pagination.page >= pagination.totalPages}
          aria-label="Trang sau"
          onClick={() => onPageChange(pagination.page + 1)}
        >
          {!numbered && <span>Trang sau</span>}
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
