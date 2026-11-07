import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheck, CircleX, Clock, LoaderCircle, RotateCw, SearchX } from 'lucide-react';
import { usePaymentOrder } from '../../hooks/usePaymentOrder';
import OrderDetails from '../../components/payment/OrderDetails';
import { FAILURE_TEXT, getRetryLink } from '../../utils/orderDisplay';
import '../../styles/paymentResult.css';

// Khung chung của mọi trạng thái: biểu tượng tròn, tiêu đề, mô tả, nội dung, các nút
function ResultCard({ tone, Icon, title, description, children, actions }) {
  return (
    <section className="card result-card" aria-labelledby="result-title">
      <span className={`result-icon result-icon-${tone}`} aria-hidden="true">
        <Icon size={32} />
      </span>
      <h1 id="result-title" className="result-title">{title}</h1>
      {description && <p className="result-description">{description}</p>}
      {children}
      {actions && <div className="result-actions">{actions}</div>}
    </section>
  );
}

const NOT_FOUND_ACTIONS = (
  <Link to="/checkout" className="btn btn-primary">Go to checkout</Link>
);

// SC21 – Payment Result (UC17): cổng thanh toán đưa trình duyệt về /payment/result?order=<mã đơn>
export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('order');
  const { order, loading, loadError, pollingStopped, refresh } = usePaymentOrder(orderCode);

  if (!orderCode) {
    return (
      <ResultCard
        tone="gray"
        Icon={SearchX}
        title="No order to show"
        description="This page shows the result of a payment. Start from checkout to buy a plan or credits."
        actions={NOT_FOUND_ACTIONS}
      />
    );
  }

  if (loading && !order) {
    return (
      <ResultCard tone="gray" Icon={LoaderCircle} title="Loading your order..." description={`Order ${orderCode}`} />
    );
  }

  if (!order) {
    let title = 'Could not load this order';
    let description = loadError.message;
    if (loadError.status === 404) {
      title = 'Order not found';
      description = `We could not find order ${orderCode}. Please check the link or start a new checkout.`;
    }
    return (
      <ResultCard
        tone="gray"
        Icon={SearchX}
        title={title}
        description={description}
        actions={NOT_FOUND_ACTIONS}
      />
    );
  }

  if (order.status === 'SUCCESS') {
    let description = 'Your Pro plan is now active and this month\'s credits were added to your balance.';
    if (order.item_type === 'CREDIT_PACK') {
      description = 'The credits were added to your balance and are ready to use.';
    }
    return (
      <ResultCard
        tone="success"
        Icon={CircleCheck}
        title="Payment successful"
        description={description}
        actions={(
          <>
            <Link to="/dashboard" className="btn btn-outline">Go to dashboard</Link>
            <Link to="/credits" className="btn btn-primary">View credits & transactions</Link>
          </>
        )}
      >
        <OrderDetails order={order} />
        {order.receipt && (
          <p className="result-receipt">
            <Link to={`/receipts/${encodeURIComponent(order.order_code)}`} className="link">View receipt</Link>
          </p>
        )}
      </ResultCard>
    );
  }

  if (order.status === 'PENDING') {
    let description = 'We are waiting for the payment gateway to confirm your payment. This usually takes a few seconds.';
    let actions = null;
    if (pollingStopped) {
      description = 'The payment gateway has not confirmed this payment yet. If you already paid, refresh in a moment. Nothing changes until the payment is confirmed.';
      actions = (
        <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading}>
          <RotateCw size={18} aria-hidden="true" />
          <span>Refresh status</span>
        </button>
      );
    }
    return (
      <ResultCard tone="pending" Icon={pollingStopped ? Clock : LoaderCircle} title="Processing payment..." description={description} actions={actions}>
        <p className="visually-hidden" role="status">{pollingStopped ? 'Payment still pending' : 'Checking payment status'}</p>
        <OrderDetails order={order} />
      </ResultCard>
    );
  }

  // FAILED / CANCELLED / EXPIRED (UC17 E1)
  let failureText = FAILURE_TEXT[order.status];
  if (!failureText) {
    failureText = FAILURE_TEXT.FAILED;
  }
  return (
    <ResultCard
      tone="error"
      Icon={CircleX}
      title={failureText.title}
      description={failureText.description}
      actions={(
        <>
          <Link to="/credits" className="btn btn-outline">Back to Credits & Transactions</Link>
          <Link to={getRetryLink(order)} className="btn btn-primary">Try again</Link>
        </>
      )}
    >
      <OrderDetails order={order} />
    </ResultCard>
  );
}
