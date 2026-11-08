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
      <StatCard label="Joined Classes" value={getTotal(classes)} detail="Active classes" tone="primary" />
      <StatCard label="Upcoming Sessions" value={getTotal(sessions)} detail="Next 7 days" tone="info" />
      <StatCard label="Pending Assignments" value={getTotal(assignments)} detail="Not submitted yet" tone="warning" />
      <StatCard label="Published Grades" value={getTotal(grades)} detail="With tutor feedback" tone="success" />
    </div>
  );
}
