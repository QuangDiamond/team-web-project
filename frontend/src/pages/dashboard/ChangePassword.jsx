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
  const title = hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu';
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
    if (hasPassword && !values.current_password) nextErrors.current_password = 'Vui lòng nhập mật khẩu hiện tại';
    if (hasPassword && values.current_password === values.new_password) nextErrors.new_password = 'Mật khẩu mới phải khác mật khẩu hiện tại';
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
      setNotice(hasPassword ? 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được đăng xuất.' : 'Đặt mật khẩu thành công. Giờ bạn có thể đăng nhập bằng email và mật khẩu.');
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
      <PageHeader eyebrow="TÀI KHOẢN · BẢO MẬT" title={title} description="Bảo vệ tài khoản TuConnector của bạn." />
      <SectionCard title={title}>
        {!hasPassword && <Alert type="info">Tài khoản của bạn đang đăng nhập bằng Google. Đặt mật khẩu để có thể đăng nhập thêm bằng email.</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}
        {formError && <Alert type="error">{formError}</Alert>}
        <form onSubmit={handleSubmit} noValidate>
          {hasPassword && <PasswordInput id="current_password" label="Mật khẩu hiện tại" required autoComplete="current-password"
            value={values.current_password} onChange={handleChange} error={errors.current_password} disabled={submitting} />}
          <NewPasswordFields values={values} errors={errors} onChange={handleChange} disabled={submitting} />
          <p className="form-field-hint">Các phiên đăng nhập khác sẽ được đăng xuất. Bạn vẫn đăng nhập trên trình duyệt này.</p>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : title}</button>
        </form>
      </SectionCard>
    </div>
  );
}
