import { LockKeyhole, MapPin, Star, UserRound } from 'lucide-react';
import { getInitials } from '../../utils/getInitials';

export default function ProfileIdentity({ profile, role, reviewCount = 0, children }) {
  const isTutor = role === 'TUTOR';
  const available = profile.availability_status === 'AVAILABLE';

  return (
    <aside className="card public-profile-identity">
      <div className="public-profile-cover">
        {profile.cover_url && <img src={profile.cover_url} alt="" />}
      </div>
      <div className="public-profile-identity-body">
        <div className="public-profile-avatar-row">
          <div className="public-profile-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} />
              : getInitials(profile.full_name)}
          </div>
          <span className="public-profile-role"><UserRound size={14} aria-hidden="true" />{isTutor ? 'Gia sư' : 'Phụ huynh'}</span>
        </div>
        <h1>{profile.full_name}</h1>
        {profile.headline && <p className="public-profile-headline">{profile.headline}</p>}
        {profile.address && <p className="public-profile-meta"><MapPin size={16} aria-hidden="true" />{profile.address}</p>}
        {isTutor && (
          <>
            <div className="public-profile-facts">
              <div>
                <p className="public-profile-rating"><Star size={17} aria-hidden="true" />{profile.average_rating == null ? 'Chưa có đánh giá' : `${Number(profile.average_rating).toFixed(1)} / 5`}</p>
                <span>Điểm đánh giá</span>
              </div>
              <div><p>{reviewCount.toLocaleString('vi-VN')}</p><span>Đánh giá đã duyệt</span></div>
            </div>
            <p className={`public-profile-availability${available ? ' is-available' : ''}`}>
              <span aria-hidden="true" />{available ? 'Đang nhận học sinh' : 'Hiện chưa nhận học sinh'}
            </p>
          </>
        )}
        <div className="public-profile-actions">{children}</div>
        <p className="public-profile-privacy"><LockKeyhole size={15} aria-hidden="true" /><span>Thông tin liên hệ được bảo vệ. Kết nối qua TuConnector để trao đổi về việc học.</span></p>
      </div>
    </aside>
  );
}
