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
        filterLabel="Type"
        allLabel="All types"
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
        emptyTitle="No credit activity yet"
        emptyText="Upgrade to Pro or buy a credit pack to get started."
        emptyAction={<Link to="/checkout" className="btn btn-primary btn-sm">Upgrade / Buy credits</Link>}
      />

      {!list.loadError && list.items.length > 0 && (
        <table className="data-table history-table">
          <caption className="visually-hidden">Credit activity</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Type</th>
              <th scope="col">Details</th>
              <th scope="col" className="cell-number">Credits</th>
              <th scope="col">Expires</th>
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
                  <td data-label="Date">{formatDateTime(transaction.created_at)}</td>
                  <td data-label="Type">{getCreditTypeLabel(transaction.type)}</td>
                  <td data-label="Details">{getCreditDescription(transaction)}</td>
                  <td data-label="Credits" className={amountClass}>{formatCreditAmount(transaction.amount)}</td>
                  <td data-label="Expires">{formatDate(transaction.expires_at)}</td>
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
        label="Credit activity pages"
      />
    </>
  );
}
