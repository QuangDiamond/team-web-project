import { getPlanTitle } from '../../utils/planDisplay';
import { formatDate } from '../../utils/paymentDisplay';

// Gói hiện tại, hạn dùng, số dư credit và AI quota còn lại của user (GET /payment/v1/me)
export default function CurrentPlanBanner({ billing }) {
  let planLabel = '—';
  if (billing.plan) {
    planLabel = getPlanTitle(billing.plan.name);
  }

  let expiryLabel = 'Không có ngày hết hạn';
  if (billing.subscription && billing.subscription.expires_at) {
    expiryLabel = `Đến ngày ${formatDate(billing.subscription.expires_at)}`;
  }

  return (
    <dl className="card current-plan">
      <div>
        <dt>Gói hiện tại</dt>
        <dd>{planLabel}</dd>
        <dd className="current-plan-note">{expiryLabel}</dd>
      </div>
      <div>
        <dt>Số dư credits</dt>
        <dd>{billing.credit_balance?.toLocaleString('vi-VN')}</dd>
      </div>
      <div>
        <dt>Lượt dùng AI còn lại</dt>
        <dd>{billing.ai_quota_left?.toLocaleString('vi-VN')}</dd>
      </div>
    </dl>
  );
}
