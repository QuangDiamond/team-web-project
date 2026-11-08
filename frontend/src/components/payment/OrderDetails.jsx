import { formatVnd } from '../../utils/formatCurrency';
import { formatDateTime, getPaymentMethodLabel } from '../../utils/paymentDisplay';
import { getOrderItemLabel } from '../../utils/orderDisplay';

// Bảng thông tin đơn thanh toán trên màn Payment Result
export default function OrderDetails({ order }) {
  let amountLabel = 'Số tiền';
  if (order.status === 'SUCCESS') {
    amountLabel = 'Số tiền đã thanh toán';
  }

  return (
    <dl className="order-details">
      <div>
        <dt>Sản phẩm</dt>
        <dd>{getOrderItemLabel(order)}</dd>
      </div>
      <div>
        <dt>{amountLabel}</dt>
        <dd className="order-details-amount">{formatVnd(order.amount)}</dd>
      </div>
      <div>
        <dt>Mã đơn hàng</dt>
        <dd className="order-details-code">{order.order_code}</dd>
      </div>
      <div>
        <dt>Phương thức thanh toán</dt>
        <dd>{getPaymentMethodLabel(order.payment_method)}</dd>
      </div>
      {order.status === 'SUCCESS' && (
        <div>
          <dt>Thời gian thanh toán</dt>
          <dd>{formatDateTime(order.paid_at)}</dd>
        </div>
      )}
      {order.status !== 'SUCCESS' && (
        <div>
          <dt>Thời gian tạo</dt>
          <dd>{formatDateTime(order.created_at)}</dd>
        </div>
      )}
    </dl>
  );
}
