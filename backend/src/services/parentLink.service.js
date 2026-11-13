import mongoose from 'mongoose';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';

// Liên kết phụ huynh – học sinh độc lập với lớp học: phụ huynh mời bằng email, học sinh xác nhận (PARENT_CHILD_LINKS).
// Sau khi ACCEPTED, phụ huynh theo dõi mọi lớp con tham gia (UC35) mà không cần tham gia lớp.

const { ParentChildLinksStatus, UserRole } = ENUMS;
const MAX_PENDING_INVITES = 20;
const REINVITE_COOLDOWN_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const USER_FIELDS = 'full_name email avatar_url';

/**
 * Quyết định cách xử lý khi phụ huynh mời một học sinh, dựa vào liên kết đã có giữa hai bên
 * @param {Object|null} existingLink - ParentChildLink hiện có hoặc null
 * @param {Date} now
 * @returns {{ action: 'CREATE'|'REOPEN'|'REJECT', message?: string }}
 * CREATE: chưa có liên kết; REOPEN: học sinh từng từ chối đã quá thời gian chờ nên mời lại; REJECT: không cho mời, kèm lý do
 */
export const decideInvite = (existingLink, now = new Date()) => {
  if (!existingLink) {
    return { action: 'CREATE' };
  }
  if (existingLink.status === ParentChildLinksStatus.ACCEPTED) {
    return { action: 'REJECT', message: 'You are already linked with this student' };
  }
  if (existingLink.status === ParentChildLinksStatus.PENDING) {
    return { action: 'REJECT', message: 'An invitation to this student is already waiting for confirmation' };
  }

  // DECLINED: chỉ cho mời lại sau thời gian chờ để học sinh không bị làm phiền liên tục
  const declinedAt = new Date(existingLink.updated_at || existingLink.created_at || 0).getTime();
  if (now.getTime() - declinedAt < REINVITE_COOLDOWN_DAYS * DAY_IN_MS) {
    return { action: 'REJECT', message: `This student declined recently. You can invite again after ${REINVITE_COOLDOWN_DAYS} days` };
  }
  return { action: 'REOPEN' };
};

/**
 * Chuyển một liên kết sang dữ liệu trả về, kèm thông tin bên còn lại (không có mật khẩu hay dữ liệu nhạy cảm)
 * @param {Object} link - ParentChildLink (lean)
 * @param {Object|null} otherUser - { _id, full_name, email, avatar_url }
 * @param {'PARENT'|'STUDENT'} viewerRole - vai trò người đang xem
 * @returns {Object}
 */
export const toParentLinkDto = (link, otherUser, viewerRole) => {
  let otherDto = null;
  if (otherUser) {
    otherDto = {
      _id: String(otherUser._id),
      full_name: otherUser.full_name,
      email: otherUser.email,
      avatar_url: otherUser.avatar_url || null,
    };
  }
  const dto = {
    _id: String(link._id),
    status: link.status,
    created_at: link.created_at,
    updated_at: link.updated_at,
  };
  // Người xem là phụ huynh thì bên kia là học sinh, và ngược lại
  if (viewerRole === UserRole.PARENT) {
    dto.student = otherDto;
  } else {
    dto.parent = otherDto;
  }
  return dto;
};

// Thông báo trong ứng dụng; lỗi thông báo không làm hỏng thao tác chính
const notifyUser = async (recipientUserId, title, body) => {
  try {
    await Notification.create({
      recipient_user_id: recipientUserId,
      category: ENUMS.NotificationsCategory.SYSTEM,
      title: title,
      body: body,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: recipientUserId,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: new Date(),
        },
      ],
    });
  } catch {
    console.error('Parent link notification failed');
  }
};

/**
 * Phụ huynh mời học sinh liên kết bằng email. Không cho biết email có tồn tại hay không (tránh dò tài khoản):
 * email không phải tài khoản học sinh đang hoạt động thì vẫn trả thành công nhưng không tạo lời mời
 * @param {Object} user - req.user { id, role }
 * @param {{ student_email: string }} data
 * @returns {Promise<void>}
 */
export const inviteStudent = async (user, { student_email }) => {
  if (user.role !== UserRole.PARENT) {
    throw new AppError('Only parent accounts can invite a student', 403);
  }

  const student = await User.findOne({
    email: student_email,
    role: UserRole.STUDENT,
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  })
    .select('_id')
    .lean();
  if (!student) {
    return;
  }

  const existingLink = await ParentChildLink.findOne({ parent_user_id: user.id, student_user_id: student._id }).lean();
  const decision = decideInvite(existingLink);
  if (decision.action === 'REJECT') {
    throw new AppError(decision.message, 409);
  }

  const pendingCount = await ParentChildLink.countDocuments({
    parent_user_id: user.id,
    status: ParentChildLinksStatus.PENDING,
  });
  if (pendingCount >= MAX_PENDING_INVITES) {
    throw new AppError('You have too many invitations waiting for confirmation', 409);
  }

  if (decision.action === 'REOPEN') {
    // Điều kiện status trong filter để hai lần mời đồng thời không ghi đè nhau
    const reopened = await ParentChildLink.findOneAndUpdate(
      { _id: existingLink._id, status: ParentChildLinksStatus.DECLINED },
      { $set: { status: ParentChildLinksStatus.PENDING } },
      { new: true }
    );
    if (!reopened) {
      throw new AppError('An invitation to this student is already waiting for confirmation', 409);
    }
  } else {
    try {
      await ParentChildLink.create({
        parent_user_id: user.id,
        student_user_id: student._id,
        status: ParentChildLinksStatus.PENDING,
      });
    } catch (error) {
      // Unique index {parent, student} chặn mời trùng kể cả khi bấm đồng thời
      if (error.code === 11000) {
        throw new AppError('An invitation to this student is already waiting for confirmation', 409);
      }
      throw error;
    }
  }

  const parent = await User.findById(user.id).select('full_name email').lean();
  await notifyUser(
    student._id,
    'Lời mời liên kết từ phụ huynh',
    `${parent.full_name || parent.email} muốn liên kết với tài khoản của bạn để theo dõi tiến độ học tập. Vào mục "Liên kết phụ huynh" để xác nhận hoặc từ chối.`
  );
};

