const ids = require('../ids');
const { d } = require('../helpers');

// filter_criteria_json đang để kiểu String (chuỗi JSON) theo sheet.
module.exports = [
  {
    _id: ids.ss_ha_toan, user_id: ids.user_parent_ha, search_name: 'Gia sư Toán gần nhà',
    filter_criteria_json: JSON.stringify({ subject: 'Toán', grade: 'Lớp 9', area: 'Cầu Giấy', max_price: 300000, mode: 'OFFLINE' }),
    created_at: d('2026-10-03T19:30:00+07:00'),
  },
];
