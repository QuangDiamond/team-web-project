import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import { usePagedList } from '../../hooks/usePagedList';
import { getCreditTransactions, getCreditTransactionsExportUrl } from '../../services/paymentService';
import {
  CREDIT_TYPE_OPTIONS,
  formatCreditAmount,
  getCreditDescription,
  getCreditTypeLabel,
} from '../../utils/creditDisplay';
import { formatDate, formatDateTime } from '../../utils/paymentDisplay';
import HistoryFilters from './HistoryFilters';
import { Link } from 'react-router-dom';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';

const EMPTY_FILTERS = { type: '', from: '', to: '' };

// Biến động credit (UC18 bước 2–3): cấp hằng tháng, mua, dùng cho ứng tuyển / lời mời, hết hạn
export default function CreditActivityPanel() {
  const history = useHistoryFilters(EMPTY_FILTERS);
  const hasValidFilters = history.dateError === '';
  const list = usePagedList(getCreditTransactions, history.filterParams, history.page, hasValidFilters);

  return (
    <>
      <HistoryFilters
        idPrefix="credit"
        filterField="type"
        filterLabel="Loại"
        allLabel="Tất cả loại"
        options={CREDIT_TYPE_OPTIONS}
        filters={history.filters}
        onChange={history.changeFilter}
        dateError={history.dateError}
        exportUrl={getCreditTransactionsExportUrl(history.filterParams)}
      />

      <ListState
        loading={list.loading}
        loadError={list.loadError}
        onRetry={list.reload}
        isEmpty={list.items.length === 0}
        filtersActive={history.filtersActive}
        onClearFilters={history.clearFilters}
        emptyTitle="Chưa có biến động tín dụng"
        emptyText="Nâng cấp lên Pro hoặc mua gói tín dụng để bắt đầu."
        emptyAction={<Link to="/checkout" className="btn btn-primary btn-sm">Nâng cấp / Mua tín dụng</Link>}
      />

      {!list.loadError && list.items.length > 0 && (
        <table className="data-table history-table">
          <caption className="visually-hidden">Biến động tín dụng</caption>
          <thead>
            <tr>
              <th scope="col">Ngày</th>
              <th scope="col">Loại</th>
              <th scope="col">Chi tiết</th>
              <th scope="col" className="cell-number">Tín dụng</th>
              <th scope="col">Hết hạn</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((transaction) => {
              let amountClass = 'cell-number credit-amount';
              if (transaction.amount > 0) {
                amountClass = 'cell-number credit-amount is-positive';
              }
              return (
                <tr key={transaction._id}>
                  <td data-label="Ngày">{formatDateTime(transaction.created_at)}</td>
                  <td data-label="Loại">{getCreditTypeLabel(transaction.type)}</td>
                  <td data-label="Chi tiết">{getCreditDescription(transaction)}</td>
                  <td data-label="Tín dụng" className={amountClass}>{formatCreditAmount(transaction.amount)}</td>
                  <td data-label="Hết hạn">{formatDate(transaction.expires_at)}</td>
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
        label="Phân trang biến động tín dụng"
      />
    </>
  );
}