/**
 * Danh sách liên kết của chính người dùng: phụ huynh thấy học sinh đã mời / đã liên kết,
 * học sinh thấy phụ huynh đã mời mình / đã liên kết. Mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { status?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listMyLinks = async (user, { status, page, limit }) => {
  let ownKey = 'parent_user_id';
  let otherKey = 'student_user_id';
  if (user.role === UserRole.STUDENT) {
    ownKey = 'student_user_id';
    otherKey = 'parent_user_id';
  }

  const filter = { [ownKey]: user.id };
  if (status) {
    filter.status = status;
  }
  const [links, total] = await Promise.all([
    ParentChildLink.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ParentChildLink.countDocuments(filter),
  ]);

  const others = await User.find({ _id: { $in: links.map((link) => link[otherKey]) } })
    .select(USER_FIELDS)
    .lean();
  const otherById = new Map(others.map((other) => [String(other._id), other]));

  const items = links.map((link) => toParentLinkDto(link, otherById.get(String(link[otherKey])) || null, user.role));
  return { items: items, pagination: buildPagination(page, limit, total) };
};

const assertValidLinkId = (linkId) => {
  if (!mongoose.isValidObjectId(linkId)) {
    throw new AppError('Link not found', 404);
  }
};

/**
 * Học sinh chấp nhận hoặc từ chối lời mời đang chờ. Chỉ lời mời của chính học sinh, chỉ khi còn PENDING
 * @param {Object} user - req.user { id, role }
 * @param {string} linkId
 * @param {{ action: 'ACCEPT'|'DECLINE' }} data
 * @returns {Promise<Object>} liên kết sau khi phản hồi
 */
export const respondToLink = async (user, linkId, { action }) => {
  if (user.role !== UserRole.STUDENT) {
    throw new AppError('Only student accounts can respond to a link invitation', 403);
  }
  assertValidLinkId(linkId);

  const link = await ParentChildLink.findOne({ _id: linkId, student_user_id: user.id }).lean();
  if (!link) {
    throw new AppError('Link not found', 404);
  }
  if (link.status !== ParentChildLinksStatus.PENDING) {
    throw new AppError('This invitation is no longer waiting for a response', 409);
  }

  let newStatus = ParentChildLinksStatus.DECLINED;
  if (action === 'ACCEPT') {
    newStatus = ParentChildLinksStatus.ACCEPTED;
  }
  const updated = await ParentChildLink.findOneAndUpdate(
    { _id: link._id, student_user_id: user.id, status: ParentChildLinksStatus.PENDING },
    { $set: { status: newStatus } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('This invitation is no longer waiting for a response', 409);
  }

  const student = await User.findById(user.id).select('full_name email').lean();
  let verb = 'từ chối';
  if (action === 'ACCEPT') {
    verb = 'chấp nhận';
  }
  await notifyUser(updated.parent_user_id, 'Phản hồi liên kết học sinh', `${student.full_name || student.email} đã ${verb} lời mời liên kết của bạn.`);

  const parent = await User.findById(updated.parent_user_id).select(USER_FIELDS).lean();
  return toParentLinkDto(updated, parent, UserRole.STUDENT);
};

/**
 * Xóa liên kết. Phụ huynh hủy lời mời đang chờ hoặc hủy liên kết đã có; học sinh chỉ hủy liên kết đã có
 * (lời mời đang chờ thì từ chối). Liên kết đã bị từ chối không xóa được để giữ thời gian chờ mời lại
 * @param {Object} user - req.user { id, role }
 * @param {string} linkId
 * @returns {Promise<{ _id: string }>}
 */
export const removeLink = async (user, linkId) => {
  assertValidLinkId(linkId);

  let ownKey = 'parent_user_id';
  if (user.role === UserRole.STUDENT) {
    ownKey = 'student_user_id';
  }
  const link = await ParentChildLink.findOne({ _id: linkId, [ownKey]: user.id }).lean();
  if (!link) {
    throw new AppError('Link not found', 404);
  }

  const isParent = user.role === UserRole.PARENT;
  const canRemovePending = isParent && link.status === ParentChildLinksStatus.PENDING;
  const canRemoveAccepted = link.status === ParentChildLinksStatus.ACCEPTED;
  if (!canRemovePending && !canRemoveAccepted) {
    throw new AppError('This link cannot be removed in its current state', 409);
  }

  const result = await ParentChildLink.deleteOne({ _id: link._id, status: link.status });
  if (result.deletedCount === 0) {
    throw new AppError('This link cannot be removed in its current state', 409);
  }
  return { _id: String(link._id) };
};
