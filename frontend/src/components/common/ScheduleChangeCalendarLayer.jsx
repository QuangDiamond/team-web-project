import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatShortDay, getDayDifference, getWeekStart, isRequestExpired } from '../../utils/scheduleChangeDates';

const TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function isInWeek(date, weekStart) {
  const dayIndex = getDayDifference(weekStart, date);
  return dayIndex >= 0 && dayIndex < 7;
}

function formatRange(start, end) {
  return `${TIME_FORMATTER.format(new Date(start))} – ${TIME_FORMATTER.format(new Date(end))}`;
}

function getMoveLabel(request) {
  const dayDifference = getDayDifference(request.session.start_time, request.proposed_start_time);
  if (dayDifference === 0) return 'đổi giờ · chờ phản hồi';
  const sign = dayDifference > 0 ? '+' : '−';
  return `${sign}${Math.abs(dayDifference)} ngày · chờ phản hồi`;
}

/**
 * Gom các yêu cầu đổi lịch PENDING cho tuần đang xem:
 * - requestBySessionId: buổi gốc nào đang chờ đổi
 * - proposals: "buổi ma" ở giờ đề xuất (chỉ những giờ nằm trong tuần), dùng chung layout với buổi học thật
 * - hints: yêu cầu chỉ có một đầu nằm trong tuần (không vẽ được đường nối)
 */
export function getPendingChanges(requests, weekStart) {
  const pending = requests.filter((request) => request.status === 'PENDING' && request.session && !isRequestExpired(request));
  const requestBySessionId = new Map();
  const proposals = [];
  const hints = [];

  for (const request of pending) {
    requestBySessionId.set(String(request.session._id), request);
    const sourceInWeek = isInWeek(request.session.start_time, weekStart);
    const proposalInWeek = isInWeek(request.proposed_start_time, weekStart);
    if (proposalInWeek) {
      proposals.push({
        _id: `proposal-${request._id}`,
        isProposal: true,
        requestId: request._id,
        class_id: request.session.class_id,
        class_name: request.session.class_name,
        title: request.session.title,
        start_time: request.proposed_start_time,
        end_time: request.proposed_end_time,
        status: 'PROPOSED',
      });
    }
    if (sourceInWeek !== proposalInWeek) {
      const otherDate = sourceInWeek ? request.proposed_start_time : request.session.start_time;
      hints.push({
        requestId: request._id,
        label: `${request.session.class_name || 'Lớp học'}: ${sourceInWeek ? 'giờ đề xuất' : 'buổi gốc'} ở ${formatShortDay(otherDate)}`,
        weekStart: getWeekStart(otherDate),
      });
    }
  }

  return { pending, requestBySessionId, proposals, hints };
}

// Class thêm cho buổi gốc đang chờ đổi
export function getPendingClassName(request, selectedRequestId) {
  if (!request) return '';
  if (!selectedRequestId) return ' is-pending-change';
  return request._id === selectedRequestId ? ' is-pending-change is-change-selected' : ' is-pending-change is-change-dimmed';
}

export function ProposalEvent({ event, selectedRequestId, onSelect }) {
  const proposal = event.session;
  const isSelected = selectedRequestId === proposal.requestId;
  const isDimmed = Boolean(selectedRequestId) && !isSelected;
  const timeLabel = formatRange(proposal.start_time, proposal.end_time);
  return (
    <button
      type="button"
      className={`schedule-change-proposal-event${isSelected ? ' is-change-selected' : ''}${isDimmed ? ' is-change-dimmed' : ''}`}
      style={{
        top: `${event.top}px`,
        height: `${event.height}px`,
        left: `calc(${(100 / event.laneCount) * event.laneIndex}% + 3px)`,
        width: `calc(${100 / event.laneCount}% - 6px)`,
      }}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onSelect(proposal.requestId);
      }}
      aria-label={`Giờ đề xuất đổi lịch: ${proposal.class_name || 'Lớp học'}, ${timeLabel}`}
    >
      <span className="schedule-change-proposal-tag">Đề xuất</span>
      <strong>{proposal.class_name || 'Lớp học'}</strong>
      <span>{timeLabel}</span>
    </button>
  );
}

/**
 * Lớp vẽ đường nối, đặt tuyệt đối trên lưới lịch (bên phải trục giờ, dưới hàng tiêu đề ngày).
 * dayLayouts: mảng 7 phần tử, mỗi phần tử là danh sách event {session, top, height, laneIndex, laneCount}.
 */
