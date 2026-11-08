import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { useRequestActions } from '../../hooks/useRequestActions';
import { getSuggestedRequests } from '../../services/tutorRequestService';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import RequestGrid from '../../components/tutor/RequestGrid';
import '../../styles/tutorRequests.css';

const PAGE_SIZE = 9;

// Gợi ý yêu cầu dựa trên môn học và cấp học/trình độ trong hồ sơ gia sư.
export default function SuggestedRequests() {
  const [page, setPage] = useState(1);
  const list = usePagedList(getSuggestedRequests, { page: page, limit: PAGE_SIZE });
  const actions = useRequestActions({ patchItem: list.patchItem });

  const handleRefresh = () => {
    if (page === 1) list.reload();
    else setPage(1);
  };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <div>
          <p className="item-meta">Yêu cầu đang mở phù hợp với môn học và cấp học / trình độ trong hồ sơ của bạn, mới nhất trước.</p>
          <Link to="/tutor/profile" className="link">Cập nhật danh mục giảng dạy trong hồ sơ</Link>
        </div>
        <button type="button" className="btn btn-outline btn-sm" disabled={list.loading} onClick={handleRefresh}>
          <RefreshCw size={14} className={list.loading ? 'spin' : ''} aria-hidden="true" />
          <span>{list.loading ? 'Đang cập nhật...' : 'Cập nhật'}</span>
        </button>
      </div>

      <ListState
        list={list}
        empty={{ icon: Search, title: 'Chưa có gợi ý', description: 'Hãy cập nhật môn học và trình độ trong hồ sơ, hoặc quay lại khi có yêu cầu mới.' }}
      >
        {list.data && <RequestGrid items={list.data.items} actions={actions} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} disabled={list.loading} />}
    </div>
  );
}
