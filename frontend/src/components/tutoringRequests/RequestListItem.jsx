import { useNavigate } from 'react-router-dom';
import { Sparkles, Users } from 'lucide-react';
import { REQUEST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';

const pluralize = (count) => {
  if (count === 1) {
    return '1 application';
  }
  return `${count} applications`;
};

// Một dòng trong danh sách request của phụ huynh (Figma: RequestsScreen)
export default function RequestListItem({ request }) {
  const navigate = useNavigate();
  const badge = getStatusBadge(REQUEST_STATUS, request.status);

  let learner = 'no specific learner';
  if (request.student) {
    learner = request.student.full_name;
  }

  let editOrView = 'View';
  let editOrViewPath = `/parent/requests/${request._id}`;
  if (request.can_edit) {
    editOrView = 'Edit';
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
          {request.is_expired && <span className="status-badge tone-error">Expired</span>}
        </div>
        <p className="item-meta">
          For {learner} · {getModeLabel(request.teaching_mode)} · {formatBudget(request.budget)}
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
          <span>Applications</span>
        </button>
        {canSuggest && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(`/parent/requests/${request._id}/ai-suggestions`)}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>AI Suggestions</span>
          </button>
        )}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(editOrViewPath)}>
          {editOrView}
        </button>
      </div>
    </li>
  );
}
