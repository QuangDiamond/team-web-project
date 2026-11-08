import { Pencil } from 'lucide-react';
import { formatVnd } from '../../utils/formatCurrency';
import { getClassLimitLabel, getPlanTitle, getTargetRoleLabel } from '../../utils/planDisplay';

// Thẻ hiển thị 1 plan (Free / Pro) với giá, quyền lợi và nút sửa
export default function PlanCard({ plan, onEdit }) {
  const planTitle = getPlanTitle(plan.name);
  const roleLabel = getTargetRoleLabel(plan.target_role);
  const isPro = plan.name === 'PRO';

  let cardClass = 'card plan-card';
  if (isPro) {
    cardClass = 'card plan-card is-pro';
  }

  let smsLabel = 'Off';
  if (plan.sms_reminders_enabled) {
    smsLabel = 'On';
  }

  return (
    <article className={cardClass} aria-label={`${roleLabel} ${planTitle} plan`}>
      <div className="plan-card-header">
        <h3 className="plan-card-title">{planTitle}</h3>
        {plan.is_active === false && <span className="badge badge-gray">Inactive</span>}
      </div>

      <p className="plan-card-price">
        <span className="plan-card-amount">{formatVnd(plan.monthly_price)}</span>
        <span className="plan-card-period"> / month</span>
      </p>

      <dl className="plan-card-features">
        <div>
          <dt>Credits per month</dt>
          <dd>{plan.monthly_credits}</dd>
        </div>
        <div>
          <dt>AI quota</dt>
          <dd>{plan.ai_quota}</dd>
        </div>
        <div>
          <dt>Class limit</dt>
          <dd>{getClassLimitLabel(plan.max_classrooms)}</dd>
        </div>
        <div>
          <dt>SMS reminders</dt>
          <dd>{smsLabel}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onEdit(plan)}
        aria-label={`Edit ${roleLabel} ${planTitle} plan`}
      >
        <Pencil size={16} aria-hidden="true" />
        <span>Edit plan</span>
      </button>
    </article>
  );
}
