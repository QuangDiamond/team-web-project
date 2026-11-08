import mongoose from 'mongoose';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { Notification } from '../models/Notification.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { buildPagination } from '../common/utils/pagination.js';
import { isRequestAvailable } from '../common/utils/requestRules.js';
import { CREDIT_USAGE_TYPES, spendCredits } from './credit.service.js';
import { getTutorProfileOrThrow, loadTutorSummaries } from './tutorContext.service.js';
import { mapConversationIds, openDirectConversation } from './conversation.service.js';

const { ApplyRequestsStatus } = ENUMS;

/**
 * Chuyển đơn ứng tuyển sang dữ liệu trả về
 * @param {Object} application - ApplyRequest (lean)
 * @param {Object|null} request - ParentRequest (lean) hoặc null nếu không còn
 * @returns {Object}
 */
export const toApplicationDto = (application, request, conversationId = null) => {
  let requestDto = null;
  if (request) {
    requestDto = {
      _id: String(request._id),
      title: request.title,
      subject_name: request.subject_name,
      status: request.status,
      is_available: isRequestAvailable(request),
    };
  }
  return {
    _id: String(application._id),
    status: application.status,
    note: application.note,
    credits_spent: application.credits_spent ?? 1,
    created_at: application.created_at,
    conversation_id: conversationId,
    request: requestDto,
  };
};

/**
 * Gia sư ứng tuyển vào request đang mở: trừ `credits` credit (1-10), không hoàn lại dù phụ huynh bỏ qua đơn.
 * Đã rút đơn thì được ứng tuyển lại request đó (đơn cũ được kích hoạt lại và trừ credit lần nữa).
 * Dùng nhiều credit hơn thì đơn được xếp lên đầu danh sách của phụ huynh
 * @param {Object} user - req.user { id, role }
 * @param {Object} data - { request_id, note, credits }
 * @returns {Promise<{ application: Object, remaining_credits: number }>}
 */
export const createApplication = async (user, { request_id, note, credits }) => {
  const profile = await getTutorProfileOrThrow(user);

  const request = await ParentRequest.findById(request_id).lean();
  if (!request || !isRequestAvailable(request)) {
    throw new AppError('Tutoring request not found', 404);
  }

  const existing = await ApplyRequest.findOne({ request_id: request._id, tutor_profile_id: profile._id }).lean();
  if (existing && existing.status !== ApplyRequestsStatus.WITHDRAWN) {
    throw new AppError('You have already applied to this request', 409);
  }

  // Tạo đơn trước (hoặc kích hoạt lại đơn đã rút): unique index {request_id, tutor_profile_id} chặn ứng tuyển trùng
  // kể cả khi bấm đồng thời. rollback đưa dữ liệu về như cũ nếu việc trừ credit thất bại
  let application;
  let rollback;
  try {
    if (existing) {
      // Điều kiện status trong filter để hai lần ứng tuyển lại đồng thời không ghi đè nhau
      application = await ApplyRequest.findOneAndUpdate(
        { _id: existing._id, status: ApplyRequestsStatus.WITHDRAWN },
        { $set: { status: ApplyRequestsStatus.PENDING, note: note, credits_spent: credits, created_at: new Date() } },
        { new: true, overwriteImmutable: true }
      );
      if (!application) {
        throw new AppError('You have already applied to this request', 409);
      }
      rollback = () =>
        ApplyRequest.updateOne(
          { _id: existing._id },
          { $set: { status: ApplyRequestsStatus.WITHDRAWN, note: existing.note, credits_spent: existing.credits_spent ?? 1, created_at: existing.created_at } },
          { overwriteImmutable: true }
        );
    } else {
      application = await ApplyRequest.create({
        request_id: request._id,
        tutor_profile_id: profile._id,
        note: note,
        credits_spent: credits,
        status: ApplyRequestsStatus.PENDING,
      });
      rollback = () => ApplyRequest.deleteOne({ _id: application._id });
    }
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('You have already applied to this request', 409);
    }
    throw error;
  }

  let remainingCredits;
  try {
    remainingCredits = await spendCredits(user.id, credits, {
      type: CREDIT_USAGE_TYPES.APPLY,
      relatedApplyId: application._id,
    });
  } catch (error) {
    // Không đủ credit hoặc lỗi ghi lịch sử: bỏ đơn vừa tạo (hoặc trả đơn đã rút về như cũ) để không có đơn "miễn phí"
    await rollback();
    throw error;
  }

  return { application: toApplicationDto(application.toObject(), request), remaining_credits: remainingCredits };
};

