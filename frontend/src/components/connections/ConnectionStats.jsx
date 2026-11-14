import { CheckCircle2, Clock, Star, Users } from 'lucide-react';

function StatItem({ Icon, tone, value, label }) {
  return (
    <div className="conn-kpi-card">
      <div className={`conn-kpi-icon ${tone}`}>
        <Icon size={24} aria-hidden="true" />
      </div>
      <div>
        <div className="conn-kpi-val">{value}</div>
        <div className="conn-kpi-lbl">{label}</div>
      </div>
    </div>
  );
}

// Thống kê nhanh trên SC22 My Agreements
export default function ConnectionStats({ totalCount, confirmedCount, pendingCount, rateableCount }) {
  return (
    <div className="conn-kpi-grid">
      <StatItem Icon={Users} tone="orange" value={totalCount} label="Tổng số thỏa thuận" />
      <StatItem Icon={CheckCircle2} tone="green" value={confirmedCount} label="Đã xác nhận" />
      <StatItem Icon={Clock} tone="amber" value={pendingCount} label="Chờ xác nhận" />
      <StatItem Icon={Star} tone="blue" value={rateableCount} label="Cần đánh giá gia sư" />
    </div>
  );
}
