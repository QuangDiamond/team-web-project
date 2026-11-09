// Lịch học dạng "T2, T4, T6 · 4:00 PM - 6:00 PM". Vẫn lưu trong một chuỗi `schedule`
// nên không đổi schema; hàm parse đọc lại chuỗi này để điền sẵn khi sửa.

export const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Lịch đã lưu trước đây dùng tên ngày tiếng Anh (Mon, Tue...): vẫn đọc được và đổi sang tên tiếng Việt
const ENGLISH_DAY_TO_VIETNAMESE = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' };

export const EMPTY_TIME = { hour: '', minute: '', period: 'PM' };

const DAY_PATTERN = [...WEEK_DAYS, ...Object.keys(ENGLISH_DAY_TO_VIETNAMESE)].join('|');
const SCHEDULE_REGEX = new RegExp(
  `^((?:${DAY_PATTERN})(?:, (?:${DAY_PATTERN}))*) · (\\d{1,2}):(\\d{2}) (AM|PM) - (\\d{1,2}):(\\d{2}) (AM|PM)$`
);

// Giờ hợp lệ: giờ 1-12, phút 0-59
export const isValidTime = (time) => {
  if (time.hour === '' || time.minute === '') {
    return false;
  }
  const hour = Number(time.hour);
  const minute = Number(time.minute);
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
    return false;
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return false;
  }
  return true;
};

// Số phút tính từ 00:00, dùng để so sánh giờ bắt đầu và kết thúc
export const toMinutes = (time) => {
  let hour24 = Number(time.hour) % 12;
  if (time.period === 'PM') {
    hour24 += 12;
  }
  return hour24 * 60 + Number(time.minute);
};

const formatTime = (time) => {
  const minute = String(Number(time.minute)).padStart(2, '0');
  return `${Number(time.hour)}:${minute} ${time.period}`;
};

// Trả chuỗi lịch, hoặc '' nếu chưa chọn ngày / giờ chưa hợp lệ / giờ kết thúc không sau giờ bắt đầu
export const formatSchedule = (days, start, end) => {
  if (days.length === 0 || !isValidTime(start) || !isValidTime(end)) {
    return '';
  }
  if (toMinutes(end) <= toMinutes(start)) {
    return '';
  }
  const orderedDays = WEEK_DAYS.filter((day) => days.includes(day));
  return `${orderedDays.join(', ')} · ${formatTime(start)} - ${formatTime(end)}`;
};

// Đọc lại chuỗi lịch. Chuỗi nhập tay kiểu cũ ("Tối thứ 3, thứ 5") không đọc được thì trả null
export const parseSchedule = (text) => {
  const match = SCHEDULE_REGEX.exec(text || '');
  if (!match) {
    return parseVietnameseSchedule(text);
  }
  const days = match[1].split(', ').map((day) => ENGLISH_DAY_TO_VIETNAMESE[day] || day);
  return {
    days: days,
    start: { hour: match[2], minute: match[3], period: match[4] },
    end: { hour: match[5], minute: match[6], period: match[7] },
  };
};

// Older requests store a 24-hour range, e.g. "Thứ 3, 5 — 19:30 đến 21:00".
function parseVietnameseSchedule(text) {
  const match = /^(.*?)\s+[—–·-]\s+(\d{1,2}):(\d{2})\s+(?:đến|[—–-])\s+(\d{1,2}):(\d{2})$/i.exec(text || '');
  if (!match) return null;
  const days = [];
  for (const value of match[1].split(/,\s*/)) {
    const token = value.trim().toLowerCase();
    if (token === 'chủ nhật' || token === 'cn') days.push('CN');
    else {
      const day = /^(?:thứ\s*|t)?([2-7])$/.exec(token);
      if (!day) return null;
      days.push('T' + day[1]);
    }
  }
  const toTime = (hour, minute) => {
    const hours = Number(hour);
    return { hour: String(hours % 12 || 12), minute, period: hours >= 12 ? 'PM' : 'AM' };
  };
  if (Number(match[2]) > 23 || Number(match[4]) > 23) return null;
  const start = toTime(match[2], match[3]);
  const end = toTime(match[4], match[5]);
  if (!isValidTime(start) || !isValidTime(end) || toMinutes(end) <= toMinutes(start)) return null;
  return { days: WEEK_DAYS.filter((day) => days.includes(day)), start, end };
}
