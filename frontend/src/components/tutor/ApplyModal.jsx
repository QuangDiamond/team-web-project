import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditBalance';
import { applyToRequest } from '../../services/applicationService';
import Alert from '../common/Alert';
import CreditAmountField from '../common/CreditAmountField';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';
import { formatBudget, getModeLabel } from '../../constants/requestLabels';

const NOTE_MAX_LENGTH = 500;

/*
 * Hộp thoại ứng tuyển vào một request (UC12). Trừ số credit đã chọn (1-10) khi gửi, không hoàn lại.
 * Dùng nhiều credit hơn thì đơn được xếp lên đầu danh sách của phụ huynh.
 * onApplied(result) được gọi sau khi gửi thành công với { application, remaining_credits }.
 */
export default function ApplyModal({ request, onClose, onApplied }) {
  const credits = useCreditBalance();
  const [note, setNote] = useState('');
  const [creditsToSpend, setCreditsToSpend] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasNoCredit = !credits.loading && credits.balance === 0;
  const amount = Number(creditsToSpend);
  const exceedsBalance = !credits.loading && credits.balance !== null && amount > credits.balance;
  const canSubmit = !submitting && !credits.loading && !credits.error && !hasNoCredit && !exceedsBalance;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { request_id: request._id, credits: amount };
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

  let creditText = 'Checking your credits...';
  if (credits.error) {
    creditText = 'Could not load your credits';
  } else if (!credits.loading) {
    creditText = `Balance: ${credits.balance}`;
  }

  return (
    <Modal title="Apply to this request" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="modal-summary">
          <strong>{request.title}</strong>
          <br />
          {request.subject_name} · {request.grade_level} · {getModeLabel(request.teaching_mode)} · {formatBudget(request.budget)}
        </p>

        <p className="modal-cost">
          <span>Cost: {amount} {amount === 1 ? 'credit' : 'credits'}</span>
          <span>{creditText}</span>
        </p>
        <p className="item-meta modal-note">The credit is not refunded if the parent skips your application.</p>

        <CreditAmountField
          id="apply-credits"
          value={creditsToSpend}
          onChange={(event) => setCreditsToSpend(event.target.value)}
          balance={credits.balance}
          disabled={submitting || hasNoCredit}
          audience="the parent's"
        />

        {hasNoCredit && <Alert type="error">You need at least 1 credit to apply.</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <FormTextarea
          id="apply-note"
          label="Short note to the parent"
          optional
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Introduce your experience and how you would help"
          disabled={submitting}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
            {submitting ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : null}
            <span>{submitting ? 'Sending...' : 'Send application'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
