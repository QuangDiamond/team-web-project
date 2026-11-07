import { LoaderCircle, ReceiptText, RotateCw, SearchX } from 'lucide-react';
import Alert from './Alert';

// Trạng thái chung của 1 danh sách có bộ lọc: đang tải / lỗi / rỗng (UC18, UC37).
// Trả về null khi đã có dữ liệu để component cha vẽ bảng. emptyAction: nút / link khi chưa có dữ liệu nào
export default function ListState({ loading, loadError, onRetry, isEmpty, filtersActive, onClearFilters, emptyTitle, emptyText, emptyAction }) {
  if (loading && isEmpty) {
    return (
      <div className="history-state" role="status">
        <LoaderCircle size={22} className="spin" aria-hidden="true" />
        <span>Loading...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="history-state history-state-error">
        <Alert type="error">Could not load this list: {loadError}</Alert>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          <RotateCw size={16} aria-hidden="true" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  if (!isEmpty) {
    return null;
  }

  // Có bộ lọc mà không ra kết quả: gợi ý xóa bộ lọc
  if (filtersActive) {
    return (
      <div className="empty-state">
        <SearchX size={32} className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">No results for these filters</p>
        <p className="empty-state-text">Try another type, status or date range.</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onClearFilters}>Clear filters</button>
      </div>
    );
  }

  // Chưa có dữ liệu nào (vd UC18 E1: link sang UC17)
  return (
    <div className="empty-state">
      <ReceiptText size={32} className="empty-state-icon" aria-hidden="true" />
      <p className="empty-state-title">{emptyTitle}</p>
      {emptyText && <p className="empty-state-text">{emptyText}</p>}
      {emptyAction}
    </div>
  );
}