/**
 * Các đơn ứng tuyển của chính gia sư, mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { status?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listMyApplications = async (user, { status, page, limit }) => {
  const profile = await getTutorProfileOrThrow(user);

  const filter = { tutor_profile_id: profile._id };
  if (status) {
    filter.status = status;
  }
  const [applications, total] = await Promise.all([
    ApplyRequest.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ApplyRequest.countDocuments(filter),
  ]);

  const requests = await ParentRequest.find({ _id: { $in: applications.map((application) => application.request_id) } })
    .select('title subject_name status created_at')
    .lean();
  const requestById = new Map(requests.map((request) => [String(request._id), request]));

  // Đơn đã được phụ huynh Continue có hội thoại 1-1: trả conversation_id để gia sư mở chat
  const conversationIds = await mapConversationIds(
    { tutor_profile_id: profile._id },
    applications.map((application) => application.request_id)
  );

  const items = applications.map((application) => {
    let conversationId = null;
    if (application.status === ApplyRequestsStatus.CONTINUED) {
      conversationId = conversationIds.get(`${profile._id}|${application.request_id}`) || null;
    }
    return toApplicationDto(application, requestById.get(String(application.request_id)) || null, conversationId);
  });
  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Rút đơn đang chờ (PENDING → WITHDRAWN). Credit không được hoàn lại
 * @param {Object} user - req.user { id, role }
 * @param {string} applicationId
 * @returns {Promise<Object>} đơn sau khi rút
 */
export const withdrawApplication = async (user, applicationId) => {
  const profile = await getTutorProfileOrThrow(user);
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new AppError('Application not found', 404);
  }

  const application = await ApplyRequest.findOne({ _id: applicationId, tutor_profile_id: profile._id }).lean();
  if (!application) {
    throw new AppError('Application not found', 404);
  }
  if (application.status !== ApplyRequestsStatus.PENDING) {
    throw new AppError(`Only pending applications can be withdrawn (status: ${application.status})`, 409);
  }

  // Điều kiện status trong filter để hai lần rút đồng thời không ghi đè nhau
  const updated = await ApplyRequest.findOneAndUpdate(
    { _id: applicationId, tutor_profile_id: profile._id, status: ApplyRequestsStatus.PENDING },
    { $set: { status: ApplyRequestsStatus.WITHDRAWN } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Only pending applications can be withdrawn', 409);
  }

  const request = await ParentRequest.findById(updated.request_id).select('title subject_name status created_at').lean();
  return toApplicationDto(updated, request);
};

/**
 * Chuyển đơn ứng tuyển sang dữ liệu cho phụ huynh xem: có thông tin gia sư, không có thông tin nội bộ
 * @param {Object} application - ApplyRequest (lean)
 * @param {Object|null} tutor - kết quả loadTutorSummaries
 * @param {string|null} conversationId
 * @returns {Object}
 */
export const toReceivedApplicationDto = (application, tutor, conversationId) => {
  return {
    _id: String(application._id),
    status: application.status,
    note: application.note,
    credits_spent: application.credits_spent ?? 1,
    created_at: application.created_at,
    conversation_id: conversationId,
    tutor: tutor,
  };
};

const assertValidApplicationId = (applicationId) => {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new AppError('Application not found', 404);
  }
};

/**
 * Lấy đơn ứng tuyển thuộc request của chính phụ huynh; không phải của họ thì 404
 * @param {Object} user - req.user { id, role }
 * @param {string} applicationId
 * @returns {Promise<{ application: Object, request: Object }>}
 */
const getApplicationOfParent = async (user, applicationId) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  assertValidApplicationId(applicationId);

  const application = await ApplyRequest.findById(applicationId).lean();
  if (!application) {
    throw new AppError('Application not found', 404);
  }
  const request = await ParentRequest.findOne({ _id: application.request_id, parent_user_id: user.id }).lean();
  if (!request) {
    throw new AppError('Application not found', 404);
  }
  return { application: application, request: request };
};

/**
 * Các đơn ứng tuyển vào một request của phụ huynh (không gồm đơn đã rút), điểm cao nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ request: Object, items: Object[], pagination: Object }>}
 */
