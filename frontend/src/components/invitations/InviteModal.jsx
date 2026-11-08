import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditBalance';
import { inviteTutor } from '../../services/invitationService';
import Alert from '../common/Alert';
import CreditAmountField from '../common/CreditAmountField';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';

const MESSAGE_MAX_LENGTH = 500;

/*
 * Hộp thoại mời gia sư vào một request (UC14). Trừ số credit đã chọn (1-10) của phụ huynh, không hoàn lại.
 * Dùng nhiều credit hơn thì lời mời được xếp lên đầu danh sách của gia sư.
 * onInvited(result) được gọi sau khi mời thành công với { invitation, remaining_credits }.
 */
export default function InviteModal({ requestId, requestTitle, tutorProfileId, tutorName, onClose, onInvited }) {
  const credits = useCreditBalance();
  const [message, setMessage] = useState('');
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
      const payload = { request_id: requestId, tutor_profile_id: tutorProfileId, credits: amount };
      if (message.trim()) {
        payload.message = message.trim();
      }
      const response = await inviteTutor(payload);
      onInvited(response.data);
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
    <Modal title="Mời gia sư" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="modal-summary">
          Mời <strong>{tutorName}</strong> vào yêu cầu của bạn <strong>{requestTitle}</strong>.
        </p>

        <p className="modal-cost">
          <span>Chi phí: {amount} tín dụng</span>
          <span>{creditText}</span>
        </p>
        <p className="item-meta modal-note">Tín dụng không được hoàn lại khi gia sư từ chối hoặc bạn hủy lời mời.</p>

        <CreditAmountField
          id="invite-credits"
          value={creditsToSpend}
          onChange={(event) => setCreditsToSpend(event.target.value)}
          balance={credits.balance}
          disabled={submitting || hasNoCredit}
          audience="gia sư"
        />

        {hasNoCredit && <Alert type="error">Bạn cần ít nhất 1 tín dụng để mời gia sư.</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <FormTextarea
          id="invite-message"
          label="Lời nhắn cho gia sư"
          optional
          rows={3}
          maxLength={MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Chia sẻ lý do bạn muốn hợp tác với gia sư"
          disabled={submitting}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
            {submitting ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : null}
            <span>{submitting ? "Đang gửi..." : "Gửi lời mời"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
