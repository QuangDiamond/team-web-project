import { isIP } from 'node:net';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { CreditPack } from '../models/CreditPack.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { AppError } from '../common/utils/AppError.js';
import * as pspClient from '../common/utils/pspClient.js';
import { sendPaymentReceiptEmail } from '../common/utils/mailer.js';
import { env } from '../config/environment.js';
import { FREE_PLAN_NAME, calculatePlanCharge, toPlanResponse, toCreditPackResponse } from './plan.service.js';
import {
  activateScheduledPlan,
  addCredits,
  addMonths,
  hasConflictingScheduledPlan,
  schedulePlanPurchase,
} from './subscription.service.js';

// BR-06: đơn chờ thanh toán hết hạn sau 15 phút (PAYMENT_ORDERS không có field expires_at nên tính từ created_at)
const ORDER_TTL_MS = 15 * 60 * 1000;

/**
 * Thời điểm đơn hết hạn (created_at + 15 phút)
 * @param {Object} order - PaymentOrder
 * @returns {Date} thời điểm hết hạn
 */
const getOrderExpiresAt = (order) => {
  return new Date(order.created_at.getTime() + ORDER_TTL_MS);
};

/**
 * Đơn PENDING đã quá 15 phút chưa
 * @param {Object} order - PaymentOrder
 * @returns {boolean} true nếu đơn PENDING đã hết hạn
 */
const isPendingOrderExpired = (order) => {
  if (order.status !== 'PENDING') {
    return false;
  }
  return getOrderExpiresAt(order).getTime() <= Date.now();
};

/**
 * Chuyển đơn PENDING đã quá hạn sang EXPIRED (chỉ cập nhật khi đơn vẫn còn PENDING)
 * @param {Object} order - PaymentOrder
 * @returns {Promise<Object>} đơn sau khi cập nhật (hoặc đơn hiện tại nếu chưa hết hạn)
 */
const expireOrderIfNeeded = async (order) => {
  if (!isPendingOrderExpired(order)) {
    return order;
  }
  const expiredOrder = await PaymentOrder.findOneAndUpdate(
    { _id: order._id, status: 'PENDING' },
    { status: 'EXPIRED' },
    { new: true }
  );
  if (expiredOrder) {
    return expiredOrder;
  }
  return PaymentOrder.findById(order._id);
};

/**
 * Tạo mã đơn dễ đọc: TC + yyyymmdd + 6 ký tự ngẫu nhiên, vd TC20261105A1B2C3
 * @returns {string} mã đơn
 */
