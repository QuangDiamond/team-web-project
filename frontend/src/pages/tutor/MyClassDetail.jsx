import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  Video,
  RotateCcw,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import Modal from '../../components/common/Modal';
import ClassroomTopicsAndMaterials from '../../components/tutorClassroom/ClassroomTopicsAndMaterials';
import AttendanceModal from '../../components/classroom/AttendanceModal';
import TutorChangeRequestsModal from '../../components/classroom/TutorChangeRequestsModal';
import {
  createClassTopic,
  createClassMaterial,
  createClassSession,
  deleteClassMaterial,
  deleteClassSession,
  deleteClassTopic,
  getClassSessions,
  getClassMaterials,
  getClassTopics,
  updateClassMaterial,
  updateClassSession,
  updateClassTopic,
} from '../../services/classroomService';
import '../../styles/classDetail.css';
import '../../styles/mySchedule.css';

const SESSION_PAGE_SIZE = 100;
const HOUR_HEIGHT = 40;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

const CLASS_TABS = [
  { id: 'materials', label: 'Tài liệu & Chủ đề', Icon: BookOpen },
  { id: 'schedule', label: 'Lịch học lớp học', Icon: CalendarDays },
];

function getWeekStart(date) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekDays(weekStart) {
  const days = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayIndex);
    days.push(day);
  }
  return days;
}

function isSameDay(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function getSessionLayout(sessions, hourStart) {
  const events = sessions.map((session, index) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
    const durationMinutes = Math.max(30, (endTime.getTime() - startTime.getTime()) / 60000);

    return {
      session: session,
      top: (startOffset / 60) * HOUR_HEIGHT,
      height: Math.max(76, (durationMinutes / 60) * HOUR_HEIGHT),
      colorIndex: index % 5,
    };
  });

  events.sort((first, second) => first.top - second.top);

  const positionedEvents = [];
  let overlappingGroup = [];
  let groupEnd = -1;

  const addGroupToLayout = () => {
    const laneEnds = [];
    for (const event of overlappingGroup) {
      let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= event.top);
      if (laneIndex === -1) {
        laneIndex = laneEnds.length;
        laneEnds.push(event.top + event.height);
      } else {
        laneEnds[laneIndex] = event.top + event.height;
      }
      event.laneIndex = laneIndex;
    }

    for (const event of overlappingGroup) {
      event.laneCount = laneEnds.length;
      positionedEvents.push(event);
    }
    overlappingGroup = [];
    groupEnd = -1;
  };

  for (const event of events) {
    if (overlappingGroup.length > 0 && event.top >= groupEnd) {
      addGroupToLayout();
    }
    overlappingGroup.push(event);
    groupEnd = Math.max(groupEnd, event.top + event.height);
  }
  addGroupToLayout();

  return positionedEvents;
}

function formatSessionTime(session) {
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  return `${TIME_FORMATTER.format(startTime)} – ${TIME_FORMATTER.format(endTime)}`;
}

function formatDateInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function getAllClassSessions(classId) {
  const firstResponse = await getClassSessions(classId, { page: 1, limit: SESSION_PAGE_SIZE });
  const allSessions = [...firstResponse.data.items];
  const totalPages = firstResponse.data.pagination.totalPages;
  const otherPageNumbers = [];

  for (let page = 2; page <= totalPages; page += 1) {
    otherPageNumbers.push(page);
  }

  const otherPages = await Promise.all(otherPageNumbers.map((page) => (
    getClassSessions(classId, { page: page, limit: SESSION_PAGE_SIZE })
  )));

  for (const page of otherPages) {
    allSessions.push(...page.data.items);
  }

  return allSessions;
}

