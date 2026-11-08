import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';

/**
 * Số dư credit hiện tại (ví chưa có coi như 0)
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const getBalance = async (userId) => {
  const user = await User.findById(userId).select('credit_wallet').lean();
  if (!user || !user.credit_wallet || typeof user.credit_wallet.balance !== 'number') {
    return 0;
  }
  return user.credit_wallet.balance;
};

/**
 * Trừ amount credit và ghi lịch sử. Trừ bằng một phép cập nhật có điều kiện (balance >= amount) nên hai request
 * chạy song song không thể làm số dư âm. DB local là standalone (không có transaction), nên nếu ghi
 * lịch sử lỗi thì hoàn lại credit rồi ném lỗi; người gọi tự xóa bản ghi nghiệp vụ vừa tạo.
 * Không có luồng nào hoàn credit (skip, decline, cancel, withdraw).
 * @param {string} userId - chủ ví (gia sư khi ứng tuyển, phụ huynh khi mời)
 * @param {number} amount - số credit trừ (số nguyên >= 1)
 * @param {Object} usage - { type: USED_APPLY | USED_INVITATION, relatedApplyId?, relatedInvitationId? }
 * @returns {Promise<number>} số dư còn lại sau khi trừ
 */
export const spendCredits = async (userId, amount, { type, relatedApplyId = null, relatedInvitationId = null }) => {
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, 'credit_wallet.balance': { $gte: amount } },
    { $inc: { 'credit_wallet.balance': -amount }, $set: { 'credit_wallet.updated_at': new Date() } },
    { new: true }
  )
    .select('credit_wallet')
    .lean();

  if (!updatedUser) {
    throw new AppError('Not enough credits', 402);
  }

  try {
    await CreditTransaction.create({
      user_id: userId,
      amount: -amount,
      type: type,
      related_apply_id: relatedApplyId,
      related_invitation_id: relatedInvitationId,
    });
  } catch (error) {
    await User.updateOne({ _id: userId }, { $inc: { 'credit_wallet.balance': amount } });
    throw error;
  }

  return updatedUser.credit_wallet.balance;
};

export const CREDIT_USAGE_TYPES = Object.freeze({
  APPLY: ENUMS.CreditTransactionsType.USED_APPLY,
  INVITATION: ENUMS.CreditTransactionsType.USED_INVITATION,
});
