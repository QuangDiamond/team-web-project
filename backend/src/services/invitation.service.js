import mongoose from 'mongoose';
import { TutorInvitation } from '../models/TutorInvitation.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { TutorPost } from '../models/TutorPost.js';
import { Notification } from '../models/Notification.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { maskContact } from '../common/utils/contactMask.js';
import { buildPagination } from '../common/utils/pagination.js';
import { decimalToNumber, isRequestAvailable } from '../common/utils/requestRules.js';
import { CREDIT_USAGE_TYPES, spendCredits } from './credit.service.js';
import { mapConversationIds, openDirectConversation } from './conversation.service.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';

const { TutorInvitationsStatus } = ENUMS;

/**
 * Chuyển lời mời sang dữ liệu trả về cho phụ huynh
 * @param {Object} invitation - TutorInvitation (lean)
 * @param {Object|null} request - ParentRequest (lean)
 * @param {Object|null} tutor - { profile, fullName }
 * @returns {Object}
 */
export const toInvitationDto = (invitation, request, tutor, conversationId = null) => {
  let requestDto = null;
  if (request) {
    requestDto = { _id: String(request._id), title: request.title, subject_name: request.subject_name };
  }
  let tutorDto = null;
  if (tutor) {
    tutorDto = {
      profile_id: String(tutor.profile._id),
      full_name: tutor.fullName,
      headline: tutor.profile.headline || null,
    };
  }
  return {
    _id: String(invitation._id),
    status: invitation.status,
    message: invitation.message,
    credits_spent: invitation.credits_spent ?? 1,
    created_at: invitation.created_at,
    conversation_id: conversationId,
    request: requestDto,
    tutor: tutorDto,
  };
};

const loadTutors = async (tutorProfileIds) => {
  const profiles = await TutorProfile.find({ _id: { $in: tutorProfileIds } }).lean();
  const users = await User.find({ _id: { $in: profiles.map((profile) => profile.user_id) } })
    .select('full_name')
    .lean();
  const nameByUserId = new Map(users.map((user) => [String(user._id), user.full_name]));

  const tutors = new Map();
  for (const profile of profiles) {
    tutors.set(String(profile._id), { profile: profile, fullName: nameByUserId.get(String(profile.user_id)) || null });
  }
  return tutors;
};

/**
 * Phụ huynh mời gia sư vào một request của mình: trừ `credits` credit (1-10) của phụ huynh,
 * không hoàn lại dù gia sư từ chối hoặc phụ huynh hủy lời mời.
 * Dùng nhiều credit hơn thì lời mời được xếp lên đầu danh sách của gia sư
 * @param {Object} user - req.user { id, role }
 * @param {Object} data - { request_id, tutor_profile_id, message, credits }
 * @returns {Promise<{ invitation: Object, remaining_credits: number }>}
 */
