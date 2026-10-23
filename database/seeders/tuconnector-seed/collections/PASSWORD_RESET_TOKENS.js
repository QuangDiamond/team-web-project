const ids = require('../ids');
const { FAR_FUTURE } = require('../helpers');

// TTL index trên expired_at: thực tế token sống ~15 phút; seed để xa để không bị xóa ngay.
module.exports = [
  { _id: ids.prt_tuan, user_id: ids.user_parent_tuan, token_value: 'prt_seed_4d8e0c2a71', expired_at: FAR_FUTURE, is_used: false },
];
