import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { changePostStatus, deletePost, getMyPosts } from '../../services/tutorPostService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import PostList from '../../components/tutorPosts/PostList';
import '../../styles/tutorPosts.css';

const PAGE_SIZE = 10;

// Bài đăng quảng cáo dịch vụ dạy học của gia sư. Chỉ bài PUBLISHED mới được dùng để gợi ý cho phụ huynh
export default function TutorPosts() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const list = usePagedList(getMyPosts, { page: page, limit: PAGE_SIZE });

  const handleChangeStatus = async (post, status) => {
    setNotice('');
    setActionError('');
    try {
      await changePostStatus(post._id, status);
      if (status === 'PUBLISHED') {
        setNotice(`"${post.title}" is now published.`);
      } else {
        setNotice(`"${post.title}" is now hidden.`);
      }
    } catch (error) {
      setActionError(error.message);
    }
    await list.reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setNotice('');
    setActionError('');
    try {
      await deletePost(postToDelete._id);
      setNotice(`"${postToDelete.title}" was deleted.`);
    } catch (error) {
      setActionError(error.message);
    }
    setDeleting(false);
    setPostToDelete(null);
    await list.reload();
  };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Posts parents can find you with. Only published posts are used for suggestions.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/tutor/posts/new')}>
          <Plus size={14} aria-hidden="true" />
          <span>New post</span>
        </button>
      </div>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

      <ListState
        list={list}
        empty={{ icon: FileText, title: 'No posts yet', description: 'Create a post so parents can find you and get suggested to them.' }}
      >
        {list.data && <PostList posts={list.data.items} onChangeStatus={handleChangeStatus} onDelete={setPostToDelete} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}

      {postToDelete && (
        <Modal title="Delete this post?" onClose={() => setPostToDelete(null)}>
          <p className="modal-summary">
            <strong>{postToDelete.title}</strong> will be removed from your posts and no longer suggested to parents.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" disabled={deleting} onClick={() => setPostToDelete(null)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
