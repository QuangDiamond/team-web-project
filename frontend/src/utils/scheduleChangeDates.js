const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function getWeekStart(date) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

// Số ngày lịch giữa hai thời điểm (theo giờ địa phương)
export function getDayDifference(from, to) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

// "T7 14/11"
export function formatShortDay(date) {
  const value = new Date(date);
  return `${WEEKDAY_SHORT[value.getDay()]} ${value.getDate()}/${value.getMonth() + 1}`;
}

// Tìm lý do giờ đề xuất bị trùng: 'SAME_TIME' nếu y hệt giờ hiện tại, buổi bị trùng nếu chồng giờ, null nếu hợp lệ.
// Hai buổi sát nhau (kết thúc = bắt đầu) cũng tính là trùng, giống backend (ensureNoSessionOverlap).
export function findProposalConflict(session, proposedStart, proposedEnd, otherSessions) {
  const startMs = new Date(proposedStart).getTime();
  const endMs = new Date(proposedEnd).getTime();
  const sameStart = startMs === new Date(session.start_time).getTime();
  const sameEnd = endMs === new Date(session.end_time).getTime();
  if (sameStart && sameEnd) return 'SAME_TIME';

  const conflictingSession = otherSessions.find((otherSession) => {
    if (otherSession._id === session._id || otherSession.status === 'CANCELLED') return false;
    const otherStartMs = new Date(otherSession.start_time).getTime();
    const otherEndMs = new Date(otherSession.end_time).getTime();
    return startMs <= otherEndMs && endMs >= otherStartMs;
  });
  return conflictingSession || null;
}

// Yêu cầu PENDING nhưng buổi gốc đã bắt đầu hoặc giờ đề xuất đã qua → không thể phản hồi nữa
// (backend cũng chặn phản hồi trong trường hợp này; DB không có trạng thái EXPIRED nên chỉ suy ra ở giao diện)
export function isRequestExpired(request, now = new Date()) {
  if (request.status !== 'PENDING' || !request.session) return false;
  return new Date(request.session.start_time) <= now || new Date(request.proposed_start_time) <= now;
}
