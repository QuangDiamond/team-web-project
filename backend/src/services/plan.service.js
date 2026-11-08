import mongoose from 'mongoose';
import { Plan } from '../models/Plan.js';
import { CreditPack } from '../models/CreditPack.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { AppError } from '../common/utils/AppError.js';

// Gói Free (theo seed PLANS.json) luôn giữ giá 0
export const FREE_PLAN_NAME = 'FREE_DEFAULT';

/**
 * Đổi Decimal128 (hoặc chuỗi từ getter) sang number để frontend nhận tiền VND dạng số
 * @param {Object|string|null} value - giá trị tiền trong DB
 * @returns {number|null} số tiền, null nếu không có giá trị
 */
const decimalToNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value.toString());
};

/**
 * Đổi Plan document sang dạng trả về cho API (monthly_price là number)
 * @param {Object} plan - Plan document
 * @returns {Object} { _id, target_role, name, monthly_price, monthly_credits, ai_quota, max_classrooms, sms_reminders_enabled, is_active }
 */
export const toPlanResponse = (plan) => {
  return {
    _id: plan._id,
    target_role: plan.target_role,
    name: plan.name,
    monthly_price: decimalToNumber(plan.monthly_price),
    monthly_credits: plan.monthly_credits,
    ai_quota: plan.ai_quota,
    max_classrooms: plan.max_classrooms,
    sms_reminders_enabled: plan.sms_reminders_enabled,
    is_active: plan.is_active,
  };
};

/**
 * Đổi CreditPack document sang dạng trả về cho API (price là number)
 * @param {Object} creditPack - CreditPack document
 * @returns {Object} { _id, target_role, name, credit_amount, price, is_active }
 */
export const toCreditPackResponse = (creditPack) => {
  return {
    _id: creditPack._id,
    target_role: creditPack.target_role,
    name: creditPack.name,
    credit_amount: creditPack.credit_amount,
    price: decimalToNumber(creditPack.price),
    is_active: creditPack.is_active,
  };
};

/**
 * Ghi nhật ký hành động của Admin (BR-16)
 * @param {Object} admin - { adminUserId, ipAddress }
 * @param {string} reason - lý do Admin nhập
 * @param {Object} details - { entity, operation, target_id, before, after }
 * @returns {Promise<void>}
 */
const writeAuditLog = async (admin, reason, details) => {
  await AdminAuditLog.create({
    admin_user_id: admin.adminUserId,
    action: 'UPDATE_PLAN',
    reason: reason,
    details_json: details,
    ip_address: admin.ipAddress,
  });
};

/**
 * Tìm Plan theo id, báo 404 nếu id sai định dạng hoặc không tồn tại
 * @param {string} planId - id của Plan
 * @returns {Promise<Object>} Plan document
 */
const findPlanOrThrow = async (planId) => {
  if (!mongoose.isValidObjectId(planId)) {
    throw new AppError('Plan not found', 404);
  }
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  return plan;
};

/**
 * Tìm CreditPack theo id, báo 404 nếu id sai định dạng hoặc không tồn tại
 * @param {string} creditPackId - id của CreditPack
 * @returns {Promise<Object>} CreditPack document
 */
const findCreditPackOrThrow = async (creditPackId) => {
  if (!mongoose.isValidObjectId(creditPackId)) {
    throw new AppError('Credit pack not found', 404);
  }
  const creditPack = await CreditPack.findById(creditPackId);
  if (!creditPack) {
    throw new AppError('Credit pack not found', 404);
  }
  return creditPack;
};

/**
 * Admin sửa cấu hình gói (UC39): giá, credit/tháng, AI quota, số lớp tối đa, SMS. Gói Free phải giữ giá 0.
 * Ghi audit log UPDATE_PLAN kèm giá trị trước / sau
 * @param {string} planId - id của Plan
 * @param {Object} data - { monthly_price, monthly_credits, ai_quota, max_classrooms, sms_reminders_enabled, is_active?, reason }
 * @param {Object} admin - { adminUserId, ipAddress }
 * @returns {Promise<Object>} plan sau khi sửa (dạng toPlanResponse)
 */
