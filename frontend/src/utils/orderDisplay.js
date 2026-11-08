import { getPlanTitle } from './planDisplay';
import { pluralize } from './paymentDisplay';

// Lấy giá trị từ đơn, nếu đơn không có thì lấy trong order.item
const readOrderField = (order, field) => {
  if (order[field] !== undefined && order[field] !== null) {
    return order[field];
  }
  if (order.item && order.item[field] !== undefined && order.item[field] !== null) {
    return order.item[field];
  }
  return null;
};

// Tên mục đã mua, vd: "Pro plan · 3 months" hoặc "Gói 30 credit × 2"
export const getOrderItemLabel = (order) => {
  let itemName = '—';
  if (order.item && order.item.name) {
    itemName = order.item.name;
  }

  if (order.item_type === 'PLAN_UPGRADE') {
    const months = readOrderField(order, 'duration_months');
    const planLabel = `Gói ${getPlanTitle(itemName)}`;
    if (!months) {
      return planLabel;
    }
    return `${planLabel} · ${pluralize(months, 'tháng')}`;
  }

  const quantity = readOrderField(order, 'quantity');
  if (!quantity || quantity === 1) {
    return itemName;
  }
  return `${itemName} × ${quantity.toLocaleString('vi-VN')}`;
};

// Link "Try again": quay lại Checkout với đúng mục đã chọn (UC17 E1)
export const getRetryLink = (order) => {
  let itemId = null;
  if (order.item_type === 'PLAN_UPGRADE') {
    itemId = readOrderField(order, 'plan_id');
  } else {
    itemId = readOrderField(order, 'pack_id');
  }
  if (!itemId && order.item && order.item._id) {
    itemId = order.item._id;
  }
  if (!itemId) {
    return '/checkout';
  }
  // Giữ lại cả số tháng / số lượng và phương thức thanh toán của lần trước (UC17-B2)
  const params = new URLSearchParams();
  if (order.item_type === 'PLAN_UPGRADE') {
    params.set('plan', itemId);
    const months = readOrderField(order, 'duration_months');
    if (months) {
      params.set('count', String(months));
    }
  } else {
    params.set('pack', itemId);
    const quantity = readOrderField(order, 'quantity');
    if (quantity) {
      params.set('count', String(quantity));
    }
  }
  if (order.payment_method) {
    params.set('method', order.payment_method);
  }
  return `/checkout?${params.toString()}`;
};

// Tiêu đề + mô tả cho từng trạng thái thất bại
export const FAILURE_TEXT = {
  FAILED: { title: 'Thanh toán thất bại', description: 'Cổng thanh toán đã từ chối giao dịch. Bạn không bị trừ tiền; gói dịch vụ và tín dụng vẫn được giữ nguyên.' },
  CANCELLED: { title: 'Đã hủy thanh toán', description: 'Bạn đã hủy thanh toán. Bạn không bị trừ tiền; gói dịch vụ và tín dụng vẫn được giữ nguyên.' },
  EXPIRED: { title: 'Thanh toán đã hết hạn', description: 'Đơn hàng chưa được thanh toán trong vòng 15 phút. Bạn không bị trừ tiền; gói dịch vụ và tín dụng vẫn được giữ nguyên.' },
};
