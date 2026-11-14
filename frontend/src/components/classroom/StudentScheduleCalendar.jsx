import { useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../common/EmptyState';
import {
  ProposalEvent,
  ScheduleChangeCalendarNotes,
  ScheduleChangeLinks,
  getPendingChanges,
  getPendingClassName,
} from '../common/ScheduleChangeCalendarLayer';
import { getClassColorMap, getClassColorStyle } from '../../utils/classScheduleColors';
import '../../styles/mySchedule.css';
import '../../styles/studentClassContent.css';

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const HOUR_START = 6;
const HOUR_END = 24;
const EMPTY_HOUR_HEIGHT = 18;
const BUSY_HOUR_HEIGHT = 64;

function getWeekStart(date) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayIndex);
    return day;
  });
}

function isSameDay(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function formatSessionTime(session) {
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  return `${SESSION_TIME_FORMATTER.format(startTime)} – ${SESSION_TIME_FORMATTER.format(endTime)}`;
}

function getAttendanceDisplay(status) {
  if (status === 'PRESENT') {
    return { label: 'Có mặt', className: 'is-present' };
  }
  if (status === 'ABSENT') {
    return { label: 'Vắng', className: 'is-absent' };
  }
  if (status === 'LATE') {
    return { label: 'Đi muộn', className: 'is-late' };
  }
  return null;
}

function isWebLink(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function getHourHeights(sessions) {
  const hourHeights = Array(HOUR_END - HOUR_START).fill(EMPTY_HOUR_HEIGHT);

  for (const session of sessions) {
    const sessionStart = new Date(session.start_time);
    const sessionEnd = new Date(session.end_time);

    for (let hourIndex = 0; hourIndex < hourHeights.length; hourIndex += 1) {
      const hourStartTime = new Date(sessionStart);
      hourStartTime.setHours(HOUR_START + hourIndex, 0, 0, 0);
      const hourEndTime = new Date(hourStartTime);
      hourEndTime.setHours(hourEndTime.getHours() + 1);

      if (sessionStart < hourEndTime && sessionEnd > hourStartTime) {
        hourHeights[hourIndex] = BUSY_HOUR_HEIGHT;
      }
    }
  }

  return hourHeights;
}

function getVerticalPosition(minutesFromStart, hourHeights) {
  const totalMinutes = hourHeights.length * 60;
  const boundedMinutes = Math.min(Math.max(minutesFromStart, 0), totalMinutes);
  const completeHours = Math.floor(boundedMinutes / 60);
  const minutesInCurrentHour = boundedMinutes % 60;
  let position = 0;

  for (let hourIndex = 0; hourIndex < completeHours; hourIndex += 1) {
    position += hourHeights[hourIndex];
  }

  if (completeHours < hourHeights.length) {
    position += (minutesInCurrentHour / 60) * hourHeights[completeHours];
  }

  return position;
}

function getSessionLayout(sessions, hourHeights) {
  const events = sessions.map((session) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startMinute = (startTime.getHours() - HOUR_START) * 60 + startTime.getMinutes();
    const endMinute = (endTime.getHours() * 60) + endTime.getMinutes() - (HOUR_START * 60);
    const top = getVerticalPosition(startMinute, hourHeights);
    const endPosition = getVerticalPosition(endMinute, hourHeights);
    const height = Math.max(28, endPosition - top);

    return { session, top, height };
  }).sort((first, second) => first.top - second.top);

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

export default function StudentScheduleCalendar({
  sessions,
  classroom = null,
  onRequestChange,
  scheduleChangeRequests = [],
  selectedRequestId = '',
  onSelectRequest = () => {},
  weekStart: controlledWeekStart,
  onWeekChange,
}) {
  const [internalWeekStart, setInternalWeekStart] = useState(() => getWeekStart(new Date()));
  const weekStart = controlledWeekStart || internalWeekStart;
  const setWeekStart = onWeekChange || setInternalWeekStart;
  const days = getWeekDays(weekStart);
  const today = new Date();
  const weekSessions = useMemo(() => {
    const weekEndTime = weekStart.getTime() + (7 * 24 * 60 * 60 * 1000);
    return sessions.filter((session) => {
      const startTime = new Date(session.start_time).getTime();
      return startTime >= weekStart.getTime() && startTime < weekEndTime;
    });
  }, [sessions, weekStart]);
  const classColors = useMemo(() => getClassColorMap(sessions), [sessions]);
  const pendingChanges = useMemo(
    () => getPendingChanges(scheduleChangeRequests, weekStart),
    [scheduleChangeRequests, weekStart],
  );
  const hourHeights = getHourHeights([...weekSessions, ...pendingChanges.proposals]);
  const hourTops = [];
  let gridHeight = 0;
  for (const hourHeight of hourHeights) {
    hourTops.push(gridHeight);
    gridHeight += hourHeight;
  }
  const timeLabels = Array.from({ length: HOUR_END - HOUR_START }, (_, hourIndex) => {
    const hourDate = new Date(2000, 0, 1, HOUR_START + hourIndex);
    return {
      label: SESSION_TIME_FORMATTER.format(hourDate),
      height: hourHeights[hourIndex],
    };
  });
  const weekEndLabelDate = new Date(weekStart);
  weekEndLabelDate.setDate(weekStart.getDate() + 6);

  const moveWeek = (amount) => {
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + (amount * 7));
    setWeekStart(nextWeekStart);
  };

  // Layout từng ngày gồm cả buổi học thật và ô đề xuất (dùng chung để vẽ đường nối)
  const dayLayouts = days.map((day) => {
    const dayItems = [...weekSessions, ...pendingChanges.proposals].filter((session) => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      return isSameDay(startTime, day)
        && endTime.getHours() > HOUR_START
        && startTime.getHours() < HOUR_END;
    });
    return getSessionLayout(dayItems, hourHeights);
  });

  const goToCurrentWeek = () => setWeekStart(getWeekStart(new Date()));

  return (
    <>
      <section className="schedule-toolbar student-schedule-toolbar" aria-label="Điều hướng lịch tuần">
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true"><CalendarDays size={19} /></span>
          <div>
            <h2>{MONTH_YEAR_FORMATTER.format(weekStart)}</h2>
            <p>{DATE_RANGE_FORMATTER.format(weekStart)} – {DATE_RANGE_FORMATTER.format(weekEndLabelDate)}</p>
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
      <ScheduleChangeCalendarNotes
        pendingChanges={pendingChanges}
        onShowHint={(hint) => {
          onSelectRequest(hint.requestId);
          setWeekStart(hint.weekStart);
        }}
      />
      <div className="schedule-calendar-card student-schedule-calendar-card">
        {weekSessions.length === 0 && pendingChanges.proposals.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Tuần này chưa có buổi học"
            description={classroom ? `Lịch học của lớp ${classroom.name} sẽ hiển thị ở đây.` : 'Lịch học từ các lớp bạn tham gia sẽ hiển thị ở đây.'}
          />
        ) : (
          <div className="schedule-calendar-scroll">
            <div className="schedule-calendar student-week-calendar" style={{ '--schedule-grid-height': `${gridHeight}px` }}>
              <div className="schedule-calendar-corner" aria-hidden="true" />
              {days.map((day) => (
                <div key={day.toISOString()} className={isSameDay(day, today) ? 'schedule-day-heading is-today' : 'schedule-day-heading'}>
                  <span>{WEEKDAY_FORMATTER.format(day)}</span>
                  <strong>{DAY_FORMATTER.format(day)}</strong>
                </div>
              ))}
              <div className="schedule-time-axis student-schedule-time-axis" style={{ height: `${gridHeight}px` }}>
                {timeLabels.map((timeLabel) => (
                  <span key={timeLabel.label} style={{ '--schedule-hour-height': `${timeLabel.height}px` }}>
                    {timeLabel.label}
                  </span>
                ))}
              </div>
              {days.map((day, dayIndex) => {
                const dayIsToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    className={dayIsToday ? 'schedule-day-column student-schedule-day is-today' : 'schedule-day-column student-schedule-day'}
                    style={{ height: `${gridHeight}px` }}
                  >
                    {[...hourTops, gridHeight].map((top) => (
                      <span key={top} className="schedule-hour-line" style={{ top: `${top}px` }} />
                    ))}
                    {dayLayouts[dayIndex].map((event) => {
                      if (event.session.isProposal) {
                        return (
                          <ProposalEvent key={event.session._id} event={event} selectedRequestId={selectedRequestId} onSelect={onSelectRequest} />
                        );
                      }
                      const session = event.session;
                      const pendingRequest = pendingChanges.requestBySessionId.get(String(session._id));
                      const sessionIsCancelled = session.status === 'CANCELLED';
                      const className = session.class_name || session.classroom?.name || 'Lớp chưa đặt tên';
                      const classHue = classColors.get(String(session.class_id)) || 0;
                      const eventTitle = session.title || 'Buổi học';
                      const attendanceDisplay = getAttendanceDisplay(session.attendance_status);
                      const hoursUntilStart = (new Date(session.start_time).getTime() - Date.now()) / (60 * 60 * 1000);
                      const canRequestChange = !classroom
                        && session.status !== 'CANCELLED'
                        && hoursUntilStart >= 12
                        && session.classroom?.status === 'ACTIVE'
                        && session.classroom?.active_student_count === 1;

                      return (
                        <article
                          key={session._id}
                          className={`schedule-event schedule-event-class-view student-schedule-event${event.height < 104 ? ' is-compact' : ''}${sessionIsCancelled ? ' is-cancelled' : ''}${getPendingClassName(pendingRequest, selectedRequestId)}`}
                          style={{
                            top: `${event.top}px`,
                            height: `${event.height}px`,
                            left: `calc(${(100 / event.laneCount) * event.laneIndex}% + 3px)`,
                            width: `calc(${100 / event.laneCount}% - 6px)`,
                            right: 'auto',
                            ...getClassColorStyle(classHue),
                          }}
                        >
                          {attendanceDisplay ? (
                            <span className={`schedule-event-class-tag student-attendance-status ${attendanceDisplay.className}`}>
                              {attendanceDisplay.label}
                            </span>
                          ) : (
                            <span className="schedule-event-class-tag is-current-class">
                              {classroom ? 'LỚP ĐANG XEM' : 'BUỔI HỌC'}
                            </span>
                          )}
                          <div className="schedule-event-heading">
                            <div className="schedule-event-class-info">
                              {classroom ? (
                                <strong className="schedule-event-class-label">{className}</strong>
                              ) : (
                                <Link className="schedule-event-class-label student-schedule-class-link" to={`/student/classes/${session.class_id}`}>
                                  {className}
                                </Link>
                              )}
                              <span className="schedule-event-title">{eventTitle}</span>
                            </div>
                            {canRequestChange && (
                              <button
                                type="button"
                                className="schedule-event-action schedule-event-change-action"
                                onClick={() => onRequestChange(session)}
                                aria-label={`Đề nghị đổi lịch ${session.title || 'buổi học'}`}
                                title="Đề nghị đổi lịch với gia sư (gửi trước ít nhất 12 giờ)"
                              >
                                <CalendarClock size={13} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                          <span className="schedule-event-time">
                            <Clock3 size={12} aria-hidden="true" />
                            {formatSessionTime(session)}
                          </span>
                          {sessionIsCancelled && <span className="student-schedule-cancelled-label">Đã hủy</span>}
                          {isWebLink(session.meeting_link) && !sessionIsCancelled && (
                            <a className="student-schedule-join-link" href={session.meeting_link} target="_blank" rel="noreferrer">
                              <ExternalLink size={11} aria-hidden="true" /> Vào buổi học
                            </a>
                          )}
                        </article>
                      );
                    })}
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
        )}
      </div>
      <p className="schedule-timezone-note">Giờ hiển thị theo múi giờ trên thiết bị của bạn.</p>
    </>
  );
}
