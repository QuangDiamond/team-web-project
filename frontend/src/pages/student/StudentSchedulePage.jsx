import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Video,
  BookOpen,
  Filter,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { getStudentSchedule, getJoinedClasses } from '../../services/studentDashboardService';
import RequestScheduleChangeModal from '../../components/classroom/RequestScheduleChangeModal';
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

export default function StudentSchedulePage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ totalSessions: 0, upcomingCount: 0, completedCount: 0 });
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SCHEDULED' | 'COMPLETED'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'LIST'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [changeRequestSession, setChangeRequestSession] = useState(null);

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);

  // 1. Tải danh sách lớp đang tham gia để lọc
  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const res = await getJoinedClasses({ page: 1, limit: 100 });
        if (isMounted && res?.data?.items) {
          setClasses(res.data.items);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách lớp học:', err.message);
      }
    };
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải lịch học theo tuần
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const params = {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      };
      if (selectedClassId) params.classId = selectedClassId;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await getStudentSchedule(params);
      if (res?.data) {
        setSessions(res.data.items || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải lịch học');
    } finally {
      setLoading(false);
    }
  }, [weekStart, selectedClassId, statusFilter]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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

  // Tính toán khung giờ cho view Grid
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

  const getStatusBadge = (session) => {
    const now = new Date();
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    if (session.status === 'CANCELLED') {
      return (
        <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'var(--color-error-soft)', color: 'var(--color-error)', fontSize: '12px', fontWeight: 600 }}>
          Đã hủy
        </span>
      );
    }
    if (now >= start && now <= end) {
      return (
        <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'var(--color-success-soft)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
          Đang diễn ra
        </span>
      );
    }
    if (now > end || session.status === 'COMPLETED') {
      return (
        <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600 }}>
          Đã học xong
        </span>
      );
    }
    return (
      <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'var(--color-info-soft)', color: 'var(--color-info)', fontSize: '12px', fontWeight: 600 }}>
        Sắp tới
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
            Lịch học của tôi
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Theo dõi thời khóa biểu hàng tuần và tham gia các buổi học trực tuyến
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={18} style={{ color: 'var(--color-primary-strong)' }} />
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>Tuần này</p>
              <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>{sessions.length} buổi</strong>
            </div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} style={{ color: 'var(--color-info)' }} />
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>Sắp tới</p>
              <strong style={{ fontSize: '15px', color: 'var(--color-info)' }}>{stats.upcomingCount} buổi</strong>
            </div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>Đã học xong</p>
              <strong style={{ fontSize: '15px', color: 'var(--color-success)' }}>{stats.completedCount} buổi</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="schedule-toolbar" style={{ flexWrap: 'wrap' }}>
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              {MONTH_YEAR_FORMATTER.format(weekStart)}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
              {' - '}
              {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="schedule-toolbar-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
          {/* Lọc theo lớp học */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={15} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-control-border)',
                fontSize: '13px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              <option value="">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc trạng thái */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-control-border)',
                fontSize: '13px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SCHEDULED">Sắp diễn ra</option>
              <option value="COMPLETED">Đã học xong</option>
            </select>
          </div>

          {/* View switcher */}
          <div style={{ display: 'flex', background: 'var(--color-surface-subtle)', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              style={{
                border: 'none',
                background: viewMode === 'GRID' ? 'var(--color-white)' : 'transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: viewMode === 'GRID' ? 700 : 500,
                color: viewMode === 'GRID' ? 'var(--color-primary-strong)' : 'var(--color-text-muted)',
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
                background: viewMode === 'LIST' ? 'var(--color-white)' : 'transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: viewMode === 'LIST' ? 700 : 500,
                color: viewMode === 'LIST' ? 'var(--color-primary-strong)' : 'var(--color-text-muted)',
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

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Loader2 size={26} className="spin" />
          <span>Đang tải lịch học của bạn...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ padding: '24px', background: 'var(--color-error-soft)', border: '1px solid #fecaca', borderRadius: '10px', color: 'var(--color-error)', textAlign: 'center' }}>
          <AlertCircle size={28} style={{ color: 'var(--color-error)', marginBottom: '8px' }} />
          <p style={{ margin: '0 0 12px', fontWeight: 600 }}>{error}</p>
          <button
            type="button"
            onClick={fetchSchedule}
            style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid var(--color-error)', background: 'var(--color-surface)', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 600 }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* View 1: Calendar Grid */}
      {!loading && !error && viewMode === 'GRID' && (
        <div className="schedule-calendar-card">
          {sessions.length === 0 && (
            <div className="schedule-week-empty" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <CalendarCheck size={40} style={{ color: 'var(--color-control-border)', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Không có buổi học nào trong khoảng thời gian này.</p>
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
                const daySessions = sessions.filter((session) => isSameDay(new Date(session.start_time), day));

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
                            <span style={{ fontSize: '11px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {session.class?.name || 'Lớp học'}
                            </span>
                            <span style={{ fontSize: '11px', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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

      {/* View 2: List View */}
      {!loading && !error && viewMode === 'LIST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <CalendarCheck size={40} style={{ color: 'var(--color-control-border)', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Không có buổi học nào trong khoảng thời gian này.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const start = new Date(session.start_time);
              const dateStr = start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

              return (
                <div
                  key={session._id}
                  style={{
                    padding: '18px 22px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'var(--color-primary-soft)',
                        color: 'var(--color-primary-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CalendarDays size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                          {session.title || 'Buổi học'}
                        </h4>
                        {session.class?.subject && (
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-info-soft)', color: 'var(--color-info)' }}>
                            {session.class.subject}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Lớp: <strong>{session.class?.name || '---'}</strong>
                        {session.class?.tutor_name && ` • Gia sư: ${session.class.tutor_name}`}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <Clock size={12} />
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
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
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

      {/* Session Detail Modal */}
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
              background: 'var(--color-surface)',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                  {selectedSession.title || 'Chi tiết buổi học'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {selectedSession.class?.name || 'Lớp học'} ({selectedSession.class?.subject || 'Môn học'})
                </p>
              </div>
              {getStatusBadge(selectedSession)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text)' }}>
                <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
                <span>
                  <strong>Thời gian:</strong> {formatSessionTime(selectedSession)} (
                  {new Date(selectedSession.start_time).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  )
                </span>
              </div>

              {selectedSession.class?.tutor_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text)' }}>
                  <Sparkles size={16} style={{ color: 'var(--color-primary-strong)' }} />
                  <span>
                    <strong>Gia sư phụ trách:</strong> {selectedSession.class.tutor_name}
                  </span>
                </div>
              )}

              {selectedSession.meeting_link && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--color-text)' }}>
                  <Video size={16} style={{ color: 'var(--color-info)', marginTop: '2px' }} />
                  <div>
                    <strong>Link trực tuyến:</strong>{' '}
                    <a
                      href={selectedSession.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--color-info)', textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {selectedSession.meeting_link}
                    </a>
                  </div>
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
              {selectedSession.status === 'SCHEDULED' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary-strong)', borderColor: '#fdba74' }}
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
                  <span>Vào phòng học ngay</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal yêu cầu đổi/hủy lịch học theo quy định BR-10 / UC27 */}
      <RequestScheduleChangeModal
        isOpen={Boolean(changeRequestSession)}
        onClose={() => setChangeRequestSession(null)}
        session={changeRequestSession}
        onSuccess={() => {
          fetchSchedule();
        }}
      />

    </div>
  );
}

