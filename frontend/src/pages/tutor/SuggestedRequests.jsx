import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { useRequestActions } from '../../hooks/useRequestActions';
import { getSuggestedRequests, refreshSuggestedRequests } from '../../services/tutorRequestService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import RequestGrid from '../../components/tutorRequests/RequestGrid';
import '../../styles/tutorRequests.css';

const PAGE_SIZE = 9;

// UC11 – "Suggested for you": request phù hợp với các bài đăng của gia sư, xếp hạng bằng luật
export default function SuggestedRequests() {
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const list = usePagedList(getSuggestedRequests, { page: page, limit: PAGE_SIZE });
  const actions = useRequestActions({ patchItem: list.patchItem });

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError('');
    try {
      await refreshSuggestedRequests();
      if (page === 1) {
        await list.reload();
      } else {
        setPage(1);
      }
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  let showFallbackNotice = false;
  if (list.data && list.data.items.length > 0 && list.data.ai_status === 'FALLBACK') {
    showFallbackNotice = true;
  }

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Yêu cầu phù hợp với bài đăng đã xuất bản của bạn, xếp theo mức phù hợp.</p>
        <button type="button" className="btn btn-outline btn-sm" disabled={refreshing} onClick={handleRefresh}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} aria-hidden="true" />
          <span>{refreshing ? "Đang cập nhật..." : "Cập nhật"}</span>
        </button>
      </div>

      {refreshError && <Alert type="error">{refreshError}</Alert>}
      {showFallbackNotice && (
        <Alert type="info">Hiện chưa có giải thích từ AI. Yêu cầu được xếp hạng theo học phí, lịch học và khu vực.</Alert>
      )}

      <ListState
        list={list}
        empty={{ icon: Sparkles, title: "Chưa có gợi ý", description: "Hãy quay lại khi có yêu cầu mới." }}
      >
        {list.data && <RequestGrid items={list.data.items} actions={actions} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
