import FormTextarea from '../common/FormTextarea';
import { REASON_MAX_LENGTH } from '../../utils/pricingValidators';

// Ô "Reason" bắt buộc cho mọi thao tác của Admin (BR-16: ghi vào audit log)
export default function ReasonField({ value, onChange, error, disabled, placeholder = 'Nêu lý do bạn thực hiện thay đổi này' }) {
  return (
    <FormTextarea
      id="reason"
      label="Lý do thay đổi"
      value={value}
      onChange={onChange}
      error={error}
      hint="Bắt buộc. Lý do sẽ được lưu vào nhật ký quản trị."
      placeholder={placeholder}
      maxLength={REASON_MAX_LENGTH}
      disabled={disabled}
    />
  );
}
