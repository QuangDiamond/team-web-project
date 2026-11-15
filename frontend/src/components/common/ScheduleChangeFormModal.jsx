import { useState } from 'react';
import { CalendarClock, Clock3, X } from 'lucide-react';
import { createScheduleChangeRequest, updateScheduleChangeRequest } from '../../services/scheduleChangeRequestService';
import { updateClassSession } from '../../services/classroomService';
import { findProposalConflict } from '../../utils/scheduleChangeDates';
import FormTextarea from './FormTextarea';
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
// otherSessions: các buổi đang có trên lịch, dùng để báo trùng giờ ngay trên form (backend vẫn kiểm tra lại)
export default function ScheduleChangeFormModal({ session, mode, onClose, onSaved, editingRequest = null, otherSessions = [] }) {
  const initialStart = toDateTimeLocal(editingRequest ? editingRequest.proposed_start_time : session.start_time);
  const initialEnd = toDateTimeLocal(editingRequest ? editingRequest.proposed_end_time : session.end_time);
  // Form chia thành 1 ngày + giờ bắt đầu + giờ kết thúc ("YYYY-MM-DD" và "HH:mm")
  const [date, setDate] = useState(() => initialStart.slice(0, 10));
  const [startClock, setStartClock] = useState(() => initialStart.slice(11));
  const [endClock, setEndClock] = useState(() => initialEnd.slice(11));
  const startTime = date && startClock ? `${date}T${startClock}` : '';
  const endTime = date && endClock ? `${date}T${endClock}` : '';
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

  // Đổi giờ bắt đầu thì tự dời giờ kết thúc để giữ nguyên thời lượng buổi học
  const handleStartClockChange = (value) => {
    setStartClock(value);
    const nextStartTime = new Date(`${date}T${value}`);
    if (Number.isFinite(nextStartTime.getTime())) {
      setEndClock(toDateTimeLocal(new Date(nextStartTime.getTime() + sessionDuration)).slice(11));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!startTime || !endTime || new Date(startTime) <= new Date() || new Date(endTime) <= new Date(startTime)) {
      setError('Giờ đề xuất phải ở tương lai và giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000;
    if (durationMinutes < 15 || durationMinutes > 300) {
      setError('Thời lượng buổi học phải từ 15 phút đến 300 phút (5 tiếng).');
      return;
    }
    const conflict = findProposalConflict(session, startTime, endTime, otherSessions);
    if (conflict === 'SAME_TIME') {
      setError('Giờ đề xuất đang trùng với giờ hiện tại của buổi học. Hãy chọn giờ khác.');
      return;
    }
    if (conflict) {
      const conflictStart = new Date(conflict.start_time).toLocaleString('vi-VN');
      const conflictEnd = new Date(conflict.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setError(`Giờ đề xuất bị trùng với buổi "${conflict.title || 'Buổi học'}" (${conflictStart} – ${conflictEnd}). Hãy chọn giờ khác.`);
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
          <div className="form-field">
            <label className="form-label" htmlFor="schedule-change-date">Ngày học mới</label>
            <div className="form-control">
              <input id="schedule-change-date" type="date" value={date} min={toDateTimeLocal(new Date()).slice(0, 10)} onChange={(event) => setDate(event.target.value)} required disabled={isSubmitting} />
            </div>
          </div>
          <div className="schedule-change-time-fields">
            <div className="form-field">
              <label className="form-label" htmlFor="schedule-change-start">Giờ bắt đầu</label>
              <div className="form-control">
                <input id="schedule-change-start" type="time" value={startClock} onChange={(event) => handleStartClockChange(event.target.value)} required disabled={isSubmitting} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="schedule-change-end">Giờ kết thúc</label>
              <div className="form-control">
                <input id="schedule-change-end" type="time" value={endClock} min={startClock || undefined} onChange={(event) => setEndClock(event.target.value)} required disabled={isSubmitting} />
              </div>
            </div>
          </div>
          {isRequest && (
            <FormTextarea
              id="schedule-change-reason"
              label="Lý do đề nghị"
              rows={4}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Em có lịch thi ở trường vào giờ này, mong thầy/cô dời sang buổi chiều."
              hint={`${reason.length}/500 ký tự`}
              required
              disabled={isSubmitting}
            />
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
