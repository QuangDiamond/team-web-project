import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { deleteRequest } from '../../services/parentRequestService';
import Alert from '../common/Alert';
import Modal from '../common/Modal';

/*
 * Hộp thoại xác nhận xóa một request. Xóa hẳn cùng đơn ứng tuyển, lời mời liên quan; credit đã dùng không hoàn lại.
 * Server từ chối (409) khi request đã có hội thoại với gia sư: hiện lý do ngay trong hộp thoại.
 * onDeleted() được gọi sau khi xóa thành công.
 */
export default function DeleteRequestModal({ request, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await deleteRequest(request._id);
      onDeleted();
    } catch (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete this request?" onClose={onClose}>
      <p className="modal-summary">
        <strong>{request.title}</strong> will be deleted together with its applications and invitations. This cannot be undone,
        and credits already spent are not refunded.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline btn-sm" disabled={deleting} onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={deleting} onClick={handleDelete}>
          {deleting ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : null}
          <span>{deleting ? 'Deleting...' : 'Delete'}</span>
        </button>
      </div>
    </Modal>
  );
}
