// Gói của user (UC17 D27): tính lịch gói khi mua, kích hoạt gói đã hẹn và cộng credit vào ví.
// Tách khỏi payment.service để middleware authentication dùng được mà không kéo theo mailer / PSP client
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { CreditTransaction } from '../models/CreditTransaction.js';

/**
 * Cộng thêm số tháng vào một ngày
 * @param {Date} date - ngày gốc
 * @param {number} months - số tháng cộng thêm
 * @returns {Date} ngày mới
 */
export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Cộng credit vào ví (tạo ví nếu chưa có) bằng $inc nguyên tử và ghi lịch sử CreditTransaction
 * @param {Object} userId - id của user
 * @param {number} amount - số credit cộng thêm
 * @param {string} type - MONTHLY_GRANT | PURCHASE
 * @param {Date|null} expiresAt - hạn dùng credit (credit mua từ pack để null = vĩnh viễn)
 * @param {Object} session - mongoose session của transaction đang chạy
 * @returns {Promise<void>}
 */
export const addCredits = async (userId, amount, type, expiresAt, session) => {
  // Ví null thì không $inc được, tạo ví số dư 0 trước
  await User.updateOne({ _id: userId, credit_wallet: null }, { $set: { credit_wallet: { balance: 0 } } }, { session });
  await User.updateOne({ _id: userId }, { $inc: { 'credit_wallet.balance': amount } }, { session });
  await CreditTransaction.create([{
    user_id: userId,
    amount: amount,
    type: type,
    expires_at: expiresAt,
  }], { session });
};

/**
 * User đang dùng gói trả phí còn hạn không (gói Free không có expires_at)
 * @param {Object|null} subscription - User.subscription
 * @param {Date} now - thời điểm hiện tại
 * @returns {boolean}
 */
const hasActivePaidPlan = (subscription, now) => {
  if (!subscription || subscription.status !== 'ACTIVE' || !subscription.expires_at) {
    return false;
  }
  return subscription.expires_at > now;
};

/**
 * Đã có gói khác đang chờ chạy chưa (chỉ giữ 1 gói chờ; mua thêm đúng gói đang chờ thì được cộng dồn)
 * @param {Object|null} subscription - User.subscription
 * @param {Object} planId - gói định mua
 * @param {Date} now - thời điểm hiện tại
 * @returns {boolean}
 */
export const hasConflictingScheduledPlan = (subscription, planId, now) => {
  if (!hasActivePaidPlan(subscription, now) || !subscription.next_plan_id) {
    return false;
  }
  return String(subscription.next_plan_id) !== String(planId);
};

/**
 * Tính subscription mới sau khi mua gói (UC17 #13).
 * Đang Free / hết hạn: áp dụng ngay. Đang dùng gói trả phí còn hạn: gói mới chờ đến khi gói hiện tại hết hạn
 * (mua thêm đúng gói đang chờ thì cộng dồn vào gói chờ); credit và AI quota của gói mới tính từ ngày bắt đầu
 * @param {Object|null} currentSubscription - User.subscription hiện tại
 * @param {Object} planId - gói vừa mua
 * @param {number} durationMonths - số tháng của đơn
 * @param {Date} now - thời điểm thanh toán thành công
 * @returns {{ subscription: Object, period: { start_date: Date, expires_at: Date, is_scheduled: boolean } }|null}
 *   null nếu đã có một gói khác đang chờ
 */
export const schedulePlanPurchase = (currentSubscription, planId, durationMonths, now) => {
  if (!hasActivePaidPlan(currentSubscription, now)) {
    const expiresAt = addMonths(now, durationMonths);
    return {
      subscription: {
        plan_id: planId,
        status: 'ACTIVE',
        start_date: now,
        expires_at: expiresAt,
        ai_quota_used: 0,
        ai_quota_reset_at: addMonths(now, 1),
        created_at: now,
        next_plan_id: null,
        next_start_date: null,
        next_expires_at: null,
      },
      period: { start_date: now, expires_at: expiresAt, is_scheduled: false },
    };
  }
  if (hasConflictingScheduledPlan(currentSubscription, planId, now)) {
    return null;
  }

  let nextStartDate = currentSubscription.expires_at;
  let periodStartDate = currentSubscription.expires_at;
  if (currentSubscription.next_plan_id) {
    nextStartDate = currentSubscription.next_start_date;
    periodStartDate = currentSubscription.next_expires_at;
  }
  const periodExpiresAt = addMonths(periodStartDate, durationMonths);

  return {
    subscription: {
      plan_id: currentSubscription.plan_id,
      status: currentSubscription.status,
      start_date: currentSubscription.start_date,
      expires_at: currentSubscription.expires_at,
      ai_quota_used: currentSubscription.ai_quota_used,
      ai_quota_reset_at: currentSubscription.ai_quota_reset_at,
      created_at: currentSubscription.created_at,
      next_plan_id: planId,
      next_start_date: nextStartDate,
      next_expires_at: periodExpiresAt,
    },
    period: { start_date: periodStartDate, expires_at: periodExpiresAt, is_scheduled: true },
  };
};

/**
 * Subscription sau khi chuyển sang gói đang chờ
 * @param {Object} subscription - User.subscription có next_plan_id
 * @returns {Object} subscription mới
 */
export const buildActivatedSubscription = (subscription) => {
  return {
    plan_id: subscription.next_plan_id,
    status: 'ACTIVE',
    start_date: subscription.next_start_date,
    expires_at: subscription.next_expires_at,
    ai_quota_used: 0,
    ai_quota_reset_at: addMonths(subscription.next_start_date, 1),
    created_at: subscription.created_at,
    next_plan_id: null,
    next_start_date: null,
    next_expires_at: null,
  };
};

/**
 * Chuyển sang gói đang chờ khi đã tới ngày bắt đầu và cấp credit tháng đầu của gói đó.
 * Chưa có job nền nên được gọi lúc user gửi request (authentication, billing, tạo đơn).
 * Điều kiện next_plan_id + next_start_date trong updateOne đảm bảo chỉ 1 request kích hoạt
 * @param {Object} userId - id user
 * @returns {Promise<boolean>} true nếu vừa kích hoạt gói chờ
 */
export const activateScheduledPlan = async (userId) => {
  const user = await User.findById(userId).select('subscription');
  if (!user || !user.subscription || !user.subscription.next_start_date) {
    return false;
  }
  const now = new Date();
  const subscription = user.subscription;
  if (subscription.next_start_date > now) {
    return false;
  }

  const plan = await Plan.findById(subscription.next_plan_id);
  const activatedSubscription = buildActivatedSubscription(subscription);
  let isActivated = false;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await User.updateOne(
        {
          _id: user._id,
          'subscription.next_plan_id': subscription.next_plan_id,
          'subscription.next_start_date': subscription.next_start_date,
        },
        { $set: { subscription: activatedSubscription } },
        { session }
      );
      isActivated = result.modifiedCount === 1;
      if (!isActivated || !plan || subscription.next_expires_at <= now) {
        return;
      }
      const creditExpiresAt = addMonths(subscription.next_start_date, 1);
      await addCredits(user._id, plan.monthly_credits, 'MONTHLY_GRANT', creditExpiresAt, session);
    });
  } finally {
    await session.endSession();
  }
  return isActivated;
};
