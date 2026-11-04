import { Conversation } from '../models/Conversation.js';
import { ENUMS } from '../models/enums.js';

/**
 * Mở hội thoại 1-1 giữa phụ huynh và gia sư cho một request (sau khi Continue một đơn hoặc Accept một lời mời).
 * Idempotent: đã có hội thoại cho đúng bộ ba này (ví dụ gia sư vừa ứng tuyển vừa được mời) thì dùng lại,
 * và bật lại is_active nếu trước đó bị tắt. Chưa có chức năng nhắn tin, chỉ tạo bản ghi.
 * @param {Object} data - { parentUserId, tutorProfileId, requestId }
 * @returns {Promise<Object>} hội thoại (lean)
 */
export const openDirectConversation = async ({ parentUserId, tutorProfileId, requestId }) => {
  const filter = {
    type: ENUMS.ConversationsType.DIRECT,
    parent_user_id: parentUserId,
    tutor_profile_id: tutorProfileId,
    request_id: requestId,
  };

  const existing = await Conversation.findOne(filter);
  if (existing) {
    if (existing.is_active !== true) {
      existing.is_active = true;
      await existing.save();
    }
    return existing.toObject();
  }

  const created = await Conversation.create({ ...filter, is_active: true, read_states: [] });
  return created.toObject();
};

/**
 * Tìm hội thoại 1-1 theo request, trả về map "tutor_profile_id|request_id" -> conversation id
 * @param {Object} filter - điều kiện lọc thêm, ví dụ { parent_user_id } hoặc { tutor_profile_id }
 * @param {Array} requestIds
 * @returns {Promise<Map<string, string>>}
 */
export const mapConversationIds = async (filter, requestIds) => {
  const conversations = await Conversation.find({
    ...filter,
    type: ENUMS.ConversationsType.DIRECT,
    request_id: { $in: requestIds },
  })
    .select('tutor_profile_id request_id')
    .lean();

  const conversationIds = new Map();
  for (const conversation of conversations) {
    conversationIds.set(`${conversation.tutor_profile_id}|${conversation.request_id}`, String(conversation._id));
  }
  return conversationIds;
};
