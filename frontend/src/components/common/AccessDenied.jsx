import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

// Hiện khi user đã đăng nhập nhưng role không được vào trang (403)
export default function AccessDenied() {
  return (
    <div className="empty-state" role="alert">
      <ShieldAlert size={36} className="empty-state-icon" aria-hidden="true" />
      <h1 className="empty-state-title">You do not have access to this page</h1>
      <p className="empty-state-text">This page is only available to a different account type. If you think this is a mistake, contact an administrator.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link>
    </div>
  );
}
