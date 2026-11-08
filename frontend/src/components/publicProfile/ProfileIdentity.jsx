import { MapPin, ShieldCheck, Star } from 'lucide-react';
import { getInitials } from '../../utils/getInitials';

export default function ProfileIdentity({ profile, role, children }) {
  return (
    <aside className="card public-profile-identity">
      <div className="public-profile-cover">
        {profile.cover_url && <img src={profile.cover_url} alt="" />}
      </div>
      <div className="public-profile-identity-body">
        <div className="public-profile-avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : getInitials(profile.full_name)}
        </div>
        <p className="public-profile-role"><ShieldCheck size={16} aria-hidden="true" /> {role === 'TUTOR' ? 'Tutor profile' : 'Parent profile'}</p>
        <h1>{profile.full_name}</h1>
        {profile.headline && <p className="public-profile-headline">{profile.headline}</p>}
        {profile.address && <p className="public-profile-meta"><MapPin size={16} aria-hidden="true" />{profile.address}</p>}
        {role === 'TUTOR' && (
          <div className="public-profile-facts">
            <p><Star size={16} aria-hidden="true" />{profile.average_rating == null ? 'No ratings yet' : `${Number(profile.average_rating).toFixed(1)} / 5`}</p>
            <p>{profile.availability_status === 'AVAILABLE' ? 'Available for tutoring' : 'Not currently available'}</p>
          </div>
        )}
        <div className="public-profile-actions">{children}</div>
        <p className="public-profile-privacy">Contact details are protected. Connect through TuConnector to discuss lessons.</p>
      </div>
    </aside>
  );
}
