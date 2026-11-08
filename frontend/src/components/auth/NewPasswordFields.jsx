import PasswordInput from '../common/PasswordInput';
import PasswordStrengthMeter from '../register/PasswordStrengthMeter';

export default function NewPasswordFields({ values, errors, onChange, disabled }) {
  return (
    <>
      <PasswordInput id="new_password" label="New password" required autoComplete="new-password"
        value={values.new_password} onChange={onChange} error={errors.new_password} disabled={disabled} />
      <PasswordStrengthMeter password={values.new_password} />
      <p className="form-field-hint">8–64 characters, with an uppercase letter, a lowercase letter and a number.</p>
      <PasswordInput id="confirm_password" label="Confirm new password" required autoComplete="new-password"
        value={values.confirm_password} onChange={onChange} error={errors.confirm_password} disabled={disabled} />
    </>
  );
}
