import { isIP } from 'node:net';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { CreditPack } from '../models/CreditPack.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { AppError } from '../common/utils/AppError.js';
import * as pspClient from '../common/utils/pspClient.js';
import { env } from '../config/environment.js';
import { FREE_PLAN_NAME, calculatePlanCharge, toPlanResponse, toCreditPackResponse } from './plan.service.js';

// BR-06: đơn chờ thanh toán hết hạn sau 15 phút (PAYMENT_ORDERS không có field expires_at nên tính từ created_at)
const ORDER_TTL_MS = 15 * 60 * 1000;

/**
 * Cộng thêm số tháng vào một ngày
 * @param {Date} date - ngày gốc
 * @param {number} months - số tháng cộng thêm
 * @returns {Date} ngày mới
 */
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

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
 * Cộng credit vào ví (tạo ví nếu chưa có) bằng $inc nguyên tử và ghi lịch sử CreditTransaction
 * @param {Object} userId - id của user
 * @param {number} amount - số credit cộng thêm
 * @param {string} type - MONTHLY_GRANT | PURCHASE
 * @param {Date|null} expiresAt - hạn dùng credit (credit mua từ pack để null = vĩnh viễn)
 * @returns {Promise<void>}
 */
const addCredits = async (userId, amount, type, expiresAt) => {
  // Ví null thì không $inc được, tạo ví số dư 0 trước
  await User.updateOne({ _id: userId, credit_wallet: null }, { $set: { credit_wallet: { balance: 0 } } });
  await User.updateOne({ _id: userId }, { $inc: { 'credit_wallet.balance': amount } });
  await CreditTransaction.create({
    user_id: userId,
    amount: amount,
    type: type,
    expires_at: expiresAt,
  });
};

/**
 * Nâng cấp / gia hạn gói cho user sau khi thanh toán thành công.
 * D8: đang còn hạn thì cộng dồn thời hạn. D7: cấp ngay credit tháng đầu (MONTHLY_GRANT)
 * @param {Object} order - PaymentOrder đã SUCCESS (item_type = PLAN_UPGRADE)
 * @returns {Promise<void>}
 */
const applyPlanUpgrade = async (order) => {
  const user = await User.findById(order.user_id);
  const plan = await Plan.findById(order.plan_id);
  if (!user || !plan) {
    console.error(`Paid order ${order.order_code}: user or plan not found, needs manual handling`);
    return;
  }

  const now = new Date();
  const currentSubscription = user.subscription;
  let isExtending = false;
  if (currentSubscription && currentSubscription.status === 'ACTIVE' && currentSubscription.expires_at > now) {
    isExtending = true;
  }

  let newSubscription;
  if (isExtending) {
    newSubscription = {
      plan_id: plan._id,
      status: 'ACTIVE',
      start_date: currentSubscription.start_date,
      expires_at: addMonths(currentSubscription.expires_at, order.duration_months),
      ai_quota_used: currentSubscription.ai_quota_used,
      ai_quota_reset_at: currentSubscription.ai_quota_reset_at,
      created_at: currentSubscription.created_at,
    };
  } else {
    newSubscription = {
      plan_id: plan._id,
      status: 'ACTIVE',
      start_date: now,
      expires_at: addMonths(now, order.duration_months),
      ai_quota_used: 0,
      ai_quota_reset_at: addMonths(now, 1),
      created_at: now,
    };
  }

  await User.updateOne({ _id: user._id }, { $set: { subscription: newSubscription } });
  // Credit tháng có hạn 1 tháng (job cấp credit hàng tháng chưa làm, xem docs/TODO.md)
  await addCredits(user._id, plan.monthly_credits, 'MONTHLY_GRANT', addMonths(now, 1));
};

/**
 * Cộng credit của gói credit đã mua (credit_amount × quantity), credit mua không hết hạn
 * @param {Object} order - PaymentOrder đã SUCCESS (item_type = CREDIT_PACK)
 * @returns {Promise<void>}
 */
const applyCreditPackPurchase = async (order) => {
  const creditPack = await CreditPack.findById(order.pack_id);
  if (!creditPack) {
    console.error(`Paid order ${order.order_code}: credit pack not found, needs manual handling`);
    return;
  }
  const totalCredits = creditPack.credit_amount * order.quantity;
  await addCredits(order.user_id, totalCredits, 'PURCHASE', null);
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
 * @returns {Promise<{ plan: Object|null, subscription: Object|null, credit_balance: number, ai_quota_left: number }>}
 */
export const getMyBilling = async (userId) => {
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

  return {
    plan: planData,
    subscription: subscriptionData,
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
 * SUCCESS -> lưu paid_at, receipt rồi nâng cấp gói hoặc cộng credit
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

  const now = new Date();
  // Điều kiện status PENDING đảm bảo chỉ 1 request được cộng quyền lợi dù kết quả gửi về nhiều lần
  const paidOrder = await PaymentOrder.findOneAndUpdate(
    { _id: order._id, status: 'PENDING' },
    {
      status: 'SUCCESS',
      paid_at: now,
      receipt: {
        receipt_url: `${env.corsOrigin}/receipts/${order.order_code}`,
        created_at: now,
      },
    },
    { new: true }
  );
  if (!paidOrder) {
    console.warn(`Payment result ignored: order ${orderCode} was processed by another request`);
    return PaymentOrder.findById(order._id);
  }

  if (paidOrder.item_type === 'PLAN_UPGRADE') {
    await applyPlanUpgrade(paidOrder);
  } else {
    await applyCreditPackPurchase(paidOrder);
  }
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
