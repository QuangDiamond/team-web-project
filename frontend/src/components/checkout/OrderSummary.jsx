import { Link } from 'react-router-dom';
import { LoaderCircle, Lock } from 'lucide-react';
import Alert from '../common/Alert';
import { formatVnd, toNumber } from '../../utils/formatCurrency';
import { getClassLimitLabel, getPlanTitle } from '../../utils/planDisplay';
import { DURATION_OPTIONS, QUANTITY_OPTIONS, formatDate, pluralize } from '../../utils/paymentDisplay';

// Ô chọn số tháng (Pro) hoặc số lượng (credit pack)
function CountSelect({ id, label, options, value, onChange, disabled, formatOption }) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="form-control">
        <select id={id} name={id} value={value} onChange={(event) => onChange(Number(event.target.value))} disabled={disabled}>
          {options.map((option) => (
            <option key={option} value={option}>{formatOption(option)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// Các dòng quyền lợi của plan (SC20 field 2: credits, AI quota, SMS reminders)
function PlanSummaryRows({ plan }) {
  let smsLabel = 'Not included';
  if (plan.sms_reminders_enabled) {
    smsLabel = 'Included';
  }
  return (
    <>
      <SummaryRow label="Price" value={`${formatVnd(plan.monthly_price)} / month`} />
      <SummaryRow label="Credits" value={`${plan.monthly_credits} per month`} />
      <SummaryRow label="AI quota" value={`${plan.ai_quota} per month`} />
      <SummaryRow label="Class limit" value={getClassLimitLabel(plan.max_classrooms)} />
      <SummaryRow label="SMS reminders" value={smsLabel} />
    </>
  );
}

function PackSummaryRows({ pack, quantity }) {
  const totalCredits = pack.credit_amount * quantity;
  return (
    <>
      <SummaryRow label="Price" value={`${formatVnd(pack.price)} / pack`} />
      <SummaryRow label="Credits added" value={String(totalCredits)} />
    </>
  );
}

// D8: đang Pro còn hạn mà mua tiếp thì số tháng được cộng dồn vào hạn hiện tại
function ExtendNote({ billing, plan }) {
  const hasActiveSubscription = billing.subscription && billing.subscription.expires_at;
  if (!hasActiveSubscription || billing.plan._id !== plan._id) {
    return null;
  }
  return (
    <p className="summary-note">
      Your {getPlanTitle(plan.name)} plan runs until {formatDate(billing.subscription.expires_at)}. The new months are added on top.
    </p>
  );
}

// Tóm tắt đơn hàng + nút Pay / Cancel. Số tiền ở đây chỉ để hiển thị, server tự tính lại (D9)
export default function OrderSummary({ selection, count, onCountChange, billing, submitting, formError }) {
  if (!selection) {
    return (
      <aside className="card order-summary" aria-label="Order summary">
        <h2 className="order-summary-title">Order summary</h2>
        <p className="summary-empty">Choose a plan or a credit pack to continue.</p>
      </aside>
    );
  }

  const isPlan = selection.type === 'PLAN';
  const item = selection.item;
  let unitPrice = toNumber(item.price);
  let itemTitle = item.name;
  if (isPlan) {
    unitPrice = toNumber(item.monthly_price);
    itemTitle = `${getPlanTitle(item.name)} plan`;
  }
  const total = unitPrice * count;

  return (
    <aside className="card order-summary" aria-label="Order summary">
      <h2 className="order-summary-title">Order summary</h2>
      <p className="summary-item-title">{itemTitle}</p>

      {isPlan && (
        <CountSelect
          id="duration_months"
          label="Duration"
          options={DURATION_OPTIONS}
          value={count}
          onChange={onCountChange}
          disabled={submitting}
          formatOption={(option) => pluralize(option, 'month')}
        />
      )}
      {!isPlan && (
        <CountSelect
          id="quantity"
          label="Quantity"
          options={QUANTITY_OPTIONS}
          value={count}
          onChange={onCountChange}
          disabled={submitting}
          formatOption={(option) => pluralize(option, 'pack')}
        />
      )}

      <dl className="summary-rows">
        {isPlan && <PlanSummaryRows plan={item} />}
        {!isPlan && <PackSummaryRows pack={item} quantity={count} />}
      </dl>

      {isPlan && <ExtendNote billing={billing} plan={item} />}

      <dl className="summary-total">
        <dt>Total</dt>
        <dd>{formatVnd(total)}</dd>
      </dl>

      {formError && <Alert type="error">{formError}</Alert>}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
        <span>{submitting ? 'Creating order...' : `Pay ${formatVnd(total)}`}</span>
      </button>
      <Link to="/credits" className="btn btn-outline btn-block summary-cancel">Cancel</Link>

      <p className="summary-secure">
        <Lock size={14} aria-hidden="true" />
        <span>You will be redirected to a secure payment page. The order expires after 15 minutes.</span>
      </p>
    </aside>
  );
}
