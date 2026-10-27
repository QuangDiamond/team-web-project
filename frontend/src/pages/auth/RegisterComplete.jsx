import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleLoginUrl } from '../../services/authService';
import AuthLayout from '../../components/layout/AuthLayout';
import RegisterStepper from '../../components/common/RegisterStepper';
import RegisterConfirmStep from '../../components/common/RegisterConfirmStep';
import GoogleButton from '../../components/common/GoogleButton';
import Alert from '../../components/common/Alert';
import { validateRole, validateAgreeTerms, toFieldErrors } from '../../utils/authValidators';
import { decodeTicket } from '../../utils/decodeTicket';
import '../../styles/register.css';

// Đăng ký bước 2 cho user đăng nhập Google lần đầu (backend redirect về đây kèm ?ticket=)
export default function RegisterComplete() {
  const { completeGoogleRegister } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ticket = searchParams.get('ticket');
  const [googleProfile] = useState(() => decodeTicket(ticket));

  const [role, setRole] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [ticketExpired, setTicketExpired] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrors({ ...errors, role: '' });
  };

  const handleAgreeTermsChange = (checked) => {
    setAgreeTerms(checked);
    setErrors({ ...errors, agree_terms: '' });
  };

  const handleSubmit = async () => {
    setFormError('');

    const newErrors = {
      role: validateRole(role),
      agree_terms: validateAgreeTerms(agreeTerms),
    };
    setErrors(newErrors);
    if (newErrors.role || newErrors.agree_terms) {
      return;
    }

    setSubmitting(true);
    const result = await completeGoogleRegister({
      ticket: ticket,
      full_name: googleProfile.full_name,
      role: role,
      agree_terms: agreeTerms,
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/');
      return;
    }

    const error = result.error;
    if (error.status === 401) {
      setTicketExpired(true);
      return;
    }
    if (error.status === 409) {
      setEmailTaken(true);
      return;
    }
    if (error.status === 422 && error.errors) {
      setErrors(toFieldErrors(error.errors));
    }
    setFormError(error.message);
  };

  // Ticket hỏng / hết hạn: phải đăng nhập Google lại để lấy ticket mới
  if (!googleProfile || ticketExpired) {
    return (
      <AuthLayout activeStep={2}>
        <h1 className="auth-title">Session expired</h1>
        <p className="auth-subtitle">Your Google sign-up session is invalid or has expired. Please continue with Google again.</p>
        <GoogleButton href={getGoogleLoginUrl()} />
        <p className="auth-footer-text">
          Or <Link to="/register" className="link">sign up with email</Link>
        </p>
      </AuthLayout>
    );
  }

  let alert = null;
  if (emailTaken) {
    alert = (
      <Alert type="error">
        This email is already registered. <Link to="/login" className="link">Login</Link>
      </Alert>
    );
  } else if (formError) {
    alert = <Alert type="error">{formError}</Alert>;
  }

  return (
    <AuthLayout activeStep={2}>
      <RegisterStepper currentStep={2} />
      <RegisterConfirmStep
        fullName={googleProfile.full_name}
        email={googleProfile.google_email}
        role={role}
        onRoleChange={handleRoleChange}
        agreeTerms={agreeTerms}
        onAgreeTermsChange={handleAgreeTermsChange}
        errors={errors}
        submitting={submitting}
        onSubmit={handleSubmit}
        alert={alert}
      />
    </AuthLayout>
  );
}
