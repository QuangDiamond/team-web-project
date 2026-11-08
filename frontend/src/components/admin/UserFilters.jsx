import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../../utils/userDisplay';

const SEARCH_DELAY_MS = 400;

function FilterSelect({ id, label, allLabel, options, value, onChange }) {
  return (
    <div className="user-filter">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="form-control">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DateFilter({ id, label, value, onChange, dateError }) {
  let describedBy;
  if (dateError) {
    describedBy = 'user-date-error';
  }
  return (
    <div className="user-filter">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className={dateError ? 'form-control has-error' : 'form-control'}>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={dateError ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
      </div>
    </div>
  );
}

// Thanh lọc danh sách user (UC37 bước 1): tìm theo tên / email (gõ xong 400ms mới tìm), role, trạng thái, ngày tạo
export default function UserFilters({ filters, onChange, dateError }) {
  const [searchText, setSearchText] = useState(filters.q);

  // Bộ lọc bị xóa từ bên ngoài (nút Clear filters) thì ô tìm kiếm cũng trống theo
  useEffect(() => {
    setSearchText(filters.q);
  }, [filters.q]);

  // Debounce: chỉ gửi từ khóa khi người dùng ngừng gõ
  useEffect(() => {
    const keyword = searchText.trim();
    if (keyword === filters.q) {
      return undefined;
    }
    const timerId = setTimeout(() => {
      onChange('q', keyword);
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timerId);
    };
  }, [searchText, filters.q, onChange]);

  return (
    <div className="card user-filters">
      <div className="user-filter user-search">
        <label htmlFor="user-search" className="form-label">Search</label>
        <div className="form-control">
          <Search size={18} className="user-search-icon" aria-hidden="true" />
          <input
            id="user-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Name or email"
            autoComplete="off"
          />
        </div>
      </div>
      <FilterSelect
        id="user-role"
        label="Role"
        allLabel="All roles"
        options={USER_ROLE_OPTIONS}
        value={filters.role}
        onChange={(value) => onChange('role', value)}
      />
      <FilterSelect
        id="user-status"
        label="Status"
        allLabel="All statuses"
        options={USER_STATUS_OPTIONS}
        value={filters.status}
        onChange={(value) => onChange('status', value)}
      />
      <DateFilter id="user-from" label="Created from" value={filters.from} onChange={(value) => onChange('from', value)} dateError={dateError} />
      <DateFilter id="user-to" label="Created to" value={filters.to} onChange={(value) => onChange('to', value)} dateError={dateError} />
      {dateError && <p id="user-date-error" className="form-error user-date-error">{dateError}</p>}
    </div>
  );
}
