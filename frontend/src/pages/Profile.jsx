import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page profile">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <div className="profile-details">
          <h3>Account Information</h3>
          <dl>
            <dt>User ID</dt>
            <dd>{user?.id || '-'}</dd>
            <dt>Name</dt>
            <dd>{user?.name || '-'}</dd>
            <dt>Email</dt>
            <dd>{user?.email || '-'}</dd>
            <dt>Member Since</dt>
            <dd>2026</dd>
          </dl>
        </div>
        <div className="profile-actions">
          <button className="btn btn-secondary">Edit Profile</button>
          <button className="btn btn-secondary">Change Password</button>
        </div>
      </div>
    </div>
  );
}