function ClassSessionFormModal({ session, initialValues, onClose, onSave, onSuccess }) {
  const [values, setValues] = useState(() => {
    if (!session) {
      return {
        title: '',
        date: initialValues ? initialValues.date : '',
        start_time: initialValues ? initialValues.start_time : '',
        end_time: initialValues ? initialValues.end_time : '',
        meeting_link: '',
        status: 'SCHEDULED',
      };
    }
    return {
      title: session.title || '',
      date: formatDateInput(session.start_time),
      start_time: formatTimeInput(session.start_time),
      end_time: formatTimeInput(session.end_time),
      meeting_link: session.meeting_link || '',
      status: session.status || 'SCHEDULED',
    };
  });
  const [isRepeating, setIsRepeating] = useState(false);
  const [selectedDays, setSelectedDays] = useState(['MON']);
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const isEditing = Boolean(session);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!values.title.trim()) {
      setFormError('Vui lòng nhập tên buổi học.');
      return;
    }

    const startTime = new Date(`${values.date}T${values.start_time}`);
    const endTime = new Date(`${values.date}T${values.end_time}`);
    if (startTime <= new Date()) {
      setFormError('Thời gian bắt đầu buổi học phải ở trong tương lai.');
      return;
    }
    if (endTime <= startTime) {
      setFormError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    // BR-10: Thời lượng từ 15 phút đến 300 phút (5 tiếng)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
    if (durationMinutes < 15 || durationMinutes > 300) {
      setFormError('Thời lượng buổi học phải từ 15 phút đến 300 phút (5 tiếng).');
      return;
    }

    const payload = {
      title: values.title.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      meeting_link: values.meeting_link.trim() || null,
      status: values.status,
    };

    // Quy tắc lặp lại hàng tuần (BR-10: Tối đa 6 tháng)
    if (!isEditing && isRepeating) {
      if (selectedDays.length === 0) {
        setFormError('Vui lòng chọn ít nhất 1 ngày trong tuần để lặp lại.');
        return;
      }
      if (!repeatEndDate) {
        setFormError('Vui lòng chọn ngày kết thúc cho chu kỳ lặp lại.');
        return;
      }
      const endRepeat = new Date(`${repeatEndDate}T23:59:59`);
      const maxRepeat = new Date(startTime.getTime() + 185 * 24 * 60 * 60 * 1000);
      if (endRepeat <= startTime) {
        setFormError('Ngày kết thúc chu kỳ lặp lại phải sau ngày học đầu tiên.');
        return;
      }
      if (endRepeat > maxRepeat) {
        setFormError('Chu kỳ lặp lại không được vượt quá 6 tháng theo quy định BR-10.');
        return;
      }

      payload.repeat = {
        days_of_week: selectedDays,
        end_date: endRepeat.toISOString(),
      };
    }

    setIsSubmitting(true);
    const result = await onSave(payload, session ? session._id : null);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess(startTime, result.session);
      onClose();
      return;
    }
    toast.error(result.message);
  };

  return (
    <Modal title={isEditing ? 'Chỉnh sửa buổi học' : 'Tạo buổi học mới'} onClose={onClose}>
      <form className="class-create-form class-session-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="class-session-title"
          label="Tên buổi học"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          placeholder="Ví dụ: Bài giảng Hàm số và Đồ thị"
          maxLength={200}
          disabled={isSubmitting}
        />
        <div className="form-field">
          <label className="form-label" htmlFor="class-session-date">Ngày học</label>
          <div className="form-control">
            <input
              id="class-session-date"
              type="date"
              value={values.date}
              onChange={(event) => handleChange('date', event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="class-session-time-fields">
          <div className="form-field">
            <label className="form-label" htmlFor="class-session-start-time">Giờ bắt đầu</label>
            <div className="form-control">
              <input
                id="class-session-start-time"
                type="time"
                value={values.start_time}
                onChange={(event) => handleChange('start_time', event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="class-session-end-time">Giờ kết thúc</label>
            <div className="form-control">
              <input
                id="class-session-end-time"
                type="time"
                value={values.end_time}
                onChange={(event) => handleChange('end_time', event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        <FormInput
          id="class-session-meeting-link"
          label="Link phòng học trực tuyến (Google Meet / Zoom)"
          value={values.meeting_link}
          onChange={(event) => handleChange('meeting_link', event.target.value)}
          placeholder="https://meet.google.com/..."
          maxLength={2048}
          disabled={isSubmitting}
        />
        <FormSelect
          id="class-session-status"
          label="Trạng thái"
          value={values.status}
          onChange={(event) => handleChange('status', event.target.value)}
          options={[
            { value: 'SCHEDULED', label: 'Đã lên lịch (Scheduled)' },
            { value: 'CANCELLED', label: 'Đã hủy (Cancelled)' },
            { value: 'COMPLETED', label: 'Đã hoàn thành (Completed)' },
          ]}
          disabled={isSubmitting}
        />

        {/* Cấu hình lặp lại (Chỉ khả dụng khi tạo mới) */}
        {!isEditing && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                color: '#0f172a',
              }}
            >
              <input
                type="checkbox"
                checked={isRepeating}
                onChange={(e) => setIsRepeating(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Lặp lại hàng tuần theo lịch (Tối đa 6 tháng)</span>
            </label>

            {isRepeating && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#475569',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Các thứ trong tuần:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { key: 'MON', label: 'T2' },
                      { key: 'TUE', label: 'T3' },
                      { key: 'WED', label: 'T4' },
                      { key: 'THU', label: 'T5' },
                      { key: 'FRI', label: 'T6' },
                      { key: 'SAT', label: 'T7' },
                      { key: 'SUN', label: 'CN' },
                    ].map((day) => {
                      const isChecked = selectedDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedDays(selectedDays.filter((d) => d !== day.key));
                            } else {
                              setSelectedDays([...selectedDays, day.key]);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: isChecked ? '#ea580c' : '#cbd5e1',
                            backgroundColor: isChecked ? '#fff7ed' : '#ffffff',
                            color: isChecked ? '#c2410c' : '#334155',
                            fontSize: '12px',
                            fontWeight: isChecked ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="repeat-end-date" style={{ fontSize: '12px' }}>
                    Lặp lại đến ngày (Tối đa 6 tháng):
                  </label>
                  <div className="form-control">
                    <input
                      id="repeat-end-date"
                      type="date"
                      value={repeatEndDate}
                      onChange={(e) => setRepeatEndDate(e.target.value)}
                      disabled={isSubmitting}
                      required={isRepeating}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {formError && <Alert type="error"><p>{formError}</p></Alert>}
        <div className="class-session-form-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo buổi học'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ClassSchedule({ classId, sessions, isLoading, error, onRetry, onSaveSession, onDeleteSession }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [isChangeRequestsOpen, setIsChangeRequestsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const days = getWeekDays(weekStart);
  const today = new Date();
  const weekSessions = useMemo(() => sessions
    .filter((session) => {
      const startTime = new Date(session.start_time);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return startTime >= weekStart && startTime < weekEnd;
    })
    .sort((first, second) => new Date(first.start_time) - new Date(second.start_time)), [sessions, weekStart]);

  let hourStart = 7;
  let hourEnd = 21;
  for (const session of weekSessions) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    hourStart = Math.min(hourStart, startTime.getHours());
    const nominalEndHour = Math.ceil(endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0));
    // Thẻ buổi học có min-height 76px (~1.9h với lưới 40px/h).
    // Tính khung giờ kết thúc hiển thị thực tế để thẻ không bị chạm đáy/khuất.
    const visualEndHour = Math.ceil(startTime.getHours() + (startTime.getMinutes() / 60) + (76 / HOUR_HEIGHT));
    const latestHour = Math.max(nominalEndHour, visualEndHour);
    hourEnd = Math.max(hourEnd, Math.min(24, latestHour + 1));
  }

  const hourCount = Math.max(1, hourEnd - hourStart);
  let calculatedGridHeight = hourCount * HOUR_HEIGHT;
  for (const session of weekSessions) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
    const durationMinutes = Math.max(30, (endTime.getTime() - startTime.getTime()) / 60000);
    const top = (startOffset / 60) * HOUR_HEIGHT;
    const height = Math.max(76, (durationMinutes / 60) * HOUR_HEIGHT);
    calculatedGridHeight = Math.max(calculatedGridHeight, top + height + 24);
  }
  const gridHeight = calculatedGridHeight;

  const timeLabels = [];
  for (let hour = hourStart; hour < hourEnd; hour += 1) {
    const hourDate = new Date(2000, 0, 1, hour, 0, 0, 0);
    timeLabels.push(TIME_FORMATTER.format(hourDate));
  }

  const moveWeek = (amount) => {
    setWeekStart((currentWeekStart) => {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + (amount * 7));
      return nextWeekStart;
    });
    setSelectedSlot(null);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart(new Date()));
    setSelectedSlot(null);
  };

  const handleCalendarColumnClick = (event, day) => {
    const columnBounds = event.currentTarget.getBoundingClientRect();
    const minutesFromTop = Math.max(0, event.clientY - columnBounds.top) * 60 / HOUR_HEIGHT;
    const roundedMinutesFromTop = Math.floor(minutesFromTop / 15) * 15;
    const dayMinutes = Math.min((hourStart * 60) + roundedMinutesFromTop, (23 * 60) + 45);
    const startTime = new Date(day);
    startTime.setHours(0, dayMinutes, 0, 0);

    if (startTime <= new Date()) {
      setSelectedSlot(null);
      return;
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);
    if (!isSameDay(startTime, endTime)) {
      endTime.setHours(23, 59, 0, 0);
    }

    setSelectedSlot({
      dayKey: day.toDateString(),
      top: (roundedMinutesFromTop / 60) * HOUR_HEIGHT,
      date: formatDateInput(startTime),
      start_time: formatTimeInput(startTime),
      end_time: formatTimeInput(endTime),
    });
  };

  const openCreateForm = (initialValues) => {
    setIsCreateOpen(true);
    if (!initialValues) {
      setSelectedSlot(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) {
      return;
    }
    setIsDeleting(true);
    const result = await onDeleteSession(sessionToDelete._id);
    setIsDeleting(false);
    if (result.success) {
      setSessionToDelete(null);
      return;
    }
    toast.error(result.message);
  };

  if (isLoading) {
    return (
      <div className="schedule-loading" role="status">
        <LoaderCircle size={24} className="spin" aria-hidden="true" />
        <span>Đang tải danh sách buổi học...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        <p>{error}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Thử lại</button>
      </Alert>
    );
  }

  return (
    <section className="class-schedule-section" aria-labelledby="class-schedule-title">
      <div className="schedule-toolbar">
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true"><CalendarDays size={19} /></span>
          <div>
            <h2 id="class-schedule-title">{MONTH_YEAR_FORMATTER.format(weekStart)}</h2>
            <p>
              {weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
              {' – '}
              {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
                .toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="schedule-toolbar-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ea580c', borderColor: '#fdba74' }}
            onClick={() => setIsChangeRequestsOpen(true)}
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Yêu cầu đổi lịch</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreateForm(null)}>
            <Plus size={15} aria-hidden="true" />
            Tạo buổi học
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={goToCurrentWeek}>Hôm nay</button>
          <div className="schedule-week-arrows" aria-label="Đổi tuần">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(-1)} aria-label="Tuần trước">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(1)} aria-label="Tuần sau">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="schedule-calendar-card">
        {weekSessions.length === 0 && (
          <div className="schedule-week-empty">
            <span>Không có buổi học nào trong tuần này. Sử dụng các mũi tên để xem tuần khác.</span>
          </div>
        )}
        <div className="schedule-calendar-scroll">
          <div
            className="schedule-calendar"
            style={{
              '--schedule-grid-height': `${gridHeight}px`,
              '--schedule-hour-height': `${HOUR_HEIGHT}px`,
            }}
          >
            <div className="schedule-calendar-corner" aria-hidden="true" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={isSameDay(day, today) ? 'schedule-day-heading is-today' : 'schedule-day-heading'}
              >
                <span>{WEEKDAY_FORMATTER.format(day)}</span>
                <strong>{DAY_FORMATTER.format(day)}</strong>
              </div>
            ))}

            <div className="schedule-time-axis">
              {timeLabels.map((label) => <span key={label}>{label}</span>)}
            </div>

            {days.map((day) => {
              const daySessions = weekSessions.filter((session) => isSameDay(new Date(session.start_time), day));
              const events = getSessionLayout(daySessions, hourStart);
              const dayIsToday = isSameDay(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={dayIsToday ? 'schedule-day-column schedule-day-column-selectable is-today' : 'schedule-day-column schedule-day-column-selectable'}
                  style={{ height: `${gridHeight}px` }}
                  title="Nhấp vào khung giờ trống để tạo buổi học"
                  onClick={(event) => handleCalendarColumnClick(event, day)}
                >
                  {events.map((event) => {
                    const sessionHasStarted = new Date(event.session.start_time) <= new Date();
                    const eventStyle = {
                      top: `${event.top}px`,
                      height: `${event.height}px`,
                      left: `calc(${(100 / event.laneCount) * event.laneIndex}% + 4px)`,
                      width: `calc(${100 / event.laneCount}% - 8px)`,
                      right: 'auto',
                    };

                    return (
                      <article
                        key={event.session._id}
                        className={`schedule-event schedule-event-color-${event.colorIndex}`}
                        style={eventStyle}
                        onClick={(eventClick) => eventClick.stopPropagation()}
                      >
                        <div className="schedule-event-heading">
                          <strong className="schedule-event-title">{event.session.title || 'Buổi học'}</strong>
                          <div className="schedule-event-actions">
                            <button
                              type="button"
                              className="schedule-event-action"
                              onClick={() => setAttendanceSession(event.session)}
                              title={event.session.status === 'COMPLETED' ? 'Đã điểm danh (Bấm để xem/sửa)' : 'Điểm danh học sinh'}
                              aria-label="Điểm danh học sinh"
                              style={{ color: event.session.status === 'COMPLETED' ? '#16a34a' : undefined }}
                            >
                              <UserCheck size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="schedule-event-action"
                              onClick={() => setSessionToEdit(event.session)}
                              disabled={sessionHasStarted}
                              aria-label={sessionHasStarted ? 'Không thể chỉnh sửa buổi học đã qua' : 'Chỉnh sửa buổi học'}
                              title={sessionHasStarted ? 'Không thể chỉnh sửa buổi học đã qua' : 'Chỉnh sửa buổi học'}
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="schedule-event-action schedule-event-delete-action"
                              onClick={() => {
                                setSessionToDelete(event.session);
                              }}
                              disabled={sessionHasStarted}
                              aria-label={sessionHasStarted ? 'Không thể xóa buổi học đã qua' : 'Xóa buổi học'}
                              title={sessionHasStarted ? 'Không thể xóa buổi học đã qua' : 'Xóa buổi học'}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <span className="schedule-event-time">
                          <Clock3 size={12} aria-hidden="true" />
                          {formatSessionTime(event.session)}
                        </span>
                        <div className="schedule-event-footer">
                          <span
                            className={`schedule-status-pill ${
                              event.session.status === 'CANCELLED'
                                ? 'status-cancelled'
                                : event.session.status === 'COMPLETED'
                                ? 'status-completed'
                                : 'status-scheduled'
                            }`}
                          >
                            {event.session.status === 'CANCELLED'
                              ? 'Đã hủy'
                              : event.session.status === 'COMPLETED'
                              ? 'Đã học xong'
                              : 'Sắp tới'}
                          </span>
                          {event.session.meeting_link && (
                            <a
                              className="schedule-join-btn"
                              href={event.session.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Vào phòng học"
                            >
                              <Video size={11} aria-hidden="true" />
                              <span>Vào học</span>
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {selectedSlot && selectedSlot.dayKey === day.toDateString() && (
                    <button
                      type="button"
                      className="schedule-slot-create-button"
                      style={{ top: `${selectedSlot.top}px` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openCreateForm(selectedSlot);
                      }}
                    >
                      <Plus size={13} aria-hidden="true" />
                      Tạo buổi học
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="schedule-timezone-note">Thời gian hiển thị theo múi giờ trên thiết bị của bạn.</p>
      {isCreateOpen && (
        <ClassSessionFormModal
          key="create-session"
          session={null}
          initialValues={selectedSlot}
          onClose={() => setIsCreateOpen(false)}
          onSave={onSaveSession}
          onSuccess={(startTime) => {
            setWeekStart(getWeekStart(startTime));
            setSelectedSlot(null);
          }}
        />
      )}
      {sessionToEdit && (
        <ClassSessionFormModal
          key={sessionToEdit._id}
          session={sessionToEdit}
          onClose={() => setSessionToEdit(null)}
          onSave={onSaveSession}
          onSuccess={(startTime) => setWeekStart(getWeekStart(startTime))}
        />
      )}
      {sessionToDelete && (
        <Modal title="Xóa buổi học" onClose={() => setSessionToDelete(null)}>
          <p className="class-session-delete-copy">
            Bạn có chắc muốn xóa buổi học “{sessionToDelete.title || 'Buổi học'}”? Thao tác này không thể hoàn tác.
          </p>
          <div className="class-session-form-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSessionToDelete(null)}
              disabled={isDeleting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm class-delete-confirm-button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal điểm danh học sinh (UC26.A2) */}
      <AttendanceModal
        isOpen={Boolean(attendanceSession)}
        onClose={() => setAttendanceSession(null)}
        session={attendanceSession}
        classId={classId}
        onSuccess={() => {
          onRetry();
        }}
      />

      {/* Modal xét duyệt yêu cầu đổi / hủy lịch học từ học viên (UC27 & UC28) */}
      <TutorChangeRequestsModal
        isOpen={isChangeRequestsOpen}
        onClose={() => setIsChangeRequestsOpen(false)}
        classId={classId}
        onSuccess={() => {
          onRetry();
        }}
      />
    </section>
  );
}

export default function MyClassDetail({
  embedded = false,
  classId: providedClassId,
  classroom: providedClassroom,
  activeTab: providedActiveTab,
}) {
  const routeParams = useParams();
  const location = useLocation();
  const classId = providedClassId || routeParams.classId;
  const [localActiveTab, setLocalActiveTab] = useState('materials');
  const activeTab = embedded ? providedActiveTab : localActiveTab;
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const classroom = embedded ? providedClassroom : location.state && location.state.classroom;
  const canLoadClassroom = classroom && String(classroom._id) === classId;

  useEffect(() => {
    if (!canLoadClassroom) {
      setTopicsLoading(false);
      setSessionsLoading(false);
      return;
    }

    let isCurrentRequest = true;
    setTopicsLoading(true);
    setTopicsError('');

    getClassTopics(classId, { page: 1, limit: 100 })
      .then((response) => {
        if (isCurrentRequest) {
          setTopics(response.data.items);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setTopicsError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setTopicsLoading(false);
        }
      });

    getClassMaterials(classId, { page: 1, limit: 100 })
      .then((response) => {
        if (isCurrentRequest) {
          setMaterials(response.data.items);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setMaterialsError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setMaterialsLoading(false);
        }
      });

    setSessionsLoading(true);
    setSessionsError('');
    getAllClassSessions(classId)
      .then((classSessions) => {
        if (isCurrentRequest) {
          setSessions(classSessions);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setSessionsError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setSessionsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [classId, canLoadClassroom]);

  if (!canLoadClassroom) {
    if (embedded) {
      return null;
    }
    return (
      <div className="class-detail-page">
        <Alert type="info">
          <p>Vui lòng mở lớp học này từ danh sách Lớp của tôi để tải thông tin chi tiết.</p>
          <Link to="/tutor/classes" className="link">Quay lại Lớp của tôi</Link>
        </Alert>
      </div>
    );
  }

  const handleCreateTopic = async (topicName) => {
    try {
      const response = await createClassTopic(classId, { name: topicName });
      setTopics((currentTopics) => [...currentTopics, response.data]);
      toast.success(response.message);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleUpdateTopic = async (topicId, topicName) => {
    try {
      const response = await updateClassTopic(classId, topicId, { name: topicName });
      setTopics((currentTopics) => currentTopics.map((topic) => (
        topic._id === topicId ? response.data : topic
      )));
      toast.success(response.message);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      const response = await deleteClassTopic(classId, topicId);
      setTopics((currentTopics) => currentTopics.filter((topic) => topic._id !== topicId));
      toast.success(response.message);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleCreateMaterial = async (formData) => {
    try {
      const response = await createClassMaterial(classId, formData);
      setMaterials((currentMaterials) => [...currentMaterials, response.data]);
      toast.success(response.message);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleUpdateMaterial = async (materialId, formData) => {
    try {
      const response = await updateClassMaterial(classId, materialId, formData);
      setMaterials((currentMaterials) => currentMaterials.map((material) => (
        material._id === materialId ? response.data : material
      )));
      if (!response.data.old_file_deleted) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
      }
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      const response = await deleteClassMaterial(classId, materialId);
      setMaterials((currentMaterials) => currentMaterials.filter((material) => material._id !== materialId));
      if (!response.data.cloudinary_deleted) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
      }
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleRetryLoadingMaterials = () => {
    setMaterialsLoading(true);
    setMaterialsError('');
    getClassMaterials(classId, { page: 1, limit: 100 })
      .then((response) => setMaterials(response.data.items))
      .catch((error) => setMaterialsError(error.message))
      .finally(() => setMaterialsLoading(false));
  };

  const handleRetryLoadingTopics = () => {
    setTopicsLoading(true);
    setTopicsError('');
    getClassTopics(classId, { page: 1, limit: 100 })
      .then((response) => setTopics(response.data.items))
      .catch((error) => setTopicsError(error.message))
      .finally(() => setTopicsLoading(false));
  };

  const handleRetryLoadingSessions = () => {
    setSessionsLoading(true);
    setSessionsError('');
    getAllClassSessions(classId)
      .then((classSessions) => setSessions(classSessions))
      .catch((error) => setSessionsError(error.message))
      .finally(() => setSessionsLoading(false));
  };

  const handleSaveSession = async (sessionData, sessionId) => {
    try {
      let response;
      if (sessionId) {
        response = await updateClassSession(classId, sessionId, sessionData);
      } else {
        response = await createClassSession(classId, sessionData);
      }

      // Nếu tạo lịch lặp lại hoặc tạo buổi học mới, load lại tất cả buổi học để phản ánh đầy đủ
      if (sessionData.repeat || !sessionId) {
        const all = await getAllClassSessions(classId);
        setSessions(all);
      } else {
        setSessions((currentSessions) => {
          return currentSessions.map((session) => (
            session._id === sessionId ? response.data : session
          ));
        });
      }
      toast.success(response.message);
      return { success: true, message: response.message, session: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await deleteClassSession(classId, sessionId);
      setSessions((currentSessions) => currentSessions.filter((session) => session._id !== sessionId));
      toast.success(response.message);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const classMeta = [];
  if (classroom.subject) {
    classMeta.push(classroom.subject);
  }
  if (classroom.grade) {
    classMeta.push(classroom.grade);
  }

  if (embedded) {
    return (
      <>
        {activeTab === 'materials' && (
          <ClassroomTopicsAndMaterials
            classId={classId}
            topics={topics}
            materials={materials}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            onRetryTopics={handleRetryLoadingTopics}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onCreateMaterial={handleCreateMaterial}
            materialsLoading={materialsLoading}
            materialsError={materialsError}
            onRetryMaterials={handleRetryLoadingMaterials}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}
        {activeTab === 'schedule' && (
          <ClassSchedule
            classId={classId}
            sessions={sessions}
            isLoading={sessionsLoading}
            error={sessionsError}
            onRetry={handleRetryLoadingSessions}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </>
    );
  }

  return (
    <div className="class-detail-page">
      <Link to="/tutor/classes" className="class-detail-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Quay lại Lớp của tôi</span>
      </Link>

      <section className="class-detail-hero">
        <div className="class-detail-hero-top">
          <div className="class-detail-icon" aria-hidden="true"><BookOpen size={22} /></div>
          <span className="status-badge tone-success">{classroom.status}</span>
        </div>
        <h1>{classroom.name || 'Lớp học'}</h1>
        {classMeta.length > 0 && <p className="class-detail-subtitle">{classMeta.join(' · ')}</p>}
        {classroom.description && <p className="class-detail-description">{classroom.description}</p>}
        {classroom.capacity !== null && classroom.capacity !== undefined && (
          <div className="class-detail-facts"><span>Sĩ số: {classroom.capacity} học viên</span></div>
        )}
      </section>

      <div className="class-detail-tabs" role="tablist" aria-label="Chi tiết lớp học">
        {CLASS_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            className={activeTab === id ? 'class-detail-tab is-active' : 'class-detail-tab'}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setLocalActiveTab(id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        className="class-detail-tab-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'materials' && (
          <ClassroomTopicsAndMaterials
            classId={classId}
            topics={topics}
            materials={materials}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            onRetryTopics={handleRetryLoadingTopics}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onCreateMaterial={handleCreateMaterial}
            materialsLoading={materialsLoading}
            materialsError={materialsError}
            onRetryMaterials={handleRetryLoadingMaterials}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}
        {activeTab === 'schedule' && (
          <ClassSchedule
            classId={classId}
            sessions={sessions}
            isLoading={sessionsLoading}
            error={sessionsError}
            onRetry={handleRetryLoadingSessions}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </div>
    </div>
  );
}
