import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditBalance';
import { applyToRequest } from '../../services/applicationService';
import Alert from '../common/Alert';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';
import { formatBudget, getModeLabel } from '../../constants/requestLabels';

const NOTE_MAX_LENGTH = 500;

/*
 * Hộp thoại ứng tuyển vào một request (UC12). Trừ 1 credit khi gửi, không hoàn lại.
 * onApplied(result) được gọi sau khi gửi thành công với { application, remaining_credits }.
 */
export default function ApplyModal({ request, onClose, onApplied }) {
  const credits = useCreditBalance();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasNoCredit = !credits.loading && credits.balance === 0;
  const canSubmit = !submitting && !credits.loading && !credits.error && !hasNoCredit;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { request_id: request._id };
      if (note.trim()) {
        payload.note = note.trim();
      }
      const response = await applyToRequest(payload);
      onApplied(response.data);
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  let creditText = "Đang kiểm tra tín dụng...";
  if (credits.error) {
    creditText = "Không thể tải số dư tín dụng";
  } else if (!credits.loading) {
    creditText = `Số dư: ${credits.balance}`;
  }

  return (
    <Modal title="Ứng tuyển yêu cầu này" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="modal-summary">
          <strong>{request.title}</strong>
          <br />
          {request.subject_name} · {request.grade_level} · {getModeLabel(request.teaching_mode)} · {formatBudget(request.budget)}
        </p>

        <p className="modal-cost">
          <span>Chi phí: 1 tín dụng</span>
          <span>{creditText}</span>
        </p>
        <p className="item-meta modal-note">Tín dụng không được hoàn lại nếu phụ huynh bỏ qua đơn ứng tuyển.</p>

        {hasNoCredit && <Alert type="error">Bạn cần ít nhất 1 tín dụng để ứng tuyển.</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <FormTextarea
          id="apply-note"
          label="Lời nhắn ngắn cho phụ huynh"
          optional
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Giới thiệu kinh nghiệm và cách bạn hỗ trợ học sinh"
          disabled={submitting}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
            {submitting ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : null}
            <span>{submitting ? "Đang gửi..." : "Gửi đơn ứng tuyển"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
