const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

// "09:00"
export const formatTime = (value) => {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// "28 Oct 2026"
export const formatDate = (value) => {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// "Today", "Tomorrow" hoặc "Thu, 30 Oct"
export const formatRelativeDay = (value) => {
  const dayDifference = Math.round((startOfDay(value) - startOfDay(new Date())) / DAY_IN_MS);
  if (dayDifference === 0) {
    return 'Hôm nay';
  }
  if (dayDifference === 1) {
    return 'Ngày mai';
  }
  return new Date(value).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: 'short' });
};
