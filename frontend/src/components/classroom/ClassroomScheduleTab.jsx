import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Video,
  Loader2,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';
import { getClassSessions } from '../../services/classroomService';
import RequestScheduleChangeModal from './RequestScheduleChangeModal';
import '../../styles/mySchedule.css';

const HOUR_HEIGHT = 40;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

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
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatSessionTime(session) {
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  return `${TIME_FORMATTER.format(startTime)} - ${TIME_FORMATTER.format(endTime)}`;
}

export default function ClassroomScheduleTab({ classId, classroom, showToast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'LIST'
  const [selectedSession, setSelectedSession] = useState(null);
  const [changeRequestSession, setChangeRequestSession] = useState(null);

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getClassSessions(classId, { page: 1, limit: 100 });
      if (res?.data?.items) {
        setSessions(res.data.items);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải lịch học của lớp');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const weekSessions = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return sessions
      .filter((session) => {
        const startTime = new Date(session.start_time);
        return startTime >= weekStart && startTime < weekEnd;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [sessions, weekStart]);

  const moveWeek = (amount) => {
    setWeekStart((curr) => {
      const next = new Date(curr);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  };

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  let hourStart = 7;
  let hourEnd = 21;
  for (const session of weekSessions) {
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

  const getStatusBadge = (session) => {
    const now = new Date();
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    if (session.status === 'CANCELLED') {
      return <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>Đã hủy</span>;
    }
    if (now >= start && now <= end) {
      return <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 600 }}>Đang diễn ra</span>;
    }
    if (now > end || session.status === 'COMPLETED') {
      return <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Đã hoàn thành</span>;
    }
    return <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 600 }}>Sắp tới</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '10px', color: '#64748b' }}>
        <Loader2 size={24} className="spin" />
        <span>Đang tải lịch học của lớp...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', textAlign: 'center' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>{error}</p>
        <button
          type="button"
          onClick={loadSessions}
          style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Schedule Toolbar */}
      <div className="schedule-toolbar">
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {MONTH_YEAR_FORMATTER.format(weekStart)}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              {weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
              {' - '}
              {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="schedule-toolbar-actions">
          {/* Switch Grid / List */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              style={{
                border: 'none',
                background: viewMode === 'GRID' ? '#fff' : 'transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: viewMode === 'GRID' ? 700 : 500,
                color: viewMode === 'GRID' ? '#e85a2c' : '#64748b',
                cursor: 'pointer',
                boxShadow: viewMode === 'GRID' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Lưới tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              style={{
                border: 'none',
                background: viewMode === 'LIST' ? '#fff' : 'transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: viewMode === 'LIST' ? 700 : 500,
                color: viewMode === 'LIST' ? '#e85a2c' : '#64748b',
                cursor: 'pointer',
                boxShadow: viewMode === 'LIST' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Danh sách
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={goToCurrentWeek}
            style={{ fontWeight: 600, padding: '6px 12px' }}
          >
            Hôm nay
          </button>
          <div className="schedule-week-arrows" aria-label="Đổi tuần">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => moveWeek(-1)}
              aria-label="Tuần trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => moveWeek(1)}
              aria-label="Tuần sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid View */}
      {viewMode === 'GRID' && (
        <div className="schedule-calendar-card">
          {weekSessions.length === 0 && (
            <div className="schedule-week-empty" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <CalendarCheck size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Không có buổi học nào trong tuần này.</p>
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
                {timeLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              {days.map((day) => {
                const daySessions = weekSessions.filter((session) => isSameDay(new Date(session.start_time), day));

                return (
                  <div
                    key={day.toISOString()}
                    className={isSameDay(day, today) ? 'schedule-day-column is-today' : 'schedule-day-column'}
                    style={{ height: `${gridHeight}px` }}
                  >
                    {daySessions.map((session, index) => {
                      const startTime = new Date(session.start_time);
                      const endTime = new Date(session.end_time);
                      const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
                      const durationMinutes = Math.max(30, (endTime.getTime() - startTime.getTime()) / 60000);
                      const top = (startOffset / 60) * HOUR_HEIGHT;
                      const height = Math.max(76, (durationMinutes / 60) * HOUR_HEIGHT);

                      return (
                        <div
                          key={session._id}
                          className={`schedule-event schedule-event-color-${index % 5}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: '4px',
                            right: '4px',
                            width: 'auto',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '3px', width: '100%', overflow: 'hidden' }}>
                            <strong
                              style={{
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {session.title || 'Buổi học'}
                            </strong>
                            <span style={{ fontSize: '11px', opacity: 0.85, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} />
                              {formatSessionTime(session)}
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
                                  href={session.meeting_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="schedule-join-btn"
                                  title="Vào phòng học"
                                >
                                  <Video size={11} />
                                  <span>Vào học</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'LIST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {weekSessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <CalendarCheck size={40} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Không có buổi học nào trong tuần này.</p>
            </div>
          ) : (
            weekSessions.map((session) => {
              const start = new Date(session.start_time);
              const dateStr = start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

              return (
                <div
                  key={session._id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: '#fff7ed',
                        color: '#ea580c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {session.title || 'Buổi học'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <Clock size={13} />
                        <span>{formatSessionTime(session)}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {getStatusBadge(session)}
                    {session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '13px', textDecoration: 'none' }}
                      >
                        <Video size={14} />
                        <span>Vào phòng học</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedSession(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedSession.title || 'Chi tiết buổi học'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {classroom?.name || 'Lớp học'}
                </p>
              </div>
              {getStatusBadge(selectedSession)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155' }}>
                <Clock size={16} style={{ color: '#64748b' }} />
                <span>
                  <strong>Thời gian:</strong> {formatSessionTime(selectedSession)} (
                  {new Date(selectedSession.start_time).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  )
                </span>
              </div>

              {selectedSession.meeting_link && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155' }}>
                  <Video size={16} style={{ color: '#0284c7' }} />
                  <span>
                    <strong>Link trực tuyến:</strong>{' '}
                    <a
                      href={selectedSession.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {selectedSession.meeting_link}
                    </a>
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedSession(null)}
              >
                Đóng
              </button>
              {selectedSession.status === 'SCHEDULED' && new Date(selectedSession.start_time) > new Date() && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ea580c', borderColor: '#ea580c' }}
                  onClick={() => {
                    const target = selectedSession;
                    setSelectedSession(null);
                    setChangeRequestSession(target);
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Xin đổi / hủy lịch</span>
                </button>
              )}
              {selectedSession.meeting_link && (
                <a
                  href={selectedSession.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Mở phòng học</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal yêu cầu đổi / hủy lịch học (UC27) */}
      <RequestScheduleChangeModal
        isOpen={Boolean(changeRequestSession)}
        onClose={() => setChangeRequestSession(null)}
        session={changeRequestSession}
        classId={classId}
        showToast={showToast}
        onSuccess={() => loadSessions()}
      />
    </div>
  );
}

