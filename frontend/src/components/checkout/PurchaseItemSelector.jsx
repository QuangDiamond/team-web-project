import PurchaseOptionCard from './PurchaseOptionCard';
import { formatVnd } from '../../utils/formatCurrency';
import { getClassLimitLabel, getPlanTitle } from '../../utils/planDisplay';
import { toPackValue, toPlanValue } from '../../utils/checkoutSelection';

const getPlanFeatures = (plan) => {
  const features = [
    `${plan.monthly_credits} credits / month`,
    `${plan.ai_quota} AI requests / month`,
    `Classes: ${getClassLimitLabel(plan.max_classrooms)}`,
  ];
  if (plan.sms_reminders_enabled) {
    features.push('SMS reminders');
  }
  return features;
};

const getPlanBadge = (plan, currentPlanId) => {
  if (plan._id === currentPlanId) {
    return 'Current plan';
  }
  if (plan.is_free) {
    return 'Free';
  }
  return '';
};

// SC20 field 1: chọn gói (Free chỉ để so sánh, không mua được) hoặc credit pack. Một nhóm radio duy nhất.
export default function PurchaseItemSelector({ catalog, selectedValue, currentPlanId, onChange, disabled }) {
  return (
    <fieldset className="checkout-fieldset" disabled={disabled}>
      <legend className="checkout-legend">Choose a plan or credit pack</legend>

      {catalog.plans.length > 0 && (
        <>
          <h2 className="checkout-group-title">Plans</h2>
          <div className="option-grid">
            {catalog.plans.map((plan) => (
              <PurchaseOptionCard
                key={plan._id}
                value={toPlanValue(plan._id)}
                checked={selectedValue === toPlanValue(plan._id)}
                onChange={onChange}
                disabled={plan.is_free}
                title={`${getPlanTitle(plan.name)} plan`}
                priceLabel={formatVnd(plan.monthly_price)}
                priceNote=" / month"
                badge={getPlanBadge(plan, currentPlanId)}
                features={getPlanFeatures(plan)}
              />
            ))}
          </div>
        </>
      )}

      {catalog.packs.length > 0 && (
        <>
          <h2 className="checkout-group-title">Credit packs</h2>
          <div className="option-grid">
            {catalog.packs.map((pack) => (
              <PurchaseOptionCard
                key={pack._id}
                value={toPackValue(pack._id)}
                checked={selectedValue === toPackValue(pack._id)}
                onChange={onChange}
                title={pack.name}
                priceLabel={formatVnd(pack.price)}
                features={[`${pack.credit_amount} credits`]}
              />
            ))}
          </div>
        </>
      )}
    </fieldset>
  );
}
