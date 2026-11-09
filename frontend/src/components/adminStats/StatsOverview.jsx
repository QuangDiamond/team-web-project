import StatCard from '../common/StatCard';
import { formatVnd } from '../../utils/formatCurrency';
export default function StatsOverview({
  kpis
}) {
  return <div className="stat-grid">
      <StatCard label="Tổng người dùng" value={kpis.totalUsers.toLocaleString('vi-VN')} detail={`${kpis.activeParents} phụ huynh · ${kpis.activeTutors} gia sư · ${kpis.activeStudents} học sinh đang hoạt động`} />
      <StatCard label="Doanh thu đã thanh toán" value={formatVnd(kpis.totalGmv)} detail="Tổng đơn nâng cấp gói và mua credits thành công" tone="success" />
      <StatCard label="Kết nối đã xác nhận" value={kpis.confirmedConnections.toLocaleString('vi-VN')} detail={`Tỷ lệ trên tổng yêu cầu: ${kpis.conversionRate.toLocaleString('vi-VN')}%`} tone="info" />
      <StatCard label="Lớp học đang hoạt động" value={kpis.activeClassrooms.toLocaleString('vi-VN')} detail={`Hạn mức AI đã dùng hiện tại: ${kpis.aiQuotaUtilized.toLocaleString('vi-VN')}`} tone="warning" />
    </div>;
}
