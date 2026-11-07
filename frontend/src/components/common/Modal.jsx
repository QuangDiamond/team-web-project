import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Hộp thoại dùng thẻ <dialog> gốc: showModal() tự giữ focus bên trong, chặn thao tác phía sau
// và đóng bằng phím Esc. Component cha chỉ render Modal khi cần mở.
export default function Modal({ id, title, description, onClose, children }) {
  const dialogRef = useRef(null);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  // Nhấn chuột xuống ở đâu: chỉ đóng khi cả mousedown và click đều nằm trên nền tối
  const mouseDownTargetRef = useRef(null);

  // Nhớ phần tử đã mở hộp thoại (lấy lúc render đầu, trước showModal) để trả focus về khi đóng.
  // Không lấy trong effect vì StrictMode chạy effect 2 lần, lần 2 focus đã nằm trong hộp thoại.
  const openerRef = useRef(null);
  if (openerRef.current === null) {
    openerRef.current = document.activeElement;
  }

  useEffect(() => {
    const openerElement = openerRef.current;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (openerElement && openerElement.isConnected) {
        openerElement.focus();
      }
    };
  }, []);

  // Esc: để React quyết định đóng (gọi onClose) thay vì trình duyệt tự đóng
  const handleCancel = (event) => {
    event.preventDefault();
    onClose();
  };

  const handleMouseDown = (event) => {
    mouseDownTargetRef.current = event.target;
  };

  // Bấm ra vùng tối bên ngoài hộp thoại cũng đóng (kéo chuột từ trong ô nhập ra ngoài thì không)
  const handleBackdropClick = (event) => {
    const dialog = dialogRef.current;
    const startedOnBackdrop = mouseDownTargetRef.current === dialog;
    mouseDownTargetRef.current = null;
    if (startedOnBackdrop && event.target === dialog) {
      onClose();
    }
  };

  let describedBy;
  if (description) {
    describedBy = descriptionId;
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onCancel={handleCancel}
      onMouseDown={handleMouseDown}
      onClick={handleBackdropClick}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <div>
            <h2 id={titleId} className="modal-title">{title}</h2>
            {description && <p id={descriptionId} className="modal-description">{description}</p>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </dialog>
  );
}
