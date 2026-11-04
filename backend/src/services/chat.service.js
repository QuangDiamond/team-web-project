import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';

const { UserRole } = ENUMS;
const DIRECT = ENUMS.ConversationsType.DIRECT;

/**
 * Chỉ phụ huynh và gia sư mới có chat 1-1
 * @param {Object} user - req.user { id, role }
 * @returns {void}
 */
const assertChatRole = (user) => {
  if (user.role !== UserRole.PARENT && user.role !== UserRole.TUTOR) {
    throw new AppError('Only parent and tutor accounts can use chat', 403);
  }
};

/**
 * Điều kiện Mongo cho các hội thoại 1-1 đang mở của người dùng. null nếu gia sư chưa có hồ sơ (chưa có hội thoại nào)
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object|null>}
 */
const buildOwnConversationFilter = async (user) => {
  const filter = { type: DIRECT, is_active: true };
  if (user.role === UserRole.PARENT) {
    filter.parent_user_id = user.id;
    return filter;
  }
  const profile = await TutorProfile.findOne({ user_id: user.id }).select('_id').lean();
  if (!profile) {
    return null;
  }
  filter.tutor_profile_id = profile._id;
  return filter;
};

/**
 * Lấy hội thoại và kiểm tra người dùng là một trong hai bên; người ngoài cuộc nhận 404 như hội thoại không tồn tại
 * @param {Object} user - req.user { id, role }
 * @param {string} conversationId
 * @returns {Promise<Object>} hội thoại (lean)
 */
const getConversationOfUser = async (user, conversationId) => {
  assertChatRole(user);
  if (!mongoose.isValidObjectId(conversationId)) {
    throw new AppError('Conversation not found', 404);
  }

  const conversation = await Conversation.findOne({ _id: conversationId, type: DIRECT }).lean();
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (String(conversation.parent_user_id) === user.id) {
    return conversation;
  }
  const profile = await TutorProfile.findById(conversation.tutor_profile_id).select('user_id').lean();
  if (profile && String(profile.user_id) === user.id) {
    return conversation;
  }
  throw new AppError('Conversation not found', 404);
};

/**
 * Số tin chưa đọc: tin của người kia gửi sau lần đọc gần nhất (read_at) của người dùng
 * @param {Object} conversation - hội thoại (lean)
 * @param {string} userId
 * @returns {Promise<number>}
 */
const countUnread = async (conversation, userId) => {
  const filter = { conversation_id: conversation._id, sender_user_id: { $ne: userId } };
  const readState = (conversation.read_states || []).find((state) => String(state.user_id) === userId);
  if (readState && readState.read_at) {
    filter.created_at = { $gt: readState.read_at };
  }
  return Message.countDocuments(filter);
};

/**
 * Tóm tắt hội thoại cho danh sách: người đối diện, request liên quan, tin nhắn cuối, số tin chưa đọc
 * @param {Object} user - req.user { id, role }
 * @param {Object[]} conversations - hội thoại (lean)
 * @returns {Promise<Object[]>}
 */
const buildSummaries = async (user, conversations) => {
  const requestIds = conversations.map((conversation) => conversation.request_id).filter(Boolean);
  const requests = await ParentRequest.find({ _id: { $in: requestIds } }).select('title').lean();
  const requestById = new Map(requests.map((request) => [String(request._id), request]));

  // Người đối diện: phụ huynh thấy gia sư, gia sư thấy phụ huynh (chỉ tên, không có email / SĐT)
  const otherByConversation = new Map();
  if (user.role === UserRole.PARENT) {
    const profiles = await TutorProfile.find({ _id: { $in: conversations.map((c) => c.tutor_profile_id) } }).lean();
    const users = await User.find({ _id: { $in: profiles.map((profile) => profile.user_id) } })
      .select('full_name avatar_url')
      .lean();
    const userById = new Map(users.map((account) => [String(account._id), account]));
    const profileById = new Map(profiles.map((profile) => [String(profile._id), profile]));
    for (const conversation of conversations) {
      const profile = profileById.get(String(conversation.tutor_profile_id));
      const account = profile ? userById.get(String(profile.user_id)) : null;
      otherByConversation.set(String(conversation._id), {
        name: account ? account.full_name : 'Tutor',
        role: UserRole.TUTOR,
        headline: profile ? profile.headline || null : null,
        avatar_url: profile && profile.avatar_url ? profile.avatar_url : account ? account.avatar_url || null : null,
      });
    }
  } else {
    const parents = await User.find({ _id: { $in: conversations.map((c) => c.parent_user_id) } })
      .select('full_name avatar_url')
      .lean();
    const parentById = new Map(parents.map((account) => [String(account._id), account]));
    for (const conversation of conversations) {
      const parent = parentById.get(String(conversation.parent_user_id));
      otherByConversation.set(String(conversation._id), {
        name: parent ? parent.full_name : 'Parent',
        role: UserRole.PARENT,
        headline: null,
        avatar_url: parent ? parent.avatar_url || null : null,
      });
    }
  }

  return Promise.all(
    conversations.map(async (conversation) => {
      const lastMessage = await Message.findOne({ conversation_id: conversation._id })
        .sort({ created_at: -1, _id: -1 })
        .lean();
      const unreadCount = await countUnread(conversation, user.id);
      const request = requestById.get(String(conversation.request_id));

      let lastMessageDto = null;
      if (lastMessage) {
        lastMessageDto = {
          content: lastMessage.content,
          message_type: lastMessage.message_type,
          sender_is_me: String(lastMessage.sender_user_id) === user.id,
          created_at: lastMessage.created_at,
        };
      }
      return {
        _id: String(conversation._id),
        request: request ? { _id: String(request._id), title: request.title } : null,
        other: otherByConversation.get(String(conversation._id)),
        last_message: lastMessageDto,
        unread_count: unreadCount,
        updated_at: conversation.updated_at,
      };
    })
  );
};

