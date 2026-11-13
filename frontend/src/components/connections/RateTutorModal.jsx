import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { getInitials } from '../../utils/getInitials';

const STAR_VALUES = [1, 2, 3, 4, 5];

/*
 * Form đánh giá gia sư sau khi thỏa thuận CONFIRMED (SC24 Rate Tutor, BR-07: 1-5 sao).
 * onSubmit({ rating, comment }) trả về Promise; lỗi do trang cha hiển thị.
 */
export default function RateTutorModal({ connection, onSubmit, onClose }) {
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  let tutor = {};
  if (connection.tutor) {
    tutor = connection.tutor;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ rating: ratingScore, comment: ratingComment });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="conn-modal-overlay" onClick={onClose}>
      <div className="conn-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="conn-modal-header">
          <span className="conn-modal-title">Đánh giá gia sư</span>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Đóng">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="conn-modal-body">
          <div className="rate-tutor-identity">
            {tutor.avatar_url ? (
              <img src={tutor.avatar_url} alt="Gia sư" className="rate-tutor-avatar" />
            ) : (
              <span className="rate-tutor-avatar conn-avatar-initials" aria-hidden="true">
                {getInitials(tutor.full_name)}
              </span>
            )}
            <div>
              <h4 className="rate-tutor-name">{tutor.full_name}</h4>
              <p className="rate-tutor-subject">Môn: {connection.agreed_subject}</p>
            </div>
          </div>

          <div className="star-rating-row">
            {STAR_VALUES.map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= ratingScore ? 'active' : ''}`}
                onClick={() => setRatingScore(star)}
                aria-label={`${star} sao`}
              >
                <Star size={28} aria-hidden="true" />
              </button>
            ))}
          </div>

          <label htmlFor="rate-tutor-comment" className="rate-tutor-label">
            Chia sẻ nhận xét chi tiết:
          </label>
          <textarea
            id="rate-tutor-comment"
            className="rate-textarea"
            placeholder="Gia sư có đúng giờ, giảng giải dễ hiểu và nhiệt tình không?..."
            value={ratingComment}
            maxLength={1000}
            onChange={(event) => setRatingComment(event.target.value)}
          />

          <div className="rate-tutor-actions">
            <button type="button" className="btn-conn decline" onClick={onClose} disabled={submitting}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-conn confirm" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
