import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import ToggleSwitch from '../common/ToggleSwitch';
import Alert from '../common/Alert';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { updatePlan } from '../../services/adminService';
import { toNumber } from '../../utils/formatCurrency';
import { getPlanTitle, getTargetRoleLabel } from '../../utils/planDisplay';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import {
  hasErrors,
  validateAiQuota,
  validateClassLimit,
  validatePlanCredits,
  validatePlanPrice,
  validateReason,
} from '../../utils/pricingValidators';

const PLAN_FIELDS = ['monthly_price', 'monthly_credits', 'ai_quota', 'max_classrooms', 'reason'];

// Gói Free luôn có giá 0 (backend trả 422 nếu khác 0) nên khóa ô giá
const FREE_PLAN_NAME = 'FREE_DEFAULT';

// Giá trị ban đầu của form lấy từ plan (ô nhập luôn giữ chuỗi).
// max_classrooms = null nghĩa là không giới hạn số lớp
const getInitialValues = (plan) => {
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
  const [values, setValues] = useState(() => getInitialValues(plan));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const planLabel = `${getTargetRoleLabel(plan.target_role)} ${getPlanTitle(plan.name)}`;
  const isFreePlan = plan.name === FREE_PLAN_NAME;

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
      reason: values.reason.trim(),
    };

    setSubmitting(true);
    try {
      await updatePlan(plan._id, payload);
      onSaved(`${planLabel} plan was updated.`);
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
      title={`Edit ${planLabel} plan`}
      description="New values apply to new purchases and the next monthly credit grant."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}

        <div className="form-grid">
          <FormInput
            id="monthly_price"
            label="Monthly price (VND)"
            type="number"
            value={values.monthly_price}
            onChange={handleChange}
            error={errors.monthly_price}
            disabled={submitting || isFreePlan}
            endAdornment={<span className="form-control-suffix" aria-hidden="true">₫</span>}
            belowControl={isFreePlan && <p className="form-field-hint">The Free plan is always 0 ₫.</p>}
          />
          <FormInput
            id="monthly_credits"
            label="Credits per month"
            type="number"
            value={values.monthly_credits}
            onChange={handleChange}
            error={errors.monthly_credits}
            disabled={submitting}
          />
          <FormInput
            id="ai_quota"
            label="AI quota per month"
            type="number"
            value={values.ai_quota}
            onChange={handleChange}
            error={errors.ai_quota}
            disabled={submitting}
          />
          <FormInput
            id="max_classrooms"
            label="Class limit"
            type="number"
            value={values.max_classrooms}
            onChange={handleChange}
            error={errors.max_classrooms}
            placeholder="Unlimited"
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
                <span>Unlimited classes</span>
              </label>
            )}
          />
        </div>

        <ToggleSwitch
          id="sms_reminders_enabled"
          label="SMS reminders"
          description="Send session reminders by SMS in addition to email."
          checked={values.sms_reminders_enabled}
          onChange={handleSmsChange}
          disabled={submitting}
        />

        <ReasonField value={values.reason} onChange={handleChange} error={errors.reason} disabled={submitting} />

        <DialogActions submitLabel="Save changes" submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  );
}
