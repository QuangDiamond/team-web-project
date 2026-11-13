import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ClassMember } from '../models/ClassMember.js';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { ENUMS } from '../models/enums.js';

// Thông báo tin nhắn 1-1 dùng chung category/target_type CONVERSATION với thông báo thỏa thuận,
// nên được nhận diện bằng tiền tố tiêu đề cố định này.
export const DIRECT_MESSAGE_TITLE_PREFIX = 'Tin nhắn mới từ ';
const MESSAGE_PREVIEW_LENGTH = 120;

/**
 * Kiểm tra thông báo có phải thông báo tin nhắn 1-1 không
 * @param {Object} notification
 * @returns {boolean}
 */
const isDirectMessageNotification = (notification) => {
  if (notification.target_type !== ENUMS.NotificationsTargetType.CONVERSATION) {
    return false;
  }
  if (typeof notification.title !== 'string') {
    return false;
  }
  return notification.title.startsWith(DIRECT_MESSAGE_TITLE_PREFIX);
};

const buildDeepLink = (notification, role) => {
  const normalizedRole = (role || 'PARENT').toUpperCase();
  const base = `/${normalizedRole.toLowerCase()}`;

  if (isDirectMessageNotification(notification) && notification.target_id) {
    return `${base}/messages/${notification.target_id}`;
  }

  if (notification.category === 'APPLICATION') {
    return normalizedRole === 'TUTOR' ? '/tutor/applications' : '/parent/applications';
  }
  if (notification.category === 'INVITATION') {
    return normalizedRole === 'TUTOR' ? '/tutor/invitations' : '/parent/invitations';
  }
  if (notification.category === 'CONVERSATION') {
    if (normalizedRole === 'TUTOR') return '/tutor/contracts';
    if (normalizedRole === 'PARENT') return '/parent/contracts';
    return `${base}/dashboard`;
  }
  if (notification.category === 'SYSTEM' && normalizedRole === 'ADMIN') {
    return '/admin/moderation';
  }
  return `${base}/dashboard`;
};

/**
 * Lấy danh sách thông báo của người dùng hiện tại theo bộ lọc (UC33/UC35)
 * @param {Object} user - req.user { id, role }
 * @param {Object} filter - { category?, is_read? }
 * @returns {Promise<{ unreadCount: number, notifications: Object[] }>}
 */
export const getNotifications = async (user, filter = {}) => {
  const query = { recipient_user_id: user.id };
  if (filter.category && filter.category !== 'ALL') {
    query.category = filter.category;
  }
  if (filter.is_read !== undefined) {
    query.is_read = filter.is_read;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ created_at: -1 }).limit(50).lean(),
    Notification.countDocuments({ recipient_user_id: user.id, is_read: false }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map((n) => ({
      _id: String(n._id),
      category: n.category,
      title: n.title,
      body: n.body,
      target_type: n.target_type,
      target_id: n.target_id ? String(n.target_id) : null,
      is_read: Boolean(n.is_read),
      read_at: n.read_at,
      created_at: n.created_at,
      delivery_logs: n.delivery_logs || [],
      deepLink: buildDeepLink(n, user.role),
    })),
  };
};

/**
 * Đếm số lượng thông báo chưa đọc của người dùng hiện tại
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<{ unreadCount: number }>}
 */
export const getUnreadCount = async (user) => {
  const unreadCount = await Notification.countDocuments({
    recipient_user_id: user.id,
    is_read: false,
  });
  return { unreadCount };
};

/**
 * Đánh dấu một thông báo là đã đọc
 * @param {Object} user - req.user { id, role }
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
export const markAsRead = async (user, notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError('Không tìm thấy thông báo.', 404);
  }
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient_user_id: user.id },
    { $set: { is_read: true, read_at: new Date() } },
    { new: true }
  ).lean();

  if (!updated) {
    throw new AppError('Không tìm thấy thông báo.', 404);
  }
  return updated;
};

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>}
 */
export const markAllAsRead = async (user) => {
  const result = await Notification.updateMany(
    { recipient_user_id: user.id, is_read: false },
    { $set: { is_read: true, read_at: new Date() } }
  );
  return {
    success: true,
    modifiedCount: result.modifiedCount,
    message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
  };
};

/**
 * Xóa một thông báo của người dùng
 * @param {Object} user - req.user { id, role }
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
export const deleteNotification = async (user, notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError('Không tìm thấy thông báo để xóa.', 404);
  }
  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient_user_id: user.id,
  });
  if (!deleted) {
    throw new AppError('Không tìm thấy thông báo để xóa.', 404);
  }
  return {
    success: true,
    message: 'Đã xóa thông báo thành công.',
  };
};

/**
 * Lấy cấu hình nhận thông báo (UC33 Alternative Flow A1)
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>}
 */
