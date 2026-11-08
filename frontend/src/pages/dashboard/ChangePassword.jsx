import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import PasswordInput from '../../components/common/PasswordInput';
import Alert from '../../components/common/Alert';
import NewPasswordFields from '../../components/auth/NewPasswordFields';
import { validateNewPassword } from '../../utils/passwordValidators';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import '../../styles/changePassword.css';
import '../../styles/register.css';

const EMPTY_VALUES = { current_password: '', new_password: '', confirm_password: '' };

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const hasPassword = user.has_password !== false;
  const title = hasPassword ? 'Change password' : 'Set password';
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateNewPassword(values);
    if (hasPassword && !values.current_password) nextErrors.current_password = 'Current password is required';
    if (hasPassword && values.current_password === values.new_password) nextErrors.new_password = 'New password must be different from your current password';
    setErrors(nextErrors);
    setFormError('');
    setNotice('');
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstInvalidField(['current_password', 'new_password', 'confirm_password'], nextErrors);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { new_password: values.new_password, confirm_password: values.confirm_password };
      if (hasPassword) payload.current_password = values.current_password;
      await changePassword(payload);
      setNotice(hasPassword ? 'Password changed successfully. Your other sessions have been signed out.' : 'Password set successfully. You can now sign in with email and password.');
      setValues(EMPTY_VALUES);
    } catch (error) {
      const fieldErrors = toFieldErrors(error.errors);
      setErrors(fieldErrors);
      setFormError(error.message);
      focusFirstInvalidField(['current_password', 'new_password', 'confirm_password'], fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="change-password-page">
      <PageHeader eyebrow="ACCOUNT · SECURITY" title={title} description="Keep your TuConnector account secure." />
      <SectionCard title={title}>
        {!hasPassword && <Alert type="info">Your account uses Google sign-in. Set a password to also sign in with your email.</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}
        {formError && <Alert type="error">{formError}</Alert>}
        <form onSubmit={handleSubmit} noValidate>
          {hasPassword && <PasswordInput id="current_password" label="Current password" required autoComplete="current-password"
            value={values.current_password} onChange={handleChange} error={errors.current_password} disabled={submitting} />}
          <NewPasswordFields values={values} errors={errors} onChange={handleChange} disabled={submitting} />
          <p className="form-field-hint">Other sessions will be signed out. You will stay signed in on this browser.</p>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : title}</button>
        </form>
      </SectionCard>
    </div>
  );
}
