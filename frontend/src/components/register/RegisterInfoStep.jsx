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
      <h1 className="auth-title">Create your account <span aria-hidden="true">🚀</span></h1>
      <p className="auth-subtitle">Free — no credit card required.</p>

      <GoogleButton href={googleHref} label="Google" />

      <p className="auth-divider"><span>or fill in your details</span></p>

      <FormInput
        id="full_name"
        label="Full Name"
        value={values.full_name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.full_name}
        placeholder="John Smith"
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
        placeholder="you@example.com"
        autoComplete="email"
      />
      <PasswordInput
        id="password"
        label="Password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        belowControl={<PasswordStrengthMeter password={values.password} />}
      />
      <PasswordInput
        id="confirm_password"
        label="Confirm Password"
        value={values.confirm_password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.confirm_password}
        placeholder="Re-enter your password"
        autoComplete="new-password"
      />

      <button type="submit" className="btn btn-primary btn-block">
        <span>Next</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      <p className="auth-footer-text">
        Already have an account? <Link to="/login" className="link">Sign in</Link>
      </p>
    </form>
  );
}
