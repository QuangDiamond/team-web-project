import { useState } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { updateCreditPackStatus } from '../../services/adminService';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import { validateReason } from '../../utils/pricingValidators';

// Hộp thoại xác nhận tắt / bật lại credit pack, bắt buộc nhập lý do (UC39 A1)
export default function PackStatusDialog({ pack, onClose, onSaved }) {
  const willEnable = !pack.is_active;
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
      await updateCreditPackStatus(pack._id, { is_active: willEnable, reason: reason.trim() });
      if (willEnable) {
        onSaved(`Credit pack "${pack.name}" is enabled again.`);
      } else {
        onSaved(`Credit pack "${pack.name}" was disabled.`);
      }
    } catch (error) {
      const fieldErrors = toFieldErrors(error.errors);
      if (fieldErrors.reason) {
        setReasonError(fieldErrors.reason);
      }
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  let title = `Disable "${pack.name}"?`;
  let description = 'Disabled packs are hidden from tutors and parents. Past purchases are not affected.';
  let submitLabel = 'Disable pack';
  if (willEnable) {
    title = `Enable "${pack.name}"?`;
    description = 'The pack will be shown to users again and can be bought right away.';
    submitLabel = 'Enable pack';
  }

  return (
    <Modal id="pack-status" title={title} description={description} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}
        <ReasonField value={reason} onChange={handleReasonChange} error={reasonError} disabled={submitting} />
        <DialogActions
          submitLabel={submitLabel}
          submitting={submitting}
          onCancel={onClose}
          danger={!willEnable}
        />
      </form>
    </Modal>
  );
}
