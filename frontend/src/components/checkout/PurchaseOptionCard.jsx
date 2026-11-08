// Thẻ chọn 1 plan hoặc 1 credit pack: radio thật (ẩn) bọc trong label để dùng được bàn phím và screen reader
export default function PurchaseOptionCard({ value, checked, onChange, disabled, title, priceLabel, priceNote, badge, features }) {
  let cardClass = 'option-card';
  if (checked) {
    cardClass = 'option-card is-selected';
  }
  if (disabled) {
    cardClass = 'option-card is-disabled';
  }

  return (
    <label className={cardClass}>
      <input
        type="radio"
        name="purchase_item"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="option-card-input"
      />
      <span className="option-card-header">
        <span className="option-card-title">{title}</span>
        {badge && <span className="badge badge-gray">{badge}</span>}
      </span>
      <span className="option-card-price">
        {priceLabel}
        {priceNote && <span className="option-card-price-note">{priceNote}</span>}
      </span>
      {features && features.length > 0 && (
        <span className="option-card-features">
          {features.map((feature) => (
            <span key={feature} className="option-card-feature">{feature}</span>
          ))}
        </span>
      )}
    </label>
  );
}
