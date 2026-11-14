import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileText, LoaderCircle, Search } from 'lucide-react';
import Alert from '../common/Alert';
import EmptyState from '../common/EmptyState';
import FormSelect from '../common/FormSelect';
import { getClassMaterials, getClassSessions, getClassTopics } from '../../services/classroomService';
import '../../styles/classDetail.css';
import '../../styles/mySchedule.css';
import '../../styles/studentClassContent.css';

const PAGE_SIZE = 100;
const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
const HOUR_START = 6;
const HOUR_END = 24;
const HOUR_HEIGHT = 72;
const EMPTY_HOUR_HEIGHT = 18;
const ALL_MATERIAL_TOPICS = '__all_topics__';
const UNASSIGNED_MATERIAL_TOPIC = '__unassigned_topic__';

function normalizeSearch(value) {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
}

async function getAllPages(loadPage) {
  const firstResponse = await loadPage(1);
  const items = [...firstResponse.data.items];
  const totalPages = firstResponse.data.pagination.totalPages;
  const otherPageNumbers = [];

  for (let page = 2; page <= totalPages; page += 1) {
    otherPageNumbers.push(page);
  }

  const otherResponses = await Promise.all(otherPageNumbers.map((page) => loadPage(page)));
  for (const response of otherResponses) {
    items.push(...response.data.items);
  }
  return items;
}

function formatMaterialSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return 'Tài liệu chia sẻ trong lớp';
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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

function formatSessionDateTime(session) {
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
        hourHeights[hourIndex] = HOUR_HEIGHT;
      }
    }
  }

  return hourHeights;
}

