import { PAYMENT_METHODS } from '../../utils/paymentDisplay';

// Chọn phương thức thanh toán (SC20 field 4): VietQR / ATM card / Credit card
export default function PaymentMethodSelector({ value, onChange, disabled }) {
  return (
    <fieldset className="checkout-fieldset">
      <legend className="checkout-legend">Payment method</legend>
      <div className="method-list">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.Icon;
          const checked = value === method.value;
          let methodClass = 'method-option';
          if (checked) {
            methodClass = 'method-option is-selected';
          }
          return (
            <label key={method.value} className={methodClass}>
              <input
                type="radio"
                name="payment_method"
                value={method.value}
                checked={checked}
                onChange={() => onChange(method.value)}
                disabled={disabled}
                className="option-card-input"
              />
              <span className="method-icon" aria-hidden="true"><Icon size={20} /></span>
              <span className="method-text">
                <span className="method-label">{method.label}</span>
                <span className="method-description">{method.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
