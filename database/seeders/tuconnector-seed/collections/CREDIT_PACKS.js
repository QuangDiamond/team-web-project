const ids = require('../ids');
const { money } = require('../helpers');

module.exports = [
  { _id: ids.pack_10, target_role: null, name: 'Gói 10 credit', credit_amount: 10, price: money(49000), is_active: true }, // bán cho cả 2 vai trò
  { _id: ids.pack_30, target_role: 'TUTOR', name: 'Gói 30 credit', credit_amount: 30, price: money(129000), is_active: true },
];
