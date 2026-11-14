import { toast } from 'sonner';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { deleteRequest } from '../../services/parentRequestService';
import Modal from '../common/Modal';

// Lỗi 409 của server khi request đã có hội thoại với gia sư; hiện lại bằng tiếng Việt
const HAS_CONVERSATION_MESSAGE = 'This request already has a conversation with a tutor and cannot be deleted';
const HAS_CONVERSATION_MESSAGE_VI = 'Yêu cầu này đã có hội thoại với gia sư nên không thể xóa.';

/*
 * Hộp thoại xác nhận xóa một request. Xóa hẳn cùng đơn ứng tuyển, lời mời liên quan; credits đã dùng không hoàn lại.
 * Server từ chối (409) khi request đã có cuộc trò chuyện với gia sư: hiện lý do (đã dịch ở api.js) ngay trong hộp thoại.
 * onDeleted() được gọi sau khi xóa thành công.
 */
export default function DeleteRequestModal({ request, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {

    setDeleting(true);
    try {
      await deleteRequest(request._id);
      onDeleted();
    } catch (deleteError) {
      toast.error(deleteError.message);
      setDeleting(false);
    }
  };

  return (
    <Modal title="Xóa yêu cầu này?" onClose={onClose}>
      <p className="modal-summary">
        <strong>{request.title}</strong> sẽ bị xóa cùng với các đơn ứng tuyển và lời mời liên quan. Không thể hoàn tác,
        và credit đã dùng sẽ không được hoàn lại.
      </p>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline btn-sm" disabled={deleting} onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={deleting} onClick={handleDelete}>
          {deleting ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : null}
          <span>{deleting ? 'Đang xóa...' : 'Xóa'}</span>
        </button>
      </div>
    </Modal>
  );
}
