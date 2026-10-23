const ids = require('../ids');
const { money } = require('../helpers');

module.exports = [
  { _id: ids.plan_tutor_free, target_role: 'TUTOR', name: 'FREE_DEFAULT', monthly_price: money(0), monthly_credits: 5, ai_quota: 10, sms_reminders_enabled: false, is_active: true, max_classrooms: 1 },
  { _id: ids.plan_tutor_pro, target_role: 'TUTOR', name: 'PRO', monthly_price: money(199000), monthly_credits: 30, ai_quota: 100, sms_reminders_enabled: true, is_active: true, max_classrooms: null },
  // Gói phụ huynh: không dùng max_classrooms, sms_reminders_enabled → null
  { _id: ids.plan_parent_free, target_role: 'PARENT', name: 'FREE_DEFAULT', monthly_price: money(0), monthly_credits: 3, ai_quota: 5, sms_reminders_enabled: null, is_active: true, max_classrooms: null },
  { _id: ids.plan_parent_pro, target_role: 'PARENT', name: 'PRO', monthly_price: money(99000), monthly_credits: 15, ai_quota: 50, sms_reminders_enabled: null, is_active: true, max_classrooms: null },
];
