import { ArrowRight, Coins } from 'lucide-react';
import { formatVnd } from '../../utils/formatCurrency';

export default function ProfileRates({ posts, onViewSchedule }) {
  if (posts.length === 0) return null;

  return (
    <section className="card public-profile-rates">
      <h2><Coins size={18} aria-hidden="true" />Mức phí tham khảo</h2>
      <ul>
        {posts.slice(0, 3).map((post) => (
          <li key={post._id}>
            <span>{post.subject_name || post.title}<small>{post.grade_level}</small></span>
            <strong>{formatVnd(post.price)}<small>/ buổi</small></strong>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-outline" onClick={onViewSchedule}>Xem bài đăng và lịch dạy<ArrowRight size={16} aria-hidden="true" /></button>
    </section>
  );
}
