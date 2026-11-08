import { LoaderCircle } from 'lucide-react';

// Hàng nút cuối hộp thoại: Cancel + nút submit (hiện vòng quay khi đang lưu)
export default function DialogActions({ submitLabel, submitting, onCancel, danger = false }) {
  let submitClass = 'btn btn-primary';
  if (danger) {
    submitClass = 'btn btn-danger';
  }

  return (
    <div className="modal-actions">
      <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>
        Hủy
      </button>
      <button type="submit" className={submitClass} disabled={submitting}>
        {submitting && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
        <span>{submitLabel}</span>
      </button>
    </div>
  );
}