const generateOrderCode = () => {
  const today = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TC${today}${randomPart}`;
};

/**
 * Gói Free của một role
 * @param {string} role - TUTOR | PARENT
 * @returns {Promise<Object|null>} Plan Free hoặc null nếu chưa cấu hình
 */
const findFreePlan = async (role) => {
  return Plan.findOne({ target_role: role, name: FREE_PLAN_NAME });
};

/**
 * Áp gói vừa mua cho user sau khi thanh toán thành công (UC17 #13, xem schedulePlanPurchase).
 * Gói áp dụng ngay thì cấp luôn credit tháng đầu (D7); gói chờ thì cấp khi gói đó bắt đầu
 * @param {Object} order - PaymentOrder đã SUCCESS (item_type = PLAN_UPGRADE)
 * @param {Object} session - mongoose session của transaction đang chạy
 * @returns {Promise<{ plan: Object, period: Object }|null>} null nếu cần xử lý tay
 */
const applyPlanUpgrade = async (order, session) => {
  const user = await User.findById(order.user_id).session(session);
  const plan = await Plan.findById(order.plan_id).session(session);
  if (!user || !plan) {
    console.error(`Paid order ${order.order_code}: user or plan not found, needs manual handling`);
    return null;
  }

  const now = new Date();
  const purchase = schedulePlanPurchase(user.subscription, plan._id, order.duration_months, now);
  if (!purchase) {
    console.error(`Paid order ${order.order_code}: another plan is already scheduled, needs manual handling`);
    return null;
  }

  await User.updateOne({ _id: user._id }, { $set: { subscription: purchase.subscription } }, { session });
  if (!purchase.period.is_scheduled) {
    // Credit tháng có hạn 1 tháng (job cấp credit hàng tháng chưa làm, xem docs/TODO.md)
    await addCredits(user._id, plan.monthly_credits, 'MONTHLY_GRANT', addMonths(now, 1), session);
  }
  return { plan: plan, period: purchase.period };
};

/**
 * Cộng credit của gói credit đã mua (credit_amount × quantity), credit mua không hết hạn
 * @param {Object} order - PaymentOrder đã SUCCESS (item_type = CREDIT_PACK)
 * @returns {Promise<void>}
 */
const applyCreditPackPurchase = async (order, session) => {
  const creditPack = await CreditPack.findById(order.pack_id).session(session);
  if (!creditPack) {
    console.error(`Paid order ${order.order_code}: credit pack not found, needs manual handling`);
    return null;
  }
  const totalCredits = creditPack.credit_amount * order.quantity;
  await addCredits(order.user_id, totalCredits, 'PURCHASE', null, session);
  return { pack: creditPack };
};

/**
 * Gửi bill qua email sau khi thanh toán thành công. Lỗi gửi mail chỉ ghi log, không ảnh hưởng đơn đã thanh toán
 * @param {Object} order - PaymentOrder đã SUCCESS
 * @param {Object|null} benefit - kết quả applyPlanUpgrade / applyCreditPackPurchase
 * @returns {Promise<void>}
 */
const sendPaymentBill = async (order, benefit) => {
  const buyer = await User.findById(order.user_id).select('full_name email');
  if (!buyer || !buyer.email) {
    return;
  }
  const bill = {
    order_code: order.order_code,
    paid_at: order.paid_at,
    amount: order.amount,
    payment_method: order.payment_method,
    receipt_url: order.receipt.receipt_url,
    plan: null,
    period: null,
    pack: null,
  };
  if (benefit && benefit.plan) {
    bill.plan = {
      name: benefit.plan.name,
      billing_period: benefit.plan.billing_period,
      monthly_credits: benefit.plan.monthly_credits,
      ai_quota: benefit.plan.ai_quota,
      max_classrooms: benefit.plan.max_classrooms,
    };
    bill.period = benefit.period;
  }
  if (benefit && benefit.pack) {
    bill.pack = {
      name: benefit.pack.name,
      quantity: order.quantity,
      credit_amount: benefit.pack.credit_amount,
    };
  }
  await sendPaymentReceiptEmail(buyer.email, buyer.full_name, bill);
};

/**
 * Danh mục gói cho user (D10): plans của role (kèm cờ is_free để so sánh) và credit packs của role
 * hoặc dùng chung (target_role null, D4). Chỉ lấy mục đang bật
 * @param {string} role - TUTOR | PARENT
 * @returns {Promise<{ role: string, plans: Object[], packs: Object[] }>}
 */
export const getCatalog = async (role) => {
  const plans = await Plan.find({ target_role: role, is_active: true }).sort({ monthly_price: 1 });
  const packs = await CreditPack.find({ target_role: { $in: [role, null] }, is_active: true }).sort({ price: 1 });

  const planItems = plans.map((plan) => {
    const planItem = toPlanResponse(plan);
    planItem.is_free = plan.name === FREE_PLAN_NAME;
    return planItem;
  });

  return {
    role: role,
    plans: planItems,
    packs: packs.map(toCreditPackResponse),
  };
};

/**
 * Gói hiện tại, thời hạn, số dư credit và AI quota còn lại của user (UC17, UC18).
 * Subscription hết hạn hoặc chưa có thì coi như đang dùng gói Free của role
 * @param {string} userId - id user đang đăng nhập
 * @returns {Promise<{ plan: Object|null, subscription: Object|null, next_plan: Object|null, credit_balance: number, ai_quota_left: number }>}
 */
export const getMyBilling = async (userId) => {
  await activateScheduledPlan(userId);
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const now = new Date();
  const subscription = user.subscription;
  let hasActiveSubscription = false;
  if (subscription && subscription.status === 'ACTIVE' && subscription.expires_at > now) {
    hasActiveSubscription = true;
  }

  let plan = null;
  if (hasActiveSubscription) {
    plan = await Plan.findById(subscription.plan_id);
  }
  if (!plan) {
    plan = await findFreePlan(user.role);
  }

  let subscriptionData = null;
  if (subscription) {
    let status = subscription.status;
    if (!hasActiveSubscription) {
      status = 'EXPIRED';
    }
    subscriptionData = {
      status: status,
      start_date: subscription.start_date,
      expires_at: subscription.expires_at,
    };
  }

  let creditBalance = 0;
  if (user.credit_wallet) {
    creditBalance = user.credit_wallet.balance;
  }

  let aiQuotaLeft = 0;
  let planData = null;
  if (plan) {
    let aiQuotaUsed = 0;
    if (hasActiveSubscription && subscription.ai_quota_used) {
      aiQuotaUsed = subscription.ai_quota_used;
    }
    aiQuotaLeft = Math.max((plan.ai_quota || 0) - aiQuotaUsed, 0);
    planData = { _id: plan._id, name: plan.name, is_free: plan.name === FREE_PLAN_NAME };
  }

  // Gói đã mua, chạy khi gói hiện tại hết hạn (UC17 #13)
  let nextPlanData = null;
  if (hasActiveSubscription && subscription.next_plan_id) {
    const nextPlan = await Plan.findById(subscription.next_plan_id);
    let nextPlanName = null;
    if (nextPlan) {
      nextPlanName = nextPlan.name;
    }
    nextPlanData = {
      _id: subscription.next_plan_id,
      name: nextPlanName,
      start_date: subscription.next_start_date,
      expires_at: subscription.next_expires_at,
    };
  }

  return {
    plan: planData,
    subscription: subscriptionData,
    next_plan: nextPlanData,
    credit_balance: creditBalance,
    ai_quota_left: aiQuotaLeft,
  };
};

/**
 * Tạo đơn thanh toán PENDING (BR-06), số tiền tính từ giá hiện tại trong DB (D9), rồi tạo payment bên PSP
 * @param {Object} user - { id, role } từ JWT
 * @param {Object} data - { item_type, plan_id } hoặc { item_type, pack_id, quantity }, kèm payment_method
 * @param {string} payerIp - Validated client IP from the HTTP request
 * @returns {Promise<{ order_code, item_type, amount, expires_at, checkout_url }>}
 */
export const createOrder = async (user, data, payerIp) => {
  if (typeof payerIp !== 'string' || isIP(payerIp) === 0) {
    throw new AppError('A valid payer IP address is required', 400);
  }
  const newOrder = {
    order_code: generateOrderCode(),
    user_id: user.id,
    item_type: data.item_type,
    payment_method: data.payment_method,
    status: 'PENDING',
  };

  let amount;
  if (data.item_type === 'PLAN_UPGRADE') {
    const plan = await Plan.findById(data.plan_id);
    if (!plan || !plan.is_active) {
      throw new AppError('Plan not found', 404);
    }
    if (plan.target_role !== user.role) {
      throw new AppError('This plan is not available for your role', 422, { plan_id: ['This plan is not available for your role'] });
    }
    if (plan.name === FREE_PLAN_NAME) {
      throw new AppError('The Free plan cannot be purchased', 422, { plan_id: ['The Free plan cannot be purchased'] });
    }
    await activateScheduledPlan(user.id);
    const buyer = await User.findById(user.id).select('subscription');
    if (buyer && hasConflictingScheduledPlan(buyer.subscription, plan._id, new Date())) {
      const message = 'You already have another plan scheduled to start after your current plan';
      throw new AppError(message, 409, { plan_id: [message] });
    }
    const planCharge = calculatePlanCharge(plan);
    amount = planCharge.amount;
    newOrder.plan_id = plan._id;
    newOrder.duration_months = planCharge.duration_months;
    newOrder.quantity = null;
  } else {
    const creditPack = await CreditPack.findById(data.pack_id);
    if (!creditPack || !creditPack.is_active) {
      throw new AppError('Credit pack not found', 404);
    }
    if (creditPack.target_role !== null && creditPack.target_role !== user.role) {
      throw new AppError('This credit pack is not available for your role', 422, { pack_id: ['This credit pack is not available for your role'] });
    }
    amount = Number(creditPack.price) * data.quantity;
    newOrder.pack_id = creditPack._id;
    newOrder.quantity = data.quantity;
  }
  newOrder.amount = String(amount);

  const order = await PaymentOrder.create(newOrder);
  let payment;
  try {
    payment = await pspClient.createPayment(order, payerIp);
  } catch (error) {
    // A network failure may happen after PSP accepted the payment. Keep it pending for reconciliation.
    if (error.status !== 502) {
      await PaymentOrder.updateOne({ _id: order._id, status: 'PENDING' }, { status: 'FAILED' });
    }
    throw error;
  }

  return {
    order_code: order.order_code,
    item_type: order.item_type,
    amount: amount,
    expires_at: getOrderExpiresAt(order),
    checkout_url: payment.checkout_url,
  };
};

/**
 * Chi tiết đơn của chính user (404 nếu không phải chủ đơn). Đơn PENDING quá hạn được lưu thành EXPIRED
 * @param {string} userId - id user đang đăng nhập
 * @param {string} orderCode - mã đơn
 * @returns {Promise<Object>} { order_code, item_type, status, amount, payment_method, created_at, paid_at, expires_at, item, buyer, receipt }
 */
export const getOrder = async (userId, orderCode) => {
  let order = await PaymentOrder.findOne({ order_code: orderCode, user_id: userId });
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  order = await expireOrderIfNeeded(order);

  // Webhook có thể đến chậm: hỏi lại PSP khi đơn vẫn PENDING
  if (order.status === 'PENDING') {
    const pspResult = await pspClient.getPayment(order);
    if (pspResult) {
      await applyPaymentResult(order.order_code, pspResult.result);
      order = await PaymentOrder.findById(order._id);
    }
  }

  let item = null;
  if (order.item_type === 'PLAN_UPGRADE') {
    const plan = await Plan.findById(order.plan_id);
    item = {
      _id: order.plan_id,
      name: plan ? plan.name : null,
      duration_months: order.duration_months,
      monthly_credits: plan ? plan.monthly_credits : null,
    };
  } else {
    const creditPack = await CreditPack.findById(order.pack_id);
    item = {
      _id: order.pack_id,
      name: creditPack ? creditPack.name : null,
      quantity: order.quantity,
      credit_amount: creditPack ? creditPack.credit_amount : null,
    };
  }

  // Thông tin người mua để in biên lai (UC18)
  const buyer = await User.findById(order.user_id).select('full_name email');

  return {
    order_code: order.order_code,
    item_type: order.item_type,
    status: order.status,
    amount: Number(order.amount),
    payment_method: order.payment_method,
    created_at: order.created_at,
    paid_at: order.paid_at,
    expires_at: getOrderExpiresAt(order),
    item: item,
    buyer: { full_name: buyer.full_name, email: buyer.email },
    receipt: order.receipt,
  };
};

/**
 * User hủy đơn đang chờ thanh toán (E1). Đơn không còn PENDING (kể cả đã quá hạn) -> 409
 * @param {string} userId - id user đang đăng nhập
 * @param {string} orderCode - mã đơn
 * @returns {Promise<{ order_code: string, status: string }>}
 */
export const cancelOrder = async (userId, orderCode) => {
  let order = await PaymentOrder.findOne({ order_code: orderCode, user_id: userId });
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  order = await expireOrderIfNeeded(order);

  if (order.status !== 'PENDING') throw new AppError('Only pending orders can be cancelled', 409);
  await pspClient.cancelPayment(order);
  const cancelledOrder = await PaymentOrder.findOneAndUpdate(
    { _id: order._id, status: 'PENDING' },
    { status: 'CANCELLED' },
    { new: true }
  );
  if (!cancelledOrder) {
    throw new AppError('Only pending orders can be cancelled', 409);
  }

  return { order_code: cancelledOrder.order_code, status: cancelledOrder.status };
};

/**
 * Áp kết quả thanh toán (webhook PSP hoặc trang thanh toán giả). Idempotent (E2): đơn không tồn tại hoặc
 * không còn PENDING thì bỏ qua và ghi log. Đơn quá hạn -> EXPIRED. FAILED -> không đổi gì khác (E1).
 * SUCCESS -> lưu paid_at, receipt rồi nâng cấp gói hoặc cộng credit (cùng transaction), sau đó gửi bill qua email
 * @param {string} orderCode - mã đơn
 * @param {'SUCCESS'|'FAILED'} result - kết quả thanh toán
 * @returns {Promise<Object|null>} đơn sau khi xử lý, null nếu không tìm thấy
 */
export const applyPaymentResult = async (orderCode, result) => {
  const order = await PaymentOrder.findOne({ order_code: orderCode });
  if (!order) {
    console.warn(`Payment result ignored: order ${orderCode} not found`);
    return null;
  }
  if (order.status !== 'PENDING') {
    console.warn(`Payment result ignored: order ${orderCode} is already ${order.status}`);
    return order;
  }
  if (isPendingOrderExpired(order)) {
    console.warn(`Payment result ignored: order ${orderCode} expired`);
    return expireOrderIfNeeded(order);
  }

  if (result !== 'SUCCESS') {
    const failedOrder = await PaymentOrder.findOneAndUpdate(
      { _id: order._id, status: 'PENDING' },
      { status: 'FAILED' },
      { new: true }
    );
    if (failedOrder) {
      return failedOrder;
    }
    return PaymentOrder.findById(order._id);
  }

  // Đổi trạng thái đơn và cộng quyền lợi trong 1 transaction: lỗi giữa chừng thì đơn vẫn PENDING, không mất quyền lợi
  let paidOrder = null;
  let benefit = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const now = new Date();
      // Điều kiện status PENDING đảm bảo chỉ 1 request được cộng quyền lợi dù kết quả gửi về nhiều lần
      paidOrder = await PaymentOrder.findOneAndUpdate(
        { _id: order._id, status: 'PENDING' },
        {
          status: 'SUCCESS',
          paid_at: now,
          receipt: {
            receipt_url: `${env.corsOrigin}/receipts/${order.order_code}`,
            created_at: now,
          },
        },
        { new: true, session }
      );
      if (!paidOrder) {
        return;
      }
      if (paidOrder.item_type === 'PLAN_UPGRADE') {
        benefit = await applyPlanUpgrade(paidOrder, session);
      } else {
        benefit = await applyCreditPackPurchase(paidOrder, session);
      }
    });
  } finally {
    await session.endSession();
  }

  if (!paidOrder) {
    console.warn(`Payment result ignored: order ${orderCode} was processed by another request`);
    return PaymentOrder.findById(order._id);
  }

  sendPaymentBill(paidOrder, benefit).catch((error) => {
    console.error(`Could not send the bill for order ${orderCode}:`, error.message);
  });
  return paidOrder;
};

/**
 * Lấy đơn của chính user cho trang thanh toán giả (D12, chỉ dùng khi dev)
 * @param {string} userId - id user đang đăng nhập
 * @param {string} orderCode - mã đơn
 * @returns {Promise<Object|null>} đơn (PENDING quá hạn đã chuyển EXPIRED) hoặc null nếu không có / không phải chủ đơn
 */
export const findOrderForMockCheckout = async (userId, orderCode) => {
  const order = await PaymentOrder.findOne({ order_code: orderCode, user_id: userId });
  if (!order) {
    return null;
  }
  return expireOrderIfNeeded(order);
};

/**
 * Reconcile a signed webhook against the gateway payment and local amount.
 * @param {Object} event - Verified webhook event
 * @returns {Promise<void>}
 */
export const handlePspWebhook = async (event) => {
  const order = await PaymentOrder.findOne({ order_code: event.order_code });
  if (!order || order.status !== 'PENDING') return;
  const payment = await pspClient.getPayment(order);
  if (!payment || payment.result !== event.result) {
    throw new AppError('Payment gateway result is not confirmed', 502);
  }
  await applyPaymentResult(order.order_code, payment.result);
};
