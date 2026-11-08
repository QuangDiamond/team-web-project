import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

const getInitials = (fullName) => {
  const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'GS';
  }
  return words.map((word) => word[0]).join('').slice(0, 2).toUpperCase();
};

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>Chưa có đánh giá</span>;
  }
  return <span className="suggestion-rating"><Star size={14} aria-hidden="true" />{Number(rating).toFixed(1)}</span>;
}

// Một gia sư được gợi ý (Figma: Applications ai). Nút Mời mở hộp thoại mời gia sư (UC14), Xem chi tiết mở hồ sơ công khai
export default function SuggestionCard({ suggestion, rank, isInvited, onInvite }) {
  const { tutor, matching_categories } = suggestion;

  return (
    <li className="ai-card">
      <div className="ai-card-top">
        <span className="ai-card-rank" aria-label={`Thứ hạng ${rank}`}>{rank}</span>
        <span className="ai-card-avatar" aria-hidden="true">{tutor.avatar_url ? <img src={tutor.avatar_url} alt="" /> : getInitials(tutor.full_name)}</span>
        <div className="ai-card-identity">
          <p className="ai-card-name">{tutor.full_name}</p>
          {tutor.headline && <p className="ai-card-sub">{tutor.headline}</p>}
          <p className="ai-card-rating"><RatingText rating={tutor.average_rating} /></p>
        </div>
        {tutor.availability_status === 'NOT_AVAILABLE' && (
          <div className="ai-card-badges">
            <span className="status-badge tone-warning">Tạm không nhận</span>
          </div>
        )}
      </div>

      <ul className="suggestion-category-tags" aria-label="Danh mục phù hợp">
        {matching_categories.map((item) => <li key={`${item.type}:${item.category_id}`}>{item.name}</li>)}
      </ul>
      <p className="ai-card-reason">{suggestion.reason}</p>

      <div className="ai-card-actions">
        <Link to={`/tutors/${tutor.profile_id}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={isInvited}
          onClick={() => onInvite(suggestion)}
        >
          {isInvited ? "Đã mời" : "Mời"}
        </button>
      </div>
    </li>
  );
}
