import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import AvatarUpload from '../components/common/AvatarUpload';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page profile">
      <h1>Hồ sơ</h1>
      <div className="profile-card">
        <AvatarUpload />
        <div className="profile-header">
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>{user?.name || "Người dùng"}</h2>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <div className="profile-details">
          <h3>Thông tin tài khoản</h3>
          <dl>
            <dt>Mã người dùng</dt>
            <dd>{user?.id || '-'}</dd>
            <dt>Họ tên</dt>
            <dd>{user?.name || '-'}</dd>
            <dt>Email</dt>
            <dd>{user?.email || '-'}</dd>
            <dt>Thành viên từ</dt>
            <dd>2026</dd>
          </dl>
        </div>
        <div className="profile-actions">
          <button className="btn btn-secondary">Sửa hồ sơ</button>
          <Link to="/change-password" className="btn btn-secondary">Đổi mật khẩu</Link>
        </div>
      </div>
    </div>
  );
}