/**
 * Chuyển tin nhắn sang dữ liệu trả về
 * @param {Object} message - Message (lean hoặc document)
 * @param {string} userId - người đang xem
 * @returns {Object}
 */
export const toMessageDto = (message, userId) => {
  const raw = typeof message.toObject === 'function' ? message.toObject() : message;
  return {
    _id: String(raw._id),
    content: raw.content,
    message_type: raw.message_type,
    sender_is_me: String(raw.sender_user_id) === userId,
    created_at: raw.created_at,
  };
};

/**
 * Danh sách hội thoại 1-1 đang mở của người dùng, có tin mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listConversations = async (user, { page, limit }) => {
  assertChatRole(user);

  const filter = await buildOwnConversationFilter(user);
  if (!filter) {
    return { items: [], pagination: buildPagination(page, limit, 0) };
  }
  const [conversations, total] = await Promise.all([
    Conversation.find(filter)
      .sort({ updated_at: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Conversation.countDocuments(filter),
  ]);
  const items = await buildSummaries(user, conversations);
  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Tóm tắt một hội thoại (dùng cho phần đầu khung chat khi mở thẳng bằng đường dẫn)
 * @param {Object} user - req.user { id, role }
 * @param {string} conversationId
 * @returns {Promise<Object>}
 */
export const getConversation = async (user, conversationId) => {
  const conversation = await getConversationOfUser(user, conversationId);
  const [summary] = await buildSummaries(user, [conversation]);
  return { ...summary, is_active: conversation.is_active === true };
};

/**
 * Tin nhắn của một hội thoại, MỚI NHẤT TRƯỚC (trang 1 là các tin mới nhất)
 * @param {Object} user - req.user { id, role }
 * @param {string} conversationId
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listMessages = async (user, conversationId, { page, limit }) => {
  const conversation = await getConversationOfUser(user, conversationId);

  const filter = { conversation_id: conversation._id };
  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Message.countDocuments(filter),
  ]);
  return {
    items: messages.map((message) => toMessageDto(message, user.id)),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Đánh dấu đã đọc đến tin mới nhất của hội thoại
 * @param {Object} user - req.user { id, role }
 * @param {string} conversationId
 * @returns {Promise<{ unread_count: number }>}
 */
export const markConversationRead = async (user, conversationId) => {
  const conversation = await getConversationOfUser(user, conversationId);

  const lastMessage = await Message.findOne({ conversation_id: conversation._id })
    .sort({ created_at: -1, _id: -1 })
    .select('_id')
    .lean();
  const lastReadMessageId = lastMessage ? lastMessage._id : null;
  const now = new Date();

  const updated = await Conversation.updateOne(
    { _id: conversation._id, 'read_states.user_id': user.id },
    { $set: { 'read_states.$.last_read_message_id': lastReadMessageId, 'read_states.$.read_at': now } }
  );
  if (updated.matchedCount === 0) {
    await Conversation.updateOne(
      { _id: conversation._id, 'read_states.user_id': { $ne: user.id } },
      { $push: { read_states: { user_id: user.id, last_read_message_id: lastReadMessageId, read_at: now } } }
    );
  }
  return { unread_count: 0 };
};

/**
 * Gửi tin nhắn văn bản vào hội thoại đang mở; tin vừa gửi tính là đã đọc với người gửi
 * @param {Object} user - req.user { id, role }
 * @param {string} conversationId
 * @param {string} content - nội dung đã validate
 * @returns {Promise<Object>} tin nhắn vừa gửi
 */
export const sendMessage = async (user, conversationId, content) => {
  const conversation = await getConversationOfUser(user, conversationId);
  if (conversation.is_active !== true) {
    throw new AppError('This conversation is closed', 409);
  }

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_user_id: user.id,
    message_type: ENUMS.MessagesMessageType.TEXT,
    content: content,
    attachments: [],
  });
  // Đưa hội thoại lên đầu danh sách của cả hai bên
  await Conversation.updateOne({ _id: conversation._id }, { $set: { updated_at: new Date() } });
  await markConversationRead(user, conversationId);

  return toMessageDto(message, user.id);
};
