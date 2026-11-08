import { ChevronLeft, Sparkles } from 'lucide-react';
import RoleSelector, { getRoleTitle } from './RoleSelector';

// Bước 2 "Confirm" của đăng ký: chọn role, xem lại thông tin, đồng ý điều khoản.
// Dùng ở /register (đăng ký thường) và /register/complete (đăng ký bằng Google)
export default function RegisterConfirmStep({
  fullName,
  email,
  role,
  onRoleChange,
  agreeTerms,
  onAgreeTermsChange,
  errors,
  submitting,
  onSubmit,
  onBack,
  alert,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {onBack && (
        <button type="button" className="link-back" onClick={onBack}>
          <ChevronLeft size={16} aria-hidden="true" />
          <span>Quay lại</span>
        </button>
      )}

      <h1 className="auth-title">Bạn là ai? <span aria-hidden="true">🤔</span></h1>
      <p className="auth-subtitle">Chọn vai trò phù hợp nhất với bạn.</p>

      {alert}

      <RoleSelector value={role} onChange={onRoleChange} error={errors.role} />

      <section className="account-summary" aria-labelledby="account-summary-title">
        <h2 id="account-summary-title" className="account-summary-title">Thông tin tài khoản</h2>
        <dl>
          <div className="account-summary-row">
            <dt>Họ và tên</dt>
            <dd>{fullName}</dd>
          </div>
          <div className="account-summary-row">
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div className="account-summary-row">
            <dt>Vai trò</dt>
            <dd className="account-summary-role">{getRoleTitle(role)}</dd>
          </div>
        </dl>
      </section>

      <div className="form-field">
        <label className="checkbox">
          <input
            id="agree_terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(event) => onAgreeTermsChange(event.target.checked)}
            aria-invalid={errors.agree_terms ? 'true' : 'false'}
            aria-describedby={errors.agree_terms ? 'agree_terms-error' : undefined}
          />
          <span>
            {/* TODO: thay "#" bằng trang Terms / Privacy khi có */}
            Tôi đồng ý với <a href="#" className="link">Điều khoản sử dụng</a> và{' '}
            <a href="#" className="link">Chính sách bảo mật</a> của TuConnector.
          </span>
        </label>
        {errors.agree_terms && <p id="agree_terms-error" className="form-error">{errors.agree_terms}</p>}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        <Sparkles size={18} aria-hidden="true" />
        <span>{submitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
      </button>
    </form>
  );
}
