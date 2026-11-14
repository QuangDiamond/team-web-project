import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormInput from '../../components/common/FormInput';
import { forgotPassword } from '../../services/authService';
import { validateEmail, toFieldErrors, focusFirstInvalidField } from '../../utils/authValidators';
import '../../styles/passwordRecovery.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || secondsLeft > 0) return;
    const error = validateEmail(email);
    setEmailError(error);

    if (error) {
      focusFirstInvalidField(['email'], { email: error });
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
      toast.success('Nếu email đã được đăng ký và tài khoản đủ điều kiện, bạn sẽ nhận được liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến và thư rác. Liên kết có hiệu lực trong 15 phút.');
      setSecondsLeft(60);
    } catch (error) {
      setEmailError(toFieldErrors(error.errors).email || '');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = sent ? 'Gửi lại liên kết đặt lại mật khẩu' : 'Gửi liên kết đặt lại mật khẩu';
  if (submitting) submitLabel = 'Đang gửi...';
  else if (secondsLeft > 0) submitLabel = `Gửi lại sau ${secondsLeft} giây`;

  return (
    <AuthLayout>
      <div className="password-recovery">
        <span className="password-recovery-icon" aria-hidden="true"><Mail size={26} /></span>
        <h1 className="auth-title">Bạn quên mật khẩu?</h1>
        <p className="auth-subtitle">Nhập email của tài khoản để nhận liên kết đặt lại mật khẩu an toàn.</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormInput id="email" label="Địa chỉ email" type="email" autoComplete="email" required
            value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
            error={emailError} disabled={submitting} />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || secondsLeft > 0}>{submitLabel}</button>
        </form>
        <Link to="/login" className="link">Quay lại đăng nhập</Link>
      </div>
    </AuthLayout>
  );
}
