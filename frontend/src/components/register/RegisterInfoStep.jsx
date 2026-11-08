import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import FormInput from '../common/FormInput';
import PasswordInput from '../common/PasswordInput';
import GoogleButton from '../common/GoogleButton';
import PasswordStrengthMeter from './PasswordStrengthMeter';

// Bước 1 "Your Info" của đăng ký thường
export default function RegisterInfoStep({ values, errors, onChange, onBlur, onNext, googleHref }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onNext();
  };

  const handleChange = (event) => {
    onChange(event.target.name, event.target.value);
  };

  const handleBlur = (event) => {
    onBlur(event.target.name);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="auth-title">Tạo tài khoản <span aria-hidden="true">🚀</span></h1>
      <p className="auth-subtitle">Miễn phí — không cần thẻ tín dụng.</p>

      <GoogleButton href={googleHref} label="Google" />

      <p className="auth-divider"><span>hoặc điền thông tin của bạn</span></p>

      <FormInput
        id="full_name"
        label="Họ và tên"
        value={values.full_name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.full_name}
        placeholder="Nguyễn Văn An"
        autoComplete="name"
      />
      <FormInput
        id="email"
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        placeholder="ban@example.com"
        autoComplete="email"
      />
      <PasswordInput
        id="password"
        label="Mật khẩu"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        placeholder="Ít nhất 8 ký tự"
        autoComplete="new-password"
        belowControl={<PasswordStrengthMeter password={values.password} />}
      />
      <PasswordInput
        id="confirm_password"
        label="Xác nhận mật khẩu"
        value={values.confirm_password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.confirm_password}
        placeholder="Nhập lại mật khẩu"
        autoComplete="new-password"
      />

      <button type="submit" className="btn btn-primary btn-block">
        <span>Tiếp tục</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      <p className="auth-footer-text">
        Bạn đã có tài khoản? <Link to="/login" className="link">Đăng nhập</Link>
      </p>
    </form>
  );
}
