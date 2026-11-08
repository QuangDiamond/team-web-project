import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { getMyProfile, saveMyProfile } from '../../services/tutorProfileService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import TutorProfileForm, { EMPTY_PROFILE_VALUES, toProfileFormValues } from '../../components/tutorProfile/TutorProfileForm';
import '../../styles/tutorProfile.css';

// Hồ sơ gia sư của chính mình: tạo lần đầu hoặc chỉnh sửa. Cần có hồ sơ để duyệt request, ứng tuyển và đăng bài
export default function TutorProfile() {
  const [state, setState] = useState({ loading: true, error: null, profile: null, fullName: '' });
  const [notice, setNotice] = useState('');
  // Đổi key để form dựng lại với dữ liệu vừa lưu
  const [formVersion, setFormVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    getMyProfile()
      .then((response) => {
        if (!ignore) {
          setState({ loading: false, error: null, profile: response.data.profile, fullName: response.data.full_name });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ loading: false, error: error, profile: null, fullName: '' });
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (payload) => {
    const response = await saveMyProfile(payload);
    setState({ ...state, profile: response.data.profile });
    setFormVersion(formVersion + 1);
    if (response.data.created) {
      setNotice("Hồ sơ đã sẵn sàng. Bạn có thể xem yêu cầu, ứng tuyển và tạo bài đăng.");
    } else {
      setNotice("Đã lưu hồ sơ.");
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <Alert type="error">{state.error.message}</Alert>
      </div>
    );
  }

  let initialValues = EMPTY_PROFILE_VALUES;
  let submitLabel = "Tạo hồ sơ";
  if (state.profile) {
    initialValues = toProfileFormValues(state.profile);
    submitLabel = "Lưu hồ sơ";
  }

  return (
    <div className="profile-page">
      {!state.profile && (
        <Alert type="info">
          Xin chào, {state.fullName}! Hãy tạo hồ sơ để bắt đầu giảng dạy trên TuConnector.
        </Alert>
      )}
      {notice && (
        <Alert type="success">
          <p>{notice}</p>
          <p>
            <Link to="/tutor/posts/new" className="link">Tạo bài đăng</Link>
            {' · '}
            <Link to="/tutor/requests" className="link">Tìm yêu cầu</Link>
          </p>
        </Alert>
      )}

      <SectionCard title="Hồ sơ gia sư của tôi" action={state.profile && (
        <Link to={`/tutors/${state.profile._id}`} className="btn btn-outline btn-sm">Tổng quan</Link>
      )}>
        <TutorProfileForm key={formVersion} initialValues={initialValues} submitLabel={submitLabel} onSubmit={handleSubmit} />
      </SectionCard>
    </div>
  );
}
