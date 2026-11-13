import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { getClassSessions, getMyClassroomsPage } from '../../services/classroomService';
import '../../styles/mySchedule.css';

const PAGE_SIZE = 100;
const HOUR_HEIGHT = 40;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

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

function getSessionLayout(sessions, hourStart, hourEnd) {
  const events = sessions.map((session, index) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
    const durationMinutes = Math.max(30, (endTime.getTime() - startTime.getTime()) / 60000);
    const top = (startOffset / 60) * HOUR_HEIGHT;
    const height = Math.max(76, (durationMinutes / 60) * HOUR_HEIGHT);

    return {
      session: session,
      top: top,
      height: height,
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

function formatTimeRange(session) {
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  return `${TIME_FORMATTER.format(startTime)} – ${TIME_FORMATTER.format(endTime)}`;
}

function ScheduleEvent({ event }) {
  const session = event.session;
  const eventStyle = {
    top: `${event.top}px`,
    height: `${event.height}px`,
    left: `calc(${(100 / event.laneCount) * event.laneIndex}% + 4px)`,
    width: `calc(${100 / event.laneCount}% - 8px)`,
    right: 'auto',
  };

  return (
    <article className={`schedule-event schedule-event-color-${event.colorIndex}`} style={eventStyle}>
      <Link className="schedule-event-title" to={`/tutor/classes/${session.class_id}`}>
        {session.title || 'Buổi học'}
      </Link>
      <span className="schedule-event-class">{session.class_name}</span>
      <span className="schedule-event-time">
        <Clock3 size={12} aria-hidden="true" />
        {formatTimeRange(session)}
      </span>
      <div className="schedule-event-footer">
        <span
          className={`schedule-status-pill ${
            session.status === 'CANCELLED'
              ? 'status-cancelled'
              : session.status === 'COMPLETED'
              ? 'status-completed'
              : 'status-scheduled'
          }`}
        >
          {session.status === 'CANCELLED'
            ? 'Đã hủy'
            : session.status === 'COMPLETED'
            ? 'Đã học xong'
            : 'Sắp tới'}
        </span>
        {session.meeting_link && (
          <a
            className="schedule-join-btn"
            href={session.meeting_link}
            target="_blank"
            rel="noreferrer"
            aria-label={`Vào phòng học cho ${session.title || session.class_name}`}
            title="Vào phòng học"
          >
            <Video size={11} aria-hidden="true" />
            <span>Vào học</span>
          </a>
        )}
      </div>
    </article>
  );
}

function CalendarWeek({ weekStart, sessions }) {
  const days = getWeekDays(weekStart);
  const today = new Date();
  let hourStart = 7;
  let hourEnd = 21;

  for (const session of sessions) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    hourStart = Math.min(hourStart, startTime.getHours());
    const nominalEndHour = Math.ceil(endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0));
    const visualEndHour = Math.ceil(startTime.getHours() + (startTime.getMinutes() / 60) + (76 / HOUR_HEIGHT));
    const latestHour = Math.max(nominalEndHour, visualEndHour);
    hourEnd = Math.max(hourEnd, Math.min(24, latestHour + 1));
  }

  const hourCount = Math.max(1, hourEnd - hourStart);
  let calculatedGridHeight = hourCount * HOUR_HEIGHT;
  for (const session of sessions) {
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

        <div className="schedule-time-axis">
          {timeLabels.map((label) => <span key={label}>{label}</span>)}
        </div>

        {days.map((day) => {
          const daySessions = sessions.filter((session) => isSameDay(new Date(session.start_time), day));
          const events = getSessionLayout(daySessions, hourStart, hourEnd);
          const dayIsToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={dayIsToday ? 'schedule-day-column is-today' : 'schedule-day-column'}
              style={{ height: `${gridHeight}px` }}
            >
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadSchedule = async () => {
      setIsLoading(true);
      setError('');

      try {
        const classrooms = await getAllPages((page) => getMyClassroomsPage({ page: page, limit: PAGE_SIZE }));
        const sessionsByClass = await Promise.all(classrooms.map(async (classroom) => {
          const classSessions = await getAllPages((page) => getClassSessions(classroom._id, {
            page: page,
            limit: PAGE_SIZE,
          }));
          return classSessions.map((session) => ({
            ...session,
            class_name: classroom.name || 'Untitled class',
          }));
        }));

        if (isCurrentRequest) {
          setSessions(sessionsByClass.flat());
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.message || 'Unable to load your schedule');
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
      <section className="schedule-toolbar" aria-label="Calendar navigation">
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true"><CalendarDays size={19} /></span>
          <div>
            <h2>{MONTH_YEAR_FORMATTER.format(weekStart)}</h2>
            <p>
              {weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
              {' – '}
              {weekEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="schedule-toolbar-actions">
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
          <span>Đang tải lịch dạy và các buổi học...</span>
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
          description="Các buổi học từ các lớp đang dạy sẽ hiển thị trên lịch tuần này."
        />
      )}

      {!isLoading && !error && sessions.length > 0 && (
        <>
          <div className="schedule-calendar-card">
            {weekSessions.length === 0 && (
              <div className="schedule-week-empty">
                <MapPin size={17} aria-hidden="true" />
                <span>Không có buổi học nào trong tuần này. Sử dụng các mũi tên để xem tuần khác.</span>
              </div>
            )}
            <CalendarWeek weekStart={weekStart} sessions={weekSessions} />
          </div>
          <p className="schedule-timezone-note">Thời gian hiển thị theo múi giờ trên thiết bị của bạn.</p>
        </>
      )}
    </div>
  );
}
