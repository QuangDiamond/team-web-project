import { BarChart3 } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import EmptyState from '../common/EmptyState';
import { getUserRoleLabel } from '../../utils/userDisplay';
import { formatVnd } from '../../utils/formatCurrency';
export default function StatsCharts({
  trends,
  roles,
  periodLabel
}) {
  const maxRevenue = Math.max(...trends.revenue, 1);
  const hasRevenue = trends.revenue.some(value => value > 0);
  return <div className="admin-stats-charts">
      <SectionCard title="Doanh thu theo thời gian" action={<span className="admin-stats-meta">{periodLabel}</span>}>
        {!hasRevenue && <EmptyState icon={BarChart3} title="Chưa có doanh thu trong kỳ" description="Chỉ ghi nhận đơn thanh toán thành công trong khoảng thời gian đã chọn." />}
        {hasRevenue && <div className="admin-stats-chart" aria-hidden="true">
            {trends.labels.map((label, index) => <div key={`${label}-${index}`} className="admin-stats-chart-column">
                <span className="admin-stats-chart-amount">{formatVnd(trends.revenue[index])}</span>
                <div className="admin-stats-chart-track">
                  <div className="admin-stats-chart-bar" style={{
              height: `${trends.revenue[index] / maxRevenue * 100}%`
            }} />
                </div>
                <span>{label}</span>
              </div>)}
          </div>}
        <details className="admin-stats-data">
          <summary>Xem số liệu chi tiết trong kỳ</summary>
          <div className="admin-stats-table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">Doanh thu, người dùng mới và thỏa thuận mới trong {periodLabel}</caption>
              <thead><tr><th scope="col">Mốc thời gian</th><th scope="col">Doanh thu</th><th scope="col">Người dùng mới</th><th scope="col">Thỏa thuận mới</th></tr></thead>
              <tbody>{trends.labels.map((label, index) => <tr key={`${label}-${index}`}><th scope="row">{label}</th><td>{formatVnd(trends.revenue[index])}</td><td>{trends.userGrowth[index]}</td><td>{trends.connections[index]}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </SectionCard>
      <SectionCard title="Phân bổ tài khoản" action={<span className="admin-stats-meta">Toàn hệ thống</span>}>
        <ul className="admin-stats-roles">
          {roles.map(item => <li key={item.role} className={`admin-stats-role admin-stats-role-${item.role}`}>
              <div className="admin-stats-role-heading"><span>{getUserRoleLabel(item.role)}</span><strong>{item.count.toLocaleString('vi-VN')} <span className="admin-stats-meta">({item.percent.toLocaleString('vi-VN')}%)</span></strong></div>
              <div className="admin-stats-role-track" aria-hidden="true"><div className="admin-stats-role-fill" style={{
              width: `${item.percent}%`
            }} /></div>
            </li>)}
        </ul>
        <p className="admin-stats-meta">Bao gồm các tài khoản ở mọi trạng thái, phân theo vai trò đã đăng ký.</p>
      </SectionCard>
    </div>;
}
