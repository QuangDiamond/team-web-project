// Nhãn và màu hiển thị cho màn theo dõi tiến độ của con (UC35)

export const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Có mặt', tone: 'success' },
  LATE: { label: 'Đi muộn', tone: 'warning' },
  ABSENT: { label: 'Vắng', tone: 'error' },
};

export const TIMELINESS = {
  ON_TIME: 'Nộp đúng hạn',
  LATE: 'Nộp muộn',
};

export const QUESTION_TYPE = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  SHORT_ANSWER: 'Tự luận ngắn',
  FILE_UPLOAD: 'Nộp file',
};

// Màu theo điểm phần trăm: >= 85 xanh, >= 70 vàng, còn lại đỏ (giống Student Dashboard)
export const getScoreTone = (percent) => {
  if (percent === null || percent === undefined) {
    return 'info';
  }
  if (percent >= 85) {
    return 'success';
  }
  if (percent >= 70) {
    return 'warning';
  }
  return 'error';
};

export const formatPercent = (percent) => {
  if (percent === null || percent === undefined) {
    return '—';
  }
  return `${percent}%`;
};

// "6/10" hoặc "6" nếu không có tổng điểm; "—" khi chưa có điểm
export const formatScore = (score, totalPoints) => {
  if (score === null || score === undefined) {
    return '—';
  }
  if (!totalPoints) {
    return String(score);
  }
  return `${score}/${totalPoints}`;
};
