import { useState } from 'react';
import { Flag } from 'lucide-react';
import { createReport } from '../../services/reportService';
import Modal from './Modal';
import Alert from './Alert';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';

const OTHER_REASON = 'OTHER';
const MIN_REASON_LENGTH = 5;
const MAX_DETAIL_LENGTH = 400;

const REASON_OPTIONS = [
  { value: 'Thông tin sai sự thật hoặc có dấu hiệu lừa đảo', label: 'Thông tin sai sự thật / lừa đảo' },
  { value: 'Chứa số điện thoại hoặc liên hệ ngoài nền tảng', label: 'Chứa số điện thoại / liên hệ ngoài nền tảng' },
  { value: 'Ngôn từ xúc phạm hoặc không phù hợp', label: 'Ngôn từ xúc phạm / không phù hợp' },
  { value: 'Spam hoặc nội dung trùng lặp', label: 'Spam / nội dung trùng lặp' },
  { value: OTHER_REASON, label: 'Lý do khác' },
];

const TARGET_LABELS = {
  POST: 'bài đăng',
  REQUEST: 'yêu cầu',
};

/**
 * Ghép lý do chọn sẵn và mô tả thêm thành chuỗi gửi lên API (5–500 ký tự)
 */
const buildReason = (selectedReason, detail) => {
  const trimmedDetail = detail.trim();
  if (selectedReason === OTHER_REASON) {
    return trimmedDetail;
  }
  if (!trimmedDetail) {
    return selectedReason;
  }
  return `${selectedReason}: ${trimmedDetail}`;
};

/*
 * Nút "Báo cáo" + hộp thoại chọn lý do (UC38). Báo cáo được gửi tới hàng đợi Kiểm duyệt của Admin,
 * nội dung bị tạm ẩn cho đến khi Admin xử lý.
 * targetType: 'POST' (bài đăng gia sư) | 'REQUEST' (yêu cầu tìm gia sư)
 * onReported(message) được gọi khi gửi thành công.
 */
export default function ReportContentButton({ targetType, targetId, targetTitle, onReported, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reported, setReported] = useState(false);

  const targetLabel = TARGET_LABELS[targetType] || 'nội dung';

  const closeDialog = () => {
    if (submitting) {
      return;
    }
    setIsOpen(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedReason) {
      setError('Vui lòng chọn lý do báo cáo.');
      return;
    }
    const reason = buildReason(selectedReason, detail);
    if (reason.length < MIN_REASON_LENGTH) {
      setError(`Vui lòng mô tả lý do (ít nhất ${MIN_REASON_LENGTH} ký tự).`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await createReport({ target_type: targetType, target_id: targetId, reason: reason });
      setReported(true);
      setIsOpen(false);
      if (onReported) {
        onReported(response.message || 'Đã gửi báo cáo. Admin sẽ xem xét nội dung này.');
      }
    } catch (failure) {
      if (failure.status === 409) {
        setReported(true);
      }
      setError(failure.message || 'Không thể gửi báo cáo.');
    } finally {
      setSubmitting(false);
    }
  };

  let buttonLabel = 'Báo cáo';
  if (reported) {
    buttonLabel = 'Đã báo cáo';
  }

  return (
    <>
      <button
        type="button"
        className={`btn btn-ghost btn-sm report-content-button ${className}`.trim()}
        onClick={() => setIsOpen(true)}
        disabled={reported}
        title={`Báo cáo ${targetLabel} vi phạm`}
      >
        <Flag size={15} aria-hidden="true" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <Modal title={`Báo cáo ${targetLabel} vi phạm`} onClose={closeDialog}>
          <form className="report-content-form" onSubmit={handleSubmit}>
            {targetTitle && <p className="report-content-target">{targetTitle}</p>}
            <p className="item-meta">
              Báo cáo được gửi tới Admin để kiểm duyệt. Nội dung sẽ tạm ẩn khỏi trang công khai cho đến khi Admin xử lý xong.
            </p>
            {error && <Alert type="error">{error}</Alert>}
            <FormSelect
              id="report-reason"
              label="Lý do báo cáo"
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
              options={REASON_OPTIONS}
              placeholder="Chọn lý do"
              required
              disabled={submitting}
            />
            <FormTextarea
              id="report-detail"
              label="Mô tả thêm"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Cho Admin biết rõ hơn nội dung vi phạm..."
              maxLength={MAX_DETAIL_LENGTH}
              rows={4}
              optional={selectedReason !== OTHER_REASON}
              required={selectedReason === OTHER_REASON}
              disabled={submitting}
            />
            <div className="report-content-actions">
              <button type="button" className="btn btn-outline" onClick={closeDialog} disabled={submitting}>
                Hủy
              </button>
              <button type="submit" className="btn report-content-submit" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
