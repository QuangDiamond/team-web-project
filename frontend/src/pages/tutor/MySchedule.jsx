import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ScheduleChangeFormModal from '../../components/common/ScheduleChangeFormModal';
import ScheduleChangeRequestsPanel from '../../components/common/ScheduleChangeRequestsPanel';
import {
  ProposalEvent,
  ScheduleChangeCalendarNotes,
  ScheduleChangeLinks,
  getPendingChanges,
  getPendingClassName,
} from '../../components/common/ScheduleChangeCalendarLayer';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import Modal from '../../components/common/Modal';
import SessionAttendance from './SessionAttendance';
import { createClassSession, getMyClassroomsPage } from '../../services/classroomService';
import { getUserSessions } from '../../services/sessionService';
import { getClassColorMap, getClassColorStyle } from '../../utils/classScheduleColors';
import {
  findSessionConflict,
  formatMinuteTime,
  getAvailableTimeWindows,
  getSessionsForDate,
  parseMinuteTime,
} from '../../utils/sessionAvailability';
import '../../styles/mySchedule.css';
import '../../styles/scheduleChangeRequests.css';

const PAGE_SIZE = 100;
const HOUR_HEIGHT = 64;
const EMPTY_HOUR_HEIGHT = 18;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

async function getAllPages(loadPage) {
  const firstPage = await loadPage(1);
  const firstData = firstPage.data;
  const totalPages = firstData.pagination.totalPages;

  if (totalPages <= 1) {
    return firstData.items;
  }

  const otherPageNumbers = [];
  for (let page = 2; page <= totalPages; page += 1) {
    otherPageNumbers.push(page);
  }

  const otherPages = await Promise.all(otherPageNumbers.map((page) => loadPage(page)));
  const allItems = [...firstData.items];
  for (const page of otherPages) {
    allItems.push(...page.data.items);
  }
  return allItems;
}

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

