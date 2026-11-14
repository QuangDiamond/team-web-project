import { useState } from 'react';
import { CalendarClock, Clock3, X } from 'lucide-react';
import { createScheduleChangeRequest, updateScheduleChangeRequest } from '../../services/scheduleChangeRequestService';
import { updateClassSession } from '../../services/classroomService';
import '../../styles/scheduleChangeRequests.css';

function toDateTimeLocal(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalIso(value) {
  return new Date(value).toISOString();
}

// editingRequest: khi có, modal dùng để sửa đề nghị đang chờ của chính người dùng
export default function ScheduleChangeFormModal({ session, mode, onClose, onSaved, editingRequest = null }) {
  const [startTime, setStartTime] = useState(() => toDateTimeLocal(editingRequest ? editingRequest.proposed_start_time : session.start_time));
  const [endTime, setEndTime] = useState(() => toDateTimeLocal(editingRequest ? editingRequest.proposed_end_time : session.end_time));
  const sessionDuration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
  const [reason, setReason] = useState(() => (editingRequest ? editingRequest.reason || '' : ''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRequest = mode === 'REQUEST' || Boolean(editingRequest);
  let submitLabel = 'Đổi lịch và thông báo';
  if (isRequest) {
    submitLabel = editingRequest ? 'Lưu thay đổi' : 'Gửi đề nghị';
  }
  if (isSubmitting) {
    submitLabel = 'Đang lưu...';
  }

  const handleStartTimeChange = (value) => {
    setStartTime(value);
    const nextStartTime = new Date(value);
    if (Number.isFinite(nextStartTime.getTime())) {
      setEndTime(toDateTimeLocal(new Date(nextStartTime.getTime() + sessionDuration)));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!startTime || !endTime || new Date(startTime) <= new Date() || new Date(endTime) <= new Date(startTime)) {
      setError('Giờ đề xuất phải ở tương lai và giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    if (isRequest && reason.trim().length < 3) {
      setError('Vui lòng nhập lý do ít nhất 3 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        start_time: toLocalIso(startTime),
        end_time: toLocalIso(endTime),
      };
      if (editingRequest) {
        await updateScheduleChangeRequest(editingRequest._id, {
          proposed_start_time: payload.start_time,
          proposed_end_time: payload.end_time,
          reason: reason.trim(),
        });
      } else if (isRequest) {
        await createScheduleChangeRequest({
          session_id: session._id,
          proposed_start_time: payload.start_time,
          proposed_end_time: payload.end_time,
          reason: reason.trim(),
        });
      } else {
        await updateClassSession(session.class_id, session._id, payload);
      }
      onSaved();
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi yêu cầu đổi lịch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="schedule-change-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section className="schedule-change-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-change-title">
        <header className="schedule-change-modal-heading">
          <div>
            <span className="schedule-change-modal-icon"><CalendarClock size={19} aria-hidden="true" /></span>
            <div>
              <h2 id="schedule-change-title">{editingRequest ? 'Sửa đề nghị đổi lịch' : isRequest ? 'Đề nghị đổi lịch học' : 'Đổi lịch học cho cả lớp'}</h2>
              <p>{session.class_name || session.classroom?.name || 'Lớp học'} · {session.title || 'Buổi học'}</p>
            </div>
          </div>
          <button type="button" className="schedule-change-close" onClick={onClose} disabled={isSubmitting} aria-label="Đóng">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="schedule-change-current-time">
            <Clock3 size={15} aria-hidden="true" />
            Lịch hiện tại: {new Date(session.start_time).toLocaleString('vi-VN')} – {new Date(session.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <label className="form-field">
            <span className="form-label">Bắt đầu lúc</span>
            <input className="form-control" type="datetime-local" value={startTime} min={toDateTimeLocal(new Date())} onChange={(event) => handleStartTimeChange(event.target.value)} required disabled={isSubmitting} />
          </label>
          <label className="form-field">
            <span className="form-label">Kết thúc lúc</span>
            <input className="form-control" type="datetime-local" value={endTime} min={startTime || toDateTimeLocal(new Date())} onChange={(event) => setEndTime(event.target.value)} required disabled={isSubmitting} />
          </label>
          {isRequest && (
            <label className="form-field">
              <span className="form-label">Lý do đề nghị</span>
              <textarea className="form-control" rows="3" maxLength="500" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Cho bên kia biết lý do cần đổi lịch..." required disabled={isSubmitting} />
            </label>
          )}
          {error && <p className="schedule-change-form-error" role="alert">{error}</p>}
          <footer className="schedule-change-form-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
