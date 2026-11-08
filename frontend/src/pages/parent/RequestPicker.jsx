import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyRequests } from '../../services/parentRequestService';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import { REQUEST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';

const PAGE_SIZE = 10;

// Cấu hình theo chế độ: bấm vào một request thì đi đâu
const PICKER_MODES = {
  applications: {
    intro: 'Choose a request to review the tutors who applied to it.',
    actionLabel: 'Review applications',
    status: undefined,
    emptyTitle: 'No requests yet',
    emptyDescription: 'Create a request and tutors will start applying.',
    buildPath: (requestId) => `/parent/requests/${requestId}/applications`,
    isAvailable: () => true,
    unavailableNote: '',
  },
};

const pluralize = (count) => {
  if (count === 1) {
    return '1 application';
  }
  return `${count} applications`;
};

function PickerRow({ request, mode }) {
  const navigate = useNavigate();
  const badge = getStatusBadge(REQUEST_STATUS, request.status);
  const available = mode.isAvailable(request);

  let learner = 'no specific learner';
  if (request.student) {
    learner = request.student.full_name;
  }

  return (
    <li className="item-row">
      <div className="item-row-body">
        <div className="item-row-heading">
          <button type="button" className="item-title-link" disabled={!available} onClick={() => navigate(mode.buildPath(request._id))}>
            {request.title}
          </button>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
          {request.is_expired && <span className="status-badge tone-error">Expired</span>}
        </div>
        <p className="item-meta">
          {request.subject_name} · {request.grade_level} · {getModeLabel(request.teaching_mode)} · {formatBudget(request.budget)} · For {learner}
        </p>
      </div>
      <span className="item-count">{pluralize(request.application_count)}</span>
      <div className="item-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={!available} onClick={() => navigate(mode.buildPath(request._id))}>
          {mode.actionLabel}
        </button>
      </div>
    </li>
  );
}

/*
 * Trang chọn request cho mục menu Applications (cần một request cụ thể của phụ huynh).
 * mode = 'applications'
 */
export default function RequestPicker({ mode: modeName }) {
  const navigate = useNavigate();
  const mode = PICKER_MODES[modeName];
  const [page, setPage] = useState(1);

  const params = { page: page, limit: PAGE_SIZE };
  if (mode.status) {
    params.status = mode.status;
  }
  const list = usePagedList(getMyRequests, params);

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">{mode.intro}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/parent/requests/new')}>
          <Plus size={14} aria-hidden="true" />
          <span>Create request</span>
        </button>
      </div>

      <ListState list={list} empty={{ icon: FileText, title: mode.emptyTitle, description: mode.emptyDescription }}>
        {list.data && (
          <ul className="item-list">
            {list.data.items.map((request) => (
              <PickerRow key={request._id} request={request} mode={mode} />
            ))}
          </ul>
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
