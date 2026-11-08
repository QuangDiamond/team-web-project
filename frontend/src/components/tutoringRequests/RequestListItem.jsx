import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { REQUEST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';

const pluralize = (count) => {
  if (count === 1) {
    return '1 application';
  }
  return `${count} applications`;
};

// Một dòng trong danh sách request của phụ huynh (Figma: RequestsScreen)
export default function RequestListItem({ request, onDelete }) {
  const navigate = useNavigate();
  const badge = getStatusBadge(REQUEST_STATUS, request.status);

  let learner = 'no specific learner';
  if (request.student) {
    learner = request.student.full_name;
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
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/parent/requests/${request._id}`)}>
          <Eye size={14} aria-hidden="true" />
          <span>View details</span>
        </button>
        {canSuggest && (
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            title="AI tutor suggestions"
            aria-label="AI tutor suggestions"
            onClick={() => navigate(`/parent/requests/${request._id}/ai-suggestions`)}
          >
            <Sparkles size={16} aria-hidden="true" />
          </button>
        )}
        {request.can_edit && (
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            title="Edit request"
            aria-label="Edit request"
            onClick={() => navigate(`/parent/requests/${request._id}/edit`)}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline btn-sm btn-icon"
          title="Delete request"
          aria-label="Delete request"
          onClick={() => onDelete(request)}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
