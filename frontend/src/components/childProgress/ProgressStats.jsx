import StatCard from '../common/StatCard';
import { formatPercent } from './progressLabels';

// Hàng số liệu tổng quan của một người con (lớp, chuyên cần, điểm trung bình)
export default function ProgressStats({ summary }) {
  const attendance = summary.attendance;
  const results = summary.results;

  let attendanceDetail = 'Chưa có buổi nào được điểm danh';
  if (attendance.total > 0) {
    attendanceDetail = `${attendance.attended}/${attendance.total} buổi có mặt hoặc đi muộn`;
  }

  let resultDetail = 'Chưa có bài được công bố điểm';
  if (results.count > 0) {
    resultDetail = `${results.count} bài đã có điểm`;
  }

  return (
    <div className="stat-grid">
      <StatCard label="Lớp đang học" value={summary.class_count} detail="Lớp đang hoạt động" tone="primary" />
      <StatCard label="Tỉ lệ chuyên cần" value={formatPercent(attendance.rate)} detail={attendanceDetail} tone="success" />
      <StatCard label="Điểm trung bình" value={formatPercent(results.average_percent)} detail={resultDetail} tone="info" />
      <StatCard label="Điểm bài gần nhất" value={formatPercent(results.latest_percent)} detail="Theo thang 100%" tone="warning" />
    </div>
  );
}
