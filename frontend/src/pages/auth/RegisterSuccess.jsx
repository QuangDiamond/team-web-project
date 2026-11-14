import { Link, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import ResendVerificationButton from '../../components/common/ResendVerificationButton';
import '../../styles/register.css';
import '../../styles/registerSuccess.css';

// Màn "Check your email" sau khi đăng ký thường thành công
export default function RegisterSuccess() {
  const location = useLocation();
  let email = '';
  if (location.state && location.state.email) {
    email = location.state.email;
  }

  return (
    <AuthLayout activeStep={1} panelClassName="register-intro">
      <div className="register-success">
        <span className="register-success-icon" aria-hidden="true">
          <MailCheck size={32} />
        </span>
        <h1 className="auth-title">Kiểm tra email của bạn</h1>
        {email ? (
          <p className="auth-subtitle">
            Chúng tôi đã gửi liên kết xác minh đến <strong>{email}</strong>. Nhấn vào liên kết để kích hoạt tài khoản.
            Liên kết có hiệu lực trong 24 giờ.
          </p>
        ) : (
          <p className="auth-subtitle">
            Chúng tôi đã gửi liên kết xác minh đến email của bạn. Nhấn vào liên kết để kích hoạt tài khoản.
            Liên kết có hiệu lực trong 24 giờ.
          </p>
        )}

        {email && <ResendVerificationButton email={email} />}

        <p className="auth-footer-text">
          Bạn đã xác minh tài khoản? <Link to="/login" className="link">Đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
