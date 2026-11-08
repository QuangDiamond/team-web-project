import { getInitials, getUserRoleLabel, getUserStatusOption } from '../../utils/userDisplay';
import { formatDate, formatDateTime } from '../../utils/paymentDisplay';
import { getPlanTitle } from '../../utils/planDisplay';

function ProfileRow({ label, value }) {
  return (
    <div className="profile-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// Cách đăng nhập của user: mật khẩu / Google
const getSignInMethods = (user) => {
  const methods = [];
  if (user.has_password) {
    methods.push('Password');
  }
  if (user.google_linked) {
    methods.push('Google');
  }
  if (methods.length === 0) {
    return '—';
  }
  return methods.join(', ');
};

// Hồ sơ tóm tắt của user (UC37 bước 2)
export default function UserProfileCard({ user }) {
  const status = getUserStatusOption(user.account_status);
  const hasBilling = user.role === 'TUTOR' || user.role === 'PARENT';

  let lastLogin = 'Never';
  if (user.last_login_at) {
    lastLogin = formatDateTime(user.last_login_at);
  }

  let creditLabel = '—';
  if (user.credit_balance !== null && user.credit_balance !== undefined) {
    creditLabel = user.credit_balance;
  }

  let planLabel = '—';
  if (user.plan_name) {
    planLabel = getPlanTitle(user.plan_name);
  }

  return (
    <section className="card profile-card" aria-labelledby="profile-name">
      <div className="profile-header">
        <span className="avatar profile-avatar" aria-hidden="true">{getInitials(user.full_name)}</span>
        <div className="profile-heading">
          <h1 id="profile-name" className="profile-name">{user.full_name}</h1>
          <p className="profile-email">{user.email}</p>
          <div className="profile-badges">
            <span className="badge badge-gray">{getUserRoleLabel(user.role)}</span>
            <span className={`badge badge-${status.tone}`}>{status.label}</span>
          </div>
        </div>
      </div>

      <dl className="profile-rows">
        <ProfileRow label="Email verified" value={user.email_verify_status ? 'Yes' : 'No'} />
        <ProfileRow label="Sign-in methods" value={getSignInMethods(user)} />
        <ProfileRow label="Created" value={formatDate(user.created_at)} />
        <ProfileRow label="Last sign-in" value={lastLogin} />
        {hasBilling && <ProfileRow label="Plan" value={planLabel} />}
        {hasBilling && <ProfileRow label="Credit balance" value={creditLabel} />}
      </dl>
    </section>
  );
}
