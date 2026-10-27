import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleLoginUrl } from '../../services/authService';
import AuthLayout from '../../components/layout/AuthLayout';
import FormInput from '../../components/common/FormInput';
import PasswordInput from '../../components/common/PasswordInput';
import GoogleButton from '../../components/common/GoogleButton';
import Alert from '../../components/common/Alert';
import ResendVerificationButton from '../../components/common/ResendVerificationButton';
import { validateEmail, focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import '../../styles/login.css';

const LOGIN_FIELDS = ['email', 'password'];

// Thông báo theo query backend gắn khi redirect về /login
const getRedirectNotice = (searchParams) => {
  if (searchParams.get('verify') === 'success') {
    return { type: 'success', message: 'Your account has been verified. Please sign in.' };
  }
  if (searchParams.get('verify') === 'invalid') {
    return { type: 'error', message: 'This verification link is invalid or has expired.', canResend: true };
  }
  if (searchParams.get('oauth') === 'failed') {
    return { type: 'error', message: 'Google sign-in failed. Please try again.' };
  }
  return null;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Thông báo từ URL chỉ hiện cho đến khi user submit lần đầu
  const [redirectNotice, setRedirectNotice] = useState(() => getRedirectNotice(searchParams));

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const newErrors = { email: validateEmail(values.email), password: '' };
    if (values.password.length === 0) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotVerified(false);
    setRedirectNotice(null);

    const newErrors = validate();
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) {
      focusFirstInvalidField(LOGIN_FIELDS, newErrors);
      return;
    }

    setSubmitting(true);
    const result = await login({ email: values.email.trim(), password: values.password });
    setSubmitting(false);

    if (result.success) {
      navigate('/');
      return;
    }

    const error = result.error;
    if (error.status === 403) {
      setNotVerified(true);
      return;
    }
    if (error.status === 422 && error.errors) {
      setErrors(toFieldErrors(error.errors));
      return;
    }
    setFormError(error.message);
  };

  let alert = null;
  if (notVerified) {
    alert = (
      <Alert type="error">
        Your account is not verified yet. Please check your email or resend the verification email below.
      </Alert>
    );
  } else if (formError) {
    alert = <Alert type="error">{formError}</Alert>;
  } else if (redirectNotice) {
    alert = <Alert type={redirectNotice.type}>{redirectNotice.message}</Alert>;
  }

  const showResend = notVerified || (redirectNotice !== null && redirectNotice.canResend === true);

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="login-form">
        <h1 className="auth-title">Welcome back <span aria-hidden="true">👋</span></h1>
        <p className="auth-subtitle">Sign in to continue to TuConnector.</p>

        {alert}

        <GoogleButton href={getGoogleLoginUrl()} />

        <p className="auth-divider"><span>or sign in with email</span></p>

        <FormInput
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={submitting}
        />
        <PasswordInput
          id="password"
          label="Password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="login-options">
          {/* TODO: đổi "#" thành trang Forgot password khi có */}
          <a href="#" className="link">Forgot password?</a>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        {showResend && <ResendVerificationButton email={values.email} />}

        <p className="auth-footer-text">
          Don't have an account? <Link to="/register" className="link">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
