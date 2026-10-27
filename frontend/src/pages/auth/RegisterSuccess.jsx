import { Link, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import ResendVerificationButton from '../../components/common/ResendVerificationButton';
import '../../styles/registerSuccess.css';

// Màn "Check your email" sau khi đăng ký thường thành công
export default function RegisterSuccess() {
  const location = useLocation();
  let email = '';
  if (location.state && location.state.email) {
    email = location.state.email;
  }

  return (
    <AuthLayout activeStep={1}>
      <div className="register-success">
        <span className="register-success-icon" aria-hidden="true">
          <MailCheck size={32} />
        </span>
        <h1 className="auth-title">Check your email</h1>
        {email ? (
          <p className="auth-subtitle">
            We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            The link expires in 24 hours.
          </p>
        ) : (
          <p className="auth-subtitle">
            We sent a verification link to your email. Click the link to activate your account.
            The link expires in 24 hours.
          </p>
        )}

        {email && <ResendVerificationButton email={email} />}

        <p className="auth-footer-text">
          Already verified? <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
