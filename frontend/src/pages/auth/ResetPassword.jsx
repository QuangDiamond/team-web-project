import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';
import Alert from '../../components/common/Alert';
import NewPasswordFields from '../../components/auth/NewPasswordFields';
import { validateNewPassword } from '../../utils/passwordValidators';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import '../../styles/passwordRecovery.css';
import '../../styles/register.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ new_password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invalidLink, setInvalidLink] = useState(!/^[a-f\d]{64}$/i.test(token));

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateNewPassword(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstInvalidField(['new_password', 'confirm_password'], nextErrors);
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await resetPassword({ token, ...values });
      navigate('/login?password=reset', { replace: true });
    } catch (error) {
      setErrors(toFieldErrors(error.errors));
      if ([404, 410].includes(error.status) || error.errors?.token) setInvalidLink(true);
      focusFirstInvalidField(['new_password', 'confirm_password'], toFieldErrors(error.errors));
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="password-recovery">
        <span className="password-recovery-icon" aria-hidden="true"><LockKeyhole size={26} /></span>
        <h1 className="auth-title">Create a new password</h1>
        <p className="auth-subtitle">Choose a new password. You will need to sign in again after resetting it.</p>
        {formError && <Alert type="error">{formError}</Alert>}
        {invalidLink ? <Alert type="error">This reset link is invalid or expired. <Link to="/forgot-password" className="link">Request a new reset link</Link>.</Alert> : (
          <form onSubmit={handleSubmit} noValidate>
            <NewPasswordFields values={values} errors={errors} onChange={handleChange} disabled={submitting} />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset password'}</button>
          </form>
        )}
        <Link to="/forgot-password" className="link">Request another reset link</Link>
      </div>
    </AuthLayout>
  );
}
