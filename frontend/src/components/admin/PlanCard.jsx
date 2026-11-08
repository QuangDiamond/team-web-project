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

  let smsLabel = 'Tắt';
  if (plan.sms_reminders_enabled) {
    smsLabel = 'Bật';
  }

  return (
    <article className={cardClass} aria-label={`Gói ${planTitle} dành cho ${roleLabel}`}>
      <div className="plan-card-header">
        <h3 className="plan-card-title">{planTitle}</h3>
        {plan.is_active === false && <span className="badge badge-gray">Ngừng hoạt động</span>}
      </div>

      <p className="plan-card-price">
        <span className="plan-card-amount">{formatVnd(plan.monthly_price)}</span>
        <span className="plan-card-period"> / tháng</span>
      </p>

      <dl className="plan-card-features">
        <div>
          <dt>Tín dụng mỗi tháng</dt>
          <dd>{plan.monthly_credits.toLocaleString('vi-VN')}</dd>
        </div>
        <div>
          <dt>Lượt dùng AI</dt>
          <dd>{plan.ai_quota.toLocaleString('vi-VN')}</dd>
        </div>
        <div>
          <dt>Giới hạn số lớp</dt>
          <dd>{getClassLimitLabel(plan.max_classrooms)}</dd>
        </div>
        <div>
          <dt>Nhắc lịch qua SMS</dt>
          <dd>{smsLabel}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onEdit(plan)}
        aria-label={`Sửa gói ${planTitle} dành cho ${roleLabel}`}
      >
        <Pencil size={16} aria-hidden="true" />
        <span>Sửa gói dịch vụ</span>
      </button>
    </article>
  );
}
