import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import Modal from '../../components/common/Modal';
import { createClassSession, getMyClassroomsPage } from '../../services/classroomService';
import { getUserSessions } from '../../services/sessionService';
import '../../styles/mySchedule.css';

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

function getClassColorMap(sessions) {
  const classNamesById = new Map();
  for (const session of sessions) {
    if (!classNamesById.has(session.class_id)) {
      classNamesById.set(session.class_id, session.class_name);
    }
  }

  const sortedClassIds = [...classNamesById.keys()].sort((firstClassId, secondClassId) => {
    const firstName = classNamesById.get(firstClassId) || '';
    const secondName = classNamesById.get(secondClassId) || '';
    return firstName.localeCompare(secondName, 'vi') || firstClassId.localeCompare(secondClassId);
  });
  const colorByClassId = new Map();

  sortedClassIds.forEach((classId, index) => {
    const hue = Math.round((index * 360) / Math.max(sortedClassIds.length, 1));
    colorByClassId.set(classId, hue);
  });

  return colorByClassId;
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

function CreateScheduleSessionModal({ classrooms, sessions, onClose, onCreated }) {
  const [values, setValues] = useState({
    class_id: '',
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const startTime = values.date && values.start_time ? new Date(`${values.date}T${values.start_time}`) : null;
  const endTime = values.date && values.end_time ? new Date(`${values.date}T${values.end_time}`) : null;
  const hasOverlap = startTime && endTime && endTime > startTime && sessions.some((session) => (
    session.status !== 'CANCELLED'
    && session.class_id !== values.class_id
    && startTime < new Date(session.end_time)
    && endTime > new Date(session.start_time)
  ));

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
        <div className="class-session-time-fields">
          <div className="form-field">
            <label className="form-label" htmlFor="global-session-start">Giờ bắt đầu</label>
            <div className="form-control"><input id="global-session-start" type="time" value={values.start_time} onChange={(event) => updateValue('start_time', event.target.value)} required disabled={isSubmitting} /></div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="global-session-end">Giờ kết thúc</label>
            <div className="form-control"><input id="global-session-end" type="time" value={values.end_time} onChange={(event) => updateValue('end_time', event.target.value)} required disabled={isSubmitting} /></div>
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
        {hasOverlap && <Alert type="info"><p>Khung giờ này trùng với lịch của lớp khác. Anh kiểm tra lại trước khi lưu nhé.</p></Alert>}
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="class-session-form-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Tạo buổi học'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ScheduleEvent({ event }) {
  const session = event.session;
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
    <article className="schedule-event" style={eventStyle}>
      <Link className="schedule-event-class" to={`/tutor/classes/${session.class_id}?tab=schedule`}>
        {session.class_name}
      </Link>
      <span className="schedule-event-title">{session.title || 'Buổi học'}</span>
      <span className="schedule-event-time">
        <Clock3 size={12} aria-hidden="true" />
        {formatTimeRange(session)}
      </span>
      {session.meeting_link && (
        <a
          className="schedule-event-meeting-link"
          href={session.meeting_link}
          target="_blank"
          rel="noreferrer"
            aria-label={`Mở liên kết buổi học ${session.title || session.class_name}`}
        >
          <ExternalLink size={12} aria-hidden="true" />
          Vào buổi học
        </a>
      )}
    </article>
  );
}

function CalendarWeek({ weekStart, sessions, colorByClassId }) {
  const days = getWeekDays(weekStart);
  const today = new Date();
  const hourStart = 6;
  const hourEnd = 24;

  const hourHeights = getHourHeights(sessions, hourStart, hourEnd);
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

  return (
    <div className="schedule-calendar-scroll">
      <div className="schedule-calendar" style={{ '--schedule-grid-height': `${gridHeight}px` }}>
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

        {days.map((day) => {
          const daySessions = sessions.filter((session) => isSameDay(new Date(session.start_time), day));
          const events = getSessionLayout(daySessions, hourStart, hourEnd, hourHeights, colorByClassId);
          const dayIsToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={dayIsToday ? 'schedule-day-column is-today' : 'schedule-day-column'}
              style={{ height: `${gridHeight}px` }}
            >
              {hourLines.map((top) => (
                <span key={top} className="schedule-hour-line" style={{ top: `${top}px` }} />
              ))}
              {events.map((event) => <ScheduleEvent key={event.session._id} event={event} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MySchedule() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [sessions, setSessions] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      <section className="schedule-toolbar" aria-label="Điều hướng lịch">
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
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsCreateOpen(true)}>
              <Plus size={15} aria-hidden="true" /> Tạo buổi học
            </button>
          )}
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
          </button>
        </Alert>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có buổi học nào"
          description="Buổi học từ các lớp đang hoạt động sẽ xuất hiện trên lịch tuần này."
        />
      )}

      {!isLoading && !error && sessions.length > 0 && (
        <>
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
            <CalendarWeek weekStart={weekStart} sessions={weekSessions} colorByClassId={colorByClassId} />
          </div>
          <p className="schedule-timezone-note">Giờ hiển thị theo múi giờ trên thiết bị của bạn.</p>
        </>
      )}
      {isCreateOpen && (
        <CreateScheduleSessionModal
          classrooms={classrooms}
          sessions={activeClassSessions}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => setReloadKey((key) => key + 1)}
        />
      )}
    </div>
  );
}
