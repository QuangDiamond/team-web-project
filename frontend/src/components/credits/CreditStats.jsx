import { getPlanTitle } from '../../utils/planDisplay';
import { formatDate } from '../../utils/paymentDisplay';

// Dòng chữ nhỏ dưới tên gói: ngày hết hạn / gói miễn phí
const getPlanDetail = (billing) => {
  const subscription = billing.subscription;
  if (billing.plan && billing.plan.is_free) {
    if (subscription && subscription.status === 'EXPIRED') {
      return `Pro expired on ${formatDate(subscription.expires_at)}`;
    }
    return 'Free plan, no renewal';
  }
  if (subscription && subscription.expires_at) {
    // D17: chưa có tự gia hạn nên ghi "Expires on"
    return `Expires on ${formatDate(subscription.expires_at)}`;
  }
  return '—';
};

function StatCard({ label, value, detail, tone }) {
  return (
    <div className="card stat-card">
      <dt className="stat-label">{label}</dt>
      <dd className={`stat-value stat-${tone}`}>{value}</dd>
      <dd className="stat-detail">{detail}</dd>
    </div>
  );
}

// 3 thẻ thống kê (Figma: Stat): gói hiện tại + ngày gia hạn, số dư credit, AI quota còn lại (UC18 bước 1)
export default function CreditStats({ billing }) {
  let planTitle = '—';
  if (billing.plan) {
    planTitle = getPlanTitle(billing.plan.name);
  }

  return (
    <dl className="stat-grid">
      <StatCard label="Current plan" value={planTitle} detail={getPlanDetail(billing)} tone="primary" />
      <StatCard label="Credit balance" value={billing.credit_balance} detail="1 credit per application or invitation" tone="success" />
      <StatCard label="AI quota left" value={billing.ai_quota_left} detail="Left in this plan period" tone="info" />
    </dl>
  );
}
