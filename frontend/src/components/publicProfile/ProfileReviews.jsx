import { MessageSquare, Star, UserRound } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import Pagination from '../common/Pagination';
import { formatDate } from '../../utils/dateFormat';

export default function ProfileReviews({ list, averageRating, onPageChange }) {
  const total = list.pagination?.total || 0;
  return (
    <SectionCard title={<><MessageSquare size={19} aria-hidden="true" />Đánh giá</>}>
      {total > 0 && averageRating != null && (
        <div className="public-profile-review-summary">
          <strong>{Number(averageRating).toFixed(1)}<span>/ 5</span></strong>
          <div><Star size={19} aria-hidden="true" /><p>{total.toLocaleString('vi-VN')} đánh giá đã được duyệt</p></div>
        </div>
      )}
      {list.items.length === 0 && <p className="item-meta">Chưa có đánh giá được duyệt.</p>}
      <ul className="public-profile-review-list">
        {list.items.map((review) => (
          <li key={review._id}>
            <div className="public-profile-review-header">
              <span className="public-profile-review-avatar"><UserRound size={18} aria-hidden="true" /></span>
              <div><strong>Đánh giá đã duyệt</strong><p className="item-meta">{formatDate(review.created_at)}</p></div>
              <span className="public-profile-review-stars" role="img" aria-label={`${review.rating} trên 5 sao`}>
                {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} aria-hidden="true" className={value <= review.rating ? 'is-filled' : ''} />)}
              </span>
            </div>
            <p className="public-profile-text">{review.comment}</p>
            {review.tutor_reply && <blockquote className="public-profile-reply"><strong>Phản hồi của gia sư</strong><p>{review.tutor_reply}</p></blockquote>}
          </li>
        ))}
      </ul>
      <Pagination pagination={list.pagination} onPageChange={onPageChange} label="Phân trang đánh giá" />
    </SectionCard>
  );
}
