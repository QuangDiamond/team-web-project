import { useNavigate } from 'react-router-dom';
import { Sparkles, Users } from 'lucide-react';
import { REQUEST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';

const pluralize = (count) => {
  if (count === 1) {
    return "1 đơn ứng tuyển";
  }
  return `${count} đơn ứng tuyển`;
};

// Một dòng trong danh sách request của phụ huynh (Figma: RequestsScreen)
export default function RequestListItem({ request }) {
  const navigate = useNavigate();
  const badge = getStatusBadge(REQUEST_STATUS, request.status);

  let learner = "không chỉ định học sinh";
  if (request.student) {
    learner = request.student.full_name;
  }

  let editOrView = "Xem";
  let editOrViewPath = `/parent/requests/${request._id}`;
  if (request.can_edit) {
    editOrView = "Sửa";
    editOrViewPath = `/parent/requests/${request._id}/edit`;
  }

  const canSuggest = request.status === 'OPEN' && !request.is_expired;

  return (
    <li className="item-row">
      <div className="item-row-body">
        <div className="item-row-heading">
          <button type="button" className="item-title-link" onClick={() => navigate(`/parent/requests/${request._id}`)}>
            {request.title}
          </button>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
          {request.is_expired && <span className="status-badge tone-error">Đã hết hạn</span>}
        </div>
        <p className="item-meta">
          Cho yêu cầu {learner} · {getModeLabel(request.teaching_mode)} · {formatBudget(request.budget)}
        </p>
      </div>
      <span className="item-count">{pluralize(request.application_count)}</span>
      <div className="item-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => navigate(`/parent/requests/${request._id}/applications`)}
        >
          <Users size={14} aria-hidden="true" />
          <span>Đơn ứng tuyển</span>
        </button>
        {canSuggest && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(`/parent/requests/${request._id}/ai-suggestions`)}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Gợi ý AI</span>
          </button>
        )}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(editOrViewPath)}>
          {editOrView}
        </button>
      </div>
    </li>
  );
}