export const updatePlan = async (planId, data, admin) => {
  const plan = await findPlanOrThrow(planId);

  if (plan.name === FREE_PLAN_NAME && data.monthly_price !== 0) {
    throw new AppError('Free plan price must be 0', 422, {
      monthly_price: ['Free plan price must be 0'],
    });
  }

  const before = toPlanResponse(plan);

  plan.monthly_price = String(data.monthly_price);
  plan.monthly_credits = data.monthly_credits;
  plan.ai_quota = data.ai_quota;
  plan.max_classrooms = data.max_classrooms;
  plan.sms_reminders_enabled = data.sms_reminders_enabled;
  if (data.is_active !== undefined) {
    plan.is_active = data.is_active;
  }
  await plan.save();

  const after = toPlanResponse(plan);
  await writeAuditLog(admin, data.reason, {
    entity: 'PLAN',
    operation: 'UPDATE',
    target_id: plan._id,
    before: before,
    after: after,
  });

  return after;
};

/**
 * Create a subscription plan and record the admin's reason and configuration.
 * @param {Object} data - Validated plan fields and reason.
 * @param {Object} admin - Admin user ID and IP address.
 * @returns {Promise<Object>} Created plan response.
 */
export const createPlan = async (data, admin) => {
  const { reason, ...fields } = data;
  const plan = await Plan.create({ ...fields, monthly_price: String(fields.monthly_price) });
  const after = toPlanResponse(plan);
  await writeAuditLog(admin, reason, {
    entity: 'PLAN',
    operation: 'CREATE',
    target_id: plan._id,
    before: null,
    after: after,
  });
  return after;
};

/**
 * Admin thêm gói credit mới (UC39 A1), gói mới mở bán ngay. Ghi audit log UPDATE_PLAN
 * @param {Object} data - { target_role, name, credit_amount, price, reason }
 * @param {Object} admin - { adminUserId, ipAddress }
 * @returns {Promise<Object>} gói credit vừa tạo (dạng toCreditPackResponse)
 */
export const createCreditPack = async (data, admin) => {
  const creditPack = await CreditPack.create({
    target_role: data.target_role,
    name: data.name,
    credit_amount: data.credit_amount,
    price: String(data.price),
    is_active: true,
  });

  const after = toCreditPackResponse(creditPack);
  await writeAuditLog(admin, data.reason, {
    entity: 'CREDIT_PACK',
    operation: 'CREATE',
    target_id: creditPack._id,
    before: null,
    after: after,
  });

  return after;
};

/**
 * Admin sửa tên, số credit, giá của gói credit (UC39). Ghi audit log UPDATE_PLAN kèm giá trị trước / sau
 * @param {string} creditPackId - id của CreditPack
 * @param {Object} data - { name, credit_amount, price, reason }
 * @param {Object} admin - { adminUserId, ipAddress }
 * @returns {Promise<Object>} gói credit sau khi sửa (dạng toCreditPackResponse)
 */
export const updateCreditPack = async (creditPackId, data, admin) => {
  const creditPack = await findCreditPackOrThrow(creditPackId);
  const before = toCreditPackResponse(creditPack);

  creditPack.name = data.name;
  creditPack.credit_amount = data.credit_amount;
  creditPack.price = String(data.price);
  await creditPack.save();

  const after = toCreditPackResponse(creditPack);
  await writeAuditLog(admin, data.reason, {
    entity: 'CREDIT_PACK',
    operation: 'UPDATE',
    target_id: creditPack._id,
    before: before,
    after: after,
  });

  return after;
};

/**
 * Admin bật / tắt mở bán gói credit (UC39 A1), gói bị tắt sẽ ẩn với user. Ghi audit log UPDATE_PLAN
 * @param {string} creditPackId - id của CreditPack
 * @param {Object} data - { is_active, reason }
 * @param {Object} admin - { adminUserId, ipAddress }
 * @returns {Promise<Object>} gói credit sau khi đổi trạng thái (dạng toCreditPackResponse)
 */
export const updateCreditPackStatus = async (creditPackId, data, admin) => {
  const creditPack = await findCreditPackOrThrow(creditPackId);
  const before = toCreditPackResponse(creditPack);

  creditPack.is_active = data.is_active;
  await creditPack.save();

  let operation = 'DISABLE';
  if (data.is_active) {
    operation = 'ENABLE';
  }

  const after = toCreditPackResponse(creditPack);
  await writeAuditLog(admin, data.reason, {
    entity: 'CREDIT_PACK',
    operation: operation,
    target_id: creditPack._id,
    before: before,
    after: after,
  });

  return after;
};
