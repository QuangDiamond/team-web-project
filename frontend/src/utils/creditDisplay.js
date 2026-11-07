// Nhãn hiển thị cho màn Credits & Transactions (UC18)

export const CREDIT_TYPE_OPTIONS = [
  { value: 'MONTHLY_GRANT', label: 'Monthly grant', description: 'Monthly credits from your plan' },
  { value: 'PURCHASE', label: 'Purchase', description: 'Credit pack purchase' },
  { value: 'USED_APPLY', label: 'Used for application', description: 'Applied to a tutoring request' },
  { value: 'USED_INVITATION', label: 'Used for invitation', description: 'Invited a tutor' },
  { value: 'EXPIRED_GRANT', label: 'Expired', description: 'Unused monthly credits expired' },
];

export const ORDER_STATUS_OPTIONS = [
  { value: 'SUCCESS', label: 'Paid', tone: 'green' },
  { value: 'PENDING', label: 'Pending', tone: 'blue' },
  { value: 'FAILED', label: 'Failed', tone: 'red' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'gray' },
  { value: 'EXPIRED', label: 'Expired', tone: 'gray' },
];

const findOption = (options, value) => {
  return options.find((option) => option.value === value);
};

export const getCreditTypeLabel = (type) => {
  const option = findOption(CREDIT_TYPE_OPTIONS, type);
  if (!option) {
    return type;
  }
  return option.label;
};

// Mô tả giao dịch credit: có yêu cầu liên quan thì ghi tên yêu cầu, không thì mô tả theo loại
export const getCreditDescription = (transaction) => {
  if (transaction.related && transaction.related.title) {
    if (transaction.related.kind === 'INVITATION') {
      return `Invitation: ${transaction.related.title}`;
    }
    return `Application: ${transaction.related.title}`;
  }
  const option = findOption(CREDIT_TYPE_OPTIONS, transaction.type);
  if (!option) {
    return '—';
  }
  return option.description;
};

// Số credit có dấu, vd: "+30", "-1"
export const formatCreditAmount = (amount) => {
  if (amount > 0) {
    return `+${amount}`;
  }
  return String(amount);
};

export const getOrderStatusOption = (status) => {
  const option = findOption(ORDER_STATUS_OPTIONS, status);
  if (!option) {
    return { value: status, label: status, tone: 'gray' };
  }
  return option;
};

export const getOrderItemTypeLabel = (itemType) => {
  if (itemType === 'PLAN_UPGRADE') {
    return 'Plan upgrade';
  }
  return 'Credit pack';
};

// Bỏ các bộ lọc rỗng trước khi gửi lên API / ghép vào link CSV
export const toFilterParams = (filters) => {
  const params = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key]) {
      params[key] = filters[key];
    }
  });
  return params;
};

export const hasActiveFilters = (filters) => {
  return Object.values(filters).some((value) => Boolean(value));
};

// Ngày bắt đầu không được sau ngày kết thúc (ô date trả về chuỗi YYYY-MM-DD nên so sánh chuỗi được)
export const validateDateRange = (filters) => {
  if (filters.from && filters.to && filters.from > filters.to) {
    return 'The start date must be before the end date';
  }
  return '';
};