function getVerticalPosition(minutesFromStart, hourHeights) {
  const boundedMinutes = Math.min(Math.max(minutesFromStart, 0), hourHeights.length * 60);
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

function StudentScheduleCalendar({ sessions, classroom }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const days = getWeekDays(weekStart);
  const today = new Date();
  const weekSessions = useMemo(() => sessions.filter((session) => {
    const startTime = new Date(session.start_time);
    const weekEndTime = weekStart.getTime() + (7 * 24 * 60 * 60 * 1000);
    return startTime >= weekStart && startTime.getTime() < weekEndTime;
  }), [sessions, weekStart]);
  const hourHeights = getHourHeights(weekSessions);
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
    setWeekStart((currentWeekStart) => {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + (amount * 7));
      return nextWeekStart;
    });
  };

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
      <div className="schedule-calendar-card student-schedule-calendar-card">
        {weekSessions.length === 0 ? (
          <div className="schedule-week-empty">
            <CalendarDays size={17} aria-hidden="true" />
            <span>Tuần này chưa có buổi học của lớp {classroom.name}.</span>
          </div>
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
                  <span key={timeLabel.label} style={{ '--schedule-hour-height': `${timeLabel.height}px` }}>{timeLabel.label}</span>
                ))}
              </div>
              {days.map((day) => {
                const daySessions = weekSessions.filter((session) => {
                  const startTime = new Date(session.start_time);
                  const endTime = new Date(session.end_time);
                  return isSameDay(startTime, day)
                    && endTime.getHours() > HOUR_START
                    && startTime.getHours() < HOUR_END;
                });
                const dayIsToday = isSameDay(day, today);
                return (
                  <div
                    key={day.toISOString()}
                    className={dayIsToday ? 'schedule-day-column student-schedule-day is-today' : 'schedule-day-column student-schedule-day'}
                    style={{ height: `${gridHeight}px` }}
                  >
                    {hourTops.map((hourTop, hourIndex) => (
                      <span key={hourIndex} className="schedule-hour-line" style={{ top: `${hourTop}px` }} />
                    ))}
                    <span className="schedule-hour-line" style={{ top: `${gridHeight}px` }} />
                    {daySessions.map((session) => {
                      const startTime = new Date(session.start_time);
                      const endTime = new Date(session.end_time);
                      const startMinutes = Math.max(0, (startTime.getHours() - HOUR_START) * 60 + startTime.getMinutes());
                      const endMinutes = Math.min((HOUR_END - HOUR_START) * 60, (endTime.getHours() - HOUR_START) * 60 + endTime.getMinutes());
                      const eventTop = getVerticalPosition(startMinutes, hourHeights);
                      const eventBottom = getVerticalPosition(endMinutes, hourHeights);
                      const eventHeight = Math.max(30, eventBottom - eventTop);
                      const sessionIsCancelled = session.status === 'CANCELLED';
                      const attendanceDisplay = getAttendanceDisplay(session.attendance_status);

                      return (
                        <article
                          key={session._id}
                          className={`schedule-event schedule-event-class-view student-schedule-event${sessionIsCancelled ? ' is-cancelled' : ''}`}
                          style={{
                            top: `${eventTop}px`,
                            height: `${eventHeight}px`,
                            '--schedule-event-border': '#c9441a',
                            '--schedule-event-background': '#fff0e9',
                            '--schedule-event-text': '#803116',
                          }}
                        >
                          {attendanceDisplay ? (
                            <span className={`schedule-event-class-tag student-attendance-status ${attendanceDisplay.className}`}>
                              {attendanceDisplay.label}
                            </span>
                          ) : (
                            <span className="schedule-event-class-tag is-current-class">LỚP ĐANG XEM</span>
                          )}
                          <div className="schedule-event-heading">
                            <div className="schedule-event-class-info">
                              <strong className="schedule-event-class-label">{session.class_name || classroom.name}</strong>
                              <span className="schedule-event-title">{session.title || 'Buổi học'}</span>
                            </div>
                          </div>
                          <span className="schedule-event-time">
                            <Clock3 size={12} aria-hidden="true" />
                            {formatSessionDateTime(session)}
                          </span>
                          {sessionIsCancelled && <span className="student-schedule-cancelled-label">Đã hủy</span>}
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <p className="schedule-timezone-note">Giờ hiển thị theo múi giờ trên thiết bị của bạn.</p>
    </>
  );
}

export default function StudentClassContent({ classroomId, classroom, activeTab }) {
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(ALL_MATERIAL_TOPICS);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [materialsError, setMaterialsError] = useState('');
  const [sessionsError, setSessionsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setTopicsError('');
    setMaterialsError('');
    setSessionsError('');

    const loadContent = async () => {
      const [topicsResult, materialsResult, sessionsResult] = await Promise.allSettled([
        getAllPages((page) => getClassTopics(classroomId, { page, limit: PAGE_SIZE })),
        getAllPages((page) => getClassMaterials(classroomId, { page, limit: PAGE_SIZE })),
        getAllPages((page) => getClassSessions(classroomId, { page, limit: PAGE_SIZE })),
      ]);

      if (!isCurrentRequest) {
        return;
      }

      if (topicsResult.status === 'fulfilled') {
        setTopics(topicsResult.value);
      } else {
        setTopicsError(topicsResult.reason.message || 'Không thể tải chủ đề của lớp.');
      }

      if (materialsResult.status === 'fulfilled') {
        setMaterials(materialsResult.value);
      } else {
        setMaterialsError(materialsResult.reason.message || 'Không thể tải tài liệu của lớp.');
      }

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value);
      } else {
        setSessionsError(sessionsResult.reason.message || 'Không thể tải lịch học của lớp.');
      }

      setIsLoading(false);
    };

    loadContent();
    return () => {
      isCurrentRequest = false;
    };
  }, [classroomId]);

  const topicNames = useMemo(() => new Map(topics.map((topic) => [String(topic._id), topic.name])), [topics]);
  const filteredMaterials = useMemo(() => {
    const normalizedQuery = normalizeSearch(materialSearchQuery.trim());
    return materials.filter((material) => {
      const matchesTopic = selectedTopicId === ALL_MATERIAL_TOPICS
        || (selectedTopicId === UNASSIGNED_MATERIAL_TOPIC && !material.topic_id)
        || String(material.topic_id) === selectedTopicId;
      const matchesName = normalizeSearch(material.title || '').includes(normalizedQuery);
      return matchesTopic && matchesName;
    });
  }, [materials, materialSearchQuery, selectedTopicId]);
  const materialTopicOptions = useMemo(() => [
    { value: ALL_MATERIAL_TOPICS, label: 'Tất cả chủ đề' },
    { value: UNASSIGNED_MATERIAL_TOPIC, label: 'Không gắn chủ đề' },
    ...topics.map((topic) => ({ value: String(topic._id), label: topic.name })),
  ], [topics]);
  const orderedSessions = useMemo(() => [...sessions].sort((first, second) => (
    new Date(first.start_time) - new Date(second.start_time)
  )), [sessions]);

  if (activeTab === 'student-schedule') {
    return (
      <section className="class-detail-section student-class-section" aria-labelledby="student-class-schedule-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><CalendarDays size={18} /></span>
          <div>
            <h2 id="student-class-schedule-title">Lịch học</h2>
            <p>Các buổi học của lớp {classroom.name}</p>
          </div>
        </div>
        {sessionsError && <Alert type="error"><p>{sessionsError}</p></Alert>}
        {isLoading ? (
          <p className="student-class-loading" role="status"><LoaderCircle size={18} className="spin" /> Đang tải lịch học...</p>
        ) : sessionsError ? null : (
          <StudentScheduleCalendar sessions={orderedSessions} classroom={classroom} />
        )}
      </section>
    );
  }

  return (
    <div className="class-detail-content-grid student-class-content-grid">
      <section className="class-detail-section student-class-section" aria-labelledby="student-class-topics-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><BookOpen size={18} /></span>
          <div>
            <h2 id="student-class-topics-title">Chủ đề</h2>
            <p>Kế hoạch học tập của lớp {classroom.name}</p>
          </div>
        </div>
        {topicsError && <Alert type="error"><p>{topicsError}</p></Alert>}
        {isLoading ? (
          <p className="student-class-loading" role="status"><LoaderCircle size={18} className="spin" /> Đang tải chủ đề...</p>
        ) : topicsError ? null : topics.length === 0 ? (
          <EmptyState icon={BookOpen} title="Chưa có chủ đề" description="Các chủ đề do gia sư chia sẻ sẽ hiển thị ở đây." />
        ) : (
          <ol className="class-topic-list student-topic-list">
            {topics.map((topic, index) => (
              <li key={topic._id}>
                <button
                  type="button"
                  className={selectedTopicId === String(topic._id) ? 'student-topic-filter-button is-selected' : 'student-topic-filter-button'}
                  onClick={() => setSelectedTopicId(String(topic._id))}
                  aria-pressed={selectedTopicId === String(topic._id)}
                >
                  <span className="class-topic-number">{String(index + 1).padStart(2, '0')}</span>
                  {topic.name}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="class-detail-section student-class-section" aria-labelledby="student-class-materials-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><FileText size={18} /></span>
          <div>
            <h2 id="student-class-materials-title">Tài liệu</h2>
            <p>Tài nguyên gia sư chia sẻ với lớp</p>
          </div>
        </div>
        {materialsError && <Alert type="error"><p>{materialsError}</p></Alert>}
        {isLoading ? (
          <p className="student-class-loading" role="status"><LoaderCircle size={18} className="spin" /> Đang tải tài liệu...</p>
        ) : materialsError ? null : materials.length === 0 ? (
          <EmptyState icon={FileText} title="Chưa có tài liệu" description="Tài liệu học tập được gia sư chia sẻ sẽ hiển thị ở đây." />
        ) : (
          <>
            <div className="class-material-search-filters student-material-search-filters">
              <div className="form-field">
                <label htmlFor="student-class-material-search" className="form-label">Tìm tài liệu</label>
                <div className="form-control class-material-search-control">
                  <Search size={16} aria-hidden="true" />
                  <input
                    id="student-class-material-search"
                    type="search"
                    value={materialSearchQuery}
                    onChange={(event) => setMaterialSearchQuery(event.target.value)}
                    placeholder="Nhập tên tài liệu"
                    autoComplete="off"
                  />
                </div>
              </div>
              <FormSelect
                id="student-class-material-topic-filter"
                label="Lọc tài liệu theo chủ đề"
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                options={materialTopicOptions}
              />
            </div>
            {filteredMaterials.length === 0 ? (
              <p className="class-material-filter-empty" role="status">Chủ đề này chưa có tài liệu.</p>
            ) : (
              <ul className="class-material-list student-material-list">
                {filteredMaterials.map((material) => (
                  <li className="class-material-row" key={material._id}>
                    <span className="class-material-file-icon" aria-hidden="true"><FileText size={17} /></span>
                    <span className="class-material-copy">
                      <span className="class-material-title">{material.title}</span>
                      <span className="class-material-detail">
                        {topicNames.get(String(material.topic_id)) || 'Chưa gắn chủ đề'} · {formatMaterialSize(material.file_size)}
                      </span>
                    </span>
                    {material.file_url && (
                      <a className="btn btn-outline btn-sm" href={material.file_url} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} aria-hidden="true" /> Mở
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
