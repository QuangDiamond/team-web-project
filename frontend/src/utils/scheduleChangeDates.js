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

// Yêu cầu PENDING nhưng buổi gốc đã bắt đầu hoặc giờ đề xuất đã qua → không thể phản hồi nữa
// (backend cũng chặn phản hồi trong trường hợp này; DB không có trạng thái EXPIRED nên chỉ suy ra ở giao diện)
export function isRequestExpired(request, now = new Date()) {
  if (request.status !== 'PENDING' || !request.session) return false;
  return new Date(request.session.start_time) <= now || new Date(request.proposed_start_time) <= now;
}
