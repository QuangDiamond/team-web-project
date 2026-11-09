// Nhãn hiển thị cho màn Credits & Transactions (UC18)

export const CREDIT_TYPE_OPTIONS = [
  { value: 'MONTHLY_GRANT', label: 'Cấp hằng tháng', description: 'Credits hằng tháng từ gói dịch vụ' },
  { value: 'PURCHASE', label: 'Mua credits', description: 'Mua gói credits' },
  { value: 'USED_APPLY', label: 'Dùng để ứng tuyển', description: 'Đã ứng tuyển yêu cầu tìm gia sư' },
  { value: 'USED_INVITATION', label: 'Dùng để mời gia sư', description: 'Đã mời gia sư' },
  { value: 'EXPIRED_GRANT', label: 'Đã hết hạn', description: 'Credits hằng tháng chưa dùng đã hết hạn' },
];

export const ORDER_STATUS_OPTIONS = [
  { value: 'SUCCESS', label: 'Đã thanh toán', tone: 'green' },
  { value: 'PENDING', label: 'Đang chờ', tone: 'blue' },
  { value: 'FAILED', label: 'Thất bại', tone: 'red' },
  { value: 'CANCELLED', label: 'Đã hủy', tone: 'gray' },
  { value: 'EXPIRED', label: 'Đã hết hạn', tone: 'gray' },
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
      return `Lời mời: ${transaction.related.title}`;
    }
    return `Ứng tuyển: ${transaction.related.title}`;
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
    return `+${amount.toLocaleString('vi-VN')}`;
  }
  return amount.toLocaleString('vi-VN');
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
    return 'Nâng cấp gói dịch vụ';
  }
  return 'Gói credits';
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
    return 'Ngày bắt đầu không được sau ngày kết thúc';
  }
  return '';
};
