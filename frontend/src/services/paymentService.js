import api from './api.js';

// UC17 Upgrade Plan & Buy Credits (chỉ TUTOR / PARENT)
// Danh mục plan + credit pack đang bán cho role của user
export const getCatalog = () => api.get('/payment/v1/catalog');
// Gói hiện tại, hạn dùng, số credit và AI quota còn lại
export const getMyBilling = () => api.get('/payment/v1/me');
// Tạo đơn: { item_type: 'PLAN_UPGRADE', plan_id } hoặc { item_type: 'CREDIT_PACK', pack_id, quantity }
// kèm payment_method. Trả về checkout_url để chuyển trình duyệt sang cổng thanh toán
export const createOrder = (data) => api.post('/payment/v1/orders', data);
export const getOrder = (orderCode) => api.get(`/payment/v1/orders/${encodeURIComponent(orderCode)}`);
export const cancelOrder = (orderCode) => api.post(`/payment/v1/orders/${encodeURIComponent(orderCode)}/cancel`);

// UC18 View Credits & Transactions. params: { page, limit, type | status, from, to } (bỏ trống thì không lọc)
export const getCreditTransactions = (params) => api.get('/payment/v1/credit-transactions', { params });
export const getOrders = (params) => api.get('/payment/v1/orders', { params });

// Xuất CSV: trình duyệt mở thẳng link này (cookie đăng nhập tự gửi kèm) và tải file về
const buildExportUrl = (path, filters) => {
  const query = new URLSearchParams(filters).toString();
  if (query.length === 0) {
    return `${api.defaults.baseURL}${path}`;
  }
  return `${api.defaults.baseURL}${path}?${query}`;
};
export const getCreditTransactionsExportUrl = (filters) => buildExportUrl('/payment/v1/credit-transactions/export', filters);
export const getOrdersExportUrl = (filters) => buildExportUrl('/payment/v1/orders/export', filters);
