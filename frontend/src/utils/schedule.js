// Lịch học dạng "Mon, Wed, Fri · 4:00 PM - 6:00 PM". Vẫn lưu trong một chuỗi `schedule`
// nên không đổi schema; hàm parse đọc lại chuỗi này để điền sẵn khi sửa.

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const EMPTY_TIME = { hour: '', minute: '', period: 'PM' };

const DAY_PATTERN = WEEK_DAYS.join('|');
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
    return null;
  }
  return {
    days: match[1].split(', '),
    start: { hour: match[2], minute: match[3], period: match[4] },
    end: { hour: match[5], minute: match[6], period: match[7] },
  };
};
