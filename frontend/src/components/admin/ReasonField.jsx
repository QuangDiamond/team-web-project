import FormTextarea from '../common/FormTextarea';
import { REASON_MAX_LENGTH } from '../../utils/pricingValidators';

// Ô "Reason" bắt buộc cho mọi thao tác của Admin (BR-16: ghi vào audit log)
export default function ReasonField({ value, onChange, error, disabled, placeholder = 'Explain why you are making this change' }) {
  return (
    <FormTextarea
      id="reason"
      label="Reason for this change"
      value={value}
      onChange={onChange}
      error={error}
      hint="Required. Saved to the admin audit log."
      placeholder={placeholder}
      maxLength={REASON_MAX_LENGTH}
      disabled={disabled}
    />
  );
}
