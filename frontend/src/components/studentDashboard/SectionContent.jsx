import { LoaderCircle } from 'lucide-react';
import Alert from '../common/Alert';
import EmptyState from '../common/EmptyState';

// Nội dung của 1 khối dashboard: loading / lỗi (kèm thử lại) / rỗng / danh sách
export default function SectionContent({ section, onRetry, emptyIcon, emptyTitle, emptyDescription, children }) {
  if (section.loading) {
    return (
      <div className="student-section-loading" role="status">
        <LoaderCircle size={22} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (section.error) {
    return (
      <Alert type="error">
        <p className="student-section-error-text">{section.error.message}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Thử lại</button>
      </Alert>
    );
  }

  if (section.items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return children;
}
