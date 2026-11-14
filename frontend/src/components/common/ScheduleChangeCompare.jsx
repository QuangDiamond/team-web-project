import { formatShortDay, getDayDifference } from '../../utils/scheduleChangeDates';

const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const HOUR_HEIGHT = 40;

function getMinutes(date) {
  const value = new Date(date);
  return value.getHours() * 60 + value.getMinutes();
}

function getDeltaLabel(request) {
  const dayDifference = getDayDifference(request.session.start_time, request.proposed_start_time);
  const timeChanged = getMinutes(request.session.start_time) !== getMinutes(request.proposed_start_time)
    || getMinutes(request.session.end_time) !== getMinutes(request.proposed_end_time);
  if (dayDifference === 0) return 'Cùng ngày, đổi giờ';
  const sign = dayDifference > 0 ? '+' : '−';
  return `${sign}${Math.abs(dayDifference)} ngày, ${timeChanged ? 'đổi giờ' : 'cùng giờ'}`;
}

function TimeStrip({ label, start, end, variant }) {
  const startMinute = getMinutes(start);
  const endMinute = Math.max(getMinutes(end), startMinute + 30);
  const hourStart = Math.max(0, Math.floor(startMinute / 60) - 1);
  const hourEnd = Math.min(24, Math.max(hourStart + 3, Math.ceil(endMinute / 60) + 1));
  const hours = Array.from({ length: hourEnd - hourStart }, (_, index) => hourStart + index);
  const top = ((startMinute - hourStart * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(24, ((endMinute - startMinute) / 60) * HOUR_HEIGHT);
  const timeLabel = `${TIME_FORMATTER.format(new Date(start))} – ${TIME_FORMATTER.format(new Date(end))}`;

  return (
    <div className={`schedule-change-strip is-${variant}`}>
      <span className="schedule-change-strip-label">{label} · {formatShortDay(start)}</span>
      <div className="schedule-change-strip-grid" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
        {hours.map((hour, index) => (
          <div key={hour} className="schedule-change-strip-hour" style={{ top: `${index * HOUR_HEIGHT}px` }}>
            <span>{String(hour).padStart(2, '0')}:00</span>
          </div>
        ))}
        <div className="schedule-change-strip-event" style={{ top: `${top}px`, height: `${height}px` }}>
          <strong>{timeLabel}</strong>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleChangeCompare({ request }) {
  if (!request.session) return null;
  return (
    <div className="schedule-change-compare" aria-label="So sánh lịch hiện tại và lịch đề xuất">
      <TimeStrip label="Lịch hiện tại" start={request.session.start_time} end={request.session.end_time} variant="current" />
      <div className="schedule-change-compare-arrow" aria-hidden="true">
        <svg width="96" height="28" viewBox="0 0 96 28" fill="none">
          <path d="M4 22 C 28 2, 68 2, 88 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M80 19 L89 21 L87 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="22" r="3.5" fill="currentColor" />
        </svg>
        <span>{getDeltaLabel(request)}</span>
      </div>
      <TimeStrip label="Đề xuất" start={request.proposed_start_time} end={request.proposed_end_time} variant="proposal" />
    </div>
  );
}
