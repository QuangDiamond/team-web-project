import { toast } from 'sonner';
import { useState, useId } from 'react';
import { Clock, AlertCircle, CalendarDays, Loader2, X, Send } from 'lucide-react';
import { createScheduleChangeRequest } from '../../services/classroomService';

const MIN_NOTICE_MS = 12 * 60 * 60 * 1000;

export default function RequestScheduleChangeModal({
  isOpen,
  onClose,
  session,
  classId,
  onSuccess,
}) {
  const [requestType, setRequestType] = useState('MOVE'); // 'MOVE' | 'CANCEL'
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasonId = useId();
  const dateId = useId();
  const startId = useId();
  const endId = useId();

  if (!isOpen || !session) return null;

  const now = new Date();
  const sessionStart = new Date(session.start_time);
  const noticeMs = sessionStart.getTime() - now.getTime();
  const isUrgent = noticeMs < MIN_NOTICE_MS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isUrgent) {
      setError('Theo quy định, yêu cầu đổi/hủy lịch học phải gửi trước giờ học ít nhất 12 tiếng. Buổi học này đã cận giờ, vui lòng nhắn tin trực tiếp cho gia sư trong khung Chat.');
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setError('Vui lòng nhập lý do cụ thể (tối thiểu 3 ký tự).');
      return;
    }

    let payload = {
      request_type: requestType,
      reason: reason.trim(),
    };

    if (requestType === 'MOVE') {
      if (!date || !startTime || !endTime) {
        setError('Vui lòng chọn ngày học và khung giờ đề xuất mới.');
        return;
      }
      const proposedStart = new Date(`${date}T${startTime}:00`);
      const proposedEnd = new Date(`${date}T${endTime}:00`);

      if (proposedStart <= now) {
        setError('Thời gian đề xuất mới phải ở trong tương lai.');
        return;
      }
      if (proposedEnd <= proposedStart) {
        setError('Giờ kết thúc đề xuất phải sau giờ bắt đầu.');
        return;
      }
      const diffMs = proposedEnd.getTime() - proposedStart.getTime();
      const diffMins = Math.round(diffMs / (60 * 1000));
      if (diffMins < 15 || diffMins > 300) {
        setError('Thời lượng buổi học đề xuất phải từ 15 phút đến 300 phút (5 tiếng).');
        return;
      }

      payload.proposed_start_time = proposedStart.toISOString();
      payload.proposed_end_time = proposedEnd.toISOString();
    }

    try {
      setSubmitting(true);
      const targetClassId = classId || session.class_id || session.class?._id;
      const res = await createScheduleChangeRequest(targetClassId, session._id, payload);
      toast.success('Gửi yêu cầu đổi lịch học thành công! Gia sư sẽ xem xét và phản hồi.');
      if (onSuccess) onSuccess(res?.data);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Lỗi gửi yêu cầu đổi lịch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          maxWidth: '520px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
              Xin đổi / hủy lịch học
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Buổi: <strong>{session.title || 'Buổi học'}</strong> ({new Date(session.start_time).toLocaleDateString('vi-VN')})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {isUrgent ? (
          <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning-soft)', color: 'var(--color-warning)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Quy định đổi lịch cận giờ (BR-10 & UC27):</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Buổi học này sẽ bắt đầu trong vòng chưa đầy 12 tiếng nữa. Hệ thống chỉ cho phép gửi yêu cầu trực tuyến trước giờ học ít nhất 12 giờ. Vui lòng nhắn tin trực tiếp cho gia sư trong khung Chat lớp học để được hỗ trợ kịp thời.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={15} style={{ color: 'var(--color-primary-strong)' }} />
            <span>Quy định: Yêu cầu đổi lịch phải được gửi trước giờ học ít nhất 12 tiếng.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Chọn loại yêu cầu */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              Loại yêu cầu
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: requestType === 'MOVE' ? '2px solid var(--color-primary-strong)' : '1px solid var(--color-control-border)',
                  background: requestType === 'MOVE' ? 'var(--color-primary-soft)' : 'var(--color-white)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: requestType === 'MOVE' ? 'var(--color-primary-strong)' : 'var(--color-text)',
                }}
              >
                <input
                  type="radio"
                  name="request_type"
                  value="MOVE"
                  checked={requestType === 'MOVE'}
                  onChange={() => setRequestType('MOVE')}
                  style={{ accentColor: 'var(--color-primary-strong)' }}
                />
                <span>Dời sang giờ khác</span>
              </label>

              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: requestType === 'CANCEL' ? '2px solid var(--color-error)' : '1px solid var(--color-control-border)',
                  background: requestType === 'CANCEL' ? 'var(--color-error-soft)' : 'var(--color-white)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: requestType === 'CANCEL' ? 'var(--color-error)' : 'var(--color-text)',
                }}
              >
                <input
                  type="radio"
                  name="request_type"
                  value="CANCEL"
                  checked={requestType === 'CANCEL'}
                  onChange={() => setRequestType('CANCEL')}
                  style={{ accentColor: 'var(--color-error)' }}
                />
                <span>Xin nghỉ / Hủy buổi học</span>
              </label>
            </div>
          </div>

          {/* Nếu chọn dời lịch: Khung giờ đề xuất */}
          {requestType === 'MOVE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div>
                <label htmlFor={dateId} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                  Ngày học đề xuất mới
                </label>
                <input
                  id={dateId}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                  required={requestType === 'MOVE'}
                  disabled={submitting || isUrgent}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor={startId} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                    Giờ bắt đầu
                  </label>
                  <input
                    id={startId}
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                    required={requestType === 'MOVE'}
                    disabled={submitting || isUrgent}
                  />
                </div>
                <div>
                  <label htmlFor={endId} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                    Giờ kết thúc
                  </label>
                  <input
                    id={endId}
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                    required={requestType === 'MOVE'}
                    disabled={submitting || isUrgent}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lý do */}
          <div>
            <label htmlFor={reasonId} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              Lý do xin đổi / nghỉ học <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              id={reasonId}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Trùng lịch thi ở trường, gia đình có việc đột xuất..."
              maxLength={500}
              required
              disabled={submitting || isUrgent}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--color-error-soft)', border: '1px solid #fecaca', color: 'var(--color-error)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || isUrgent}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {submitting ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              <span>Gửi yêu cầu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