export const listApplicationsForRequest = async (user, requestId, { page, limit }) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  if (!mongoose.isValidObjectId(requestId)) {
    throw new AppError('Tutoring request not found', 404);
  }
  const request = await ParentRequest.findOne({ _id: requestId, parent_user_id: user.id }).lean();
  if (!request) {
    throw new AppError('Tutoring request not found', 404);
  }

  const filter = { request_id: request._id, status: { $ne: ApplyRequestsStatus.WITHDRAWN } };
  const [applications, total] = await Promise.all([
    ApplyRequest.aggregate([
      { $match: filter },
      { $addFields: { priority_credits: { $ifNull: ['$credits_spent', 1] } } },
      { $sort: { priority_credits: -1, created_at: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
    ApplyRequest.countDocuments(filter),
  ]);

  const tutors = await loadTutorSummaries(applications.map((application) => application.tutor_profile_id));
  const conversationIds = await mapConversationIds({ parent_user_id: user.id }, [request._id]);

  const items = applications.map((application) => {
    const tutorKey = String(application.tutor_profile_id);
    let conversationId = null;
    if (application.status === ApplyRequestsStatus.CONTINUED) {
      conversationId = conversationIds.get(`${tutorKey}|${request._id}`) || null;
    }
    return toReceivedApplicationDto(application, tutors.get(tutorKey) || null, conversationId);
  });

  return {
    request: { _id: String(request._id), title: request.title, subject_name: request.subject_name, status: request.status },
    items: items,
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Phụ huynh chọn Continue một đơn đang chờ: đơn → CONTINUED và mở hội thoại 1-1 với gia sư.
 * Request vẫn OPEN. Credit của gia sư không hoàn lại.
 * @param {Object} user - req.user { id, role }
 * @param {string} applicationId
 * @returns {Promise<Object>} đơn sau khi Continue (kèm conversation_id)
 */
export const continueApplication = async (user, applicationId) => {
  const { application, request } = await getApplicationOfParent(user, applicationId);

  if (!isRequestAvailable(request)) {
    throw new AppError('This request is no longer open', 409);
  }
  if (application.status !== ApplyRequestsStatus.PENDING) {
    throw new AppError(`Only pending applications can be continued (status: ${application.status})`, 409);
  }
  const tutors = await loadTutorSummaries([application.tutor_profile_id]);
  const tutor = tutors.get(String(application.tutor_profile_id));
  if (!tutor || !tutor.is_active) {
    throw new AppError('This tutor is no longer available', 409);
  }

  // Điều kiện status trong filter: hai lần Continue đồng thời chỉ một lần thắng
  const updated = await ApplyRequest.findOneAndUpdate(
    { _id: application._id, status: ApplyRequestsStatus.PENDING },
    { $set: { status: ApplyRequestsStatus.CONTINUED } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Only pending applications can be continued', 409);
  }

  let conversation;
  try {
    conversation = await openDirectConversation({
      parentUserId: user.id,
      tutorProfileId: application.tutor_profile_id,
      requestId: request._id,
    });
  } catch (error) {
    // Không mở được hội thoại thì trả đơn về PENDING để phụ huynh thử lại
    await ApplyRequest.updateOne({ _id: application._id }, { $set: { status: ApplyRequestsStatus.PENDING } });
    throw error;
  }

  // UC13 POST-1: Thông báo cho gia sư khi phụ huynh chọn Continue và mở hội thoại 1-1
  const tutorProfile = await TutorProfile.findById(application.tutor_profile_id).select('user_id').lean();
  if (tutorProfile && tutorProfile.user_id) {
    await Notification.create({
      recipient_user_id: tutorProfile.user_id,
      category: ENUMS.NotificationsCategory.APPLICATION,
      title: 'Phụ huynh đã chấp nhận trao đổi (Continue) đơn ứng tuyển của bạn!',
      body: `Đơn ứng tuyển cho yêu cầu "${request.title || request.subject_name}" đã được phụ huynh duyệt mở phòng trò chuyện 1-1.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: tutorProfile.user_id,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: new Date(),
        },
      ],
    });
  }

  return toReceivedApplicationDto(updated, tutor, String(conversation._id));
};

/**
 * Phụ huynh chọn Skip một đơn đang chờ: đơn → SKIPPED. Credit của gia sư không hoàn lại
 * @param {Object} user - req.user { id, role }
 * @param {string} applicationId
 * @returns {Promise<Object>} đơn sau khi Skip
 */
export const skipApplication = async (user, applicationId) => {
  const { application, request } = await getApplicationOfParent(user, applicationId);

  if (application.status !== ApplyRequestsStatus.PENDING) {
    throw new AppError(`Only pending applications can be skipped (status: ${application.status})`, 409);
  }
  const updated = await ApplyRequest.findOneAndUpdate(
    { _id: application._id, status: ApplyRequestsStatus.PENDING },
    { $set: { status: ApplyRequestsStatus.SKIPPED } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Only pending applications can be skipped', 409);
  }

  // UC13 POST-2 (A1): Thông báo cho gia sư khi đơn ứng tuyển bị bỏ qua (Skip)
  const tutorProfile = await TutorProfile.findById(updated.tutor_profile_id).select('user_id').lean();
  if (tutorProfile && tutorProfile.user_id) {
    await Notification.create({
      recipient_user_id: tutorProfile.user_id,
      category: ENUMS.NotificationsCategory.APPLICATION,
      title: 'Cập nhật trạng thái đơn ứng tuyển',
      body: `Phụ huynh đã bỏ qua (Skip) đơn ứng tuyển của bạn cho yêu cầu "${request.title || request.subject_name}".`,
      target_type: null,
      target_id: null,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: tutorProfile.user_id,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: new Date(),
        },
      ],
    });
  }

  const tutors = await loadTutorSummaries([updated.tutor_profile_id]);
  return toReceivedApplicationDto(updated, tutors.get(String(updated.tutor_profile_id)) || null, null);
};
