import { formatVnd } from '../../utils/formatCurrency';
import { formatDateTime, getPaymentMethodLabel } from '../../utils/paymentDisplay';
import { getOrderItemLabel } from '../../utils/orderDisplay';

// Bảng thông tin đơn thanh toán trên màn Payment Result
export default function OrderDetails({ order }) {
  let amountLabel = 'Amount';
  if (order.status === 'SUCCESS') {
    amountLabel = 'Amount paid';
  }

  return (
    <dl className="order-details">
      <div>
        <dt>Item</dt>
        <dd>{getOrderItemLabel(order)}</dd>
      </div>
      <div>
        <dt>{amountLabel}</dt>
        <dd className="order-details-amount">{formatVnd(order.amount)}</dd>
      </div>
      <div>
        <dt>Order code</dt>
        <dd className="order-details-code">{order.order_code}</dd>
      </div>
      <div>
        <dt>Payment method</dt>
        <dd>{getPaymentMethodLabel(order.payment_method)}</dd>
      </div>
      {order.status === 'SUCCESS' && (
        <div>
          <dt>Paid at</dt>
          <dd>{formatDateTime(order.paid_at)}</dd>
        </div>
      )}
      {order.status !== 'SUCCESS' && (
        <div>
          <dt>Created at</dt>
          <dd>{formatDateTime(order.created_at)}</dd>
        </div>
      )}
    </dl>
  );
}
