import { Link } from 'react-router-dom';
import { Star, CheckCircle2, Send, UserRound } from 'lucide-react';
import { getInitials } from '../../utils/getInitials';

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
        <span className="ai-card-rank" aria-label={`Thứ hạng ${rank}`}>#{rank}</span>
        <span className="ai-card-avatar" aria-hidden="true">{tutor.avatar_url ? <img src={tutor.avatar_url} alt="" loading="lazy" /> : getInitials(tutor.full_name)}</span>
        <div className="ai-card-identity">
          <h3 className="ai-card-name"><Link to={`/tutors/${tutor.profile_id}`}>{tutor.full_name}</Link></h3>
          {tutor.headline && <p className="ai-card-sub">{tutor.headline}</p>}
          <p className="ai-card-rating"><RatingText rating={tutor.average_rating} /></p>
        </div>
      </div>

      <div className="ai-card-badges">
        {tutor.availability_status === 'AVAILABLE' && <span className="status-badge tone-success">Đang nhận lớp</span>}
        {tutor.availability_status === 'NOT_AVAILABLE' && <span className="status-badge tone-warning">Tạm không nhận lớp</span>}
      </div>

      <div className="suggestion-match">
        <p className="suggestion-match-title"><CheckCircle2 size={16} aria-hidden="true" />Phù hợp với yêu cầu</p>
        <ul className="suggestion-category-tags" aria-label="Danh mục phù hợp">
          {matching_categories.map((item) => <li key={`${item.type}:${item.category_id}`}>{item.name}</li>)}
        </ul>
        <p className="ai-card-reason">{suggestion.reason}</p>
      </div>

      <div className="ai-card-actions">
        <Link to={`/tutors/${tutor.profile_id}`} className="btn btn-outline"><UserRound size={16} aria-hidden="true" />Xem hồ sơ</Link>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isInvited}
          onClick={() => onInvite(suggestion)}
        >
          <Send size={16} aria-hidden="true" />
          {isInvited ? 'Đã gửi lời mời' : 'Mời gia sư'}
        </button>
      </div>
    </li>
  );
}
