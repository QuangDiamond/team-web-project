import StatCard from '../common/StatCard';

// Hiện "—" khi khối đang tải hoặc lỗi để không hiển thị số sai
const getTotal = (section) => {
  if (section.loading || section.error) {
    return '—';
  }
  return section.total;
};

// Hàng số liệu (Figma: 4 ô stat). Giá trị là tổng số thật từ pagination.total
export default function StudentStats({ classes, sessions, assignments, grades }) {
  return (
    <div className="student-stats">
      <StatCard label="Lớp đã tham gia" value={getTotal(classes)} detail="Lớp đang hoạt động" tone="primary" />
      <StatCard label="Buổi học sắp tới" value={getTotal(sessions)} detail="Trong 7 ngày tới" tone="info" />
      <StatCard label="Bài tập chưa hoàn thành" value={getTotal(assignments)} detail="Chưa nộp" tone="warning" />
      <StatCard label="Điểm đã công bố" value={getTotal(grades)} detail="Kèm nhận xét của gia sư" tone="success" />
    </div>
  );
}
