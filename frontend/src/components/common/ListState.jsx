import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import Alert from './Alert';
import EmptyState from './EmptyState';
import { PROFILE_REQUIRED_MESSAGE } from '../../constants/requestLabels';

/*
 * Hiển thị trạng thái của một danh sách tải từ API: đang tải, lỗi (có nút thử lại), rỗng, hoặc nội dung (children).
 * list: kết quả của usePagedList. empty: { icon, title, description }
 */
export default function ListState({
  list, empty, children, loading, loadError, onRetry, isEmpty,
  filtersActive, onClearFilters, emptyTitle, emptyText, emptyAction,
}) {
  // History/admin screens render their tables separately and pass flat state.
  if (!list) {
    if (loading && isEmpty) {
      return <div className="page-loading-inline" role="status"><LoaderCircle size={26} className="spin" aria-hidden="true" /><span>Đang tải...</span></div>;
    }
    if (loadError) {
      return <Alert type="error"><p>{loadError}</p><button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Thử lại</button></Alert>;
    }
    if (isEmpty) {
      return (
        <div className="history-state">
          <EmptyState title={emptyTitle} description={emptyText} />
          {filtersActive && onClearFilters ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={onClearFilters}>Xóa bộ lọc</button>
          ) : emptyAction}
        </div>
      );
    }
    return null;
  }
  if (list.loading && !list.data) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  // Gia sư chưa có hồ sơ không phải lỗi hệ thống: chỉ đường tới trang tạo hồ sơ, không cần "Try again"
  if (list.error && (list.error.rawMessage || list.error.message) === PROFILE_REQUIRED_MESSAGE) {
    return (
      <Alert type="info">
        <p>Vui lòng tạo hồ sơ gia sư trước khi sử dụng trang này.</p>
        <Link to="/tutor/profile" className="btn btn-primary btn-sm">Hoàn thiện hồ sơ</Link>
      </Alert>
    );
  }

  if (list.error) {
    return (
      <Alert type="error">
        <p>{list.error.message}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={list.reload}>Thử lại</button>
      </Alert>
    );
  }

  if (list.data && list.data.items.length === 0) {
    let description = empty.description;
    if (list.data.hint) {
      description = list.data.hint;
    }
    return <EmptyState icon={empty.icon} title={empty.title} description={description} />;
  }

  // Đang tải lại (đổi trang / bộ lọc): giữ danh sách cũ nhưng khóa thao tác để kết quả mới không ghi đè thay đổi vừa làm
  if (list.loading) {
    return (
      <div className="list-refreshing" aria-busy="true">
        {children}
      </div>
    );
  }

  return children;
}
