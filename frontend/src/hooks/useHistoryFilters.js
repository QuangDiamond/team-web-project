import { useState } from 'react';
import { hasActiveFilters, toFilterParams, validateDateRange } from '../utils/creditDisplay';

// Bộ lọc + số trang của 1 danh sách lịch sử (UC18). emptyFilters vd: { type: '', from: '', to: '' }
export function useHistoryFilters(emptyFilters) {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  // Đổi bộ lọc thì quay về trang 1
  const changeFilter = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  const dateError = validateDateRange(filters);

  return {
    filters,
    page,
    setPage,
    changeFilter,
    clearFilters,
    dateError,
    filterParams: toFilterParams(filters),
    filtersActive: hasActiveFilters(filters),
  };
}