export const createInvitation = async (user, { request_id, tutor_profile_id, message, credits }) => {
  assertRole(user, ENUMS.UserRole.PARENT);

  const request = await ParentRequest.findOne({ _id: request_id, parent_user_id: user.id }).lean();
  if (!request) {
    throw new AppError('Tutoring request not found', 404);
  }
  if (!isRequestAvailable(request)) {
    throw new AppError('You can only invite tutors to an open request', 409);
  }

  const tutors = await loadTutors([tutor_profile_id]);
  const tutor = tutors.get(String(tutor_profile_id));
  if (!tutor) {
    throw new AppError('Tutor not found', 404);
  }
  const tutorUser = await User.findById(tutor.profile.user_id).select('account_status').lean();
  if (!tutorUser || tutorUser.account_status !== ENUMS.UserAccountStatus.ACTIVE) {
    throw new AppError('Tutor not found', 404);
  }

  const existing = await TutorInvitation.findOne({ request_id: request._id, tutor_profile_id: tutor.profile._id }).lean();
  if (existing) {
    throw new AppError('You have already invited this tutor to this request', 409);
  }

  // Tạo lời mời trước: unique index {request_id, tutor_profile_id} chặn mời trùng kể cả khi bấm đồng thời
  let invitation;
  try {
    invitation = await TutorInvitation.create({
      parent_user_id: user.id,
      tutor_profile_id: tutor.profile._id,
      request_id: request._id,
      message: message,
      credits_spent: credits,
      status: TutorInvitationsStatus.PENDING,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('You have already invited this tutor to this request', 409);
    }
    throw error;
  }

  let remainingCredits;
  try {
    remainingCredits = await spendCredits(user.id, credits, {
      type: CREDIT_USAGE_TYPES.INVITATION,
      relatedInvitationId: invitation._id,
    });
  } catch (error) {
    // Không đủ credit hoặc lỗi ghi lịch sử: bỏ lời mời vừa tạo
    await TutorInvitation.deleteOne({ _id: invitation._id });
    throw error;
  }

  return { invitation: toInvitationDto(invitation.toObject(), request, tutor), remaining_credits: remainingCredits };
};

/**
 * Các lời mời phụ huynh đã gửi, mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { status?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listMyInvitations = async (user, { status, page, limit }) => {
  assertRole(user, ENUMS.UserRole.PARENT);

  const filter = { parent_user_id: user.id };
  if (status) {
    filter.status = status;
  }
  const [invitations, total] = await Promise.all([
    TutorInvitation.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TutorInvitation.countDocuments(filter),
  ]);

  const requests = await ParentRequest.find({ _id: { $in: invitations.map((invitation) => invitation.request_id) } })
    .select('title subject_name')
    .lean();
  const requestById = new Map(requests.map((request) => [String(request._id), request]));
  const tutors = await loadTutors(invitations.map((invitation) => invitation.tutor_profile_id));

  // Lời mời đã được gia sư Accept có hội thoại 1-1: trả conversation_id để phụ huynh mở chat
  const conversationIds = await mapConversationIds(
    { parent_user_id: user.id },
    invitations.map((invitation) => invitation.request_id)
  );

  const items = invitations.map((invitation) => {
    let conversationId = null;
    if (invitation.status === TutorInvitationsStatus.ACCEPTED) {
      conversationId = conversationIds.get(`${invitation.tutor_profile_id}|${invitation.request_id}`) || null;
    }
    return toInvitationDto(
      invitation,
      requestById.get(String(invitation.request_id)) || null,
      tutors.get(String(invitation.tutor_profile_id)) || null,
      conversationId
    );
  });
  return { items: items, pagination: buildPagination(page, limit, total) };
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Chuyển một gia sư sang dữ liệu trả về cho phụ huynh xem trước khi mời. Không có email, số điện thoại
 * @param {Object} profile - TutorProfile (lean)
 * @param {Object} tutorUser - { full_name, avatar_url } của tài khoản gia sư
 * @param {Object} postSummary - { subjects: string[], minPrice: number|null } từ các bài đăng PUBLISHED
 * @returns {Object}
 */
export const toInvitableTutorDto = (profile, tutorUser, postSummary) => {
  return {
    profile_id: String(profile._id),
    full_name: maskContact(tutorUser.full_name),
    avatar_url: tutorUser.avatar_url || profile.avatar_url || null,
    headline: maskContact(profile.headline),
    average_rating: profile.average_rating ?? null,
    availability_status: profile.availability_status ?? null,
    subjects: postSummary.subjects.map((subject) => maskContact(subject)),
    teaching_categories: (profile.teaching_categories || []).map((item) => ({
      type: item.type,
      category_id: String(item.category_id),
      name: maskContact(item.name),
    })),
    min_price: postSummary.minPrice,
  };
};

/**
 * Danh sách gia sư đang hoạt động (tài khoản ACTIVE, hồ sơ đã hoàn thiện) để phụ huynh xem và mời. Rating cao trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { q?, page, limit } (q: tìm theo tên)
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listInvitableTutors = async (user, { q, page, limit }) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  return searchPublicTutors({ q, page, limit });
};

/**
 * Search complete active tutor profiles using public fields and published posts.
 * @param {Object} query - Validated search filters and pagination.
 * @returns {Promise<{items: Object[], pagination: Object}>} Public tutor cards.
 */
export const searchPublicTutors = async ({ q, page, limit, subject, grade, area, mode, availability, min_rating, min_price, max_price }) => {
  const postFilter = { status: ENUMS.TutorPostsStatus.PUBLISHED };
  if (subject) postFilter.subject_name = new RegExp(`^${escapeRegex(subject)}$`, 'i');
  if (grade) postFilter.grade_level = new RegExp(`^${escapeRegex(grade)}$`, 'i');
  if (mode) postFilter.teaching_mode = mode;
  if (min_price !== undefined || max_price !== undefined) {
    postFilter.price = {};
    if (min_price !== undefined) postFilter.price.$gte = min_price;
    if (max_price !== undefined) postFilter.price.$lte = max_price;
  }
  const hasPostFilters = Boolean(subject || grade || mode || min_price !== undefined || max_price !== undefined);

  const userFilter = { role: ENUMS.UserRole.TUTOR, account_status: ENUMS.UserAccountStatus.ACTIVE };
  const tutorUsers = await User.find(userFilter).select('full_name avatar_url').lean();
  const userById = new Map(tutorUsers.map((tutorUser) => [String(tutorUser._id), tutorUser]));

  const profileFilter = { user_id: { $in: tutorUsers.map((tutorUser) => tutorUser._id) }, is_complete: true };
  if (hasPostFilters) {
    profileFilter._id = { $in: await TutorPost.distinct('profile_id', postFilter) };
  }
  if (availability) profileFilter.availability_status = availability;
  if (min_rating !== undefined) profileFilter.average_rating = { $gte: min_rating };
  if (area) {
    profileFilter.is_address_hidden = { $ne: true };
    profileFilter.address = new RegExp(escapeRegex(area), 'i');
  }
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    const matchingPosts = await TutorPost.distinct('profile_id', {
      status: ENUMS.TutorPostsStatus.PUBLISHED,
      $or: [{ subject_name: pattern }, { title: pattern }],
    });
    profileFilter.$or = [
      { user_id: { $in: tutorUsers.filter((item) => pattern.test(item.full_name)).map((item) => item._id) } },
      { headline: pattern },
      { _id: { $in: matchingPosts } },
    ];
  }
  const [profiles, total] = await Promise.all([
    TutorProfile.find(profileFilter)
      .sort({ average_rating: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TutorProfile.countDocuments(profileFilter),
  ]);

  // Môn dạy và giá thấp nhất lấy từ các bài đăng đang PUBLISHED của từng gia sư
  const posts = await TutorPost.find({
    ...postFilter,
    profile_id: { $in: profiles.map((profile) => profile._id) },
    status: ENUMS.TutorPostsStatus.PUBLISHED,
  })
    .select('profile_id subject_name price')
    .lean();
  const summaryByProfileId = new Map();
  for (const post of posts) {
    const key = String(post.profile_id);
    if (!summaryByProfileId.has(key)) {
      summaryByProfileId.set(key, { subjects: [], minPrice: null });
    }
    const summary = summaryByProfileId.get(key);
    if (post.subject_name && !summary.subjects.includes(post.subject_name)) {
      summary.subjects.push(post.subject_name);
    }
    const price = decimalToNumber(post.price);
    if (price !== null && (summary.minPrice === null || price < summary.minPrice)) {
      summary.minPrice = price;
    }
  }

  const items = profiles.map((profile) => {
    const tutorUser = userById.get(String(profile.user_id));
    const postSummary = summaryByProfileId.get(String(profile._id)) || { subjects: [], minPrice: null };
    return toInvitableTutorDto(profile, tutorUser, postSummary);
  });
  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Hủy lời mời đang chờ (PENDING → CANCELLED). Credit không được hoàn lại
 * @param {Object} user - req.user { id, role }
 * @param {string} invitationId
 * @returns {Promise<Object>} lời mời sau khi hủy
 */
export const cancelInvitation = async (user, invitationId) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  if (!mongoose.isValidObjectId(invitationId)) {
    throw new AppError('Invitation not found', 404);
  }

  const invitation = await TutorInvitation.findOne({ _id: invitationId, parent_user_id: user.id }).lean();
  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }
  if (invitation.status !== TutorInvitationsStatus.PENDING) {
    throw new AppError(`Only pending invitations can be cancelled (status: ${invitation.status})`, 409);
  }

  // Điều kiện status trong filter để hai lần hủy đồng thời không ghi đè nhau
  const updated = await TutorInvitation.findOneAndUpdate(
    { _id: invitationId, parent_user_id: user.id, status: TutorInvitationsStatus.PENDING },
    { $set: { status: TutorInvitationsStatus.CANCELLED } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Only pending invitations can be cancelled', 409);
  }

  const request = await ParentRequest.findById(updated.request_id).select('title subject_name').lean();
  const tutors = await loadTutors([updated.tutor_profile_id]);
  return toInvitationDto(updated, request, tutors.get(String(updated.tutor_profile_id)) || null);
};

/**
 * Chuyển lời mời sang dữ liệu cho gia sư xem: có nội dung request nhưng KHÔNG có thông tin phụ huynh
 * @param {Object} invitation - TutorInvitation (lean)
 * @param {Object|null} request - ParentRequest (lean)
 * @param {string|null} conversationId
 * @returns {Object}
 */
export const toReceivedInvitationDto = (invitation, request, conversationId) => {
  let requestDto = null;
  if (request) {
    requestDto = {
      _id: String(request._id),
      title: request.title,
      subject_name: request.subject_name,
      grade_level: request.grade_level,
      teaching_mode: request.teaching_mode,
      budget: decimalToNumber(request.budget),
      schedule: request.schedule,
      description: request.description,
      tutor_requirements: request.tutor_requirements,
      location_address: request.location_address,
      is_available: isRequestAvailable(request),
    };
  }
  return {
    _id: String(invitation._id),
    parent_user_id: invitation.parent_user_id ? String(invitation.parent_user_id) : null,
    status: invitation.status,
    message: invitation.message,
    credits_spent: invitation.credits_spent ?? 1,
    created_at: invitation.created_at,
    conversation_id: conversationId,
    request: requestDto,
  };
};

/**
 * Lời mời gia sư đã nhận (không gồm lời mời phụ huynh đã hủy), mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { status?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listReceivedInvitations = async (user, { status, page, limit }) => {
  const profile = await getTutorProfileOrThrow(user);

  // Lời mời phụ huynh đã hủy thì gia sư không được thấy, kể cả khi lọc thẳng theo CANCELLED
  if (status === TutorInvitationsStatus.CANCELLED) {
    return { items: [], pagination: buildPagination(page, limit, 0) };
  }

  const filter = { tutor_profile_id: profile._id, status: { $ne: TutorInvitationsStatus.CANCELLED } };
  if (status) {
    filter.status = status;
  }
  const [invitations, total] = await Promise.all([
    TutorInvitation.aggregate([
      { $match: filter },
      { $addFields: { priority_credits: { $ifNull: ['$credits_spent', 1] } } },
      { $sort: { priority_credits: -1, created_at: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
    TutorInvitation.countDocuments(filter),
  ]);

  const requestIds = invitations.map((invitation) => invitation.request_id);
  const requests = await ParentRequest.find({ _id: { $in: requestIds } }).lean();
  const requestById = new Map(requests.map((request) => [String(request._id), request]));
  const conversationIds = await mapConversationIds({ tutor_profile_id: profile._id }, requestIds);

  const items = invitations.map((invitation) => {
    let conversationId = null;
    if (invitation.status === TutorInvitationsStatus.ACCEPTED) {
      conversationId = conversationIds.get(`${profile._id}|${invitation.request_id}`) || null;
    }
    return toReceivedInvitationDto(invitation, requestById.get(String(invitation.request_id)) || null, conversationId);
  });
  return { items: items, pagination: buildPagination(page, limit, total) };
};

const getInvitationOfTutor = async (user, invitationId) => {
  const profile = await getTutorProfileOrThrow(user);
  if (!mongoose.isValidObjectId(invitationId)) {
    throw new AppError('Invitation not found', 404);
  }
  const invitation = await TutorInvitation.findOne({ _id: invitationId, tutor_profile_id: profile._id }).lean();
  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }
  // UC15 E1: phụ huynh đã hủy lời mời trong lúc gia sư đang xem
  if (invitation.status === TutorInvitationsStatus.CANCELLED) {
    throw new AppError('This invitation is no longer available', 404);
  }
  return { invitation: invitation, profile: profile };
};

/**
 * Gia sư Accept lời mời đang chờ: lời mời → ACCEPTED và mở hội thoại 1-1 với phụ huynh. Request vẫn OPEN.
 * Credit của phụ huynh không hoàn lại.
 * @param {Object} user - req.user { id, role }
 * @param {string} invitationId
 * @returns {Promise<Object>} lời mời sau khi Accept (kèm conversation_id)
 */
export const acceptInvitation = async (user, invitationId) => {
  const { invitation, profile } = await getInvitationOfTutor(user, invitationId);

  if (invitation.status !== TutorInvitationsStatus.PENDING) {
    throw new AppError(`Only pending invitations can be accepted (status: ${invitation.status})`, 409);
  }
  const request = await ParentRequest.findById(invitation.request_id).lean();
  if (!request || !isRequestAvailable(request)) {
    throw new AppError('This request is no longer open', 409);
  }

  // Điều kiện status trong filter: hai lần Accept đồng thời chỉ một lần thắng
  const updated = await TutorInvitation.findOneAndUpdate(
    { _id: invitation._id, status: TutorInvitationsStatus.PENDING },
    { $set: { status: TutorInvitationsStatus.ACCEPTED } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Only pending invitations can be accepted', 409);
  }

  let conversation;
  try {
    conversation = await openDirectConversation({
      parentUserId: invitation.parent_user_id,
      tutorProfileId: profile._id,
      requestId: request._id,
    });
  } catch (error) {
    // Không mở được hội thoại thì trả lời mời về PENDING để gia sư thử lại
    await TutorInvitation.updateOne({ _id: invitation._id }, { $set: { status: TutorInvitationsStatus.PENDING } });
    throw error;
  }

  // UC15 POST-1: Thông báo cho phụ huynh khi gia sư chọn Continue (Accept) lời mời
  if (invitation.parent_user_id) {
    await Notification.create({
      recipient_user_id: invitation.parent_user_id,
      category: ENUMS.NotificationsCategory.INVITATION,
      title: 'Gia sư đã đồng ý lời mời dạy kèm của bạn!',
      body: `Gia sư đã phản hồi đồng ý trao đổi cho yêu cầu "${request.title || request.subject_name}". Phòng trò chuyện 1-1 đã được mở.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: invitation.parent_user_id,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: new Date(),
        },
      ],
    });
  }

  return toReceivedInvitationDto(updated, request, String(conversation._id));
};

/**
 * Gia sư Decline lời mời đang chờ: lời mời → DECLINED. Credit của phụ huynh không hoàn lại
 * @param {Object} user - req.user { id, role }
 * @param {string} invitationId
 * @returns {Promise<Object>} lời mời sau khi Decline
 */
export const declineInvitation = async (user, invitationId) => {
  const { invitation } = await getInvitationOfTutor(user, invitationId);

  if (invitation.status !== TutorInvitationsStatus.PENDING) {
    throw new AppError(`Only pending invitations can be declined (status: ${invitation.status})`, 409);
  }
  const updated = await TutorInvitation.findOneAndUpdate(
    { _id: invitation._id, status: TutorInvitationsStatus.PENDING },
    { $set: { status: TutorInvitationsStatus.DECLINED } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Only pending invitations can be declined', 409);
  }

  const request = await ParentRequest.findById(updated.request_id).lean();
  return toReceivedInvitationDto(updated, request, null);
};
