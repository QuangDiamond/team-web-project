import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import * as authService from '../../services/authService';

const COOLDOWN_SECONDS = 60;

// Nút gửi lại email kích hoạt, khóa 60 giây sau mỗi lần gửi (giống giới hạn của backend)
export default function ResendVerificationButton({ email }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    setSending(true);
    setMessage('');
    try {
      await authService.resendVerification(email);
      setMessage('If your account is not verified yet, a new verification email has been sent.');
      setSecondsLeft(COOLDOWN_SECONDS);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  };

  const hasEmail = Boolean(email && email.trim());
  const disabled = !hasEmail || sending || secondsLeft > 0;

  let buttonText = 'Resend verification email';
  if (sending) {
    buttonText = 'Sending...';
  } else if (secondsLeft > 0) {
    buttonText = `Resend in ${secondsLeft}s`;
  }

  return (
    <div className="resend-verification">
      <button type="button" className="btn btn-outline btn-block" onClick={handleResend} disabled={disabled}>
        <MailCheck size={18} aria-hidden="true" />
        <span>{buttonText}</span>
      </button>
      {!hasEmail && <p className="form-hint">Enter your email above to resend the verification email.</p>}
      {message && <p className="form-hint" role="status">{message}</p>}
    </div>
  );
}
