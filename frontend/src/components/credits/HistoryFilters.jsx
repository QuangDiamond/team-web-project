import { Download } from 'lucide-react';

// Thanh lọc của 1 danh sách lịch sử: chọn loại / trạng thái + khoảng ngày + nút Export CSV (D14).
// filterField = 'type' hoặc 'status'; idPrefix để id các ô không trùng giữa 2 tab
export default function HistoryFilters({
  idPrefix,
  filterField,
  filterLabel,
  allLabel,
  options,
  filters,
  onChange,
  dateError,
  exportUrl,
}) {
  const selectId = `${idPrefix}-${filterField}`;
  const fromId = `${idPrefix}-from`;
  const toId = `${idPrefix}-to`;
  const dateErrorId = `${idPrefix}-date-error`;

  let dateDescribedBy;
  if (dateError) {
    dateDescribedBy = dateErrorId;
  }

  return (
    <div className="history-filters">
      <div className="history-filter">
        <label htmlFor={selectId} className="form-label">{filterLabel}</label>
        <div className="form-control">
          <select
            id={selectId}
            value={filters[filterField]}
            onChange={(event) => onChange(filterField, event.target.value)}
          >
            <option value="">{allLabel}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="history-filter">
        <label htmlFor={fromId} className="form-label">From</label>
        <div className={dateError ? 'form-control has-error' : 'form-control'}>
          <input
            id={fromId}
            type="date"
            value={filters.from}
            onChange={(event) => onChange('from', event.target.value)}
            aria-invalid={dateError ? 'true' : 'false'}
            aria-describedby={dateDescribedBy}
          />
        </div>
      </div>

      <div className="history-filter">
        <label htmlFor={toId} className="form-label">To</label>
        <div className={dateError ? 'form-control has-error' : 'form-control'}>
          <input
            id={toId}
            type="date"
            value={filters.to}
            onChange={(event) => onChange('to', event.target.value)}
            aria-invalid={dateError ? 'true' : 'false'}
            aria-describedby={dateDescribedBy}
          />
        </div>
      </div>

      {/* Khoảng ngày sai thì không cho xuất (backend sẽ trả 422) */}
      {dateError && (
        <button type="button" className="btn btn-outline btn-sm history-export" disabled>
          <Download size={16} aria-hidden="true" />
          <span>Export CSV</span>
        </button>
      )}
      {!dateError && (
        <a href={exportUrl} className="btn btn-outline btn-sm history-export" download>
          <Download size={16} aria-hidden="true" />
          <span>Export CSV</span>
        </a>
      )}

      {dateError && <p id={dateErrorId} className="form-error history-date-error">{dateError}</p>}
    </div>
  );
}
