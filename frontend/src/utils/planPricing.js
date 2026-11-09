import { toNumber } from './formatCurrency.js';

export const getPlanPeriod = (plan) => plan.billing_period || 'MONTHLY';

export const getPlanPeriodLabel = (plan) => (getPlanPeriod(plan) === 'YEARLY' ? 'năm' : 'tháng');

export const getPlanBasePrice = (plan) => {
  const durationMonths = getPlanPeriod(plan) === 'YEARLY' ? 12 : 1;
  return toNumber(plan.monthly_price) * durationMonths;
};

export const getPlanPrice = (plan) => {
  const discountPercent = getPlanPeriod(plan) === 'YEARLY' ? Number(plan.annual_discount_percent || 0) : 0;
  return Math.round(getPlanBasePrice(plan) * (100 - discountPercent) / 100);
};
