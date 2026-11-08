const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

// "09:00"
export const formatTime = (value) => {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// "28/10/2026"
export const formatDate = (value) => {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// "Today", "Tomorrow" hoặc "Thu, 30 Oct"
export const formatRelativeDay = (value) => {
  const dayDifference = Math.round((startOfDay(value) - startOfDay(new Date())) / DAY_IN_MS);
  if (dayDifference === 0) {
    return 'Today';
  }
  if (dayDifference === 1) {
    return 'Tomorrow';
  }
  return new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
};
