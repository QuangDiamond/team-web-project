import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleLoginUrl } from '../../services/authService';
import AuthLayout from '../../components/layout/AuthLayout';
import FormInput from '../../components/common/FormInput';
import PasswordInput from '../../components/common/PasswordInput';
import GoogleButton from '../../components/common/GoogleButton';
import ResendVerificationButton from '../../components/common/ResendVerificationButton';
import { validateEmail, focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import { getPathAfterLogin } from '../../routes/redirectAfterLogin';
import '../../styles/login.css';

const LOGIN_FIELDS = ['email', 'password'];
const LOCKED_MESSAGE = 'Tài khoản của bạn đã bị tạm ngưng hoặc bị cấm. Vui lòng liên hệ bộ phận hỗ trợ.';

// Thông báo theo query backend gắn khi redirect về /login
const getRedirectNotice = (searchParams) => {
  if (searchParams.get('password') === 'reset') {
    return { type: 'success', message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' };
  }
  if (searchParams.get('verify') === 'success') {
    return { type: 'success', message: 'Tài khoản đã được xác minh. Vui lòng đăng nhập.' };
  }
  if (searchParams.get('verify') === 'invalid') {
    return { type: 'error', message: 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.', canResend: true };
  }
  // Đăng nhập Google bằng tài khoản bị khóa (UC37): backend chuyển về /login?oauth=locked
  if (searchParams.get('oauth') === 'locked') {
    return { type: 'error', message: LOCKED_MESSAGE };
  }
  if (searchParams.get('oauth') === 'failed') {
    return { type: 'error', message: 'Đăng nhập bằng Google không thành công. Vui lòng thử lại.' };
  }
  return null;
};

export default function Login() {
  const { login, clearLoggedOutByUser, accountLockedOnStart } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [notVerified, setNotVerified] = useState(false);

  // Đã tới /login sau Log out: từ giờ bị PrivateRoute đưa về /login thì lại nhớ trang để quay lại (D2-B2)
  useEffect(() => {
    clearLoggedOutByUser();
  }, [clearLoggedOutByUser]);
  const [submitting, setSubmitting] = useState(false);

  const [canResend, setCanResend] = useState(() => getRedirectNotice(searchParams)?.canResend === true);

  useEffect(() => {
    if (accountLockedOnStart) {
      toast.error(LOCKED_MESSAGE, { id: 'login-account-locked' });
      return;
    }
    const notice = getRedirectNotice(searchParams);
    if (notice) {
      toast[notice.type](notice.message, { id: `login-${searchParams.toString()}` });
    }
  }, [accountLockedOnStart, searchParams]);

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
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotVerified(false);
    setCanResend(false);

    const newErrors = validate();
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) {
      focusFirstInvalidField(LOGIN_FIELDS, newErrors);
      return;
    }

    setSubmitting(true);
    const result = await login({ email: values.email.trim(), password: values.password });
    setSubmitting(false);

    // login() đã lưu user vào AuthContext, GuestRoute sẽ tự chuyển tới trang theo role
    if (result.success) {
      navigate(getPathAfterLogin(location, searchParams), { replace: true });
      return;
    }

    const error = result.error;
    // 403 có 2 trường hợp: chưa kích hoạt email, hoặc tài khoản bị khóa (Suspended / Banned, UC37)
    if (error?.status === 403 && (error.rawMessage || error.message) === 'Account not verified') {
      setNotVerified(true);
      toast.error('Tài khoản của bạn chưa được xác minh. Vui lòng kiểm tra email hoặc gửi lại email xác minh bên dưới.');
      return;
    }
    if (error?.status === 403) {
      toast.error(LOCKED_MESSAGE);
      return;
    }
    if (error?.status === 422 && error?.errors) {
      setErrors(toFieldErrors(error.errors));
      return;
    }
    toast.error(error?.message || 'Đăng nhập không thành công');
  };

  const showResend = notVerified || canResend;

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="login-form">
        <h1 className="auth-title">Chào mừng bạn trở lại <span aria-hidden="true">👋</span></h1>
        <p className="auth-subtitle">Đăng nhập để tiếp tục sử dụng TuConnector.</p>

        <GoogleButton href={getGoogleLoginUrl()} />

        <p className="auth-divider"><span>hoặc đăng nhập bằng email</span></p>

        <FormInput
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="ban@example.com"
          autoComplete="email"
          disabled={submitting}
        />
        <PasswordInput
          id="password"
          label="Mật khẩu"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="login-options">
          <Link to="/forgot-password" className="link">Quên mật khẩu?</Link>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        {showResend && <ResendVerificationButton email={values.email} />}

        <p className="auth-footer-text">
          Bạn chưa có tài khoản? <Link to="/register" className="link">Đăng ký</Link>
        </p>

      </form>
    </AuthLayout>
  );
}
