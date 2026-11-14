import { toast } from 'sonner';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle, PackageOpen, RotateCw } from 'lucide-react';
import { useCheckoutData } from '../../hooks/useCheckoutData';
import { createOrder } from '../../services/paymentService';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import CurrentPlanBanner from '../../components/checkout/CurrentPlanBanner';
import PurchaseItemSelector from '../../components/checkout/PurchaseItemSelector';
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

// UC17: chọn chu kỳ đã được cấu hình trong gói và mua trực tiếp từ thẻ.
export default function Checkout() {
  const { catalog, billing, loading, loadError, reload } = useCheckoutData();
  const [submitting, setSubmitting] = useState(false);

  const header = (
    <PageHeader
      eyebrow="THANH TOÁN"
      title="Nâng cấp / Mua credits"
      description="Chọn gói dịch vụ theo chu kỳ đã thiết lập hoặc mua thêm gói credits."
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <div className="card checkout-loading" role="status">
          <LoaderCircle size={24} className="spin" aria-hidden="true" />
          <span>Đang tải gói dịch vụ và gói credits...</span>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {header}
        <Alert type="error">Không thể tải gói dịch vụ và gói credits: {loadError}</Alert>
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
          <p className="empty-state-text">Hiện chưa có gói dịch vụ hoặc gói credits dành cho tài khoản của bạn. Vui lòng quay lại sau.</p>
          <Link to="/credits" className="btn btn-outline">Quay lại Credits và giao dịch</Link>
        </div>
      </>
    );
  }

  const handlePurchase = async (selection) => {
    const payload = selection.type === 'PLAN'
      ? { item_type: 'PLAN_UPGRADE', plan_id: selection.item._id, payment_method: 'VIETQR' }
      : { item_type: 'CREDIT_PACK', pack_id: selection.item._id, quantity: selection.quantity, payment_method: 'VIETQR' };

    setSubmitting(true);
    try {
      const response = await createOrder(payload);
      // Giữ trạng thái "đang xử lý" trong lúc trình duyệt chuyển sang cổng thanh toán
      window.location.assign(response.data.checkout_url);
    } catch (error) {
      toast.error(toErrorMessage(error));
      setSubmitting(false);
    }
  };

  const currentPlanId = billing.plan ? billing.plan._id : null;

  return (
    <>
      {header}
      <CurrentPlanBanner billing={billing} />

      <div className="checkout-layout">
        <section className="card checkout-section">
          <PurchaseItemSelector
            catalog={catalog}
            currentPlanId={currentPlanId}
            onPurchase={handlePurchase}
            submitting={submitting}
          />
        </section>
      </div>
    </>
  );
}
