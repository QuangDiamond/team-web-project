import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { UserPlus, AlertTriangle, X } from 'lucide-react';
import { addMemberToClass } from '../../services/classroomService';

export default function AddMemberModal({ isOpen, onClose, classroomId, onMemberAdded }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return setError('Vui lòng nhập địa chỉ email của học viên');
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await addMemberToClass(classroomId, { email: email.trim() });
      toast.success('Đã thêm học viên vào lớp học thành công!');
      setEmail('');
      if (onMemberAdded) {
        onMemberAdded(res?.data);
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể thêm học viên');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} style={{ color: 'var(--color-primary-strong)' }} />
            <span>Thêm học viên vào lớp</span>
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

            <div className="form-group">
              <label>
                Địa chỉ Email học sinh / phụ huynh <span className="required">*</span>
              </label>
              <input
                type="email"
                placeholder="VD: hocsinh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <div className="form-help-text">
                Người dùng phải đã đăng ký tài khoản trên hệ thống TuConnector.
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-orange" disabled={submitting}>
              {submitting ? 'Đang thêm...' : 'Thêm vào lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