export function ScheduleChangeLinks({ dayLayouts, pendingRequests, selectedRequestId, gridHeight, axisWidth = 64, headerHeight = 58 }) {
  const layerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = layerRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const columnWidth = width / 7;
  const findEvent = (predicate) => {
    for (let dayIndex = 0; dayIndex < dayLayouts.length; dayIndex += 1) {
      const event = dayLayouts[dayIndex].find(predicate);
      if (event) return { ...event, dayIndex };
    }
    return null;
  };
  const getPoint = (event) => {
    const laneWidth = columnWidth / event.laneCount;
    const left = event.dayIndex * columnWidth + event.laneIndex * laneWidth;
    return { centerX: left + laneWidth / 2, right: left + laneWidth, top: event.top, middleY: event.top + event.height / 2 };
  };

  const links = width > 0 ? pendingRequests.map((request) => {
    const source = findEvent((event) => !event.session.isProposal && String(event.session._id) === String(request.session._id));
    const target = findEvent((event) => event.session.isProposal && event.session.requestId === request._id);
    if (!source || !target) return null;
    const from = getPoint(source);
    const to = getPoint(target);
    if (source.dayIndex === target.dayIndex) {
      const bulge = Math.max(from.right, to.right) + Math.min(36, columnWidth * 0.3);
      return {
        id: request._id,
        path: `M ${from.right - 4} ${from.middleY} C ${bulge} ${from.middleY}, ${bulge} ${to.middleY}, ${to.right - 4} ${to.middleY}`,
        labelX: bulge,
        labelY: (from.middleY + to.middleY) / 2,
        label: getMoveLabel(request),
      };
    }
    const lift = Math.min(70, 28 + Math.abs(to.centerX - from.centerX) * 0.12);
    const peak = Math.max(Math.min(from.top, to.top) - lift, 8);
    return {
      id: request._id,
      path: `M ${from.centerX} ${from.top + 2} C ${from.centerX} ${peak}, ${to.centerX} ${peak}, ${to.centerX} ${to.top - 2}`,
      labelX: (from.centerX + to.centerX) / 2,
      labelY: peak + (Math.min(from.top, to.top) - peak) * 0.25,
      label: getMoveLabel(request),
    };
  }).filter(Boolean) : [];

  const getState = (id) => {
    if (!selectedRequestId) return '';
    return id === selectedRequestId ? 'is-change-selected' : 'is-change-dimmed';
  };

  return (
    <div
      ref={layerRef}
      className="schedule-change-links-layer"
      style={{ left: `${axisWidth}px`, top: `${headerHeight}px`, width: `calc(100% - ${axisWidth}px)`, height: `${gridHeight}px` }}
      aria-hidden="true"
    >
      {links.length > 0 && (
        <svg width={width} height={gridHeight}>
          <defs>
            <marker id="schedule-change-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          {links.map((link) => (
            <path key={link.id} d={link.path} className={getState(link.id)} markerEnd="url(#schedule-change-arrow)" />
          ))}
        </svg>
      )}
      {links.map((link) => (
        <span key={`label-${link.id}`} className={`schedule-change-link-label ${getState(link.id)}`} style={{ left: `${link.labelX}px`, top: `${link.labelY}px` }}>
          {link.label}
        </span>
      ))}
    </div>
  );
}

// Chú thích + chip dẫn sang tuần khác, đặt phía trên lịch; chỉ hiện khi có yêu cầu đang chờ
export function ScheduleChangeCalendarNotes({ pendingChanges, onShowHint }) {
  if (pendingChanges.pending.length === 0) return null;
  return (
    <div className="schedule-change-calendar-notes">
      <div className="schedule-change-legend">
        <span><i className="is-pending" aria-hidden="true" />Buổi đang chờ đổi</span>
        <span><i className="is-proposal" aria-hidden="true" />Giờ đề xuất</span>
        <span className="is-link">
          <svg width="28" height="12" viewBox="0 0 28 12" fill="none" aria-hidden="true">
            <path d="M1 10 Q14 0 25 9" stroke="currentColor" strokeWidth="2" />
            <path d="M21 8 L26 10 L24 5" stroke="currentColor" strokeWidth="2" />
          </svg>
          Đường nối chỉ hiện khi yêu cầu đang chờ phản hồi
        </span>
      </div>
      {pendingChanges.hints.length > 0 && (
        <div className="schedule-change-week-hints">
          {pendingChanges.hints.map((hint) => (
            <button key={hint.requestId} type="button" className="schedule-change-week-hint" onClick={() => onShowHint(hint)}>
              {hint.label} <ArrowRight size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
