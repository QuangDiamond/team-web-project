import { Link } from 'react-router-dom';
import { getInitials, getUserRoleLabel, getUserStatusOption } from '../../utils/userDisplay';
import { formatDate, formatDateTime } from '../../utils/paymentDisplay';

// Bảng user (Figma: AdminList kind="users"): user, role, trạng thái, ngày tạo, lần đăng nhập cuối, nút Manage
export default function UserTable({ users, currentUserId }) {
  return (
    <table className="data-table user-table">
      <caption className="visually-hidden">Users</caption>
      <thead>
        <tr>
          <th scope="col">User</th>
          <th scope="col">Role</th>
          <th scope="col">Status</th>
          <th scope="col">Created</th>
          <th scope="col">Last sign-in</th>
          <th scope="col" className="cell-actions">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const status = getUserStatusOption(user.account_status);
          const isMe = user._id === currentUserId;
          let lastLogin = 'Never';
          if (user.last_login_at) {
            lastLogin = formatDateTime(user.last_login_at);
          }
          return (
            <tr key={user._id}>
              <td data-label="User">
                <span className="user-cell">
                  <span className="avatar" aria-hidden="true">{getInitials(user.full_name)}</span>
                  <span className="user-cell-text">
                    <span className="user-cell-name">
                      {user.full_name}
                      {isMe && <span className="badge badge-orange user-me-badge">You</span>}
                    </span>
                    <span className="user-cell-email">{user.email}</span>
                  </span>
                </span>
              </td>
              <td data-label="Role">{getUserRoleLabel(user.role)}</td>
              <td data-label="Status">
                <span className={`badge badge-${status.tone}`}>{status.label}</span>
                {!user.email_verify_status && <span className="user-unverified">Email not verified</span>}
              </td>
              <td data-label="Created">{formatDate(user.created_at)}</td>
              <td data-label="Last sign-in">{lastLogin}</td>
              <td data-label="Action" className="cell-actions">
                <Link
                  to={`/admin/users/${user._id}`}
                  className="btn btn-outline btn-sm"
                  aria-label={`Manage ${user.full_name}`}
                >
                  Manage
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
