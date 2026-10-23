const ids = require('../ids');
const { d, money } = require('../helpers');

module.exports = [
  {
    // Gia sư Minh nâng cấp Pro 3 tháng
    _id: ids.order_1, order_code: 'TUC20261001001', user_id: ids.user_tutor_minh, item_type: 'PLAN_UPGRADE',
    plan_id: ids.plan_tutor_pro, pack_id: null, quantity: null, duration_months: 3, amount: money(597000),
    payment_method: 'VIETQR', status: 'SUCCESS', ipn_signature: 'sig_seed_a1b2c3', paid_at: d('2026-10-01T00:03:00+07:00'),
    created_at: d('2026-10-01T00:00:00+07:00'),
    receipt: { receipt_url: 'https://cdn.tuconnector.vn/receipts/TUC20261001001.pdf', created_at: d('2026-10-01T00:03:05+07:00') },
  },
  {
    // Phụ huynh Hà mua 2 gói 10 credit
    _id: ids.order_2, order_code: 'TUC20261015002', user_id: ids.user_parent_ha, item_type: 'CREDIT_PACK',
    plan_id: null, pack_id: ids.pack_10, quantity: 2, duration_months: null, amount: money(98000),
    payment_method: 'ATM_CARD', status: 'SUCCESS', ipn_signature: 'sig_seed_d4e5f6', paid_at: d('2026-10-15T20:55:00+07:00'),
    created_at: d('2026-10-15T20:50:00+07:00'),
    receipt: { receipt_url: 'https://cdn.tuconnector.vn/receipts/TUC20261015002.pdf', created_at: d('2026-10-15T20:55:05+07:00') },
  },
  {
    // Gia sư Huy tạo đơn nhưng không thanh toán trong 15 phút → EXPIRED
    _id: ids.order_3, order_code: 'TUC20261018003', user_id: ids.user_tutor_huy, item_type: 'CREDIT_PACK',
    plan_id: null, pack_id: ids.pack_30, quantity: 1, duration_months: null, amount: money(129000),
    payment_method: 'VIETQR', status: 'EXPIRED', ipn_signature: null, paid_at: null,
    created_at: d('2026-10-18T09:00:00+07:00'), receipt: null,
  },
];
