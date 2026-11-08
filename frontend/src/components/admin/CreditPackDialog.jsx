import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Alert from '../common/Alert';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { createCreditPack, updateCreditPack } from '../../services/adminService';
import { toNumber } from '../../utils/formatCurrency';
import { PACK_ROLE_OPTIONS, getTargetRoleLabel } from '../../utils/planDisplay';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import {
  PACK_NAME_MAX_LENGTH,
  hasErrors,
  validatePackCredits,
  validatePackName,
  validatePackPrice,
  validateReason,
} from '../../utils/pricingValidators';

const PACK_FIELDS = ['target_role', 'name', 'credit_amount', 'price', 'reason'];

const getInitialValues = (pack) => {
  if (!pack) {
    return { target_role: 'TUTOR', name: '', credit_amount: '', price: '', reason: '' };
  }
  return {
    target_role: pack.target_role,
    name: pack.name,
    credit_amount: String(pack.credit_amount),
    price: String(toNumber(pack.price)),
    reason: '',
  };
};

const validatePackForm = (values) => {
  return {
    name: validatePackName(values.name),
    credit_amount: validatePackCredits(values.credit_amount),
    price: validatePackPrice(values.price),
    reason: validateReason(values.reason),
  };
};

// Chọn role cho gói mới (chỉ khi tạo; API sửa gói không cho đổi role)
function TargetRoleField({ value, onChange, error, disabled }) {
  const errorId = 'target_role-error';
  let describedBy;
  if (error) {
    describedBy = errorId;
  }

  return (
    <fieldset className="form-field segmented-field" aria-describedby={describedBy}>
      <legend className="form-label">Dành cho</legend>
      <div className="segmented">
        {PACK_ROLE_OPTIONS.map((option, index) => {
          let optionId;
          if (index === 0) {
            // Để focusFirstInvalidField tìm được ô này khi lỗi
            optionId = 'target_role';
          }
          return (
            <label key={option.value} className="segmented-option">
              <input
                id={optionId}
                type="radio"
                name="target_role"
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                disabled={disabled}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p id={errorId} className="form-error">{error}</p>}
    </fieldset>
  );
}

// Hộp thoại thêm mới (pack = null) hoặc sửa credit pack: tên, số credit, giá + lý do (UC39)
export default function CreditPackDialog({ pack, onClose, onSaved }) {
  const isCreating = !pack;
  const [values, setValues] = useState(() => getInitialValues(pack));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const saveToServer = async () => {
    const payload = {
      name: values.name.trim(),
      credit_amount: Number(values.credit_amount),
      price: Number(values.price),
      reason: values.reason.trim(),
    };
    if (isCreating) {
      payload.target_role = values.target_role;
      await createCreditPack(payload);
      return `Gói tín dụng "${payload.name}" đã được thêm.`;
    }
    await updateCreditPack(pack._id, payload);
    return `Gói tín dụng "${payload.name}" đã được cập nhật.`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const newErrors = validatePackForm(values);
    setErrors(newErrors);
    if (hasErrors(newErrors)) {
      focusFirstInvalidField(PACK_FIELDS, newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const successMessage = await saveToServer();
      onSaved(successMessage);
    } catch (error) {
      const fieldErrors = toFieldErrors(error.errors);
      setErrors(fieldErrors);
      setFormError(error.message);
      focusFirstInvalidField(PACK_FIELDS, fieldErrors);
      setSubmitting(false);
    }
  };

  let title = 'Sửa gói tín dụng';
  let description = `Dành cho: ${getTargetRoleLabel(values.target_role)}. Các thay đổi chỉ áp dụng cho lượt mua mới.`;
  let submitLabel = 'Lưu thay đổi';
  if (isCreating) {
    title = 'Thêm gói tín dụng';
    description = 'Gói mới sẽ hiển thị ngay cho người dùng thuộc vai trò đã chọn.';
    submitLabel = 'Thêm gói tín dụng';
  }

  return (
    <Modal id="credit-pack" title={title} description={description} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}

        {isCreating && (
          <TargetRoleField
            value={values.target_role}
            onChange={handleChange}
            error={errors.target_role}
            disabled={submitting}
          />
        )}

        <FormInput
          id="name"
          label="Tên gói tín dụng"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Ví dụ: 30 tín dụng"
          disabled={submitting}
          belowControl={<p className="form-field-hint">Tối đa {PACK_NAME_MAX_LENGTH} ký tự.</p>}
        />

        <div className="form-grid">
          <FormInput
            id="credit_amount"
            label="Tín dụng"
            type="number"
            value={values.credit_amount}
            onChange={handleChange}
            error={errors.credit_amount}
            disabled={submitting}
          />
          <FormInput
            id="price"
            label="Giá (VND)"
            type="number"
            value={values.price}
            onChange={handleChange}
            error={errors.price}
            disabled={submitting}
            endAdornment={<span className="form-control-suffix" aria-hidden="true">₫</span>}
          />
        </div>

        <ReasonField value={values.reason} onChange={handleChange} error={errors.reason} disabled={submitting} />

        <DialogActions submitLabel={submitLabel} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  );
}
