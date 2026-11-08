import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Alert from '../common/Alert';
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
    fullNameError = 'Full name is required';
  } else if (fullName.length > FULL_NAME_MAX_LENGTH) {
    fullNameError = `Full name must be at most ${FULL_NAME_MAX_LENGTH} characters`;
  }
  return {
    full_name: fullNameError,
    email: validateEmail(values.email),
    reason: validateReason(values.reason),
  };
};

const hasErrors = (errors) => Object.values(errors).some((message) => Boolean(message));

// Bước 2: hiện mật khẩu tạm đúng 1 lần (D20) kèm nút sao chép
function TemporaryPasswordView({ createdUser, temporaryPassword, onDone }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setCopyError('');
    } catch {
      setCopyError('Could not copy automatically. Please select the password and copy it manually.');
    }
  };

  return (
    <div>
      <Alert type="success">Admin account for {createdUser.full_name} ({createdUser.email}) was created.</Alert>

      <label htmlFor="temporary-password" className="form-label">Temporary password</label>
      <div className="temp-password">
        <input id="temporary-password" className="temp-password-value" value={temporaryPassword} readOnly onFocus={(event) => event.target.select()} />
        <button type="button" className="btn btn-outline btn-sm" onClick={handleCopy}>
          {copied && <Check size={16} aria-hidden="true" />}
          {!copied && <Copy size={16} aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <p className="visually-hidden" role="status">{copied ? 'Password copied to clipboard' : ''}</p>
      {copyError && <p className="form-error">{copyError}</p>}

      <p className="temp-password-warning">
        <TriangleAlert size={16} aria-hidden="true" />
        <span>This password will not be shown again. It was also emailed to the new admin. Ask them to sign in and change it.</span>
      </p>

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

// UC37 A1: Admin tạo tài khoản Admin khác với mật khẩu tạm (họ tên + email + lý do)
export default function CreateAdminDialog({ onClose, onCreated }) {
  const [values, setValues] = useState({ full_name: '', email: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
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
    setFormError('');

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
      setSubmitting(false);
    } catch (error) {
      let fieldErrors = toFieldErrors(error.errors);
      // 409: email đã có tài khoản
      if (error.status === 409) {
        fieldErrors = { ...fieldErrors, email: error.message };
      }
      setErrors(fieldErrors);
      if (error.status !== 409) {
        setFormError(error.message);
      }
      focusFirstInvalidField(ADMIN_FIELDS, fieldErrors);
      setSubmitting(false);
    }
  };

  // Đã tạo xong: đóng hộp thoại nào cũng phải tải lại danh sách
  const handleClose = () => {
    if (result) {
      onCreated(`Admin account for ${result.user.email} was created.`);
      return;
    }
    onClose();
  };

  if (result) {
    return (
      <Modal id="create-admin" title="Admin account created" description="Share the temporary password with the new admin securely." onClose={handleClose}>
        <TemporaryPasswordView createdUser={result.user} temporaryPassword={result.temporary_password} onDone={handleClose} />
      </Modal>
    );
  }

  return (
    <Modal id="create-admin" title="Create admin account" description="A temporary password is generated and shown once after the account is created." onClose={handleClose}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}
        <FormInput
          id="full_name"
          label="Full name"
          value={values.full_name}
          onChange={handleChange}
          error={errors.full_name}
          autoComplete="off"
          disabled={submitting}
        />
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="off"
          disabled={submitting}
        />
        <ReasonField value={values.reason} onChange={handleChange} error={errors.reason} disabled={submitting} />
        <DialogActions submitLabel="Create admin" submitting={submitting} onCancel={handleClose} />
      </form>
    </Modal>
  );
}
