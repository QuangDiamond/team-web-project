import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, LoaderCircle, Printer } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getOrder } from '../../services/paymentService';
import Alert from '../../components/common/Alert';
import { formatVnd } from '../../utils/formatCurrency';
import { formatDateTime, getPaymentMethodLabel } from '../../utils/paymentDisplay';
import { getOrderItemLabel } from '../../utils/orderDisplay';
import '../../styles/receipt.css';

// Người mua: lấy từ đơn nếu backend trả về, không thì là user đang đăng nhập (chỉ chủ đơn xem được đơn)
const getBuyer = (order, user) => {
  if (order.buyer) {
    return order.buyer;
  }
  return { full_name: user.full_name, email: user.email };
};

function ReceiptRow({ label, value }) {
  return (
    <div className="receipt-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// Biên lai in được (D13, UC18 bước 4): /receipts/:orderCode, chỉ cho đơn đã thanh toán thành công
export default function Receipt() {
  const { orderCode } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let ignore = false;
    getOrder(orderCode)
      .then((response) => {
        if (!ignore) {
          setOrder(response.data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(error.message);
        }
      });
    return () => {
      ignore = true;
    };
  }, [orderCode]);

  const backLink = (
    <Link to="/credits?tab=payments" className="link-back no-print">
      <ChevronLeft size={16} aria-hidden="true" />
      <span>Quay lại lịch sử thanh toán</span>
    </Link>
  );

  if (loadError) {
    return (
      <div className="receipt-page">
        {backLink}
        <Alert type="error">Không thể tải biên nhận này: {loadError}</Alert>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="receipt-page receipt-loading" role="status">
        <LoaderCircle size={22} className="spin" aria-hidden="true" />
        <span>Đang tải biên nhận...</span>
      </div>
    );
  }

  if (order.status !== 'SUCCESS') {
    return (
      <div className="receipt-page">
        {backLink}
        <Alert type="info">Chỉ đơn hàng đã thanh toán mới có biên nhận. Đơn hàng {order.order_code} chưa được thanh toán.</Alert>
      </div>
    );
  }

  const buyer = getBuyer(order, user);

  return (
    <div className="receipt-page">
      <div className="receipt-toolbar no-print">
        {backLink}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" />
          <span>In / Lưu thành PDF</span>
        </button>
      </div>

      <article className="card receipt" aria-labelledby="receipt-title">
        <header className="receipt-header">
          <span className="brand-logo">
            <span className="brand-logo-mark" aria-hidden="true">Tu</span>
            <span className="brand-logo-text">TuConnector</span>
          </span>
          <div className="receipt-heading">
            <h1 id="receipt-title" className="receipt-title">Biên nhận</h1>
            <p className="receipt-code">{order.order_code}</p>
          </div>
        </header>

        <section className="receipt-section" aria-label="Người thanh toán">
          <h2 className="receipt-section-title">Người thanh toán</h2>
          <p className="receipt-buyer-name">{buyer.full_name}</p>
          <p className="receipt-buyer-email">{buyer.email}</p>
        </section>

        <dl className="receipt-rows">
          <ReceiptRow label="Sản phẩm" value={getOrderItemLabel(order)} />
          <ReceiptRow label="Phương thức thanh toán" value={getPaymentMethodLabel(order.payment_method)} />
          <ReceiptRow label="Ngày đặt hàng" value={formatDateTime(order.created_at)} />
          <ReceiptRow label="Thời gian thanh toán" value={formatDateTime(order.paid_at)} />
        </dl>

        <dl className="receipt-total">
          <dt>Tổng tiền đã thanh toán</dt>
          <dd>{formatVnd(order.amount)}</dd>
        </dl>

        <p className="receipt-footer">Tất cả số tiền được tính bằng đồng Việt Nam (VND). Cảm ơn bạn đã sử dụng TuConnector.</p>
      </article>
    </div>
  );
}
