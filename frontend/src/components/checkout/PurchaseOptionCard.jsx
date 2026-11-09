// Thẻ gói có nút mua riêng, dùng chung cho plan và credit pack.
export default function PurchaseOptionCard({ title, priceLabel, priceNote, badge, features, originalPriceLabel, discountLabel, actionLabel, onAction, disabled }) {
  let cardClass = 'option-card';
  if (disabled) {
    cardClass = 'option-card is-disabled';
  }

  return (
    <article className={cardClass}>
      <span className="option-card-header">
        <span className="option-card-title">{title}</span>
        {badge && <span className="badge badge-gray">{badge}</span>}
      </span>
      {originalPriceLabel && <span className="option-card-old-price">{originalPriceLabel}</span>}
      <span className="option-card-price">
        {priceLabel}
        {priceNote && <span className="option-card-price-note">{priceNote}</span>}
      </span>
      {discountLabel && <span className="option-card-discount">{discountLabel}</span>}
      {features && features.length > 0 && (
        <span className="option-card-features">
          {features.map((feature) => (
            <span key={feature} className="option-card-feature">{feature}</span>
          ))}
        </span>
      )}
      <button type="button" className="btn btn-primary btn-block option-card-action" onClick={onAction} disabled={disabled}>
        {actionLabel}
      </button>
    </article>
  );
}