export const getPreferences = async (user) => {
  const foundUser = await User.findById(user.id).select('notification_preferences').lean();
  if (!foundUser) {
    throw new AppError('Không tìm thấy người dùng.', 404);
  }
  const prefs = foundUser.notification_preferences || {};
  return {
    enable_in_app: prefs.enable_in_app ?? true,
    enable_email: prefs.enable_email ?? true,
    enable_sms: prefs.enable_sms ?? false,
    notify_on_sessions: prefs.notify_on_sessions ?? true,
    notify_on_assignments: prefs.notify_on_assignments ?? true,
    notify_on_messages: prefs.notify_on_messages ?? true,
  };
};

/**
 * Cập nhật cấu hình nhận thông báo (UC33 Alternative Flow A1 / SDS 7.3)
 * @param {Object} user - req.user { id, role }
 * @param {Object} payload - { enable_in_app?, enable_email?, enable_sms?, notify_on_sessions?, notify_on_assignments?, notify_on_messages? }
 * @returns {Promise<Object>}
 */
export const updatePreferences = async (user, payload) => {
  const current = await getPreferences(user);
  const nextPrefs = {
    enable_in_app: payload.enable_in_app ?? current.enable_in_app,
    enable_email: payload.enable_email ?? current.enable_email,
    enable_sms: payload.enable_sms ?? current.enable_sms,
    notify_on_sessions: payload.notify_on_sessions ?? current.notify_on_sessions,
    notify_on_assignments: payload.notify_on_assignments ?? current.notify_on_assignments,
    notify_on_messages: payload.notify_on_messages ?? current.notify_on_messages,
    updated_at: new Date(),
  };

  await User.updateOne(
    { _id: user.id },
    { $set: { notification_preferences: nextPrefs } }
  );

  return nextPrefs;
};

/**
 * Lọc danh sách người nhận theo cấu hình thông báo (UC33 A1): bỏ người tắt in-app hoặc tắt loại thông báo này
 * @param {Array<string|Object>} recipientIds - danh sách user id
 * @param {string|null} preferenceKey - 'notify_on_messages' | 'notify_on_sessions' | 'notify_on_assignments' | null
 * @returns {Promise<string[]>} user id (string) được phép nhận
 */
const filterRecipientsByPreferences = async (recipientIds, preferenceKey) => {
  if (recipientIds.length === 0) {
    return [];
  }
  const users = await User.find({ _id: { $in: recipientIds } })
    .select('notification_preferences')
    .lean();

  const allowedIds = [];
  for (const recipient of users) {
    const prefs = recipient.notification_preferences || {};
    if (prefs.enable_in_app === false) {
      continue;
    }
    if (preferenceKey && prefs[preferenceKey] === false) {
      continue;
    }
    allowedIds.push(String(recipient._id));
  }
  return allowedIds;
};

/**
 * Rút gọn nội dung tin nhắn để hiển thị trong thông báo
 * @param {string} content
 * @returns {string}
 */
const buildMessagePreview = (content) => {
  const text = (content || '').trim();
  if (text.length <= MESSAGE_PREVIEW_LENGTH) {
    return text;
  }
  return `${text.substring(0, MESSAGE_PREVIEW_LENGTH)}...`;
};

/**
 * Báo cho bên còn lại của hội thoại 1-1 khi có tin nhắn mới.
 * Mỗi hội thoại chỉ giữ 1 thông báo tin nhắn chưa đọc (thay bằng tin mới nhất) để không spam chuông.
 * Lỗi được ghi log, không làm hỏng việc gửi tin.
 * @param {Object} params - { conversation (lean, có parent_user_id, tutor_profile_id), senderUser: { id, role }, content }
 * @returns {Promise<void>}
 */
export const notifyNewDirectMessage = async ({ conversation, senderUser, content }) => {
  try {
    let recipientUserId = null;
    if (senderUser.role === ENUMS.UserRole.PARENT) {
      const tutorProfile = await TutorProfile.findById(conversation.tutor_profile_id).select('user_id').lean();
      if (tutorProfile) {
        recipientUserId = tutorProfile.user_id;
      }
    } else {
      recipientUserId = conversation.parent_user_id;
    }
    if (!recipientUserId || String(recipientUserId) === String(senderUser.id)) {
      return;
    }

    const allowedIds = await filterRecipientsByPreferences([recipientUserId], 'notify_on_messages');
    if (allowedIds.length === 0) {
      return;
    }

    const sender = await User.findById(senderUser.id).select('full_name').lean();
    let senderName = 'người dùng';
    if (sender && sender.full_name) {
      senderName = sender.full_name;
    }

    await Notification.deleteMany({
      recipient_user_id: recipientUserId,
      is_read: false,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
      title: { $regex: `^${DIRECT_MESSAGE_TITLE_PREFIX}` },
    });

    await Notification.create({
      recipient_user_id: recipientUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: `${DIRECT_MESSAGE_TITLE_PREFIX}${senderName}`,
      body: buildMessagePreview(content),
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
      is_read: false,
    });
  } catch (error) {
    console.warn('[Notification] Không thể tạo thông báo tin nhắn mới:', error.message);
  }
};