function getSessionLayout(sessions, hourStart, hourEnd, hourHeights, colorByClassId) {
  const events = sessions.map((session) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
    const endOffset = Math.min((hourEnd - hourStart) * 60, (endTime.getHours() * 60) + endTime.getMinutes() - (hourStart * 60));
    const top = getVerticalPosition(startOffset, hourHeights);
    const endPosition = getVerticalPosition(endOffset, hourHeights);
    const height = Math.max(28, endPosition - top);

    return {
      session: session,
      top: top,
      height: height,
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

function formatTimeRange(session) {
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  return `${TIME_FORMATTER.format(startTime)} – ${TIME_FORMATTER.format(endTime)}`;
}

function getSessionConflicts(sessions) {
  const conflicts = [];
  const activeSessions = sessions.filter((session) => session.status !== 'CANCELLED');

  for (let firstIndex = 0; firstIndex < activeSessions.length; firstIndex += 1) {
    const firstSession = activeSessions[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < activeSessions.length; secondIndex += 1) {
      const secondSession = activeSessions[secondIndex];
      if (firstSession.class_id === secondSession.class_id) {
        continue;
      }

      const firstStart = new Date(firstSession.start_time);
      const firstEnd = new Date(firstSession.end_time);
      const secondStart = new Date(secondSession.start_time);
      const secondEnd = new Date(secondSession.end_time);
      if (firstStart < secondEnd && secondStart < firstEnd) {
        conflicts.push({ firstSession, secondSession });
      }
    }
  }

  return conflicts;
}

function formatConflict(conflict) {
  const firstSession = conflict.firstSession;
  const secondSession = conflict.secondSession;
  const startTime = new Date(Math.max(
    new Date(firstSession.start_time).getTime(),
    new Date(secondSession.start_time).getTime(),
  ));
  const endTime = new Date(Math.min(
    new Date(firstSession.end_time).getTime(),
    new Date(secondSession.end_time).getTime(),
  ));
  const date = DATE_RANGE_FORMATTER.format(startTime);
  return `${firstSession.class_name} và ${secondSession.class_name}, ${date}, ${TIME_FORMATTER.format(startTime)}–${TIME_FORMATTER.format(endTime)}`;
}

function CreateScheduleSessionModal({ classrooms, sessions, initialValues, onClose, onCreated }) {
  const [values, setValues] = useState({
    class_id: '',
    title: '',
    date: initialValues?.date || '',
    start_time: initialValues?.start_time || '',
    end_time: initialValues?.end_time || '',
    meeting_link: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWindowKey, setSelectedWindowKey] = useState('');

  const updateValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const startTime = values.date && values.start_time ? new Date(`${values.date}T${values.start_time}`) : null;
  const endTime = values.date && values.end_time ? new Date(`${values.date}T${values.end_time}`) : null;
  const busySessions = useMemo(() => getSessionsForDate(sessions, values.date), [sessions, values.date]);
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
  const conflictingSession = findSessionConflict(busySessions, currentStartMinute, currentEndMinute);
  const isOutsideSelectedWindow = Boolean(selectedWindow && (
    currentStartMinute < selectedWindow.startMinute || currentEndMinute > selectedWindow.endMinute
  ));

  const selectAvailableWindow = (windowKey) => {
    setSelectedWindowKey(windowKey);
    const chosenWindow = availableWindows.find((window) => `${window.startMinute}-${window.endMinute}` === windowKey);
    if (chosenWindow) {
      const startMinute = chosenWindow.startMinute;
      const endMinute = Math.min(startMinute + 60, chosenWindow.endMinute);
      setValues((current) => ({
        ...current,
        start_time: formatMinuteTime(startMinute),
        end_time: formatMinuteTime(endMinute),
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!values.class_id) {
      setError('Vui lòng chọn lớp học.');
      return;
    }
    if (!startTime || !endTime || startTime <= new Date() || endTime <= startTime) {
      setError('Vui lòng chọn thời gian hợp lệ trong tương lai.');
      return;
    }
    if (conflictingSession || !selectedWindow || isOutsideSelectedWindow) {
      setError('Khung giờ này đã bị chiếm. Hãy chọn một khung giờ trống trong ngày.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createClassSession(values.class_id, {
        title: values.title.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meeting_link: values.meeting_link.trim() || null,
      });
      onCreated();
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo buổi học. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Tạo buổi học" onClose={onClose}>
      <form className="class-create-form class-session-create-form" onSubmit={handleSubmit}>
        <FormSelect
          id="global-session-class-id"
          label="Lớp học (classId)"
          value={values.class_id}
          onChange={(event) => updateValue('class_id', event.target.value)}
          options={classrooms.map((classroom) => ({ value: classroom._id, label: classroom.name }))}
          placeholder="Chọn lớp học"
          required
          disabled={isSubmitting}
        />
        <FormInput
          id="global-session-title"
          label="Tên buổi học"
          value={values.title}
          onChange={(event) => updateValue('title', event.target.value)}
          placeholder="Ví dụ: Buổi học Đại số"
          maxLength={200}
          required
          disabled={isSubmitting}
        />
        <div className="form-field">
          <label className="form-label" htmlFor="global-session-date">Ngày học</label>
          <div className="form-control"><input id="global-session-date" type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} required disabled={isSubmitting} /></div>
        </div>
        {values.date && (
          <div className="session-availability-panel">
            <strong>Lịch đã có trong ngày</strong>
            {busySessions.length === 0 ? (
              <p>Chưa có buổi học nào khác trong ngày này.</p>
            ) : (
              <ul>
                {busySessions.map((busySession) => {
                  const busyStart = new Date(busySession.start_time);
                  const busyEnd = new Date(busySession.end_time);
                  const startMinute = (busyStart.getHours() * 60) + busyStart.getMinutes();
                  const endMinute = (busyEnd.getHours() * 60) + busyEnd.getMinutes();
                  return (
                    <li key={busySession._id}>
                      <strong>{busySession.class_name || busySession.classroom?.name || 'Lớp học'}</strong>
                      <span>{busySession.title || 'Buổi học'} · {formatMinuteTime(startMinute)}–{formatMinuteTime(endMinute)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {availableWindows.length > 0 ? (
              <div className="form-field session-availability-select">
                <label className="form-label" htmlFor="global-session-available-window">Khung giờ còn trống</label>
                <div className="form-control">
                  <select
                    id="global-session-available-window"
                    value={selectedWindow ? `${selectedWindow.startMinute}-${selectedWindow.endMinute}` : ''}
                    onChange={(event) => selectAvailableWindow(event.target.value)}
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
            <label className="form-label" htmlFor="global-session-start">Giờ bắt đầu</label>
            <div className="form-control"><input id="global-session-start" type="time" value={values.start_time} min={selectedWindow ? formatMinuteTime(selectedWindow.startMinute) : undefined} max={selectedWindow ? formatMinuteTime(selectedWindow.endMinute) : undefined} onChange={(event) => updateValue('start_time', event.target.value)} required disabled={isSubmitting} /></div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="global-session-end">Giờ kết thúc</label>
            <div className="form-control"><input id="global-session-end" type="time" value={values.end_time} min={values.start_time || (selectedWindow ? formatMinuteTime(selectedWindow.startMinute) : undefined)} max={selectedWindow ? formatMinuteTime(selectedWindow.endMinute) : undefined} onChange={(event) => updateValue('end_time', event.target.value)} required disabled={isSubmitting} /></div>
          </div>
        </div>
        <FormInput
          id="global-session-meeting-link"
          label="Liên kết buổi học"
          value={values.meeting_link}
          onChange={(event) => updateValue('meeting_link', event.target.value)}
          placeholder="https://meet.google.com/..."
          maxLength={2048}
          disabled={isSubmitting}
        />
        {conflictingSession && <Alert type="error"><p>Giờ này trùng với {conflictingSession.class_name || conflictingSession.classroom?.name || 'lớp khác'} ({conflictingSession.title || 'buổi học'}). Chọn khung trống phía trên nhé.</p></Alert>}
        {isOutsideSelectedWindow && !conflictingSession && <Alert type="error"><p>Giờ đã chọn nằm ngoài khung còn trống. Chọn khung giờ khác phía trên nhé.</p></Alert>}
        {availableWindows.length === 0 && <Alert type="error"><p>Ngày này đã kín lịch, không thể thêm buổi học.</p></Alert>}
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="class-session-form-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting || Boolean(conflictingSession) || !selectedWindow || isOutsideSelectedWindow}>{isSubmitting ? 'Đang lưu...' : 'Tạo buổi học'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ScheduleEvent({ event, onAttendanceClick, attendanceSessionId, onScheduleChangeClick, changeClassName = '' }) {
  const session = event.session;
  const activeStudentCount = session.classroom?.active_student_count || 0;
  const isDirectClassChange = activeStudentCount !== 1;
  const canMarkAttendance = new Date(session.start_time) <= new Date();
  const hoursUntilStart = (new Date(session.start_time).getTime() - Date.now()) / (60 * 60 * 1000);
  const canRequestScheduleChange = session.status !== 'CANCELLED'
    && hoursUntilStart >= 12;
  const canChangeSchedule = session.status !== 'CANCELLED'
    && session.classroom?.status === 'ACTIVE'
    && new Date(session.start_time) > new Date()
    && (isDirectClassChange || canRequestScheduleChange);
  let scheduleChangeTitle = 'Đề nghị đổi lịch với học sinh';
  if (isDirectClassChange) {
    scheduleChangeTitle = 'Đổi lịch và thông báo học sinh';
  }
  if (session.status === 'CANCELLED') {
    scheduleChangeTitle = 'Không thể đổi buổi học đã hủy';
  } else if (session.classroom?.status !== 'ACTIVE') {
    scheduleChangeTitle = 'Chỉ lớp đang hoạt động mới được đổi lịch';
  } else if (new Date(session.start_time) <= new Date()) {
    scheduleChangeTitle = 'Không thể đổi buổi học đã bắt đầu';
  } else if (!isDirectClassChange && !canRequestScheduleChange) {
    scheduleChangeTitle = 'Cần gửi đề nghị trước buổi học ít nhất 12 giờ';
  }
  const colorStyle = {
    '--schedule-event-border': `hsl(${event.colorHue} 62% 40%)`,
    '--schedule-event-background': `hsl(${event.colorHue} 80% 95%)`,
    '--schedule-event-text': `hsl(${event.colorHue} 48% 27%)`,
  };
  const eventStyle = {
    ...colorStyle,
    top: `${event.top}px`,
    height: `${event.height}px`,
    left: `calc(${(100 / event.laneCount) * event.laneIndex}% + 4px)`,
    width: `calc(${100 / event.laneCount}% - 8px)`,
    right: 'auto',
  };

  return (
    <article className={`schedule-event${changeClassName}`} style={eventStyle} onClick={(eventClick) => eventClick.stopPropagation()}>
      <div className="schedule-event-heading">
        <div className="schedule-event-class-info">
          <Link className="schedule-event-class" to={`/tutor/classes/${session.class_id}?tab=schedule`}>
            {session.class_name}
          </Link>
          <span className="schedule-event-title">{session.title || 'Buổi học'}</span>
        </div>
        <div className="schedule-event-actions">
          <button
            type="button"
            className="schedule-event-action schedule-event-change-action"
            onClick={() => onScheduleChangeClick(session, isDirectClassChange ? 'DIRECT' : 'REQUEST')}
            disabled={!canChangeSchedule}
            aria-label={isDirectClassChange ? 'Đổi lịch và thông báo học sinh' : 'Đề nghị đổi lịch với học sinh'}
            title={scheduleChangeTitle}
          >
            {isDirectClassChange ? <Pencil size={13} aria-hidden="true" /> : <CalendarClock size={13} aria-hidden="true" />}
          </button>
          {session.meeting_link && (
            <a
              className="schedule-event-action"
              href={session.meeting_link}
              target="_blank"
              rel="noreferrer"
              aria-label={`Mở liên kết buổi học ${session.title || session.class_name}`}
              title="Mở liên kết buổi học"
            >
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            className="schedule-event-action schedule-event-attendance-action"
            onClick={() => onAttendanceClick(session)}
            disabled={!canMarkAttendance}
            aria-label={`Điểm danh ${session.title || 'buổi học'}`}
            title={canMarkAttendance ? 'Điểm danh' : 'Chỉ có thể điểm danh từ giờ bắt đầu buổi học'}
            aria-expanded={attendanceSessionId === session._id}
            aria-controls="session-attendance-preview"
          >
            <ClipboardCheck size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
      <span className="schedule-event-time">
        <Clock3 size={12} aria-hidden="true" />
        {formatTimeRange(session)}
      </span>
    </article>
  );
}

function CalendarWeek({
  weekStart,
  sessions,
  colorByClassId,
  onSelectSlot,
  onAttendanceClick,
  attendanceSessionId,
  onScheduleChangeClick,
  pendingChanges,
  selectedRequestId,
  onSelectRequest,
}) {
  const days = getWeekDays(weekStart);
  const today = new Date();
  const hourStart = 6;
  const hourEnd = 24;

  const calendarItems = [...sessions, ...pendingChanges.proposals];
  const hourHeights = getHourHeights(calendarItems, hourStart, hourEnd);
  const hourCount = hourHeights.length;
  const hourTops = [];
  let gridHeight = 0;
  for (let hourIndex = 0; hourIndex < hourCount; hourIndex += 1) {
    hourTops.push(gridHeight);
    gridHeight += hourHeights[hourIndex];
  }
  const hourLines = [...hourTops, gridHeight];
  // Layout từng ngày gồm cả buổi học thật và ô đề xuất (dùng chung để vẽ đường nối)
  const dayLayouts = days.map((day) => getSessionLayout(
    calendarItems.filter((item) => isSameDay(new Date(item.start_time), day)),
    hourStart,
    hourEnd,
    hourHeights,
    colorByClassId,
  ));

  const handleCalendarColumnClick = (event, day) => {
    const columnBounds = event.currentTarget.getBoundingClientRect();
    const minutesFromTop = getMinutesFromPosition(event.clientY - columnBounds.top, hourHeights);
    const roundedMinutesFromTop = Math.floor(minutesFromTop / 15) * 15;
    const dayMinutes = Math.min((hourStart * 60) + roundedMinutesFromTop, (23 * 60) + 45);
    const startTime = new Date(day);
    startTime.setHours(0, dayMinutes, 0, 0);

    if (startTime <= new Date()) {
      onSelectSlot(null, 'Hãy chọn một khung giờ trong tương lai để tạo buổi học.');
      return;
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);
    if (!isSameDay(startTime, endTime)) {
      endTime.setHours(23, 59, 0, 0);
    }

    onSelectSlot({
      date: formatDateInput(startTime),
      start_time: formatTimeInput(startTime),
      end_time: formatTimeInput(endTime),
    }, '');
  };

  const timeLabels = [];
  for (let hourIndex = 0; hourIndex < hourCount; hourIndex += 1) {
    const hour = hourStart + hourIndex;
    const hourDate = new Date(2000, 0, 1, hour, 0, 0, 0);
    timeLabels.push({
      label: TIME_FORMATTER.format(hourDate),
      height: hourHeights[hourIndex],
    });
  }

  return (
    <div className="schedule-calendar-scroll">
      <div
        className="schedule-calendar"
        style={{
          '--schedule-grid-height': `${gridHeight}px`,
          '--schedule-hour-height': `${HOUR_HEIGHT}px`,
        }}
      >
        <div className="schedule-calendar-corner" aria-hidden="true" />
        {days.map((day) => {
          const dayIsToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className={dayIsToday ? 'schedule-day-heading is-today' : 'schedule-day-heading'}>
              <span>{WEEKDAY_FORMATTER.format(day)}</span>
              <strong>{DAY_FORMATTER.format(day)}</strong>
            </div>
          );
        })}

        <div className="schedule-time-axis" style={{ height: `${gridHeight}px` }}>
          {timeLabels.map((timeLabel) => (
            <span
              key={timeLabel.label}
              style={{ '--schedule-hour-height': `${timeLabel.height}px` }}
            >
              {timeLabel.label}
            </span>
          ))}
        </div>

        {days.map((day, dayIndex) => {
          const events = dayLayouts[dayIndex];
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
              {events.map((event) => (event.session.isProposal ? (
                <ProposalEvent key={event.session._id} event={event} selectedRequestId={selectedRequestId} onSelect={onSelectRequest} />
              ) : (
                <ScheduleEvent
                  key={event.session._id}
                  event={event}
                  onAttendanceClick={onAttendanceClick}
                  attendanceSessionId={attendanceSessionId}
                  onScheduleChangeClick={onScheduleChangeClick}
                  changeClassName={getPendingClassName(pendingChanges.requestBySessionId.get(String(event.session._id)), selectedRequestId)}
                />
              )))}
            </div>
          );
        })}
        <ScheduleChangeLinks
          dayLayouts={dayLayouts}
          pendingRequests={pendingChanges.pending}
          selectedRequestId={selectedRequestId}
          gridHeight={gridHeight}
        />
      </div>
    </div>
  );
}

export default function MySchedule() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [scheduleChangeRequests, setScheduleChangeRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const calendarSectionRef = useRef(null);
  const requestsSectionRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotError, setSelectedSlotError] = useState('');
  const [attendanceSession, setAttendanceSession] = useState(null);
  const attendancePreviewRef = useRef(null);
  const [scheduleChangeSession, setScheduleChangeSession] = useState(null);
  const [scheduleChangeMode, setScheduleChangeMode] = useState('REQUEST');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadSchedule = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [allSessions, classroomResponse] = await Promise.all([
          getAllPages((page) => getUserSessions({ page: page, limit: PAGE_SIZE })),
          getMyClassroomsPage({ page: 1, limit: PAGE_SIZE }),
        ]);
        const activeClassrooms = classroomResponse.data.items.filter((classroom) => classroom.status === 'ACTIVE');
        const scheduleSessions = allSessions.map((session) => {
          let className = 'Lớp chưa đặt tên';
          if (session.classroom && session.classroom.name) {
            className = session.classroom.name;
          }
          return { ...session, class_name: className };
        });

        if (isCurrentRequest) {
          setSessions(scheduleSessions);
          setClassrooms(activeClassrooms);
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.message || 'Không thể tải lịch của bạn. Vui lòng thử lại.');
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    loadSchedule();
    return () => {
      isCurrentRequest = false;
    };
  }, [reloadKey]);

  const weekSessions = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return sessions
      .filter((session) => {
        const startTime = new Date(session.start_time);
        return startTime >= weekStart && startTime < weekEnd;
      })
      .sort((first, second) => new Date(first.start_time) - new Date(second.start_time));
  }, [sessions, weekStart]);
  const activeClassIds = useMemo(() => new Set(classrooms.map((classroom) => String(classroom._id))), [classrooms]);
  const activeClassSessions = useMemo(
    () => sessions.filter((session) => activeClassIds.has(String(session.class_id))),
    [activeClassIds, sessions],
  );
  const weekConflicts = useMemo(
    () => getSessionConflicts(weekSessions.filter((session) => activeClassIds.has(String(session.class_id)))),
    [activeClassIds, weekSessions],
  );
  const colorByClassId = useMemo(() => getClassColorMap(sessions), [sessions]);

  useEffect(() => {
    if (attendanceSession && attendancePreviewRef.current) {
      attendancePreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [attendanceSession]);

  const openCreateForm = () => {
    setSelectedSlot(null);
    setSelectedSlotError('');
    setIsCreateOpen(true);
  };

  const handleSelectSlot = (slot, errorMessage) => {
    setSelectedSlotError(errorMessage);
    if (slot) {
      setSelectedSlot(slot);
      setIsCreateOpen(true);
      return;
    }
    setSelectedSlot(null);
  };

  const closeCreateForm = () => {
    setIsCreateOpen(false);
    setSelectedSlot(null);
  };

  const handleScheduleChangeClick = (session, mode) => {
    setScheduleChangeSession(session);
    setScheduleChangeMode(mode);
  };

  const handleScheduleChangeSaved = () => {
    setScheduleChangeSession(null);
    setReloadKey((key) => key + 1);
    if (requestsSectionRef.current) requestsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pendingChanges = useMemo(
    () => getPendingChanges(scheduleChangeRequests, weekStart),
    [scheduleChangeRequests, weekStart],
  );

  // Bấm "Xem trên lịch" ở thẻ yêu cầu: chuyển tới tuần của buổi gốc và cuộn lên lịch
  const showRequestOnCalendar = (request) => {
    setSelectedRequestId(request._id);
    setWeekStart(getWeekStart(request.session.start_time));
    if (calendarSectionRef.current) calendarSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Bấm ô đề xuất trên lịch: làm nổi cặp ô và cuộn tới thẻ yêu cầu
  const selectRequestFromCalendar = (requestId) => {
    setSelectedRequestId(requestId);
    const card = document.getElementById(`schedule-change-request-${requestId}`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const moveWeek = (amount) => {
    setWeekStart((currentWeekStart) => {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + (amount * 7));
      return nextWeekStart;
    });
  };

  const goToCurrentWeek = () => setWeekStart(getWeekStart(new Date()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return (
    <div className="page-stack my-schedule-page">
      <section ref={calendarSectionRef} className="schedule-toolbar" aria-label="Điều hướng lịch">
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true"><CalendarDays size={19} /></span>
          <div>
            <h2>{MONTH_YEAR_FORMATTER.format(weekStart)}</h2>
            <p>
              {DATE_RANGE_FORMATTER.format(weekStart)}
              {' – '}
              {DATE_RANGE_FORMATTER.format(weekEnd)}
            </p>
          </div>
        </div>
        <div className="schedule-toolbar-actions">
          {classrooms.length > 0 && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateForm}>
              <Plus size={15} aria-hidden="true" /> Tạo buổi học
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={goToCurrentWeek}>Hôm nay</button>
          <div className="schedule-week-arrows" aria-label="Đổi tuần">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(-1)} aria-label="Tuần trước">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(1)} aria-label="Tuần sau">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(1)} aria-label="Tuần sau">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="schedule-loading" role="status">
          <LoaderCircle size={24} className="spin" aria-hidden="true" />
          <span>Đang tải lớp học và buổi học...</span>
        </div>
      )}

      {!isLoading && error && (
        <Alert type="error">
          <p>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setReloadKey((key) => key + 1)}>
            Thử lại
            Thử lại
          </button>
        </Alert>
      )}

      {!isLoading && !error && sessions.length === 0 && classrooms.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có buổi học nào"
          description="Buổi học từ các lớp đang hoạt động sẽ xuất hiện trên lịch tuần này."
        />
      )}

      {!isLoading && !error && (sessions.length > 0 || classrooms.length > 0) && (
        <>
          <ScheduleChangeCalendarNotes
            pendingChanges={pendingChanges}
            onShowHint={(hint) => {
              setSelectedRequestId(hint.requestId);
              setWeekStart(hint.weekStart);
            }}
          />
          <div className="schedule-calendar-card">
            {weekConflicts.length > 0 && (
              <Alert type="error">
                <strong>Cảnh báo: có lịch học trùng giờ giữa các lớp.</strong>
                <ul className="schedule-conflict-list">
                  {weekConflicts.map((conflict) => <li key={`${conflict.firstSession._id}-${conflict.secondSession._id}`}>{formatConflict(conflict)}</li>)}
                </ul>
              </Alert>
            )}
            {weekSessions.length === 0 && (
              <div className="schedule-week-empty">
                <MapPin size={17} aria-hidden="true" />
                <span>Tuần này chưa có buổi học. Dùng các nút mũi tên để xem tuần khác.</span>
              </div>
            )}
            {selectedSlotError && <p className="schedule-slot-error" role="status">{selectedSlotError}</p>}
            <CalendarWeek
              weekStart={weekStart}
              sessions={weekSessions}
              colorByClassId={colorByClassId}
              onSelectSlot={handleSelectSlot}
              onAttendanceClick={setAttendanceSession}
              attendanceSessionId={attendanceSession?._id}
              onScheduleChangeClick={handleScheduleChangeClick}
              pendingChanges={pendingChanges}
              selectedRequestId={selectedRequestId}
              onSelectRequest={selectRequestFromCalendar}
            />
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
        </>
      )}
      <div ref={requestsSectionRef}>
        <ScheduleChangeRequestsPanel
          reloadSignal={reloadKey}
          onRequestsLoaded={setScheduleChangeRequests}
          selectedRequestId={selectedRequestId}
          onShowOnCalendar={showRequestOnCalendar}
          onChanged={() => setReloadKey((key) => key + 1)}
        />
      </div>
      {isCreateOpen && (
        <CreateScheduleSessionModal
          classrooms={classrooms}
          sessions={activeClassSessions}
          initialValues={selectedSlot}
          onClose={closeCreateForm}
          onCreated={() => setReloadKey((key) => key + 1)}
        />
      )}
      {scheduleChangeSession && (
        <ScheduleChangeFormModal
          session={scheduleChangeSession}
          mode={scheduleChangeMode}
          onClose={() => setScheduleChangeSession(null)}
          onSaved={handleScheduleChangeSaved}
        />
      )}
    </div>
  );
}
