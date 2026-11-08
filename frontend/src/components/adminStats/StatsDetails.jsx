import { Link } from 'react-router-dom';
import SectionCard from '../common/SectionCard';
import { formatVnd } from '../../utils/formatCurrency';
function Metric({
  label,
  value
}) {
  return <div className="admin-stats-metric"><dt>{label}</dt><dd>{value}</dd></div>;
}
export default function StatsDetails({
  kpis
}) {
  return <div className="admin-stats-details">
      <SectionCard title="Yêu cầu và kết nối">
        <dl>
          <Metric label="Tổng yêu cầu tìm gia sư" value={kpis.totalRequests} />
          <Metric label="Yêu cầu đang mở" value={kpis.openRequests} />
          <Metric label="Đơn ứng tuyển" value={kpis.totalApplications} />
          <Metric label="Lời mời đã gửi" value={kpis.totalInvitations} />
          <Metric label="Cuộc trò chuyện trực tiếp" value={kpis.conversationsOpened} />
          <Metric label="Thỏa thuận đang chờ" value={kpis.pendingConnections} />
        </dl>
      </SectionCard>
      <SectionCard title="Cơ cấu doanh thu">
        <dl>
          <Metric label="Nâng cấp gói dịch vụ" value={formatVnd(kpis.planUpgradeRevenue)} />
          <Metric label="Mua gói credits" value={formatVnd(kpis.creditPackRevenue)} />
          <Metric label="Tổng đã thanh toán" value={formatVnd(kpis.totalGmv)} />
        </dl>
        <p className="admin-stats-meta">Số liệu tích lũy từ các đơn thanh toán thành công.</p>
      </SectionCard>
      <SectionCard title="Kiểm duyệt và quản trị">
        <dl>
          <Metric label="Báo cáo đang chờ xử lý" value={kpis.pendingReportsCount} />
          <Metric label="Bản ghi nhật ký quản trị" value={kpis.totalAuditLogs} />
        </dl>
        <div className="admin-stats-links">
          <Link to="/admin/moderation" className="link">Xử lý báo cáo</Link>
          <Link to="/admin/users" className="link">Quản lý tài khoản</Link>
        </div>
      </SectionCard>
    </div>;
}
