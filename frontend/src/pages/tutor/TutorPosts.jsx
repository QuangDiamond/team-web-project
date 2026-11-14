import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { changePostStatus, deletePost, getMyPosts } from '../../services/tutorPostService';
import ListState from '../../components/common/ListState';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import PostList from '../../components/tutor/PostList';
import '../../styles/tutorPosts.css';

const PAGE_SIZE = 10;

// Bài đăng quảng cáo dịch vụ dạy học của gia sư. Chỉ bài PUBLISHED mới được dùng để gợi ý cho phụ huynh
export default function TutorPosts() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const list = usePagedList(getMyPosts, { page: page, limit: PAGE_SIZE });

  const handleChangeStatus = async (post, status) => {

    try {
      await changePostStatus(post._id, status);
      if (status === 'PUBLISHED') {
        toast.success(`"${post.title}" đã được đăng.`);
      } else {
        toast.success(`"${post.title}" đã được ẩn.`);
      }
    } catch (error) {
      toast.error(error.message);
    }
    await list.reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);

    try {
      await deletePost(postToDelete._id);
      toast.success(`"${postToDelete.title}" đã được xóa.`);
    } catch (error) {
      toast.error(error.message);
    }
    setDeleting(false);
    setPostToDelete(null);
    await list.reload();
  };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Các bài đăng giúp phụ huynh tìm thấy bạn. Chỉ bài đã xuất bản được dùng để gợi ý.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/tutor/posts/new')}>
          <Plus size={14} aria-hidden="true" />
          <span>Bài đăng mới</span>
        </button>
      </div>

      <ListState
        list={list}
        empty={{ icon: FileText, title: "Chưa có bài đăng", description: "Tạo bài đăng để phụ huynh tìm thấy bạn và nhận gợi ý về bạn." }}
      >
        {list.data && <PostList posts={list.data.items} onChangeStatus={handleChangeStatus} onDelete={setPostToDelete} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}

      {postToDelete && (
        <Modal title="Xóa bài đăng này?" onClose={() => setPostToDelete(null)}>
          <p className="modal-summary">
            <strong>{postToDelete.title}</strong> sẽ bị xóa khỏi danh sách và không còn được gợi ý cho phụ huynh.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" disabled={deleting} onClick={() => setPostToDelete(null)}>Hủy</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
