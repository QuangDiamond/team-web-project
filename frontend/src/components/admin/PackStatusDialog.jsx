import { toast } from 'sonner';
import { useState } from 'react';
import Modal from '../common/Modal';
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
  const [submitting, setSubmitting] = useState(false);

  const handleReasonChange = (event) => {
    setReason(event.target.value);
    if (reasonError) {
      setReasonError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
        onSaved(`Gói credits "${pack.name}" đã được bật lại.`);
      } else {
        onSaved(`Gói credits "${pack.name}" đã được tắt.`);
      }
    } catch (error) {
      const fieldErrors = toFieldErrors(error.errors);
      if (fieldErrors.reason) {
        setReasonError(fieldErrors.reason);
      }
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  let title = `Tắt "${pack.name}"?`;
  let description = 'Gia sư và phụ huynh không thấy các gói đã tắt. Các lượt mua trước đó không bị ảnh hưởng.';
  let submitLabel = 'Tắt gói credits';
  if (willEnable) {
    title = `Bật "${pack.name}"?`;
    description = 'Gói sẽ hiển thị lại cho người dùng và có thể mua ngay.';
    submitLabel = 'Bật gói credits';
  }

  return (
    <Modal id="pack-status" title={title} description={description} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>

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
