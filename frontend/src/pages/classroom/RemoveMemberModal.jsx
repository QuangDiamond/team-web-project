import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { removeMemberFromClass } from '../../services/classroomService';

export default function RemoveMemberModal({ isOpen, onClose, classroomId, member, onMemberRemoved, showToast }) {
  const [reason, setReason] = useState('Được gỡ bởi gia sư phụ trách lớp');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('Được gỡ bởi gia sư phụ trách lớp');
      setError('');
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const handleClose = () => {
    setReason('Được gỡ bởi gia sư phụ trách lớp');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      await removeMemberFromClass(classroomId, member._id, reason);
      if (showToast) {
        showToast('Đã gỡ học viên khỏi lớp thành công!');
      }
      if (onMemberRemoved) {
        onMemberRemoved(member._id);
      }
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể xóa thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  const userName = member.user_id?.full_name || member.user_id?.email || 'Học viên này';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <AlertTriangle size={20} />
            <span>Xác nhận xóa thành viên</span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-alert">
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#334155' }}>
              Bạn có chắc chắn muốn xóa học viên <strong>{userName}</strong> khỏi lớp học không?
            </p>

            <div className="form-group">
              <label>Lý do gỡ thành viên:</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Nhập lý do gỡ học viên (học sinh hoàn thành khóa học, yêu cầu chuyển lớp...)"
                required
              />
              <div className="form-help-text">Lý do này sẽ được thông báo trực tiếp đến học viên.</div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary-orange"
              style={{ backgroundColor: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              disabled={submitting}
            >
              <Trash2 size={15} />
              <span>{submitting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
