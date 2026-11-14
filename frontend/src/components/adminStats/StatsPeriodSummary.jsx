import SectionCard from '../common/SectionCard';
import { formatVnd } from '../../utils/formatCurrency';

function PeriodMetric({ label, value }) {
  return (
    <div className="admin-stats-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// UC40: các chỉ số phát sinh trong kỳ đã chọn (khác với số tích lũy ở StatsOverview)
export default function StatsPeriodSummary({ periodKpis, periodLabel }) {
  const usersByRole = periodKpis.newUsersByRole;
  const roleDetail = `${usersByRole.PARENT} phụ huynh · ${usersByRole.TUTOR} gia sư · ${usersByRole.STUDENT} học sinh`;

  return (
    <SectionCard title={`Phát sinh trong kỳ: ${periodLabel}`}>
      <dl className="admin-stats-period-grid">
        <PeriodMetric label="Người dùng mới" value={periodKpis.newUsers.toLocaleString('vi-VN')} />
        <PeriodMetric label="Theo vai trò" value={roleDetail} />
        <PeriodMetric label="Yêu cầu tìm gia sư mới" value={periodKpis.newRequests.toLocaleString('vi-VN')} />
        <PeriodMetric label="Đơn ứng tuyển" value={periodKpis.applications.toLocaleString('vi-VN')} />
        <PeriodMetric label="Lời mời đã gửi" value={periodKpis.invitations.toLocaleString('vi-VN')} />
        <PeriodMetric label="Cuộc trò chuyện được mở" value={periodKpis.conversationsOpened.toLocaleString('vi-VN')} />
        <PeriodMetric label="Thỏa thuận được xác nhận" value={periodKpis.confirmedAgreements.toLocaleString('vi-VN')} />
        <PeriodMetric label="Doanh thu nâng cấp gói" value={formatVnd(periodKpis.planUpgradeRevenue)} />
        <PeriodMetric label="Doanh thu mua credits" value={formatVnd(periodKpis.creditPackRevenue)} />
        <PeriodMetric label="Tổng doanh thu trong kỳ" value={formatVnd(periodKpis.revenue)} />
      </dl>
    </SectionCard>
  );
}
