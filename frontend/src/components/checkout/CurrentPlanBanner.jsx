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

  // Gói đã mua, chạy khi gói hiện tại hết hạn (UC17)
  let nextPlanLabel = '';
  if (billing.next_plan) {
    nextPlanLabel = `Gói tiếp theo: ${getPlanTitle(billing.next_plan.name)} từ ${formatDate(billing.next_plan.start_date)} đến ${formatDate(billing.next_plan.expires_at)}`;
  }

  return (
    <dl className="card current-plan">
      <div>
        <dt>Gói hiện tại</dt>
        <dd>{planLabel}</dd>
        <dd className="current-plan-note">{expiryLabel}</dd>
        {nextPlanLabel && <dd className="current-plan-note">{nextPlanLabel}</dd>}
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
