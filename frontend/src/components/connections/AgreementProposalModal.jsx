import { toast } from 'sonner';
import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import SchedulePicker from '../common/SchedulePicker';
import Alert from '../common/Alert';
import { createAgreementForm, getConnectedRequests } from '../../utils/agreementForm';

export default function AgreementProposalModal({ conversations, role, onSubmit, onClose }) {
  const isParent = role === 'PARENT';
  const availableConversations = conversations.filter((conversation) => !isParent || conversation.request_id);
  const [form, setForm] = useState(() => createAgreementForm(availableConversations[0]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const connectedTutors = availableConversations.filter((conversation) => conversation.request_id === form.requestId);

  const changeRequest = (event) => {
    const conversation = availableConversations.find((item) => item.request_id === event.target.value);
    setForm(createAgreementForm(conversation));
    setError('');
  };

  const changeConversation = (event) => {
    if (isParent) setForm({ ...form, conversationId: event.target.value });
    else setForm(createAgreementForm(availableConversations.find((item) => item._id === event.target.value)));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!availableConversations.some((item) => item._id === form.conversationId && (!isParent || item.request_id === form.requestId))) {
      setError('Vui lòng chọn yêu cầu và người đã kết nối phù hợp.');
      return;
    }
    if (!form.subject.trim() || !form.schedule.trim() || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
      setError('Vui lòng nhập môn học, chọn lịch hợp lệ và học phí lớn hơn 0.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ conversationId: form.conversationId, agreedSubject: form.subject.trim(), agreedSchedule: form.schedule.trim(), agreedPrice: Number(form.price) });
    } catch (failure) {
      toast.error(failure.message || 'Không thể gửi đề xuất thỏa thuận.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Đề xuất thỏa thuận dạy học" className="agreement-proposal-modal" onClose={submitting ? () => {} : onClose}>
      <form className="agreement-proposal-form" onSubmit={submit}>
        <p className="item-meta">Chọn yêu cầu và người đã kết nối. Môn học, học phí và lịch được điền từ yêu cầu; bạn có thể chỉnh sửa trước khi gửi.</p>
        {availableConversations.length === 0 && <Alert type="info">Chưa có kết nối đang hoạt động. Hãy tiếp tục một đơn ứng tuyển hoặc chấp nhận lời mời để mở hội thoại trước.</Alert>}
        {error && <Alert type="error">{error}</Alert>}
        {isParent ? (
          <div className="agreement-proposal-fields">
            <FormSelect id="agreement-request" label="Yêu cầu" required value={form.requestId} onChange={changeRequest}
              options={getConnectedRequests(availableConversations)} placeholder="Chọn yêu cầu đã có kết nối" disabled={submitting} />
            <FormSelect id="agreement-tutor" label="Gia sư đã kết nối" required value={form.conversationId} onChange={changeConversation}
              options={connectedTutors.map((item) => ({ value: item._id, label: item.tutor_name }))} placeholder="Chọn gia sư" disabled={submitting || !form.requestId} />
          </div>
        ) : (
          <FormSelect id="agreement-conversation" label="Phòng hội thoại đang mở" required value={form.conversationId} onChange={changeConversation}
            options={availableConversations.map((item) => ({ value: item._id, label: `${item.request_title} (${item.parent_name})` }))} placeholder="Chọn hội thoại" disabled={submitting} />
        )}
        <div className="agreement-proposal-fields">
          <FormInput id="agreement-subject" label="Môn học và trình độ đã thống nhất" required value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })} disabled={submitting} />
          <FormInput id="agreement-price" label="Học phí (VND / buổi)" type="number" required value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })} disabled={submitting} />
        </div>
        <SchedulePicker key={isParent ? form.requestId : form.conversationId} id="agreement-schedule" label="Lịch học đã thống nhất *" value={form.schedule}
          onChange={(schedule) => setForm({ ...form, schedule })} disabled={submitting} />
        <div className="agreement-proposal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>Hủy bỏ</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || availableConversations.length === 0}>{submitting ? 'Đang gửi...' : 'Gửi đề xuất thỏa thuận'}</button>
        </div>
      </form>
    </Modal>
  );
}
