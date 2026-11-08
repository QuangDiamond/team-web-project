import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePublicProfile } from '../hooks/usePublicProfile';
import Alert from '../components/common/Alert';
import ProfileIdentity from '../components/publicProfile/ProfileIdentity';
import ProfileBackground from '../components/publicProfile/ProfileBackground';
import ProfilePosts from '../components/publicProfile/ProfilePosts';
import ProfileReviews from '../components/publicProfile/ProfileReviews';
import InviteTutorDialog from '../components/publicProfile/InviteTutorDialog';
import ApplyModal from '../components/tutorRequests/ApplyModal';
import { clearPublicProfileReturn, rememberPublicProfile } from '../utils/publicProfileReturn';
import '../styles/publicProfile.css';

function ProfileContent({ id, role }) {
  const { user } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = usePublicProfile(id, role, page);
  const [inviting, setInviting] = useState(false);
  const [applying, setApplying] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user) clearPublicProfileReturn();
  }, [user]);

  if (loading) return <div className="public-profile-state" role="status"><LoaderCircle className="spin" aria-hidden="true" />Đang tải hồ sơ...</div>;
  if (error) {
    return <div className="public-profile-state"><Alert type="error">{error.status === 404 ? "Hồ sơ này không khả dụng" : error.message}</Alert>
      {error.status !== 404 && <button type="button" className="btn btn-outline" onClick={reload}>Thử lại</button>}
      </div>;
  }

  const profile = data.profile;
  const isTutor = role === 'TUTOR';
  const canInvite = user?.role === 'PARENT' && isTutor;
  const canApply = user?.role === 'TUTOR' && !isTutor;

  return (
    <div className="public-profile-page">
      {notice && <Alert type="success">{notice}</Alert>}
      <div className="public-profile-grid">
        <ProfileIdentity profile={profile} role={role}>
          {canInvite && <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>Mời gia sư</button>}
          {!user && isTutor && <>
            <p className="item-meta">Đăng nhập hoặc đăng ký tài khoản Phụ huynh để mời gia sư.</p>
            <Link to="/login" state={{ from: location.pathname }} onClick={() => rememberPublicProfile(location.pathname)} className="btn btn-primary">Đăng nhập để mời</Link>
            <Link to="/register" onClick={() => rememberPublicProfile(location.pathname)} className="btn btn-outline">Đăng ký làm phụ huynh</Link>
          </>}
          {user?.role === 'TUTOR' && user.id === profile.user_id && <Link to="/tutor/profile" className="btn btn-outline">Sửa hồ sơ của tôi</Link>}
        </ProfileIdentity>
        <div className="public-profile-main">
          {isTutor && <ProfileBackground profile={profile} />}
          <ProfilePosts list={isTutor ? data.posts : data.requests} role={role} onPageChange={setPage}
            onApply={canApply ? setApplying : null} appliedIds={appliedIds} />
          {isTutor && <ProfileReviews list={data.reviews} onPageChange={setPage} />}
        </div>
      </div>
      {inviting && <InviteTutorDialog profile={profile} onClose={() => setInviting(false)} onInvited={(result) => {
        setInviting(false);
        setNotice(`Đã gửi lời mời. Bạn còn ${result.remaining_credits} tín dụng.`);
      }} />}
      {applying && <ApplyModal request={applying} onClose={() => setApplying(null)} onApplied={(result) => {
        setAppliedIds([...appliedIds, applying._id]);
        setApplying(null);
        setNotice(`Đã gửi đơn ứng tuyển. Bạn còn ${result.remaining_credits} tín dụng.`);
      }} />}
    </div>
  );
}

export default function PublicProfile({ role }) {
  const { profileId, userId } = useParams();
  const id = role === 'TUTOR' ? profileId : userId;
  return <ProfileContent key={`${role}-${id}`} id={id} role={role} />;
}
