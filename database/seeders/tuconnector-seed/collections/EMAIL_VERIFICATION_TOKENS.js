const ids = require('../ids');
const { FAR_FUTURE } = require('../helpers');

// TTL index trên expired_at: thực tế token sống ~24h; seed để xa để không bị xóa ngay.
module.exports = [
  { _id: ids.evt_chi, user_id: ids.user_student_chi, token_value: 'evt_seed_9f2c7a1b4e', expired_at: FAR_FUTURE, is_used: false },
];
