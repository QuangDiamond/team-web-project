import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { formatBudget, getModeLabel } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

// Thẻ yêu cầu dùng chung cho danh sách công khai và dashboard gia sư.
export default function RequestCard({ request, onToggleSave, onApply, readOnly = false, showApplicationCount = false }) {
  const navigate = useNavigate();

  // Request đã lưu nhưng đã đóng / hết hạn
  if (!request.available) {
    return (
      <li className="request-card is-unavailable">
        <div className="request-card-body">
          <h3 className="request-card-title">{request.title || "Yêu cầu"}</h3>
          <p className="item-meta">{request.subject_name}</p>
          <span className="status-badge tone-error">Không còn khả dụng</span>
        </div>
        <div className="request-card-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onToggleSave({ ...request, is_bookmarked: true })}>
            Xóa
          </button>
        </div>
      </li>
    );
  }

  let applyButton = (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => onApply(request)}>
      Ứng tuyển
    </button>
  );
  if (request.has_applied) {
    applyButton = (
      <button type="button" className="btn btn-primary btn-sm" disabled>
        Đã ứng tuyển
      </button>
    );
  }

  const SaveIcon = request.is_bookmarked ? BookmarkCheck : Bookmark;
  let saveLabel = "Lưu yêu cầu";
  if (request.is_bookmarked) {
    saveLabel = "Bỏ lưu";
  }

  const metaParts = [request.grade_level, getModeLabel(request.teaching_mode)];
  if (request.location_address) {
    metaParts.push(request.location_address);
  }

  return (
    <li className="request-card">
      <div className="request-card-body">
        <div className="request-card-top">
          <span className="status-badge tone-primary">{request.subject_name}</span>
        </div>
        <h3 className="request-card-title">
          <button type="button" className="item-title-link" onClick={() => navigate(`/tutor/requests/${request._id}`)}>
            {request.title}
          </button>
        </h3>
        <p className="request-card-budget">{formatBudget(request.budget)}</p>
        <p className="item-meta">{metaParts.join(' · ')}</p>
        <p className="request-card-description">{request.description}</p>
        {(request.created_at || showApplicationCount) && (
          <p className="item-meta">
            {request.created_at && (
              <time className="request-card-date" dateTime={request.created_at}>{formatDate(request.created_at)}</time>
            )}
            {showApplicationCount && <span>{request.created_at && ' · '}{request.application_count} lượt ứng tuyển</span>}
          </p>
        )}
      </div>
      <div className="request-card-actions">
        {!readOnly && (
          <button
            type="button"
            className="dashboard-icon-button"
            aria-label={saveLabel}
            title={saveLabel}
            aria-pressed={request.is_bookmarked}
            onClick={() => onToggleSave(request)}
          >
            <SaveIcon size={18} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/tutor/requests/${request._id}`)}>
          Chi tiết
        </button>
        {!readOnly && applyButton}
      </div>
    </li>
  );
}
