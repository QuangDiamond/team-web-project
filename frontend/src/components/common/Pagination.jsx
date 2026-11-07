import { ChevronLeft, ChevronRight } from 'lucide-react';

// Phân trang đơn giản: Previous / "Page x of y" / Next. pagination = { page, totalPages, total }
export default function Pagination({ pagination, onPageChange, disabled, label = 'Pagination' }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }
  const isFirstPage = pagination.page <= 1;
  const isLastPage = pagination.page >= pagination.totalPages;

  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={disabled || isFirstPage}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Previous</span>
      </button>
      <span className="pagination-status" aria-live="polite">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={disabled || isLastPage}
      >
        <span>Next</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
