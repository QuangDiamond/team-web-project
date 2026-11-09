import { useState } from 'react';
import PurchaseOptionCard from './PurchaseOptionCard';
import FormSelect from '../common/FormSelect';
import { formatVnd } from '../../utils/formatCurrency';
import { getClassLimitLabel, getPlanTitle } from '../../utils/planDisplay';
import { getPlanBasePrice, getPlanPeriod, getPlanPeriodLabel, getPlanPrice } from '../../utils/planPricing';
import { QUANTITY_OPTIONS } from '../../utils/paymentDisplay';

const getPlanFeatures = (plan) => {
  const features = [
    `${plan.monthly_credits.toLocaleString('vi-VN')} credits / tháng`,
    `${plan.ai_quota.toLocaleString('vi-VN')} lượt dùng AI / tháng`,
    `Số lớp: ${getClassLimitLabel(plan.max_classrooms)}`,
  ];
  if (plan.sms_reminders_enabled) {
    features.push('Nhắc lịch qua SMS');
  }
  return features;
};

const getPlanBadge = (plan, currentPlanId) => {
  if (plan._id === currentPlanId) {
    return 'Gói hiện tại';
  }
  if (plan.is_free) {
    return 'Miễn phí';
  }
  return '';
};

// UC17: các nút mua nằm ngay trên thẻ gói, không cần chọn gói rồi xem tóm tắt.
export default function PurchaseItemSelector({ catalog, currentPlanId, onPurchase, submitting }) {
  const [packQuantity, setPackQuantity] = useState(1);
  const hasPlans = catalog.plans.length > 0;
  const hasPacks = catalog.packs.length > 0;
  const [activeTab, setActiveTab] = useState(hasPlans ? 'PLAN' : 'PACK');

  const getTabClass = (tab) => {
    if (activeTab === tab) {
      return 'checkout-tab is-active';
    }
    return 'checkout-tab';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="checkout-fieldset">
      <div className="checkout-heading">
        <h2 className="checkout-legend">Chọn gói phù hợp với bạn</h2>
        <p>Chọn một loại gói, xem quyền lợi và thanh toán trực tiếp trên thẻ gói.</p>
      </div>
      <div className="checkout-tabs" role="tablist" aria-label="Loại sản phẩm thanh toán">
        <button
          type="button"
          className={getTabClass('PLAN')}
          role="tab"
          aria-selected={activeTab === 'PLAN'}
          aria-controls="service-plans-panel"
          id="service-plans-tab"
          onClick={() => handleTabChange('PLAN')}
          disabled={!hasPlans}
        >
          Mua gói dịch vụ
        </button>
        <button
          type="button"
          className={getTabClass('PACK')}
          role="tab"
          aria-selected={activeTab === 'PACK'}
          aria-controls="credit-packs-panel"
          id="credit-packs-tab"
          onClick={() => handleTabChange('PACK')}
          disabled={!hasPacks}
        >
          Mua credits
        </button>
      </div>

      {activeTab === 'PLAN' && (
        <section id="service-plans-panel" role="tabpanel" aria-labelledby="service-plans-tab">
          <h3 className="checkout-group-title">Gói dịch vụ</h3>
          <div className="option-grid">
            {catalog.plans.map((plan) => (
              <PurchaseOptionCard
                key={plan._id}
                title={`Gói ${getPlanTitle(plan.name)}`}
                priceLabel={formatVnd(getPlanPrice(plan))}
                priceNote={` / ${getPlanPeriodLabel(plan)}`}
                badge={getPlanBadge(plan, currentPlanId)}
                features={getPlanFeatures(plan)}
                originalPriceLabel={getPlanPeriod(plan) === 'YEARLY' && plan.annual_discount_percent > 0
                  ? `${formatVnd(getPlanBasePrice(plan))} / năm`
                  : ''}
                discountLabel={getPlanPeriod(plan) === 'YEARLY' && plan.annual_discount_percent > 0
                  ? `Tiết kiệm ${plan.annual_discount_percent}%`
                  : ''}
                actionLabel={plan.is_free ? 'Gói miễn phí' : submitting ? 'Đang xử lý...' : 'Đăng ký gói'}
                onAction={() => onPurchase({ type: 'PLAN', item: plan })}
                disabled={submitting || plan.is_free}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === 'PACK' && (
        <section id="credit-packs-panel" role="tabpanel" aria-labelledby="credit-packs-tab">
          <div className="credit-pack-heading">
            <h3 className="checkout-group-title">Gói credits</h3>
            <p>Credits mua thêm không hết hạn.</p>
          </div>
          <div className="credit-pack-quantity">
            <FormSelect
              id="credit_pack_quantity"
              label="Số lượng gói"
              value={String(packQuantity)}
              onChange={(event) => setPackQuantity(Number(event.target.value))}
              options={QUANTITY_OPTIONS.map((quantity) => ({ value: String(quantity), label: String(quantity) }))}
              disabled={submitting}
            />
          </div>
          <div className="option-grid">
            {catalog.packs.map((pack) => (
              <PurchaseOptionCard
                key={pack._id}
                disabled={submitting}
                title={pack.name}
                priceLabel={formatVnd(pack.price)}
                features={[`${pack.credit_amount.toLocaleString('vi-VN')} credits`]}
                actionLabel={submitting ? 'Đang xử lý...' : 'Mua gói'}
                onAction={() => onPurchase({ type: 'PACK', item: pack, quantity: packQuantity })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
