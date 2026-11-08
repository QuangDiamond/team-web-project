import { Link } from 'react-router-dom';
import { getInitials, getUserRoleLabel, getUserStatusOption } from '../../utils/userDisplay';
import { formatDate, formatDateTime } from '../../utils/paymentDisplay';

// Bảng user (Figma: AdminList kind="users"): user, role, trạng thái, ngày tạo, lần đăng nhập cuối, nút Manage
export default function UserTable({ users, currentUserId }) {
  return (
    <table className="data-table user-table">
      <caption className="visually-hidden">Người dùng</caption>
      <thead>
        <tr>
          <th scope="col">Người dùng</th>
          <th scope="col">Vai trò</th>
          <th scope="col">Trạng thái</th>
          <th scope="col">Ngày tạo</th>
          <th scope="col">Lần đăng nhập gần nhất</th>
          <th scope="col" className="cell-actions">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const status = getUserStatusOption(user.account_status);
          const isMe = user._id === currentUserId;
          let lastLogin = 'Chưa từng';
          if (user.last_login_at) {
            lastLogin = formatDateTime(user.last_login_at);
          }
          return (
            <tr key={user._id}>
              <td data-label="Người dùng">
                <span className="user-cell">
                  <span className="avatar" aria-hidden="true">{getInitials(user.full_name)}</span>
                  <span className="user-cell-text">
                    <span className="user-cell-name">
                      {user.full_name}
                      {isMe && <span className="badge badge-orange user-me-badge">Bạn</span>}
                    </span>
                    <span className="user-cell-email">{user.email}</span>
                  </span>
                </span>
              </td>
              <td data-label="Vai trò">{getUserRoleLabel(user.role)}</td>
              <td data-label="Trạng thái">
                <span className={`badge badge-${status.tone}`}>{status.label}</span>
                {!user.email_verify_status && <span className="user-unverified">Chưa xác minh thư điện tử</span>}
              </td>
              <td data-label="Ngày tạo">{formatDate(user.created_at)}</td>
              <td data-label="Lần đăng nhập gần nhất">{lastLogin}</td>
              <td data-label="Thao tác" className="cell-actions">
                <Link
                  to={`/admin/users/${user._id}`}
                  className="btn btn-outline btn-sm"
                  aria-label={`Quản lý ${user.full_name}`}
                >
                  Quản lý
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