/**
 * Khi người dùng mở hội thoại, các thông báo tin nhắn của hội thoại đó coi như đã đọc
 * @param {string} userId
 * @param {string|Object} conversationId
 * @returns {Promise<void>}
 */
export const markDirectMessageNotificationsRead = async (userId, conversationId) => {
  try {
    await Notification.updateMany(
      {
        recipient_user_id: userId,
        is_read: false,
        target_type: ENUMS.NotificationsTargetType.CONVERSATION,
        target_id: conversationId,
        title: { $regex: `^${DIRECT_MESSAGE_TITLE_PREFIX}` },
      },
      { $set: { is_read: true, read_at: new Date() } }
    );
  } catch (error) {
    console.warn('[Notification] Không thể đánh dấu đã đọc thông báo tin nhắn:', error.message);
  }
};

/**
 * Tìm phụ huynh (liên kết ACCEPTED) của các học sinh đang học trong lớp, gom tên con theo từng phụ huynh
 * @param {string|Object} classId
 * @returns {Promise<Map<string, string[]>>} parentUserId -> danh sách tên con trong lớp
 */
const findParentsOfClassStudents = async (classId) => {
  const members = await ClassMember.find({
    class_id: classId,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .select('user_id')
    .lean();
  const memberUserIds = members.map((member) => member.user_id).filter(Boolean);

  const students = await User.find({ _id: { $in: memberUserIds }, role: ENUMS.UserRole.STUDENT })
    .select('full_name')
    .lean();
  const studentNameById = new Map();
  for (const student of students) {
    studentNameById.set(String(student._id), student.full_name || 'Con của bạn');
  }
  if (studentNameById.size === 0) {
    return new Map();
  }

  const links = await ParentChildLink.find({
    student_user_id: { $in: Array.from(studentNameById.keys()) },
    status: ENUMS.ParentChildLinksStatus.ACCEPTED,
  })
    .select('parent_user_id student_user_id')
    .lean();

  const childNamesByParent = new Map();
  for (const link of links) {
    const parentId = String(link.parent_user_id);
    if (!childNamesByParent.has(parentId)) {
      childNamesByParent.set(parentId, []);
    }
    childNamesByParent.get(parentId).push(studentNameById.get(String(link.student_user_id)));
  }
  return childNamesByParent;
};

/**
 * Báo cho phụ huynh khi gia sư cập nhật việc học của con trong lớp (bài tập, lịch học, thông báo lớp).
 * Phụ huynh đã là thành viên lớp (đã nhận thông báo thành viên) được bỏ qua bằng excludeUserIds.
 * Lỗi được ghi log, không làm hỏng thao tác chính của gia sư.
 * @param {Object} params - { classId, category, targetType, targetId, preferenceKey, excludeUserIds?, buildContent(childNames) => { title, body } }
 * @returns {Promise<number>} số thông báo đã tạo
 */
export const notifyParentsOfClassStudents = async ({
  classId,
  category,
  targetType,
  targetId,
  preferenceKey,
  excludeUserIds = [],
  buildContent,
}) => {
  try {
    const childNamesByParent = await findParentsOfClassStudents(classId);
    const excluded = new Set(excludeUserIds.map((id) => String(id)));
    const candidateIds = Array.from(childNamesByParent.keys()).filter((parentId) => !excluded.has(parentId));

    const allowedIds = await filterRecipientsByPreferences(candidateIds, preferenceKey);
    if (allowedIds.length === 0) {
      return 0;
    }

    const notifications = allowedIds.map((parentId) => {
      const content = buildContent(childNamesByParent.get(parentId));
      return {
        recipient_user_id: parentId,
        category: category,
        title: content.title,
        body: content.body,
        target_type: targetType,
        target_id: targetId,
        is_read: false,
      };
    });
    await Notification.insertMany(notifications);
    return notifications.length;
  } catch (error) {
    console.warn('[Notification] Không thể gửi thông báo cho phụ huynh:', error.message);
    return 0;
  }
};
