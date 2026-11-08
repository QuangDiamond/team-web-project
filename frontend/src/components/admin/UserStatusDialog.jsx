import { useState } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { updateUserStatus } from '../../services/adminService';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import { validateReason } from '../../utils/pricingValidators';
import { STATUS_ACTIONS, getUserStatusOption } from '../../utils/userDisplay';

// Hộp thoại Suspend / Ban / Reactivate, bắt buộc nhập lý do (UC37 bước 3, BR-16)
export default function UserStatusDialog({ user, actionKey, onClose, onSaved }) {
  const action = STATUS_ACTIONS[actionKey];
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReasonChange = (event) => {
    setReason(event.target.value);
    if (reasonError) {
      setReasonError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const newReasonError = validateReason(reason);
    setReasonError(newReasonError);
    if (newReasonError) {
      focusFirstInvalidField(['reason'], { reason: newReasonError });
      return;
    }

    setSubmitting(true);
    try {
      await updateUserStatus(user._id, { account_status: action.targetStatus, reason: reason.trim() });
      onSaved(`Tài khoản của ${user.full_name} hiện có trạng thái: ${getUserStatusOption(action.targetStatus).label}.`);
    } catch (error) {
      const fieldErrors = toFieldErrors(error.errors);
      if (fieldErrors.reason) {
        setReasonError(fieldErrors.reason);
      }
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal id="user-status" title={action.title} description={action.description} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="dialog-subject">
          <strong>{user.full_name}</strong> · {user.email}
        </p>
        {formError && <Alert type="error">{formError}</Alert>}
        <ReasonField value={reason} onChange={handleReasonChange} error={reasonError} disabled={submitting} />
        <DialogActions
          submitLabel={action.submitLabel}
          submitting={submitting}
          onCancel={onClose}
          danger={action.danger}
        />
      </form>
    </Modal>
  );
}
