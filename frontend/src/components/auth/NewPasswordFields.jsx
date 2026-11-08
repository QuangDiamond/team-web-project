import PasswordInput from '../common/PasswordInput';
import PasswordStrengthMeter from '../register/PasswordStrengthMeter';

export default function NewPasswordFields({ values, errors, onChange, disabled }) {
  return (
    <>
      <PasswordInput id="new_password" label="Mật khẩu mới" required autoComplete="new-password"
        value={values.new_password} onChange={onChange} error={errors.new_password} disabled={disabled} />
      <PasswordStrengthMeter password={values.new_password} />
      <p className="form-field-hint">Từ 8–64 ký tự, có ít nhất một chữ hoa, một chữ thường và một chữ số.</p>
      <PasswordInput id="confirm_password" label="Xác nhận mật khẩu mới" required autoComplete="new-password"
        value={values.confirm_password} onChange={onChange} error={errors.confirm_password} disabled={disabled} />
    </>
  );
}
