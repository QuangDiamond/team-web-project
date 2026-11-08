import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { POST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';

function PostRow({ post, onChangeStatus, onDelete }) {
  const navigate = useNavigate();
  const badge = getStatusBadge(POST_STATUS, post.status);

  // PUBLISHED có thể ẩn đi; DRAFT / HIDDEN có thể đăng. Bài đang chờ kiểm duyệt thì khóa mọi thao tác
  let toggleAction = null;
  if (!post.is_locked) {
    if (post.status === 'PUBLISHED') {
      toggleAction = { label: "Ẩn", icon: EyeOff, nextStatus: 'HIDDEN' };
    } else {
      toggleAction = { label: "Đăng bài", icon: Eye, nextStatus: 'PUBLISHED' };
    }
  }

  return (
    <li className="item-row">
      <div className="item-row-body">
        <div className="item-row-heading">
          <p className="item-title">{post.title}</p>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
        <p className="item-meta">
          {post.subject_name} · {post.grade_level} · {getModeLabel(post.teaching_mode)} · {formatBudget(post.price)}
        </p>
        <p className="item-meta">{post.schedule}</p>
        {post.is_locked && <p className="item-meta">Bài đăng đang được kiểm duyệt nên không thể thay đổi.</p>}
      </div>
      {!post.is_locked && (
        <div className="item-actions">
          {toggleAction && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onChangeStatus(post, toggleAction.nextStatus)}>
              <toggleAction.icon size={14} aria-hidden="true" />
              <span>{toggleAction.label}</span>
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/tutor/posts/${post._id}/edit`)}>
            <Pencil size={14} aria-hidden="true" />
            <span>Sửa</span>
          </button>
          <button type="button" className="btn btn-outline btn-sm post-delete-button" onClick={() => onDelete(post)}>
            <Trash2 size={14} aria-hidden="true" />
            <span>Xóa</span>
          </button>
        </div>
      )}
    </li>
  );
}

// Danh sách bài đăng của gia sư; onChangeStatus(post, status) và onDelete(post) do trang xử lý
export default function PostList({ posts, onChangeStatus, onDelete }) {
  return (
    <ul className="item-list">
      {posts.map((post) => (
        <PostRow key={post._id} post={post} onChangeStatus={onChangeStatus} onDelete={onDelete} />
      ))}
    </ul>
  );
}
