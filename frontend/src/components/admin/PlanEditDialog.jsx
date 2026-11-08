import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import ToggleSwitch from '../common/ToggleSwitch';
import Alert from '../common/Alert';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { createPlan, updatePlan } from '../../services/adminService';
import { toNumber } from '../../utils/formatCurrency';
import { PACK_ROLE_OPTIONS, getPlanTitle, getTargetRoleLabel } from '../../utils/planDisplay';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import {
  hasErrors,
  validateAiQuota,
  validateClassLimit,
  validatePlanCredits,
  validatePlanPrice,
  validateReason,
} from '../../utils/pricingValidators';

const PLAN_FIELDS = ['name', 'target_role', 'monthly_price', 'monthly_credits', 'ai_quota', 'max_classrooms', 'is_active', 'reason'];

// Gói Free luôn có giá 0 (backend trả 422 nếu khác 0) nên khóa ô giá
const FREE_PLAN_NAME = 'FREE_DEFAULT';

// Giá trị ban đầu của form lấy từ plan (ô nhập luôn giữ chuỗi).
// max_classrooms = null nghĩa là không giới hạn số lớp
const getInitialValues = (plan) => {
  if (!plan) {
    return {
      name: '', target_role: 'TUTOR', monthly_price: '', monthly_credits: '', ai_quota: '0',
      max_classrooms: '', unlimited_classes: true, sms_reminders_enabled: false,
      is_active: true, reason: '',
    };
  }
  let classLimit = '';
  let unlimitedClasses = true;
  if (plan.max_classrooms !== null && plan.max_classrooms !== undefined) {
    classLimit = String(plan.max_classrooms);
    unlimitedClasses = false;
  }
  return {
    monthly_price: String(toNumber(plan.monthly_price)),
    monthly_credits: String(plan.monthly_credits),
    ai_quota: String(plan.ai_quota),
    max_classrooms: classLimit,
    unlimited_classes: unlimitedClasses,
    sms_reminders_enabled: Boolean(plan.sms_reminders_enabled),
    is_active: Boolean(plan.is_active),
    reason: '',
  };
};

const validatePlanForm = (values) => {
  return {
    monthly_price: validatePlanPrice(values.monthly_price),
    monthly_credits: validatePlanCredits(values.monthly_credits),
    ai_quota: validateAiQuota(values.ai_quota),
    max_classrooms: validateClassLimit(values.max_classrooms, values.unlimited_classes),
    reason: validateReason(values.reason),
  };
};

const toClassLimitPayload = (values) => {
  if (values.unlimited_classes) {
    return null;
  }
  return Number(values.max_classrooms.trim());
};

