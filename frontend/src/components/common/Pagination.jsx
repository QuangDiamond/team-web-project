import { ChevronLeft, ChevronRight } from 'lucide-react';

// Nút Previous / Next theo object pagination của API ({ page, limit, total, totalPages })
export default function Pagination({ pagination, onPageChange, disabled = false, label = 'Phân trang' }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label={label}>
      <span className="pagination-info">
        Trang {pagination.page} / {pagination.totalPages} · {pagination.total} mục
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Trước</span>
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled || pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          <span>Sau</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
