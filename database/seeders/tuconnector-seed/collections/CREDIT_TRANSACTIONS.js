const ids = require('../ids');
const { d } = require('../helpers');

// Tổng amount theo user khớp với User.credit_wallet.balance:
// Minh 30-1=29 | Huy 5-1-1=3 | Lan 5 | Hà 3+20-1=22 | Tuấn 3-1=2
const MONTH_END = d('2026-11-01T00:00:00+07:00');
const tx = (o) => ({ related_apply_id: null, related_invitation_id: null, expires_at: null, ...o });

module.exports = [
  tx({ _id: ids.tx_minh_grant, user_id: ids.user_tutor_minh, amount: 30, type: 'MONTHLY_GRANT', expires_at: MONTH_END, created_at: d('2026-10-01T00:03:10+07:00') }),
  tx({ _id: ids.tx_minh_apply, user_id: ids.user_tutor_minh, amount: -1, type: 'USED_APPLY', related_apply_id: ids.apply_minh_toan9, created_at: d('2026-10-05T09:00:00+07:00') }),
  tx({ _id: ids.tx_huy_grant, user_id: ids.user_tutor_huy, amount: 5, type: 'MONTHLY_GRANT', expires_at: MONTH_END, created_at: d('2026-10-01T00:00:00+07:00') }),
  tx({ _id: ids.tx_huy_apply_1, user_id: ids.user_tutor_huy, amount: -1, type: 'USED_APPLY', related_apply_id: ids.apply_huy_toan9, created_at: d('2026-10-05T11:00:00+07:00') }),
  tx({ _id: ids.tx_huy_apply_2, user_id: ids.user_tutor_huy, amount: -1, type: 'USED_APPLY', related_apply_id: ids.apply_huy_ly11, created_at: d('2026-10-12T10:00:00+07:00') }),
  tx({ _id: ids.tx_lan_grant, user_id: ids.user_tutor_lan, amount: 5, type: 'MONTHLY_GRANT', expires_at: MONTH_END, created_at: d('2026-10-01T00:00:00+07:00') }),
  tx({ _id: ids.tx_ha_grant, user_id: ids.user_parent_ha, amount: 3, type: 'MONTHLY_GRANT', expires_at: MONTH_END, created_at: d('2026-10-01T00:00:00+07:00') }),
  tx({ _id: ids.tx_ha_purchase, user_id: ids.user_parent_ha, amount: 20, type: 'PURCHASE', created_at: d('2026-10-15T20:55:10+07:00') }), // credit mua: không hết hạn
  tx({ _id: ids.tx_ha_invite, user_id: ids.user_parent_ha, amount: -1, type: 'USED_INVITATION', related_invitation_id: ids.inv_minh_ly11, created_at: d('2026-10-15T21:00:00+07:00') }),
  tx({ _id: ids.tx_tuan_grant, user_id: ids.user_parent_tuan, amount: 3, type: 'MONTHLY_GRANT', expires_at: MONTH_END, created_at: d('2026-10-01T00:00:00+07:00') }),
  tx({ _id: ids.tx_tuan_invite, user_id: ids.user_parent_tuan, amount: -1, type: 'USED_INVITATION', related_invitation_id: ids.inv_lan_anh7, created_at: d('2026-10-08T19:00:00+07:00') }),
];
