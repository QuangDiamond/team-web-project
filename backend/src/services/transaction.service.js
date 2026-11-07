// UC18 View Credits & Transactions: lịch sử biến động credit và lịch sử thanh toán của user
import { CreditTransaction } from '../models/CreditTransaction.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { TutorInvitation } from '../models/TutorInvitation.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { Plan } from '../models/Plan.js';
import { CreditPack } from '../models/CreditPack.js';

// BR-06: đơn chờ thanh toán hết hạn sau 15 phút (giống payment.service.js)
const ORDER_TTL_MS = 15 * 60 * 1000;

// Loại giao dịch làm giảm credit: luôn trả amount âm, các loại còn lại luôn dương
const DEBIT_TYPES = ['USED_APPLY', 'USED_INVITATION', 'EXPIRED_GRANT'];

/**
 * Điều kiện created_at theo khoảng ngày (giờ Việt Nam, lấy trọn ngày from..to)
 * @param {Object} filters - { from, to } dạng YYYY-MM-DD, có thể thiếu
 * @returns {Object|null} điều kiện Mongo cho created_at, null nếu không lọc ngày
 */
export const buildDateRange = (filters) => {
  const range = {};
  if (filters.from) {
    range.$gte = new Date(`${filters.from}T00:00:00+07:00`);
  }
  if (filters.to) {
    const endOfDay = new Date(`${filters.to}T00:00:00+07:00`);
    endOfDay.setDate(endOfDay.getDate() + 1);
    range.$lt = endOfDay;
  }
  if (Object.keys(range).length === 0) {
    return null;
  }
  return range;
};

/**
 * Chuẩn hóa dấu của amount theo loại giao dịch (dữ liệu cũ có thể lưu sai dấu)
 * @param {string} type - loại giao dịch
 * @param {number} amount - số credit đã lưu
 * @returns {number} dương với cộng, âm với trừ
 */
const normalizeAmount = (type, amount) => {
  if (DEBIT_TYPES.includes(type)) {
    return -Math.abs(amount);
  }
  return Math.abs(amount);
};

/**
 * Tìm tiêu đề yêu cầu tìm gia sư liên quan tới các giao dịch (qua ApplyRequest / TutorInvitation)
 * @param {Object[]} transactions - CreditTransaction documents
 * @returns {Promise<{ applyTitles: Map<string, string|null>, invitationTitles: Map<string, string|null> }>}
 */
const findRelatedTitles = async (transactions) => {
  const applyIds = [];
  const invitationIds = [];
  for (const transaction of transactions) {
    if (transaction.related_apply_id) {
      applyIds.push(transaction.related_apply_id);
    }
    if (transaction.related_invitation_id) {
      invitationIds.push(transaction.related_invitation_id);
    }
  }

  const applies = await ApplyRequest.find({ _id: { $in: applyIds } }).select('request_id');
  const invitations = await TutorInvitation.find({ _id: { $in: invitationIds } }).select('request_id');

  const requestIds = [];
  for (const apply of applies) {
    requestIds.push(apply.request_id);
  }
  for (const invitation of invitations) {
    requestIds.push(invitation.request_id);
  }
  const requests = await ParentRequest.find({ _id: { $in: requestIds } }).select('title');

  const requestTitles = new Map();
  for (const request of requests) {
    requestTitles.set(String(request._id), request.title);
  }

  const applyTitles = new Map();
  for (const apply of applies) {
    applyTitles.set(String(apply._id), requestTitles.get(String(apply.request_id)) || null);
  }
  const invitationTitles = new Map();
  for (const invitation of invitations) {
    invitationTitles.set(String(invitation._id), requestTitles.get(String(invitation.request_id)) || null);
  }
  return { applyTitles, invitationTitles };
};

/**
 * Lịch sử biến động credit của user, mới nhất trước (UC18 bước 2–3)
 * @param {string} userId - id user đang đăng nhập
 * @param {Object} filters - { type, from, to } (đã validate)
 * @param {number} skip - số dòng bỏ qua
 * @param {number} limit - số dòng tối đa
 * @returns {Promise<{ items: Object[], total: number }>} item: { _id, type, amount, created_at, expires_at, related }
 */
export const findCreditTransactions = async (userId, filters, skip, limit) => {
  const query = { user_id: userId };
  if (filters.type) {
    query.type = filters.type;
  }
  const dateRange = buildDateRange(filters);
  if (dateRange) {
    query.created_at = dateRange;
  }

  const transactions = await CreditTransaction.find(query).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit);
  const total = await CreditTransaction.countDocuments(query);
  const titles = await findRelatedTitles(transactions);

  const items = transactions.map((transaction) => {
    let related = null;
    if (transaction.related_apply_id) {
      const id = String(transaction.related_apply_id);
      related = { kind: 'APPLY', id: id, title: titles.applyTitles.get(id) || null };
    } else if (transaction.related_invitation_id) {
      const id = String(transaction.related_invitation_id);
      related = { kind: 'INVITATION', id: id, title: titles.invitationTitles.get(id) || null };
    }
    return {
      _id: transaction._id,
      type: transaction.type,
      amount: normalizeAmount(transaction.type, transaction.amount),
      created_at: transaction.created_at,
      expires_at: transaction.expires_at,
      related: related,
    };
  });

  return { items, total };
};

/**
 * Lịch sử thanh toán của user, mới nhất trước (UC18 bước 4). Đơn PENDING quá 15 phút được lưu thành EXPIRED trước khi lọc
 * @param {string} userId - id user đang đăng nhập
 * @param {Object} filters - { status, from, to } (đã validate)
 * @param {number} skip - số dòng bỏ qua
 * @param {number} limit - số dòng tối đa
 * @returns {Promise<{ items: Object[], total: number }>} item: { order_code, item_type, item_name, status, amount, payment_method, created_at, paid_at, has_receipt }
 */
export const findOrders = async (userId, filters, skip, limit) => {
  const expiredBefore = new Date(Date.now() - ORDER_TTL_MS);
  await PaymentOrder.updateMany(
    { user_id: userId, status: 'PENDING', created_at: { $lte: expiredBefore } },
    { status: 'EXPIRED' }
  );

  const query = { user_id: userId };
  if (filters.status) {
    query.status = filters.status;
  }
  const dateRange = buildDateRange(filters);
  if (dateRange) {
    query.created_at = dateRange;
  }

  const orders = await PaymentOrder.find(query).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit);
  const total = await PaymentOrder.countDocuments(query);

  const planIds = [];
  const packIds = [];
  for (const order of orders) {
    if (order.plan_id) {
      planIds.push(order.plan_id);
    }
    if (order.pack_id) {
      packIds.push(order.pack_id);
    }
  }
  const plans = await Plan.find({ _id: { $in: planIds } }).select('name');
  const packs = await CreditPack.find({ _id: { $in: packIds } }).select('name');
  const itemNames = new Map();
  for (const item of plans.concat(packs)) {
    itemNames.set(String(item._id), item.name);
  }

  const items = orders.map((order) => {
    let itemId = order.pack_id;
    if (order.item_type === 'PLAN_UPGRADE') {
      itemId = order.plan_id;
    }
    return {
      order_code: order.order_code,
      item_type: order.item_type,
      item_name: itemNames.get(String(itemId)) || null,
      status: order.status,
      amount: Number(order.amount),
      payment_method: order.payment_method,
      created_at: order.created_at,
      paid_at: order.paid_at,
      has_receipt: order.status === 'SUCCESS' && Boolean(order.receipt),
    };
  });

  return { items, total };
};
