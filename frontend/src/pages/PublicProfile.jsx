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

  if (loading) return <div className="public-profile-state" role="status"><LoaderCircle className="spin" aria-hidden="true" />Loading profile...</div>;
  if (error) {
    return <div className="public-profile-state"><Alert type="error">{error.status === 404 ? 'This profile is not available' : error.message}</Alert>
      {error.status !== 404 && <button type="button" className="btn btn-outline" onClick={reload}>Try again</button>}
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
          {canInvite && <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>Invite tutor</button>}
          {!user && isTutor && <>
            <p className="item-meta">Sign in or register as a Parent to invite this tutor.</p>
            <Link to="/login" state={{ from: location.pathname }} onClick={() => rememberPublicProfile(location.pathname)} className="btn btn-primary">Sign in to invite</Link>
            <Link to="/register" onClick={() => rememberPublicProfile(location.pathname)} className="btn btn-outline">Register as Parent</Link>
          </>}
          {user?.role === 'TUTOR' && user.id === profile.user_id && <Link to="/tutor/profile" className="btn btn-outline">Edit my profile</Link>}
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
        setNotice(`Invitation sent. You have ${result.remaining_credits} credit(s) left.`);
      }} />}
      {applying && <ApplyModal request={applying} onClose={() => setApplying(null)} onApplied={(result) => {
        setAppliedIds([...appliedIds, applying._id]);
        setApplying(null);
        setNotice(`Application sent. You have ${result.remaining_credits} credit(s) left.`);
      }} />}
    </div>
  );
}

export default function PublicProfile({ role }) {
  const { profileId, userId } = useParams();
  const id = role === 'TUTOR' ? profileId : userId;
  return <ProfileContent key={`${role}-${id}`} id={id} role={role} />;
}
