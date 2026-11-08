import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoaderCircle, PackageOpen, RotateCw } from 'lucide-react';
import { useCheckoutData } from '../../hooks/useCheckoutData';
import { createOrder } from '../../services/paymentService';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import CurrentPlanBanner from '../../components/checkout/CurrentPlanBanner';
import PurchaseItemSelector from '../../components/checkout/PurchaseItemSelector';
import PaymentMethodSelector from '../../components/checkout/PaymentMethodSelector';
import OrderSummary from '../../components/checkout/OrderSummary';
import { findSelection, getDefaultValue, getInitialCount, getInitialPaymentMethod } from '../../utils/checkoutSelection';
import '../../styles/checkout.css';

// Lỗi 422 có dạng { field: [msg] } -> gộp thành 1 câu để hiện trong Alert
const toErrorMessage = (error) => {
  if (!error.errors) {
    return error.message;
  }
  const messages = [];
  Object.values(error.errors).forEach((fieldMessages) => {
    if (Array.isArray(fieldMessages)) {
      messages.push(...fieldMessages);
    }
  });
  if (messages.length === 0) {
    return error.message;
  }
  return messages.join(' ');
};

// SC20 – Checkout (UC17): chọn gói Pro hoặc credit pack, phương thức thanh toán rồi chuyển sang cổng thanh toán
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { catalog, billing, loading, loadError, reload } = useCheckoutData();
  // null = chưa chọn gì, dùng mục mặc định
  const [chosenValue, setChosenValue] = useState(null);
  const [count, setCount] = useState(() => getInitialCount(searchParams));
  const [paymentMethod, setPaymentMethod] = useState(() => getInitialPaymentMethod(searchParams));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const header = (
    <PageHeader
      eyebrow="THANH TOÁN"
      title="Nâng cấp / Mua tín dụng"
      description="Nâng cấp lên Pro để có thêm tín dụng và lượt dùng AI hằng tháng, hoặc mua thêm gói tín dụng."
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <div className="card checkout-loading" role="status">
          <LoaderCircle size={24} className="spin" aria-hidden="true" />
          <span>Đang tải gói dịch vụ và gói tín dụng...</span>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {header}
        <Alert type="error">Không thể tải gói dịch vụ và gói tín dụng: {loadError}</Alert>
        <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
          <RotateCw size={16} aria-hidden="true" />
          <span>Thử lại</span>
        </button>
      </>
    );
  }

  const paidPlans = catalog.plans.filter((plan) => !plan.is_free);
  if (paidPlans.length === 0 && catalog.packs.length === 0) {
    return (
      <>
        {header}
        <div className="card empty-state">
          <PackageOpen size={36} className="empty-state-icon" aria-hidden="true" />
          <p className="empty-state-title">Hiện chưa có gói để mua</p>
          <p className="empty-state-text">Hiện chưa có gói dịch vụ hoặc gói tín dụng dành cho tài khoản của bạn. Vui lòng quay lại sau.</p>
          <Link to="/credits" className="btn btn-outline">Quay lại Tín dụng và giao dịch</Link>
        </div>
      </>
    );
  }

  let selectedValue = chosenValue;
  if (selectedValue === null) {
    selectedValue = getDefaultValue(catalog, searchParams);
  }
  const selection = findSelection(catalog, selectedValue);

  const handleSelectItem = (event) => {
    setChosenValue(event.target.value);
    setCount(1);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selection) {
      setFormError('Vui lòng chọn gói dịch vụ hoặc gói tín dụng.');
      return;
    }

    let payload = {
      item_type: 'CREDIT_PACK',
      pack_id: selection.item._id,
      quantity: count,
      payment_method: paymentMethod,
    };
    if (selection.type === 'PLAN') {
      payload = {
        item_type: 'PLAN_UPGRADE',
        plan_id: selection.item._id,
        duration_months: count,
        payment_method: paymentMethod,
      };
    }

    setFormError('');
    setSubmitting(true);
    try {
      const response = await createOrder(payload);
      // Giữ trạng thái "đang xử lý" trong lúc trình duyệt chuyển sang cổng thanh toán
      window.location.assign(response.data.checkout_url);
    } catch (error) {
      setFormError(toErrorMessage(error));
      setSubmitting(false);
    }
  };

  const currentPlanId = billing.plan ? billing.plan._id : null;

  return (
    <>
      {header}
      <CurrentPlanBanner billing={billing} />

      <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
        <div className="checkout-main">
          <section className="card checkout-section">
            <PurchaseItemSelector
              catalog={catalog}
              selectedValue={selectedValue}
              currentPlanId={currentPlanId}
              onChange={handleSelectItem}
              disabled={submitting}
            />
          </section>

          <section className="card checkout-section">
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} disabled={submitting} />
          </section>
        </div>

        <OrderSummary
          selection={selection}
          count={count}
          onCountChange={setCount}
          billing={billing}
          submitting={submitting}
          formError={formError}
        />
      </form>
    </>
  );
}
