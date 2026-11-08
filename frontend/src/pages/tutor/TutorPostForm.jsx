import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CircleCheck, LoaderCircle } from 'lucide-react';
import { createPost, getMyPost, updatePost } from '../../services/tutorPostService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import PostForm, { EMPTY_POST_VALUES, toPostFormValues } from '../../components/tutor/PostForm';
import { PROFILE_REQUIRED_MESSAGE } from '../../constants/requestLabels';
import '../../styles/tutorPosts.css';

// Tạo mới (/tutor/posts/new) hoặc chỉnh sửa (/tutor/posts/:id/edit) một bài đăng
export default function TutorPostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: isEdit, error: null, post: null });
  const [savedPost, setSavedPost] = useState(null);

  useEffect(() => {
    if (!isEdit) {
      return undefined;
    }
    let ignore = false;
    getMyPost(id)
      .then((response) => {
        if (!ignore) {
          setState({ loading: false, error: null, post: response.data });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ loading: false, error: error, post: null });
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const handleSubmit = async (payload, status) => {
    let response;
    if (isEdit) {
      response = await updatePost(id, payload);
    } else {
      response = await createPost({ ...payload, status: status });
    }
    setSavedPost(response.data);
  };

  if (state.loading) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-stack">
        {(state.error.rawMessage || state.error.message) === PROFILE_REQUIRED_MESSAGE ? (
          <Alert type="info">
            <p>Tạo hồ sơ gia sư trước khi quản lý bài đăng.</p>
            <Link to="/tutor/profile" className="btn btn-primary btn-sm">Hoàn thiện hồ sơ</Link>
          </Alert>
        ) : (
          <Alert type="error">{state.error.message}</Alert>
        )}
        <Link to="/tutor/posts" className="link">Quay lại bài đăng của tôi</Link>
      </div>
    );
  }

  if (savedPost) {
    let title = "Đã lưu bài đăng";
    let description = "Đã lưu thay đổi của bạn.";
    if (!isEdit && savedPost.status === 'PUBLISHED') {
      title = "Đã xuất bản bài đăng";
      description = "Phụ huynh có thể tìm thấy bạn trong danh sách gia sư gợi ý.";
    } else if (!isEdit) {
      title = "Đã lưu bản nháp";
      description = "Đăng bài từ danh sách bài đăng khi bạn đã sẵn sàng.";
    }
    return (
      <div className="request-success">
        <span className="request-success-icon" aria-hidden="true"><CircleCheck size={32} /></span>
        <h2 className="request-success-title">{title}</h2>
        <p className="item-meta">{description}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/tutor/posts')}>
          Xem bài đăng của tôi
        </button>
      </div>
    );
  }

  if (isEdit && state.post.is_locked) {
    return (
      <div className="page-stack">
        <Alert type="info">Bài đăng đang được kiểm duyệt nên không thể chỉnh sửa.</Alert>
        <Link to="/tutor/posts" className="link">Quay lại bài đăng của tôi</Link>
      </div>
    );
  }

  let initialValues = EMPTY_POST_VALUES;
  if (state.post) {
    initialValues = toPostFormValues(state.post);
  }

  return (
    <div className="post-form-page">
      <Link to="/tutor/posts" className="post-back-link">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Quay lại bài đăng của tôi</span>
      </Link>
      <SectionCard title={isEdit ? "Sửa bài đăng" : "Bài đăng mới"}>
        <PostForm initialValues={initialValues} isEdit={isEdit} onSubmit={handleSubmit} />
      </SectionCard>
    </div>
  );
}
