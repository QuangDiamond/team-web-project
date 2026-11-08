import { Star } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import Pagination from '../common/Pagination';
import { formatDate } from '../../utils/dateFormat';

export default function ProfileReviews({ list, onPageChange }) {
  return (
    <SectionCard title="Reviews">
      {list.items.length === 0 && <p className="item-meta">No approved reviews yet.</p>}
      <ul className="public-profile-list">
        {list.items.map((review) => (
          <li key={review._id}>
            <p className="public-profile-meta"><Star size={16} aria-hidden="true" />{review.rating} / 5 · {formatDate(review.created_at)}</p>
            <p className="public-profile-text">{review.comment}</p>
            {review.tutor_reply && <blockquote className="public-profile-reply"><strong>Tutor reply</strong><p>{review.tutor_reply}</p></blockquote>}
          </li>
        ))}
      </ul>
      <Pagination pagination={list.pagination} onPageChange={onPageChange} label="Review pages" />
    </SectionCard>
  );
}
