import { useState } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import FormTextarea from '../common/FormTextarea';
import DialogActions from '../admin/DialogActions';
import { moderationService } from '../../services/moderationService';
import { RESOLUTION_ACTIONS } from './moderationLabels';
export default function ResolutionDialog({
  report,
  onClose,
  onResolved
}) {
  const [action, setAction] = useState(report.action_taken && report.action_taken !== 'NONE' ? report.action_taken : 'CONTENT_HIDDEN');
  const [note, setNote] = useState(report.admin_note || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const close = () => {
    if (!submitting) {
      onClose();
    }
  };
  const submit = async event => {
    event.preventDefault();
    if (!note.trim()) {
      setError('Vui lòng nhập lý do xử lý.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await moderationService.resolveReport(report._id, {
        action,
        admin_note: note.trim(),
        ban_user_id: report.target_preview?.author_id || null
      });
      onResolved(response.message || 'Đã xử lý báo cáo thành công.');
    } catch (failure) {
      setError(failure.message || 'Không thể xử lý báo cáo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal title="Xử lý báo cáo vi phạm" onClose={close}>
      <form onSubmit={submit}>
        <p className="mod-note"><strong>Lý do báo cáo:</strong> {report.reason}</p>
        {error && <Alert type="error">{error}</Alert>}
        <fieldset className="mod-resolution-options" disabled={submitting}>
          <legend>Quyết định xử lý</legend>
          {RESOLUTION_ACTIONS.map(option => <label key={option.value} className="mod-resolution-option">
            <input type="radio" name="resolutionAction" value={option.value} checked={action === option.value} onChange={() => setAction(option.value)} />
            <span><strong>{option.title}</strong><small>{option.description}</small></span>
          </label>)}
        </fieldset>
        <FormTextarea id="moderation-note" label="Lý do / căn cứ xử lý" required value={note} onChange={event => setNote(event.target.value)} maxLength={1000} disabled={submitting} hint="Mọi quyết định xử lý đều được lưu vào nhật ký quản trị cùng lý do." />
        <DialogActions onCancel={close} submitting={submitting} submitLabel="Xác nhận xử lý" danger={action === 'USER_BANNED' || action === 'CONTENT_REMOVED'} />
      </form>
    </Modal>;
}