// Hộp thoại sửa plan: giá, credit/tháng, AI quota, giới hạn lớp, SMS reminder + lý do (UC39)
export default function PlanEditDialog({ plan, onClose, onSaved }) {
  const isCreating = !plan;
  const [values, setValues] = useState(() => getInitialValues(plan));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const planLabel = plan ? `gói ${getPlanTitle(plan.name)} dành cho ${getTargetRoleLabel(plan.target_role)}` : '';
  const isFreePlan = plan?.name === FREE_PLAN_NAME;

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSmsChange = (checked) => {
    setValues({ ...values, sms_reminders_enabled: checked });
  };

  const handleUnlimitedChange = (event) => {
    setValues({ ...values, unlimited_classes: event.target.checked });
    if (errors.max_classrooms) {
      setErrors({ ...errors, max_classrooms: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const newErrors = validatePlanForm(values);
    if (isCreating) {
      const name = values.name.trim();
      if (!name || name.length > 100) {
        newErrors.name = 'Tên gói dịch vụ phải có từ 1 đến 100 ký tự';
      }
      if (name === FREE_PLAN_NAME && Number(values.monthly_price) !== 0) {
        newErrors.monthly_price = 'Giá gói Miễn phí phải bằng 0';
      }
    }
    setErrors(newErrors);
    if (hasErrors(newErrors)) {
      focusFirstInvalidField(PLAN_FIELDS, newErrors);
      return;
    }

    const payload = {
      monthly_price: Number(values.monthly_price),
      monthly_credits: Number(values.monthly_credits),
      ai_quota: Number(values.ai_quota),
      max_classrooms: toClassLimitPayload(values),
      sms_reminders_enabled: values.sms_reminders_enabled,
      is_active: values.is_active,
      reason: values.reason.trim(),
    };

    setSubmitting(true);
    try {
      if (isCreating) {
        await createPlan({ ...payload, name: values.name.trim(), target_role: values.target_role });
        onSaved(`Gói dịch vụ "${values.name.trim()}" đã được thêm.`);
      } else {
        await updatePlan(plan._id, payload);
        onSaved(`Đã cập nhật ${planLabel}.`);
      }
    } catch (error) {
      const fieldErrors = toFieldErrors(error.errors);
      setErrors(fieldErrors);
      setFormError(error.message);
      focusFirstInvalidField(PLAN_FIELDS, fieldErrors);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      id="plan-edit"
      title={isCreating ? 'Thêm gói dịch vụ' : `Sửa ${planLabel}`}
      description="Gói ngừng cung cấp sẽ không hiển thị khi thanh toán. Các đăng ký hiện có vẫn được giữ nguyên."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}

        <div className="form-grid">
          {isCreating && (
            <>
              <FormInput id="name" label="Tên gói dịch vụ" value={values.name} onChange={handleChange}
                error={errors.name} disabled={submitting} />
              <FormSelect id="target_role" label="Dành cho" value={values.target_role}
                onChange={handleChange} options={PACK_ROLE_OPTIONS} error={errors.target_role} disabled={submitting} />
            </>
          )}
          <FormInput
            id="monthly_price"
            label="Giá mỗi tháng (VND)"
            type="number"
            value={values.monthly_price}
            onChange={handleChange}
            error={errors.monthly_price}
            disabled={submitting || isFreePlan}
            endAdornment={<span className="form-control-suffix" aria-hidden="true">₫</span>}
            belowControl={isFreePlan && <p className="form-field-hint">Gói Miễn phí luôn có giá 0 ₫.</p>}
          />
          <FormInput
            id="monthly_credits"
            label="Tín dụng mỗi tháng"
            type="number"
            value={values.monthly_credits}
            onChange={handleChange}
            error={errors.monthly_credits}
            disabled={submitting}
          />
          <FormInput
            id="ai_quota"
            label="Lượt dùng AI mỗi tháng"
            type="number"
            value={values.ai_quota}
            onChange={handleChange}
            error={errors.ai_quota}
            disabled={submitting}
          />
          <FormInput
            id="max_classrooms"
            label="Giới hạn số lớp"
            type="number"
            value={values.max_classrooms}
            onChange={handleChange}
            error={errors.max_classrooms}
            placeholder="Không giới hạn"
            disabled={submitting || values.unlimited_classes}
            belowControl={(
              <label className="checkbox form-inline-checkbox">
                <input
                  id="unlimited_classes"
                  type="checkbox"
                  checked={values.unlimited_classes}
                  onChange={handleUnlimitedChange}
                  disabled={submitting}
                />
                <span>Không giới hạn số lớp</span>
              </label>
            )}
          />
        </div>

        <ToggleSwitch
          id="sms_reminders_enabled"
          label="Nhắc lịch qua SMS"
          description="Gửi nhắc lịch học qua SMS bên cạnh thư điện tử."
          checked={values.sms_reminders_enabled}
          onChange={handleSmsChange}
          disabled={submitting}
        />

        <ToggleSwitch
          id="is_active"
          label="Đang cung cấp"
          description="Cho phép người dùng thuộc vai trò đã chọn mua gói dịch vụ này."
          checked={values.is_active}
          onChange={(checked) => setValues({ ...values, is_active: checked })}
          disabled={submitting}
        />
        {errors.is_active && <Alert type="error">{errors.is_active}</Alert>}

        <ReasonField value={values.reason} onChange={handleChange} error={errors.reason} disabled={submitting} />

        <DialogActions submitLabel={isCreating ? 'Thêm gói dịch vụ' : 'Lưu thay đổi'} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  );
}
