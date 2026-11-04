import { LoaderCircle } from 'lucide-react';
import Alert from './Alert';
import EmptyState from './EmptyState';

/*
 * Hiển thị trạng thái của một danh sách tải từ API: đang tải, lỗi (có nút thử lại), rỗng, hoặc nội dung (children).
 * list: kết quả của usePagedList. empty: { icon, title, description }
 */
export default function ListState({ list, empty, children }) {
  if (list.loading && !list.data) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (list.error) {
    return (
      <Alert type="error">
        <p>{list.error.message}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={list.reload}>Try again</button>
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
