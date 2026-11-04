import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CircleCheck, LoaderCircle } from 'lucide-react';
import { createPost, getMyPost, updatePost } from '../../services/tutorPostService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import PostForm, { EMPTY_POST_VALUES, toPostFormValues } from '../../components/tutorPosts/PostForm';
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
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-stack">
        {state.error.message === PROFILE_REQUIRED_MESSAGE ? (
          <Alert type="info">
            <p>Set up your tutor profile first to manage posts.</p>
            <Link to="/tutor/profile" className="btn btn-primary btn-sm">Complete my profile</Link>
          </Alert>
        ) : (
          <Alert type="error">{state.error.message}</Alert>
        )}
        <Link to="/tutor/posts" className="link">Back to my posts</Link>
      </div>
    );
  }

  if (savedPost) {
    let title = 'Post saved';
    let description = 'Your changes were saved.';
    if (!isEdit && savedPost.status === 'PUBLISHED') {
      title = 'Post published';
      description = 'Parents can now find you in their tutor suggestions.';
    } else if (!isEdit) {
      title = 'Draft saved';
      description = 'Publish it from your posts list when you are ready.';
    }
    return (
      <div className="request-success">
        <span className="request-success-icon" aria-hidden="true"><CircleCheck size={32} /></span>
        <h2 className="request-success-title">{title}</h2>
        <p className="item-meta">{description}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/tutor/posts')}>
          View my posts
        </button>
      </div>
    );
  }

  if (isEdit && state.post.is_locked) {
    return (
      <div className="page-stack">
        <Alert type="info">This post is under moderation and cannot be edited.</Alert>
        <Link to="/tutor/posts" className="link">Back to my posts</Link>
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
        <span>Back to my posts</span>
      </Link>
      <SectionCard title={isEdit ? 'Edit post' : 'New post'}>
        <PostForm initialValues={initialValues} isEdit={isEdit} onSubmit={handleSubmit} />
      </SectionCard>
    </div>
  );
}
