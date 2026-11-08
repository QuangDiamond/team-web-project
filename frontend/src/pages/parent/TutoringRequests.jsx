import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, LoaderCircle, Plus } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyRequests } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import RequestListItem from '../../components/tutoringRequests/RequestListItem';

const PAGE_SIZE = 10;

// UC10 – danh sách yêu cầu tìm gia sư của phụ huynh (Figma: tutoring-requests)
export default function TutoringRequests() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { loading, error, data, reload } = usePagedList(getMyRequests, { page: page, limit: PAGE_SIZE });

  const goToCreate = () => {
    navigate('/parent/requests/new');
  };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Manage open requests and compare tutor interest.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={goToCreate}>
          <Plus size={14} aria-hidden="true" />
          <span>Create request</span>
        </button>
      </div>

      {loading && !data && (
        <div className="page-loading-inline" role="status">
          <LoaderCircle size={26} className="spin" aria-hidden="true" />
          <span className="visually-hidden">Loading...</span>
        </div>
      )}

      {error && (
        <Alert type="error">
          <p>{error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>Try again</button>
        </Alert>
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No tutoring requests yet"
          description="Create your first request and qualified tutors will start applying."
        />
      )}

      {data && data.items.length > 0 && (
        <ul className="item-list">
          {data.items.map((request) => (
            <RequestListItem key={request._id} request={request} />
          ))}
        </ul>
      )}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
