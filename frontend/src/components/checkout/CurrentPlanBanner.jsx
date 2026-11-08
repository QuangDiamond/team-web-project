import { getPlanTitle } from '../../utils/planDisplay';
import { formatDate } from '../../utils/paymentDisplay';

// Gói hiện tại, hạn dùng, số dư credit và AI quota còn lại của user (GET /payment/v1/me)
export default function CurrentPlanBanner({ billing }) {
  let planLabel = '—';
  if (billing.plan) {
    planLabel = getPlanTitle(billing.plan.name);
  }

  let expiryLabel = 'No expiry';
  if (billing.subscription && billing.subscription.expires_at) {
    expiryLabel = `Until ${formatDate(billing.subscription.expires_at)}`;
  }

  return (
    <dl className="card current-plan">
      <div>
        <dt>Current plan</dt>
        <dd>{planLabel}</dd>
        <dd className="current-plan-note">{expiryLabel}</dd>
      </div>
      <div>
        <dt>Credit balance</dt>
        <dd>{billing.credit_balance}</dd>
      </div>
      <div>
        <dt>AI quota left</dt>
        <dd>{billing.ai_quota_left}</dd>
      </div>
    </dl>
  );
}
