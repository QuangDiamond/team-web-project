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
  <Link to="/checkout" className="btn btn-primary">Đi đến thanh toán</Link>
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
        title="Chưa có đơn hàng để hiển thị"
        description="Trang này hiển thị kết quả thanh toán. Hãy đến trang thanh toán để mua gói dịch vụ hoặc tín dụng."
        actions={NOT_FOUND_ACTIONS}
      />
    );
  }

  if (loading && !order) {
    return (
      <ResultCard tone="gray" Icon={LoaderCircle} title="Đang tải đơn hàng..." description={`Đơn hàng ${orderCode}`} />
    );
  }

  if (!order) {
    let title = 'Không thể tải đơn hàng này';
    let description = loadError.message;
    if (loadError.status === 404) {
      title = 'Không tìm thấy đơn hàng';
      description = `Không tìm thấy đơn hàng ${orderCode}. Vui lòng kiểm tra đường dẫn hoặc tạo đơn thanh toán mới.`;
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
    let description = 'Gói Pro đã được kích hoạt và tín dụng tháng này đã được cộng vào số dư.';
    if (order.item_type === 'CREDIT_PACK') {
      description = 'Tín dụng đã được cộng vào số dư và có thể sử dụng ngay.';
    }
    return (
      <ResultCard
        tone="success"
        Icon={CircleCheck}
        title="Thanh toán thành công"
        description={description}
        actions={(
          <>
            <Link to="/dashboard" className="btn btn-outline">Về trang tổng quan</Link>
            <Link to="/credits" className="btn btn-primary">Xem tín dụng và giao dịch</Link>
          </>
        )}
      >
        <OrderDetails order={order} />
        {order.receipt && (
          <p className="result-receipt">
            <Link to={`/receipts/${encodeURIComponent(order.order_code)}`} className="link">Xem biên nhận</Link>
          </p>
        )}
      </ResultCard>
    );
  }

  if (order.status === 'PENDING') {
    let description = 'Đang chờ cổng thanh toán xác nhận giao dịch. Quá trình này thường mất vài giây.';
    let actions = null;
    if (pollingStopped) {
      description = 'Cổng thanh toán chưa xác nhận giao dịch này. Nếu đã thanh toán, vui lòng làm mới sau ít phút. Gói dịch vụ và số dư chỉ được cập nhật khi giao dịch được xác nhận.';
      actions = (
        <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading}>
          <RotateCw size={18} aria-hidden="true" />
          <span>Làm mới trạng thái</span>
        </button>
      );
    }
    return (
      <ResultCard tone="pending" Icon={pollingStopped ? Clock : LoaderCircle} title="Đang xử lý thanh toán..." description={description} actions={actions}>
        <p className="visually-hidden" role="status">{pollingStopped ? 'Thanh toán vẫn đang chờ xác nhận' : 'Đang kiểm tra trạng thái thanh toán'}</p>
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
          <Link to="/credits" className="btn btn-outline">Quay lại Tín dụng và giao dịch</Link>
          <Link to={getRetryLink(order)} className="btn btn-primary">Thử lại</Link>
        </>
      )}
    >
      <OrderDetails order={order} />
    </ResultCard>
  );
}
