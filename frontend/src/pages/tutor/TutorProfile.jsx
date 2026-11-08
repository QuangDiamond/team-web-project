import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { getMyProfile, saveMyProfile } from '../../services/tutorProfileService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import TutorProfileForm, { EMPTY_PROFILE_VALUES, toProfileFormValues } from '../../components/tutor/TutorProfileForm';
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
      setNotice('Your profile is ready. You can now browse requests, apply and create posts.');
    } else {
      setNotice('Profile saved.');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <Alert type="error">{state.error.message}</Alert>
      </div>
    );
  }

  let initialValues = EMPTY_PROFILE_VALUES;
  let submitLabel = 'Create profile';
  if (state.profile) {
    initialValues = toProfileFormValues(state.profile);
    submitLabel = 'Save profile';
  }

  return (
    <div className="profile-page">
      {!state.profile && (
        <Alert type="info">
          Welcome, {state.fullName}! Create your tutor profile to start working on TuConnector.
        </Alert>
      )}
      {notice && (
        <Alert type="success">
          <p>{notice}</p>
          <p>
            <Link to="/tutor/posts/new" className="link">Create a post</Link>
            {' · '}
            <Link to="/tutor/requests" className="link">Browse requests</Link>
          </p>
        </Alert>
      )}

      <SectionCard title="My tutor profile" action={state.profile && (
        <Link to={`/tutors/${state.profile._id}`} className="btn btn-outline btn-sm">Overview</Link>
      )}>
        <TutorProfileForm key={formVersion} initialValues={initialValues} submitLabel={submitLabel} onSubmit={handleSubmit} />
      </SectionCard>
    </div>
  );
}
