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
  let smsLabel = 'Không bao gồm';
  if (plan.sms_reminders_enabled) {
    smsLabel = 'Có bao gồm';
  }
  return (
    <>
      <SummaryRow label="Giá" value={`${formatVnd(plan.monthly_price)} / tháng`} />
      <SummaryRow label="Tín dụng" value={`${plan.monthly_credits.toLocaleString('vi-VN')} mỗi tháng`} />
      <SummaryRow label="Lượt dùng AI" value={`${plan.ai_quota.toLocaleString('vi-VN')} mỗi tháng`} />
      <SummaryRow label="Giới hạn số lớp" value={getClassLimitLabel(plan.max_classrooms)} />
      <SummaryRow label="Nhắc lịch qua SMS" value={smsLabel} />
    </>
  );
}

function PackSummaryRows({ pack, quantity }) {
  const totalCredits = pack.credit_amount * quantity;
  return (
    <>
      <SummaryRow label="Giá" value={`${formatVnd(pack.price)} / gói`} />
      <SummaryRow label="Tín dụng được cộng" value={totalCredits.toLocaleString('vi-VN')} />
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
      Gói {getPlanTitle(plan.name)} của bạn có hiệu lực đến {formatDate(billing.subscription.expires_at)}. Thời gian mua thêm sẽ được cộng vào thời hạn hiện tại.
    </p>
  );
}

// Tóm tắt đơn hàng + nút Pay / Cancel. Số tiền ở đây chỉ để hiển thị, server tự tính lại (D9)
export default function OrderSummary({ selection, count, onCountChange, billing, submitting, formError }) {
  if (!selection) {
    return (
      <aside className="card order-summary" aria-label="Tóm tắt đơn hàng">
        <h2 className="order-summary-title">Tóm tắt đơn hàng</h2>
        <p className="summary-empty">Chọn gói dịch vụ hoặc gói tín dụng để tiếp tục.</p>
      </aside>
    );
  }

  const isPlan = selection.type === 'PLAN';
  const item = selection.item;
  let unitPrice = toNumber(item.price);
  let itemTitle = item.name;
  if (isPlan) {
    unitPrice = toNumber(item.monthly_price);
    itemTitle = `Gói ${getPlanTitle(item.name)}`;
  }
  const total = unitPrice * count;

  return (
    <aside className="card order-summary" aria-label="Tóm tắt đơn hàng">
      <h2 className="order-summary-title">Tóm tắt đơn hàng</h2>
      <p className="summary-item-title">{itemTitle}</p>

      {isPlan && (
        <CountSelect
          id="duration_months"
          label="Thời hạn"
          options={DURATION_OPTIONS}
          value={count}
          onChange={onCountChange}
          disabled={submitting}
          formatOption={(option) => pluralize(option, 'tháng')}
        />
      )}
      {!isPlan && (
        <CountSelect
          id="quantity"
          label="Số lượng"
          options={QUANTITY_OPTIONS}
          value={count}
          onChange={onCountChange}
          disabled={submitting}
          formatOption={(option) => pluralize(option, 'gói')}
        />
      )}

      <dl className="summary-rows">
        {isPlan && <PlanSummaryRows plan={item} />}
        {!isPlan && <PackSummaryRows pack={item} quantity={count} />}
      </dl>

      {isPlan && <ExtendNote billing={billing} plan={item} />}

      <dl className="summary-total">
        <dt>Tổng cộng</dt>
        <dd>{formatVnd(total)}</dd>
      </dl>

      {formError && <Alert type="error">{formError}</Alert>}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
        <span>{submitting ? 'Đang tạo đơn hàng...' : `Thanh toán ${formatVnd(total)}`}</span>
      </button>
      <Link to="/credits" className="btn btn-outline btn-block summary-cancel">Hủy</Link>

      <p className="summary-secure">
        <Lock size={14} aria-hidden="true" />
        <span>Bạn sẽ được chuyển đến trang thanh toán an toàn. Đơn hàng hết hạn sau 15 phút.</span>
      </p>
    </aside>
  );
}
