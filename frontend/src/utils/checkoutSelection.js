// Chọn mục mua trên màn Checkout (UC17)
import { PAYMENT_METHODS } from './paymentDisplay';

// Giá trị radio: "plan:<id>" hoặc "pack:<id>"
export const toPlanValue = (planId) => `plan:${planId}`;
export const toPackValue = (packId) => `pack:${packId}`;

// Mục được chọn sẵn: theo query ?plan=<id> / ?pack=<id>, nếu không có thì gói trả phí đầu tiên, rồi tới pack đầu tiên
export const getDefaultValue = (catalog, searchParams) => {
  const paidPlans = catalog.plans.filter((plan) => !plan.is_free);
  const planIdFromQuery = searchParams.get('plan');
  const packIdFromQuery = searchParams.get('pack');

  if (planIdFromQuery && paidPlans.some((plan) => plan._id === planIdFromQuery)) {
    return toPlanValue(planIdFromQuery);
  }
  if (packIdFromQuery && catalog.packs.some((pack) => pack._id === packIdFromQuery)) {
    return toPackValue(packIdFromQuery);
  }
  if (paidPlans.length > 0) {
    return toPlanValue(paidPlans[0]._id);
  }
  if (catalog.packs.length > 0) {
    return toPackValue(catalog.packs[0]._id);
  }
  return null;
};

// Từ giá trị radio tìm lại plan / pack tương ứng
export const findSelection = (catalog, value) => {
  if (!value) {
    return null;
  }
  if (value.startsWith('plan:')) {
    const plan = catalog.plans.find((item) => toPlanValue(item._id) === value);
    if (plan) {
      return { type: 'PLAN', item: plan };
    }
  }
  if (value.startsWith('pack:')) {
    const pack = catalog.packs.find((item) => toPackValue(item._id) === value);
    if (pack) {
      return { type: 'PACK', item: pack };
    }
  }
  return null;
};

// Số tháng / số lượng chọn sẵn từ query ?count= (1–10 cho pack, 1–12 cho plan; sai thì về 1)
export const getInitialCount = (searchParams) => {
  const count = Number(searchParams.get('count'));
  if (!Number.isInteger(count) || count < 1 || count > 12) {
    return 1;
  }
  if (searchParams.get('pack') && count > 10) {
    return 1;
  }
  return count;
};

// Phương thức thanh toán chọn sẵn từ query ?method=
export const getInitialPaymentMethod = (searchParams) => {
  const method = searchParams.get('method');
  if (PAYMENT_METHODS.some((item) => item.value === method)) {
    return method;
  }
  return 'VIETQR';
};
