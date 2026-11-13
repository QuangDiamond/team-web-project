import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Hộp thoại có tiêu đề, đóng bằng nút X, phím Esc hoặc bấm ra ngoài; focus được đưa vào hộp khi mở
export default function Modal({ title, onClose, children, className = '' }) {
  const dialogRef = useRef(null);

  // Chỉ đưa focus vào hộp một lần khi mở. Nếu đặt chung effect phụ thuộc onClose, mỗi lần trang cha
  // render lại (vd gõ phím trong ô nhập) focus sẽ bị kéo khỏi ô nhập về hộp thoại
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button type="button" className="dashboard-icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
