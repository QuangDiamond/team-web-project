import { toast } from 'sonner';
import { useState } from 'react';
import { Copy, TriangleAlert } from 'lucide-react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { createAdmin } from '../../services/adminService';
import { focusFirstInvalidField, toFieldErrors, validateEmail } from '../../utils/authValidators';
import { validateReason } from '../../utils/pricingValidators';

const ADMIN_FIELDS = ['full_name', 'email', 'reason'];
const FULL_NAME_MAX_LENGTH = 100;

const validateAdminForm = (values) => {
  let fullNameError = '';
  const fullName = values.full_name.trim();
  if (fullName.length === 0) {
    fullNameError = 'Vui lòng nhập họ tên';
  } else if (fullName.length > FULL_NAME_MAX_LENGTH) {
    fullNameError = `Họ tên không được vượt quá ${FULL_NAME_MAX_LENGTH} ký tự`;
  }
  return {
    full_name: fullNameError,
    email: validateEmail(values.email),
    reason: validateReason(values.reason),
  };
};

const hasErrors = (errors) => Object.values(errors).some((message) => Boolean(message));

// Bước 2: hiện mật khẩu tạm đúng 1 lần (D20) kèm nút sao chép
function TemporaryPasswordView({ temporaryPassword, onDone }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      toast.success('Đã sao chép', { description: 'Đã sao chép mật khẩu vào bộ nhớ tạm' });
    } catch {
      toast.error('Không thể sao chép tự động. Vui lòng chọn mật khẩu và sao chép thủ công.');
    }
  };

  return (
    <div>
      <label htmlFor="temporary-password" className="form-label">Mật khẩu tạm thời</label>
      <div className="temp-password">
        <input id="temporary-password" className="temp-password-value" value={temporaryPassword} readOnly onFocus={(event) => event.target.select()} />
        <button type="button" className="btn btn-outline btn-sm" onClick={handleCopy}>
          <Copy size={16} aria-hidden="true" />
          <span>Sao chép</span>
        </button>
      </div>

      <p className="temp-password-warning">
        <TriangleAlert size={16} aria-hidden="true" />
        <span>Mật khẩu này chỉ hiển thị một lần và đã được gửi qua thư điện tử cho quản trị viên mới. Hãy yêu cầu họ đăng nhập và đổi mật khẩu.</span>
      </p>

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onDone}>Hoàn tất</button>
      </div>
    </div>
  );
}

// UC37 A1: Admin tạo tài khoản Admin khác với mật khẩu tạm (họ tên + email + lý do)
export default function CreateAdminDialog({ onClose, onCreated }) {
  const [values, setValues] = useState({ full_name: '', email: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // { user, temporary_password } sau khi tạo thành công
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newErrors = validateAdminForm(values);
    setErrors(newErrors);
    if (hasErrors(newErrors)) {
      focusFirstInvalidField(ADMIN_FIELDS, newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await createAdmin({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        reason: values.reason.trim(),
      });
      setResult(response.data);
      toast.success(`Đã tạo tài khoản quản trị viên cho ${response.data.user.full_name} (${response.data.user.email}).`);
      setSubmitting(false);
    } catch (error) {
      let fieldErrors = toFieldErrors(error.errors);
      // 409: email đã có tài khoản
      if (error.status === 409) {
        fieldErrors = { ...fieldErrors, email: error.message };
      }
      setErrors(fieldErrors);
      if (error.status !== 409) {
        toast.error(error.message);
      }
      focusFirstInvalidField(ADMIN_FIELDS, fieldErrors);
      setSubmitting(false);
    }
  };

  // Đã tạo xong: đóng hộp thoại nào cũng phải tải lại danh sách
  const handleClose = () => {
    if (result) {
      onCreated(`Đã tạo tài khoản quản trị viên cho ${result.user.email} .`);
      return;
    }
    onClose();
  };

  if (result) {
    return (
      <Modal id="create-admin" title="Đã tạo tài khoản quản trị viên" description="Chia sẻ mật khẩu tạm thời cho quản trị viên mới qua kênh an toàn." onClose={handleClose}>
        <TemporaryPasswordView temporaryPassword={result.temporary_password} onDone={handleClose} />
      </Modal>
    );
  }

  return (
    <Modal id="create-admin" title="Tạo tài khoản quản trị viên" description="Mật khẩu tạm thời được tạo và chỉ hiển thị một lần sau khi tạo tài khoản." onClose={handleClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormInput
          id="full_name"
          label="Họ tên"
          value={values.full_name}
          onChange={handleChange}
          error={errors.full_name}
          autoComplete="off"
          disabled={submitting}
        />
        <FormInput
          id="email"
          label="Thư điện tử"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="off"
          disabled={submitting}
        />
        <ReasonField value={values.reason} onChange={handleChange} error={errors.reason} disabled={submitting} />
        <DialogActions submitLabel="Tạo tài khoản quản trị viên" submitting={submitting} onCancel={handleClose} />
      </form>
    </Modal>
  );
}
