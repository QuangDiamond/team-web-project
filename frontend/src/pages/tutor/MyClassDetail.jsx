import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
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
import SessionAttendance from './SessionAttendance';
import AttendanceModal from '../../components/classroom/AttendanceModal';
import TutorChangeRequestsModal from '../../components/classroom/TutorChangeRequestsModal';
import {
  createClassTopic,
  createClassMaterial,
  createClassSession,
  deleteClassMaterial,
  deleteClassSession,
  deleteClassTopic,
  getClassMaterials,
  getClassTopics,
  updateClassMaterial,
  updateClassSession,
  updateClassTopic,
} from '../../services/classroomService';
import { getUserSessions } from '../../services/sessionService';
import { getClassColorMap, getClassColorStyle } from '../../utils/classScheduleColors';
import {
  findSessionConflict,
  formatMinuteTime,
  getAvailableTimeWindows,
  getSessionsForDate,
  parseMinuteTime,
} from '../../utils/sessionAvailability';
import '../../styles/classDetail.css';
import '../../styles/mySchedule.css';

const SESSION_PAGE_SIZE = 100;
const HOUR_HEIGHT = 72;
const EMPTY_HOUR_HEIGHT = 36;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const CLASS_TABS = [
  { id: 'materials', label: 'Tài liệu và chủ đề', Icon: BookOpen },
  { id: 'schedule', label: 'Lịch học', Icon: CalendarDays },
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

function getHourHeights(sessions, hourStart, hourEnd) {
  const hourHeights = Array(hourEnd - hourStart).fill(EMPTY_HOUR_HEIGHT);

  for (const session of sessions) {
    const sessionStart = new Date(session.start_time);
    const sessionEnd = new Date(session.end_time);

    for (let hourIndex = 0; hourIndex < hourHeights.length; hourIndex += 1) {
      const hourStartTime = new Date(sessionStart);
      hourStartTime.setHours(hourStart + hourIndex, 0, 0, 0);
      const hourEndTime = new Date(hourStartTime);
      hourEndTime.setHours(hourEndTime.getHours() + 1);

      if (sessionStart < hourEndTime && sessionEnd > hourStartTime) {
        hourHeights[hourIndex] = HOUR_HEIGHT;
      }
    }
  }

  return hourHeights;
}

function getVerticalPosition(minutesFromStart, hourHeights) {
  const minutesPerHour = 60;
  const totalMinutes = hourHeights.length * minutesPerHour;
  const boundedMinutes = Math.min(Math.max(minutesFromStart, 0), totalMinutes);
  const completeHours = Math.floor(boundedMinutes / minutesPerHour);
  const minutesInCurrentHour = boundedMinutes % minutesPerHour;
  let position = 0;

  for (let hourIndex = 0; hourIndex < completeHours; hourIndex += 1) {
    position += hourHeights[hourIndex];
  }

  if (completeHours < hourHeights.length) {
    position += (minutesInCurrentHour / minutesPerHour) * hourHeights[completeHours];
  }

  return position;
}

function getMinutesFromPosition(position, hourHeights) {
  let remainingPosition = Math.max(0, position);
  let minutesFromStart = 0;

  for (const hourHeight of hourHeights) {
    if (remainingPosition <= hourHeight) {
      minutesFromStart += (remainingPosition / hourHeight) * 60;
      return minutesFromStart;
    }

    remainingPosition -= hourHeight;
    minutesFromStart += 60;
  }

  return minutesFromStart;
}

function getSessionLayout(sessions, hourStart, hourEnd, hourHeights, colorByClassId) {
  const events = sessions.map((session) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
    const durationMinutes = Math.max(30, (endTime.getTime() - startTime.getTime()) / 60000);

    return {
      session: session,
      top: getVerticalPosition(startOffset, hourHeights),
      height: Math.max(
        28,
        getVerticalPosition(endOffset, hourHeights) - getVerticalPosition(startOffset, hourHeights),
      ),
      colorHue: colorByClassId.get(session.class_id) || 0,
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

function getFirstFieldError(fieldErrors, field) {
  const messages = fieldErrors[field];
  if (Array.isArray(messages)) {
    return messages[0] || '';
  }
  return messages || '';
}

async function getAllTutorSessions() {
  const firstResponse = await getUserSessions({ page: 1, limit: SESSION_PAGE_SIZE });
  const allSessions = [...firstResponse.data.items];
  const totalPages = firstResponse.data.pagination.totalPages;
  const otherPageNumbers = [];

  for (let page = 2; page <= totalPages; page += 1) {
    otherPageNumbers.push(page);
  }

  const otherPages = await Promise.all(otherPageNumbers.map((page) => (
    getUserSessions({ page: page, limit: SESSION_PAGE_SIZE })
  )));

  for (const page of otherPages) {
    allSessions.push(...page.data.items);
  }

  return allSessions.map((session) => ({
    ...session,
    class_name: session.classroom?.name || 'Lớp chưa đặt tên',
  }));
}

function ClassSessionFormModal({ session, sessions, initialValues, defaultClassId, onClose, onSave, onSuccess }) {
  const [values, setValues] = useState(() => {
    if (!session) {
      return {
        title: '',
        date: initialValues ? initialValues.date : '',
        start_time: initialValues ? initialValues.start_time : '',
        end_time: initialValues ? initialValues.end_time : '',
        meeting_link: '',
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWindowKey, setSelectedWindowKey] = useState('');
  const busySessions = useMemo(
    () => getSessionsForDate(sessions, values.date, session ? session._id : null),
    [sessions, values.date, session],
  );
  const availableWindows = useMemo(() => getAvailableTimeWindows(busySessions), [busySessions]);
  const currentStartMinute = parseMinuteTime(values.start_time);
  const currentEndMinute = parseMinuteTime(values.end_time);
  const selectedWindow = availableWindows.find((window) => (
    `${window.startMinute}-${window.endMinute}` === selectedWindowKey
  )) || availableWindows.find((window) => (
    currentStartMinute !== null
    && currentEndMinute !== null
    && currentStartMinute >= window.startMinute
    && currentEndMinute <= window.endMinute
  )) || availableWindows[0] || null;
  const canSkipAvailabilityCheck = values.status === 'CANCELLED';
  const conflictingSession = canSkipAvailabilityCheck
    ? null
    : findSessionConflict(busySessions, currentStartMinute, currentEndMinute);
  const isOutsideSelectedWindow = !canSkipAvailabilityCheck && Boolean(selectedWindow && (
    currentStartMinute < selectedWindow.startMinute || currentEndMinute > selectedWindow.endMinute
  ));

  const handleWindowChange = (windowKey) => {
    setSelectedWindowKey(windowKey);
    const chosenWindow = availableWindows.find((window) => `${window.startMinute}-${window.endMinute}` === windowKey);
    if (chosenWindow) {
      const startMinute = chosenWindow.startMinute;
      const endMinute = Math.min(startMinute + 60, chosenWindow.endMinute);
      setValues((currentValues) => ({
        ...currentValues,
        start_time: formatMinuteTime(startMinute),
        end_time: formatMinuteTime(endMinute),
      }));
    }
  };

  const handleChange = (field, value) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: '' }));
    setFormError('');
  };

  const isEditing = Boolean(session);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!values.title.trim()) {
      setFieldErrors({ title: 'Vui lòng nhập tên buổi học.' });
      return;
    }

    const startTime = new Date(`${values.date}T${values.start_time}`);
    const endTime = new Date(`${values.date}T${values.end_time}`);
    if (startTime <= new Date() && !canSkipAvailabilityCheck) {
      setFieldErrors({ start_time: 'Giờ bắt đầu phải sau thời điểm hiện tại.' });
      return;
    }
    if (endTime <= startTime) {
      setFieldErrors({ end_time: 'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.' });
      return;
    }
    if (!canSkipAvailabilityCheck && (conflictingSession || !selectedWindow || isOutsideSelectedWindow
      || currentStartMinute < selectedWindow.startMinute
      || currentEndMinute > selectedWindow.endMinute)) {
      setFormError('Khung giờ này đã bị chiếm. Hãy chọn một khung giờ trống trong ngày.');
      return;
    }

    setIsSubmitting(true);
    const sessionData = {
      title: values.title.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      meeting_link: values.meeting_link.trim() || null,
    };
    if (session) {
      sessionData.status = values.status;
    }

    const sessionClassId = session ? session.class_id : defaultClassId;
    const result = await onSave(sessionData, session ? session._id : null, sessionClassId);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess(startTime, result.session);
      onClose();
      return;
    }
    setFormError(result.message);
    setFieldErrors(result.errors || {});
  };

  return (
    <Modal title={isEditing ? 'Chỉnh sửa buổi học' : 'Tạo buổi học'} onClose={onClose}>
      <form className="class-create-form class-session-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="class-session-title"
          label="Tên buổi học"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          error={getFirstFieldError(fieldErrors, 'title')}
          placeholder="Ví dụ: Buổi học Đại số"
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
        {values.date && (
          <div className="session-availability-panel">
            <strong>Lịch đã có trong ngày</strong>
            {busySessions.length === 0 ? (
              <p>Chưa có buổi học nào khác trong ngày này.</p>
            ) : (
              <ul>
                {busySessions.map((busySession) => (
                  <li key={busySession._id}>
                    <strong>{busySession.class_name || busySession.classroom?.name || 'Lớp học'}</strong>
                    <span>{busySession.title || 'Buổi học'} · {formatMinuteTime((new Date(busySession.start_time).getHours() * 60) + new Date(busySession.start_time).getMinutes())}–{formatMinuteTime((new Date(busySession.end_time).getHours() * 60) + new Date(busySession.end_time).getMinutes())}</span>
                  </li>
                ))}
              </ul>
            )}
            {availableWindows.length > 0 ? (
              <div className="form-field session-availability-select">
                <label className="form-label" htmlFor="class-session-available-window">Khung giờ còn trống</label>
                <div className="form-control">
                  <select
                    id="class-session-available-window"
                    value={selectedWindow ? `${selectedWindow.startMinute}-${selectedWindow.endMinute}` : ''}
                    onChange={(event) => handleWindowChange(event.target.value)}
                    disabled={isSubmitting}
                  >
                    {availableWindows.map((window) => (
                      <option key={`${window.startMinute}-${window.endMinute}`} value={`${window.startMinute}-${window.endMinute}`}>
                        {formatMinuteTime(window.startMinute)} – {formatMinuteTime(window.endMinute)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="session-availability-empty">Ngày này đã kín lịch.</p>
            )}
          </div>
        )}
        <div className="class-session-time-fields">
          <div className="form-field">
            <label className="form-label" htmlFor="class-session-start-time">Giờ bắt đầu</label>
            <div className="form-control">
              <input
                id="class-session-start-time"
                type="time"
                value={values.start_time}
                onChange={(event) => handleChange('start_time', event.target.value)}
                min={selectedWindow ? formatMinuteTime(selectedWindow.startMinute) : undefined}
                max={selectedWindow ? formatMinuteTime(selectedWindow.endMinute) : undefined}
                aria-invalid={Boolean(getFirstFieldError(fieldErrors, 'start_time'))}
                aria-describedby={fieldErrors.start_time ? 'class-session-start-time-error' : undefined}
                required
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.start_time && <p id="class-session-start-time-error" className="form-error">{getFirstFieldError(fieldErrors, 'start_time')}</p>}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="class-session-end-time">Giờ kết thúc</label>
            <div className="form-control">
              <input
                id="class-session-end-time"
                type="time"
                value={values.end_time}
                onChange={(event) => handleChange('end_time', event.target.value)}
                min={values.start_time || (selectedWindow ? formatMinuteTime(selectedWindow.startMinute) : undefined)}
                max={selectedWindow ? formatMinuteTime(selectedWindow.endMinute) : undefined}
                aria-invalid={Boolean(getFirstFieldError(fieldErrors, 'end_time'))}
                aria-describedby={fieldErrors.end_time ? 'class-session-end-time-error' : undefined}
                required
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.end_time && <p id="class-session-end-time-error" className="form-error">{getFirstFieldError(fieldErrors, 'end_time')}</p>}
          </div>
        </div>
        <FormInput
          id="class-session-meeting-link"
          label="Liên kết buổi học (không bắt buộc)"
          value={values.meeting_link}
          onChange={(event) => handleChange('meeting_link', event.target.value)}
          placeholder="https://meet.google.com/..."
          maxLength={2048}
          disabled={isSubmitting}
        />
        {conflictingSession && (
          <Alert type="error">
            <p>Giờ này trùng với {conflictingSession.class_name || conflictingSession.classroom?.name || 'lớp khác'} ({conflictingSession.title || 'buổi học'}). Chọn khung trống phía trên nhé.</p>
          </Alert>
        )}
        {isOutsideSelectedWindow && !conflictingSession && (
          <Alert type="error"><p>Giờ đã chọn nằm ngoài khung còn trống. Chọn khung giờ khác phía trên nhé.</p></Alert>
        )}
        {values.date && availableWindows.length === 0 && (
          <Alert type="error"><p>Ngày này đã kín lịch, không thể thêm buổi học.</p></Alert>
        )}
        {isEditing && (
          <FormSelect
            id="class-session-status"
            label="Trạng thái"
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value)}
            options={[
              { value: 'SCHEDULED', label: 'Đã lên lịch' },
              { value: 'CANCELLED', label: 'Đã hủy' },
              { value: 'COMPLETED', label: 'Đã hoàn thành' },
            ]}
            disabled={isSubmitting}
          />
        )}
        {formError && <Alert type="error"><p>{formError}</p></Alert>}
        <div className="class-session-form-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting || (!canSkipAvailabilityCheck && (Boolean(conflictingSession) || !selectedWindow || isOutsideSelectedWindow))}>
            {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo buổi học'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ClassSchedule({ sessions, classId, isLoading, error, onRetry, onSaveSession, onDeleteSession }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotError, setSelectedSlotError] = useState('');
  const [attendanceSession, setAttendanceSession] = useState(null);
  const attendancePreviewRef = useRef(null);
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
  const colorByClassId = useMemo(() => getClassColorMap(sessions), [sessions]);

  useEffect(() => {
    if (attendanceSession && attendancePreviewRef.current) {
      attendancePreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [attendanceSession]);

  const hourStart = 6;
  const hourEnd = 24;

  const hourHeights = getHourHeights(weekSessions, hourStart, hourEnd);
  const hourCount = hourHeights.length;
  const hourTops = [];
  let gridHeight = 0;
  for (let hourIndex = 0; hourIndex < hourCount; hourIndex += 1) {
    hourTops.push(gridHeight);
    gridHeight += hourHeights[hourIndex];
  }
  const hourLines = [...hourTops, gridHeight];

  const timeLabels = [];
  for (let hourIndex = 0; hourIndex < hourCount; hourIndex += 1) {
    const hour = hourStart + hourIndex;
    const hourDate = new Date(2000, 0, 1, hour, 0, 0, 0);
    timeLabels.push({
      label: TIME_FORMATTER.format(hourDate),
      height: hourHeights[hourIndex],
    });
  }

  const moveWeek = (amount) => {
    setWeekStart((currentWeekStart) => {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + (amount * 7));
      return nextWeekStart;
    });
    setSelectedSlot(null);
    setSelectedSlotError('');
  };

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart(new Date()));
    setSelectedSlot(null);
    setSelectedSlotError('');
  };

  const handleCalendarColumnClick = (event, day) => {
    const columnBounds = event.currentTarget.getBoundingClientRect();
    const minutesFromTop = getMinutesFromPosition(event.clientY - columnBounds.top, hourHeights);
    const roundedMinutesFromTop = Math.floor(minutesFromTop / 15) * 15;
    const dayMinutes = Math.min((hourStart * 60) + roundedMinutesFromTop, (23 * 60) + 45);
    const startTime = new Date(day);
    startTime.setHours(0, dayMinutes, 0, 0);

    if (startTime <= new Date()) {
      setSelectedSlot(null);
      setSelectedSlotError('Hãy chọn một khung giờ trong tương lai để tạo buổi học.');
      return;
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);
    if (!isSameDay(startTime, endTime)) {
      endTime.setHours(23, 59, 0, 0);
    }

    const nextSelectedSlot = {
      date: formatDateInput(startTime),
      start_time: formatTimeInput(startTime),
      end_time: formatTimeInput(endTime),
    };
    setSelectedSlot(nextSelectedSlot);
    setSelectedSlotError('');
    setIsCreateOpen(true);
  };

  const openCreateForm = (initialValues) => {
    setIsCreateOpen(true);
    setSelectedSlotError('');
    if (!initialValues) {
      setSelectedSlot(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) {
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    const result = await onDeleteSession(sessionToDelete._id, sessionToDelete.class_id);
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
          <span>Đang tải các buổi học...</span>
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
              {DATE_RANGE_FORMATTER.format(weekStart)}
              {' – '}
              {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
                .toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
          <span>Tuần này chưa có buổi học. Chọn một khung giờ trong tương lai để tạo buổi học, hoặc dùng các nút mũi tên để xem tuần khác.</span>
          </div>
        )}
        {selectedSlotError && <p className="schedule-slot-error" role="status">{selectedSlotError}</p>}
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
              {timeLabels.map((timeLabel) => (
                <span
                  key={timeLabel.label}
                  style={{ '--schedule-hour-height': `${timeLabel.height}px` }}
                >
                  {timeLabel.label}
                </span>
              ))}
            </div>

            {days.map((day) => {
              const daySessions = weekSessions.filter((session) => isSameDay(new Date(session.start_time), day));
              const events = getSessionLayout(daySessions, hourStart, hourEnd, hourHeights, colorByClassId);
              const dayIsToday = isSameDay(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={dayIsToday ? 'schedule-day-column schedule-day-column-selectable is-today' : 'schedule-day-column schedule-day-column-selectable'}
                  style={{ height: `${gridHeight}px` }}
                  title="Chọn khung giờ trống để tạo buổi học"
                  onClick={(event) => handleCalendarColumnClick(event, day)}
                >
                  {hourLines.map((top) => (
                    <span key={top} className="schedule-hour-line" style={{ top: `${top}px` }} />
                  ))}
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
                        className="schedule-event schedule-event-class-view"
                        style={{ ...getClassColorStyle(event.colorHue), ...eventStyle }}
                        onClick={(eventClick) => eventClick.stopPropagation()}
                      >
                        <span className={String(event.session.class_id) === String(classId)
                          ? 'schedule-event-class-tag is-current-class'
                          : 'schedule-event-class-tag is-other-class'}
                        >
                          {String(event.session.class_id) === String(classId) ? 'THIS CLASS' : 'OTHER CLASS'}
                        </span>
                        <div className="schedule-event-heading">
                          <div className="schedule-event-class-info">
                            <strong className="schedule-event-class-label">{event.session.class_name}</strong>
                            <span className="schedule-event-title">{event.session.title || 'Buổi học'}</span>
                          </div>
                          <div className="schedule-event-actions">
                            {event.session.meeting_link && (
                              <a
                                className="schedule-event-action"
                                href={event.session.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Mở liên kết buổi học ${event.session.title || 'Buổi học'}`}
                                title="Mở liên kết buổi học"
                              >
                                <ExternalLink size={13} aria-hidden="true" />
                              </a>
                            )}
                            <button
                              type="button"
                              className="schedule-event-action"
                              onClick={() => setAttendanceSession(event.session)}
                              disabled={!sessionHasStarted}
                              aria-label={`Điểm danh ${event.session.title || 'buổi học'}`}
                              title={sessionHasStarted ? 'Điểm danh' : 'Chỉ có thể điểm danh từ giờ bắt đầu buổi học'}
                              aria-expanded={attendanceSession?._id === event.session._id}
                              aria-controls="session-attendance-preview"
                            >
                              <ClipboardCheck size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="schedule-event-action"
                              onClick={() => setSessionToEdit(event.session)}
                              disabled={sessionHasStarted}
                              aria-label={sessionHasStarted ? 'Không thể chỉnh sửa buổi học đã bắt đầu' : 'Chỉnh sửa buổi học'}
                              title={sessionHasStarted ? 'Không thể chỉnh sửa buổi học đã bắt đầu' : 'Chỉnh sửa buổi học'}
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
                              aria-label={sessionHasStarted ? 'Không thể xóa buổi học đã bắt đầu' : 'Xóa buổi học'}
                              title={sessionHasStarted ? 'Không thể xóa buổi học đã bắt đầu' : 'Xóa buổi học'}
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="schedule-timezone-note">Giờ hiển thị theo múi giờ trên thiết bị của bạn.</p>
      {attendanceSession && (
        <div ref={attendancePreviewRef}>
          <SessionAttendance
            key={`${attendanceSession.class_id}-${attendanceSession._id}`}
            classId={attendanceSession.class_id}
            sessionId={attendanceSession._id}
            embedded
            onClose={() => setAttendanceSession(null)}
          />
        </div>
      )}
      {isCreateOpen && (
        <ClassSessionFormModal
          key="create-session"
          session={null}
          sessions={sessions}
          defaultClassId={classId}
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
          sessions={sessions}
          defaultClassId={sessionToEdit.class_id}
          onClose={() => setSessionToEdit(null)}
          onSave={onSaveSession}
          onSuccess={(startTime) => setWeekStart(getWeekStart(startTime))}
        />
      )}
      {sessionToDelete && (
        <Modal title="Xóa buổi học" onClose={() => setSessionToDelete(null)}>
          <p className="class-session-delete-copy">
            Bạn có chắc muốn xóa “{sessionToDelete.title || 'Buổi học'}” không? Thao tác này không thể hoàn tác.
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
              {isDeleting ? 'Đang xóa...' : 'Xóa buổi học'}
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
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const [localActiveTab, setLocalActiveTab] = useState(requestedTab === 'schedule' ? 'schedule' : 'materials');
  const activeTab = embedded ? providedActiveTab : localActiveTab;

  useEffect(() => {
    if (!embedded) {
      const tabFromUrl = new URLSearchParams(location.search).get('tab');
      setLocalActiveTab(tabFromUrl === 'schedule' ? 'schedule' : 'materials');
    }
  }, [classId, embedded, location.search]);

  const [toast, setToast] = useState(null);
  const [topics, setTopics] = useState([]);
  const [newlyCreatedTopicId, setNewlyCreatedTopicId] = useState(null);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [createTopicError, setCreateTopicError] = useState('');
  const [createTopicNotice, setCreateTopicNotice] = useState('');
  const [topicActionError, setTopicActionError] = useState('');
  const [createMaterialError, setCreateMaterialError] = useState('');
  const [createMaterialNotice, setCreateMaterialNotice] = useState(null);
  const [newlyCreatedMaterialId, setNewlyCreatedMaterialId] = useState(null);
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
    getAllTutorSessions()
      .then((tutorSessions) => {
        if (isCurrentRequest) {
          setSessions(tutorSessions);
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
    setCreateTopicError('');
    setCreateTopicNotice('');
    try {
      const response = await createClassTopic(classId, { name: topicName });
      setTopics((currentTopics) => [...currentTopics, response.data]);
      setNewlyCreatedTopicId(response.data._id);
      setCreateTopicNotice(response.message);
      showToast('success', response.message);
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
    setCreateMaterialError('');
    setCreateMaterialNotice(null);
    try {
      const response = await createClassMaterial(classId, formData);
      setMaterials((currentMaterials) => [...currentMaterials, response.data]);
      setNewlyCreatedMaterialId(response.data._id);
      setCreateMaterialNotice({ type: 'success', message: response.message });
      showToast('success', response.message);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleUpdateMaterial = async (materialId, formData) => {
    setCreateMaterialError('');
    setCreateMaterialNotice(null);
    try {
      const response = await updateClassMaterial(classId, materialId, formData);
      setMaterials((currentMaterials) => currentMaterials.map((material) => (
        material._id === materialId ? response.data : material
      )));
      if (response.data.old_file_deleted === false) {
        const message = 'Tài liệu đã cập nhật, nhưng chưa xóa được file cũ trên Cloudinary.';
        setCreateMaterialNotice({ type: 'info', message });
        showToast('success', message);
      } else {
        setCreateMaterialNotice({ type: 'success', message: response.message });
        showToast('success', response.message);
      }
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    setCreateMaterialError('');
    setCreateMaterialNotice(null);
    try {
      const response = await deleteClassMaterial(classId, materialId);
      setMaterials((currentMaterials) => currentMaterials.filter((material) => material._id !== materialId));
      if (response.data.cloudinary_deleted === false) {
        const message = 'Đã xóa tài liệu, nhưng chưa xóa được file trên Cloudinary.';
        setCreateMaterialNotice({ type: 'info', message });
        showToast('success', message);
      } else {
        setCreateMaterialNotice({ type: 'success', message: response.message });
        showToast('success', response.message);
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
    getAllTutorSessions()
      .then((tutorSessions) => setSessions(tutorSessions))
      .catch((error) => setSessionsError(error.message))
      .finally(() => setSessionsLoading(false));
  };

  const handleSaveSession = async (sessionData, sessionId, targetClassId) => {
    try {
      let response;
      if (sessionId) {
        response = await updateClassSession(targetClassId, sessionId, sessionData);
      } else {
        response = await createClassSession(targetClassId, sessionData);
      }

      setSessions((currentSessions) => {
        const oldSession = currentSessions.find((session) => session._id === sessionId);
        const className = oldSession?.class_name
          || (String(targetClassId) === String(classId) ? classroom.name : 'Lớp chưa đặt tên');
        const updatedSession = { ...response.data, class_name: className };
        if (sessionId) {
          return currentSessions.map((session) => (
            session._id === sessionId ? updatedSession : session
          ));
        }
        return [...currentSessions, updatedSession];
      });
      const successMessage = response.message || (
        sessionId
          ? 'Đã cập nhật buổi học thành công.'
          : 'Đã tạo buổi học thành công.'
      );
      showToast('success', successMessage);
      return { success: true, message: successMessage, session: response.data };
    } catch (error) {
      return { success: false, message: error.message, errors: error.errors };
    }
  };

  const handleDeleteSession = async (sessionId, targetClassId) => {
    try {
      const response = await deleteClassSession(targetClassId, sessionId);
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
            newlyCreatedTopicId={newlyCreatedTopicId}
            materials={materials}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            createTopicError={createTopicError}
            createTopicNotice={createTopicNotice}
            topicActionError={topicActionError}
            onRetryTopics={handleRetryLoadingTopics}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onCreateMaterial={handleCreateMaterial}
            createMaterialError={createMaterialError}
            createMaterialNotice={createMaterialNotice}
            newlyCreatedMaterialId={newlyCreatedMaterialId}
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
            classId={classId}
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
            newlyCreatedTopicId={newlyCreatedTopicId}
            materials={materials}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            createTopicError={createTopicError}
            createTopicNotice={createTopicNotice}
            topicActionError={topicActionError}
            onRetryTopics={handleRetryLoadingTopics}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onCreateMaterial={handleCreateMaterial}
            createMaterialError={createMaterialError}
            createMaterialNotice={createMaterialNotice}
            newlyCreatedMaterialId={newlyCreatedMaterialId}
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
            classId={classId}
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
