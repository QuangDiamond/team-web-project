import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Alert from '../../components/common/Alert';
import FormInput from '../../components/common/FormInput';
import { forgotPassword } from '../../services/authService';
import { validateEmail, toFieldErrors, focusFirstInvalidField } from '../../utils/authValidators';
import '../../styles/passwordRecovery.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
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
    setFormError('');
    if (error) {
      focusFirstInvalidField(['email'], { email: error });
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
      setSecondsLeft(60);
    } catch (error) {
      setEmailError(toFieldErrors(error.errors).email || '');
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = sent ? 'Resend reset link' : 'Send reset link';
  if (submitting) submitLabel = 'Sending...';
  else if (secondsLeft > 0) submitLabel = `Resend in ${secondsLeft}s`;

  return (
    <AuthLayout>
      <div className="password-recovery">
        <span className="password-recovery-icon" aria-hidden="true"><Mail size={26} /></span>
        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-subtitle">Enter your account email. We will send a secure link to reset your password.</p>
        {sent && <Alert type="success">If the email exists and is eligible, a reset link will be sent. Check your inbox and spam folder. The link expires in 15 minutes.</Alert>}
        {formError && <Alert type="error">{formError}</Alert>}
        <form onSubmit={handleSubmit} noValidate>
          <FormInput id="email" label="Email address" type="email" autoComplete="email" required
            value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
            error={emailError} disabled={submitting} />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || secondsLeft > 0}>{submitLabel}</button>
        </form>
        <Link to="/login" className="link">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
