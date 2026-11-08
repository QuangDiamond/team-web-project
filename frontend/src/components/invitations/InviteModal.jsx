import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditBalance';
import { inviteTutor } from '../../services/invitationService';
import Alert from '../common/Alert';
import FormTextarea from '../common/FormTextarea';
import Modal from '../common/Modal';

const MESSAGE_MAX_LENGTH = 500;

/*
 * Hộp thoại mời gia sư vào một request (UC14). Trừ 1 credit của phụ huynh, không hoàn lại.
 * onInvited(result) được gọi sau khi mời thành công với { invitation, remaining_credits }.
 */
export default function InviteModal({ requestId, requestTitle, tutorProfileId, tutorName, onClose, onInvited }) {
  const credits = useCreditBalance();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasNoCredit = !credits.loading && credits.balance === 0;
  const canSubmit = !submitting && !credits.loading && !credits.error && !hasNoCredit;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { request_id: requestId, tutor_profile_id: tutorProfileId };
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

  let creditText = 'Checking your credits...';
  if (credits.error) {
    creditText = 'Could not load your credits';
  } else if (!credits.loading) {
    creditText = `Balance: ${credits.balance}`;
  }

  return (
    <Modal title="Invite tutor" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="modal-summary">
          Invite <strong>{tutorName}</strong> to your request <strong>{requestTitle}</strong>.
        </p>

        <p className="modal-cost">
          <span>Cost: 1 credit</span>
          <span>{creditText}</span>
        </p>
        <p className="item-meta modal-note">The credit is not refunded if the tutor declines or you cancel the invitation.</p>

        {hasNoCredit && <Alert type="error">You need at least 1 credit to invite a tutor.</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <FormTextarea
          id="invite-message"
          label="Message to the tutor"
          optional
          rows={3}
          maxLength={MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell the tutor why you would like to work with them"
          disabled={submitting}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
            {submitting ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : null}
            <span>{submitting ? 'Sending...' : 'Send invitation'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
