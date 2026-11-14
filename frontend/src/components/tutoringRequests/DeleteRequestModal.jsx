import { toast } from 'sonner';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { deleteRequest } from '../../services/parentRequestService';
import Modal from '../common/Modal';

/*
 * Hộp thoại xác nhận xóa một request. Xóa hẳn cùng đơn ứng tuyển, lời mời liên quan; credits đã dùng không hoàn lại.
 * Các cuộc trò chuyện với gia sư vẫn được giữ lại.
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
        <strong>{request.title}</strong> sẽ bị xóa cùng với các đơn ứng tuyển và lời mời liên quan. Các cuộc trò chuyện
        với gia sư vẫn được giữ lại. Không thể hoàn tác, và credit đã dùng sẽ không được hoàn lại.
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
