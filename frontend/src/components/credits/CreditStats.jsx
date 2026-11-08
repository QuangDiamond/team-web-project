import { getPlanTitle } from '../../utils/planDisplay';
import { formatDate } from '../../utils/paymentDisplay';

// Dòng chữ nhỏ dưới tên gói: ngày hết hạn / gói miễn phí
const getPlanDetail = (billing) => {
  const subscription = billing.subscription;
  if (billing.plan && billing.plan.is_free) {
    if (subscription && subscription.status === 'EXPIRED') {
      return `Gói Pro đã hết hạn vào ${formatDate(subscription.expires_at)}`;
    }
    return 'Gói Miễn phí, không cần gia hạn';
  }
  if (subscription && subscription.expires_at) {
    // D17: chưa có tự gia hạn nên ghi "Expires on"
    return `Hết hạn vào ${formatDate(subscription.expires_at)}`;
  }
  return '—';
};

function StatCard({ label, value, detail, tone }) {
  return (
    <div className="card stat-card">
      <dt className="stat-label">{label}</dt>
      <dd className={`stat-value stat-${tone}`}>{value?.toLocaleString('vi-VN')}</dd>
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
      <StatCard label="Gói hiện tại" value={planTitle} detail={getPlanDetail(billing)} tone="primary" />
      <StatCard label="Số dư tín dụng" value={billing.credit_balance} detail="1 tín dụng cho mỗi lượt ứng tuyển hoặc lời mời" tone="success" />
      <StatCard label="Lượt dùng AI còn lại" value={billing.ai_quota_left} detail="Còn lại trong kỳ dịch vụ này" tone="info" />
    </dl>
  );
}
