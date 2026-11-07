import { Link } from 'react-router-dom';
import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import { usePagedList } from '../../hooks/usePagedList';
import { getOrders, getOrdersExportUrl } from '../../services/paymentService';
import { ORDER_STATUS_OPTIONS, getOrderItemTypeLabel, getOrderStatusOption } from '../../utils/creditDisplay';
import { formatDateTime, getPaymentMethodLabel } from '../../utils/paymentDisplay';
import { formatVnd } from '../../utils/formatCurrency';
import { getPlanTitle } from '../../utils/planDisplay';
import HistoryFilters from './HistoryFilters';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';

const EMPTY_FILTERS = { status: '', from: '', to: '' };

// Gói thì hiện tên thân thiện ("PRO" -> "Pro plan"), credit pack giữ nguyên tên
const getOrderItemName = (order) => {
  if (order.item_type === 'PLAN_UPGRADE') {
    return `${getPlanTitle(order.item_name)} plan`;
  }
  return order.item_name;
};

// Đơn thành công có biên lai (D13); đơn đang chờ thì mở lại trang kết quả để xem trạng thái
function OrderAction({ order }) {
  if (order.status === 'SUCCESS' && order.has_receipt) {
    return (
      <Link to={`/receipts/${encodeURIComponent(order.order_code)}`} className="link" aria-label={`Receipt for order ${order.order_code}`}>
        Receipt
      </Link>
    );
  }
  if (order.status === 'PENDING') {
    return (
      <Link to={`/payment/result?order=${encodeURIComponent(order.order_code)}`} className="link" aria-label={`Check status of order ${order.order_code}`}>
        Check status
      </Link>
    );
  }
  return <span className="cell-muted">—</span>;
}

// Lịch sử thanh toán (UC18 bước 4): mọi trạng thái, lọc theo trạng thái + khoảng ngày (D14)
export default function PaymentHistoryPanel() {
  const history = useHistoryFilters(EMPTY_FILTERS);
  const hasValidFilters = history.dateError === '';
  const list = usePagedList(getOrders, history.filterParams, history.page, hasValidFilters);

  return (
    <>
      <HistoryFilters
        idPrefix="payment"
        filterField="status"
        filterLabel="Status"
        allLabel="All statuses"
        options={ORDER_STATUS_OPTIONS}
        filters={history.filters}
        onChange={history.changeFilter}
        dateError={history.dateError}
        exportUrl={getOrdersExportUrl(history.filterParams)}
      />

      <ListState
        loading={list.loading}
        loadError={list.loadError}
        onRetry={list.reload}
        isEmpty={list.items.length === 0}
        filtersActive={history.filtersActive}
        onClearFilters={history.clearFilters}
        emptyTitle="No payments yet"
        emptyText="Upgrade to Pro or buy a credit pack to get started."
        emptyAction={<Link to="/checkout" className="btn btn-primary btn-sm">Upgrade / Buy credits</Link>}
      />

      {!list.loadError && list.items.length > 0 && (
        <table className="data-table history-table">
          <caption className="visually-hidden">Payments</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Item</th>
              <th scope="col">Order code</th>
              <th scope="col">Method</th>
              <th scope="col" className="cell-number">Amount</th>
              <th scope="col">Status</th>
              <th scope="col" className="cell-actions">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((order) => {
              const status = getOrderStatusOption(order.status);
              return (
                <tr key={order.order_code}>
                  <td data-label="Date">{formatDateTime(order.created_at)}</td>
                  <td data-label="Item">
                    <span className="cell-stack">
                      <span className="cell-title">{getOrderItemName(order)}</span>
                      <span className="cell-subtitle">{getOrderItemTypeLabel(order.item_type)}</span>
                    </span>
                  </td>
                  <td data-label="Order code" className="cell-code">{order.order_code}</td>
                  <td data-label="Method">{getPaymentMethodLabel(order.payment_method)}</td>
                  <td data-label="Amount" className="cell-number">{formatVnd(order.amount)}</td>
                  <td data-label="Status"><span className={`badge badge-${status.tone}`}>{status.label}</span></td>
                  <td data-label="Receipt" className="cell-actions"><OrderAction order={order} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Pagination
        pagination={list.pagination}
        onPageChange={history.setPage}
        disabled={list.loading}
        label="Payment pages"
      />
    </>
  );
}
