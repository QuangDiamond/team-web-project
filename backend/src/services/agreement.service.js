import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { ENUMS } from '../models/enums.js';
import { TutoringAgreement } from '../models/TutoringAgreement.js';
import { Conversation } from '../models/Conversation.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { Notification } from '../models/Notification.js';
import { Review } from '../models/Review.js';

const assertParentOrTutor = (user) => {
  if (!user || (user.role !== ENUMS.UserRole.PARENT && user.role !== ENUMS.UserRole.TUTOR)) {
    throw new AppError('Chỉ tài khoản Phụ huynh hoặc Gia sư mới có quyền truy cập thỏa thuận kết nối (UC16).', 403);
  }
};

const assertParticipant = (user, parentUserId, tutorUserId) => {
  const currentId = String(user?.id || '');
  const isParent = parentUserId && String(parentUserId) === currentId;
  const isTutor = tutorUserId && String(tutorUserId) === currentId;
  if (!isParent && !isTutor) {
    throw new AppError('Bạn không phải thành viên của phòng hội thoại này (BR-14).', 403);
  }
};

/**
 * Đổi trạng thái thỏa thuận chỉ khi trạng thái hiện tại nằm trong `fromStatuses`.
 * Điều kiện status nằm trong filter nên hai thao tác đồng thời (ví dụ Confirm và Cancel) chỉ một bên thắng.
 * @param {ObjectId} agreementId
 * @param {string[]} fromStatuses - các trạng thái được phép đổi
 * @param {Object} changes - các field cần $set, ví dụ { status: 'CONFIRMED', accepted_by_user_id }
 * @returns {Promise<Object>} thỏa thuận sau khi đổi (lean)
 */
const changeAgreementStatus = async (agreementId, fromStatuses, changes) => {
  const updated = await TutoringAgreement.findOneAndUpdate(
    { _id: agreementId, status: { $in: fromStatuses } },
    { $set: changes },
    { new: true }
  ).lean();
  if (!updated) {
    throw new AppError('Thỏa thuận vừa được cập nhật bởi người khác. Vui lòng tải lại để xem trạng thái mới nhất.', 409);
  }
  return updated;
};

/**
 * Lấy danh sách kết nối & thỏa thuận dạy học của người dùng hiện tại (UC16/UC18)
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<{ connections: Object[], activeConversations: Object[] }>}
 */
export const getConnections = async (user) => {
  assertParentOrTutor(user);
  let conversationFilter = {};
  if (user && user.role === ENUMS.UserRole.PARENT) {
    conversationFilter = { parent_user_id: user.id };
  } else if (user && user.role === ENUMS.UserRole.TUTOR) {
    const profile = await TutorProfile.findOne({ user_id: user.id }).select('_id').lean();
    if (profile) {
      conversationFilter = { tutor_profile_id: profile._id };
    } else {
      return { connections: [], activeConversations: [] };
    }
  }

  const userConversations = await Conversation.find({
    ...conversationFilter,
    type: ENUMS.ConversationsType.DIRECT,
  })
    .populate({ path: 'parent_user_id', select: 'full_name email phone avatar_url role' })
    .populate({
      path: 'tutor_profile_id',
      select: 'headline avatar_url average_rating user_id',
      populate: { path: 'user_id', select: 'full_name email phone avatar_url role' },
    })
    .populate({ path: 'request_id', select: 'title subject_name grade_level schedule budget status' })
    .sort({ created_at: -1 })
    .lean();

  const conversationIds = userConversations.map((c) => c._id);

  const agreementQuery =
    user && (user.role === ENUMS.UserRole.PARENT || user.role === ENUMS.UserRole.TUTOR)
      ? { conversation_id: { $in: conversationIds } }
      : {};

  const agreements = await TutoringAgreement.find(agreementQuery)
    .populate({
      path: 'conversation_id',
      populate: [
        { path: 'parent_user_id', select: 'full_name email phone avatar_url role' },
        {
          path: 'tutor_profile_id',
          select: 'headline avatar_url average_rating user_id',
          populate: { path: 'user_id', select: 'full_name email phone avatar_url role' },
        },
        { path: 'request_id', select: 'title subject_name grade_level schedule budget status' },
      ],
    })
    .populate({ path: 'proposer_user_id', select: 'full_name email role' })
    .populate({ path: 'accepted_by_user_id', select: 'full_name email role' })
    .sort({ created_at: -1 })
    .lean();

  const agreementIds = agreements.map((a) => a._id);
  const existingReviews = await Review.find({ agreement_id: { $in: agreementIds } })
    .select('agreement_id rating comment')
    .lean();
  const reviewByAgreementId = new Map(existingReviews.map((r) => [String(r.agreement_id), r]));

  const connections = agreements.map((agr) => {
    const conv = agr.conversation_id || {};
    const req = conv.request_id || {};
    const parentUser = conv.parent_user_id || {};
    const tutorProfile = conv.tutor_profile_id || {};
    const tutorUser = tutorProfile.user_id || {};
    const review = reviewByAgreementId.get(String(agr._id)) || null;

    let priceValue = 0;
    if (agr.agreed_price != null) {
      priceValue = Number(agr.agreed_price.toString());
    } else if (req.budget != null) {
      priceValue = Number(req.budget.toString());
    }

    return {
      _id: String(agr._id),
      agreed_subject: agr.agreed_subject || req.subject_name || 'Môn học chung',
      agreed_schedule: agr.agreed_schedule || req.schedule || 'Thỏa thuận linh hoạt',
      agreed_price: priceValue,
      status: agr.status,
      created_at: agr.created_at,
      updated_at: agr.updated_at,
      conversation_id: conv._id ? String(conv._id) : null,
      proposer: {
        _id: agr.proposer_user_id?._id ? String(agr.proposer_user_id._id) : null,
        full_name: agr.proposer_user_id?.full_name || 'Người dùng TuConnector',
        role: agr.proposer_user_id?.role || null,
      },
      accepted_by: agr.accepted_by_user_id
        ? {
            _id: String(agr.accepted_by_user_id._id),
            full_name: agr.accepted_by_user_id.full_name,
            role: agr.accepted_by_user_id.role,
          }
        : null,
      parent: {
        _id: parentUser._id ? String(parentUser._id) : null,
        full_name: parentUser.full_name || 'Phụ huynh học sinh',
        avatar_url: parentUser.avatar_url || null,
        email: parentUser.email || null,
        phone: parentUser.phone || null,
      },
      tutor: {
        _id: tutorProfile._id ? String(tutorProfile._id) : null,
        user_id: tutorUser._id ? String(tutorUser._id) : null,
        full_name: tutorUser.full_name || 'Gia sư TuConnector',
        avatar_url: tutorProfile.avatar_url || tutorUser.avatar_url || null,
        headline: tutorProfile.headline || 'Gia sư TuConnector',
        email: tutorUser.email || null,
      },
      request: {
        _id: req._id ? String(req._id) : null,
        title: req.title || 'Yêu cầu tìm gia sư',
        status: req.status || 'OPEN',
        grade_level: req.grade_level || '',
      },
      canRate: agr.status === ENUMS.TutoringAgreementsStatus.CONFIRMED && !review,
      hasRated: Boolean(review),
      review: review
        ? { rating: Number(review.rating), comment: review.comment }
        : null,
      canCreateClassroom: agr.status === ENUMS.TutoringAgreementsStatus.CONFIRMED,
    };
  });

  const activeConversations = userConversations
    .filter((c) => c.is_active)
    .map((c) => {
      const req = c.request_id || {};
      const parentUser = c.parent_user_id || {};
      const tutorProfile = c.tutor_profile_id || {};
      const tutorUser = tutorProfile.user_id || {};
      let defaultPrice = 250000;
      if (req.budget != null) {
        defaultPrice = Number(req.budget.toString());
      }
      return {
        _id: String(c._id),
        request_title: req.title || 'Hội thoại dạy học',
        request_id: req._id ? String(req._id) : null,
        grade_level: req.grade_level || '',
        subject_name: req.subject_name || '',
        schedule: req.schedule || '',
        budget: defaultPrice,
        parent_name: parentUser.full_name || 'Phụ huynh',
        tutor_name: tutorUser.full_name || 'Gia sư',
      };
    });

  return {
    connections,
    activeConversations,
  };
};

/**
 * Đề xuất thỏa thuận dạy học mới trên một phòng hội thoại đang mở (UC16/UC18)
 * @param {Object} user - req.user { id, role }
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const proposeAgreement = async (user, payload) => {
  assertParentOrTutor(user);

  const conversationId = payload.conversation_id || payload.conversationId;
  const agreedSubject = payload.agreed_subject || payload.agreedSubject;
  const agreedSchedule = payload.agreed_schedule || payload.agreedSchedule;
  const agreedPrice = payload.agreed_price ?? payload.agreedPrice;

  if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
    throw new AppError('Vui lòng chọn phòng trò chuyện hợp lệ để đề xuất thỏa thuận.', 400);
  }

  const conversation = await Conversation.findById(conversationId)
    .populate({ path: 'parent_user_id', select: 'full_name email' })
    .populate({
      path: 'tutor_profile_id',
      populate: { path: 'user_id', select: 'full_name email' },
    })
    .populate({ path: 'request_id' });

  if (!conversation) {
    throw new AppError('Không tìm thấy phòng trò chuyện 1-1.', 404);
  }

  const parentUserId = conversation.parent_user_id?._id;
  const tutorUserId = conversation.tutor_profile_id?.user_id?._id;
  assertParticipant(user, parentUserId, tutorUserId);

  if (!conversation.is_active) {
    throw new AppError('Phòng chat phải đang ở trạng thái hoạt động để có thể đề xuất xác nhận thỏa thuận (PRE-1).', 400);
  }

  // UC16 Exception E1: Request already closed
  if (conversation.request_id && conversation.request_id.status === ENUMS.ParentRequestsStatus.CLOSED) {
    throw new AppError('Yêu cầu tìm gia sư này đã đóng (E1). Không thể tạo thỏa thuận mới.', 409);
  }

  const priceNum = Number(agreedPrice || conversation.request_id?.budget || 250000);
  const newAgreement = await TutoringAgreement.create({
    conversation_id: conversation._id,
    proposer_user_id: user.id,
    agreed_subject: agreedSubject || conversation.request_id?.subject_name || 'Môn học',
    agreed_schedule: agreedSchedule || conversation.request_id?.schedule || 'Lịch học thỏa thuận',
    agreed_price: mongoose.Types.Decimal128.fromString(String(priceNum)),
    status: ENUMS.TutoringAgreementsStatus.PENDING,
  });

  const recipientUserId =
    String(user.id) === String(parentUserId) ? tutorUserId : parentUserId;

  if (recipientUserId) {
    await Notification.create({
      recipient_user_id: recipientUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: 'Đề xuất xác nhận thỏa thuận kết nối dạy học!',
      body: `Đối tác đã gửi đề xuất chốt thỏa thuận môn ${newAgreement.agreed_subject} với mức học phí ${priceNum.toLocaleString('vi-VN')} đ/buổi. Vui lòng xác nhận tại mục Hợp đồng (Contracts).`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
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
  }

  return {
    success: true,
    message: 'Đã gửi đề xuất thỏa thuận kết nối thành công! Đang chờ đối tác bấm xác nhận.',
    agreement: newAgreement,
  };
};

/**
 * Xác nhận (CONFIRM) hoặc Từ chối (REJECT) thỏa thuận kết nối dạy học (UC16/UC18)
 * @param {Object} user - req.user { id, role }
 * @param {string} agreementId
 * @param {Object} payload - { action }
 * @returns {Promise<Object>}
 */
export const confirmAgreement = async (user, agreementId, { action }) => {
  assertParentOrTutor(user);

  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Không tìm thấy bản ghi thỏa thuận kết nối dạy học.', 404);
  }

  const agreement = await TutoringAgreement.findById(agreementId)
    .populate({
      path: 'conversation_id',
      populate: [
        { path: 'parent_user_id', select: 'full_name email phone avatar_url' },
        {
          path: 'tutor_profile_id',
          populate: { path: 'user_id', select: 'full_name email phone avatar_url' },
        },
        { path: 'request_id' },
      ],
    })
    .populate({ path: 'proposer_user_id', select: 'full_name email role' });

  if (!agreement) {
    throw new AppError('Không tìm thấy bản ghi thỏa thuận kết nối dạy học.', 404);
  }

  const conv = agreement.conversation_id;
  const parentUserId = conv?.parent_user_id?._id;
  const tutorUserId = conv?.tutor_profile_id?.user_id?._id;
  assertParticipant(user, parentUserId, tutorUserId);

  const proposerId = String(agreement.proposer_user_id?._id || agreement.proposer_user_id || '');
  const currentUserId = String(user.id);

  // UC16 Alternative Flow A3: Cancel proposal (Only the proposer can cancel a PENDING/DRAFT proposal)
  if (action === 'CANCEL') {
    if (
      agreement.status !== ENUMS.TutoringAgreementsStatus.PENDING &&
      agreement.status !== ENUMS.TutoringAgreementsStatus.DRAFT
    ) {
      throw new AppError(`Chỉ có thể hủy đề xuất đang ở trạng thái PENDING hoặc DRAFT (hiện tại: ${agreement.status}).`, 409);
    }
    if (proposerId !== currentUserId) {
      throw new AppError('Chỉ người tạo đề xuất mới có quyền hủy bỏ đề xuất thỏa thuận này (UC16 A3).', 403);
    }
    const cancelledAgreement = await changeAgreementStatus(
      agreement._id,
      [ENUMS.TutoringAgreementsStatus.PENDING, ENUMS.TutoringAgreementsStatus.DRAFT],
      { status: ENUMS.TutoringAgreementsStatus.CANCELLED }
    );

    return {
      success: true,
      action: 'CANCEL',
      message: 'Đã hủy đề xuất thỏa thuận thành công (UC16 A3).',
      agreement: cancelledAgreement,
    };
  }

  if (agreement.status !== ENUMS.TutoringAgreementsStatus.PENDING) {
    throw new AppError(`Chỉ có thể phản hồi thỏa thuận đang ở trạng thái PENDING (hiện tại: ${agreement.status}).`, 409);
  }

  // SDS 3.7: Only the other side can CONFIRM or REJECT
  if (proposerId === currentUserId) {
    throw new AppError(
      'Người đề xuất không thể tự xác nhận hoặc từ chối đề xuất của chính mình. Chỉ đối tác mới có quyền phản hồi.',
      403
    );
  }

  if (action === 'REJECT') {
    const rejectedAgreement = await changeAgreementStatus(
      agreement._id,
      [ENUMS.TutoringAgreementsStatus.PENDING],
      { status: ENUMS.TutoringAgreementsStatus.REJECTED }
    );

    if (agreement.proposer_user_id?._id) {
      await Notification.create({
        recipient_user_id: agreement.proposer_user_id._id,
        category: ENUMS.NotificationsCategory.CONVERSATION,
        title: 'Thỏa thuận kết nối chưa được xác nhận',
        body: `Đối tác chưa đồng ý thỏa thuận môn ${agreement.agreed_subject}. Hai bên có thể tiếp tục trao đổi thêm trong phòng chat.`,
        target_type: ENUMS.NotificationsTargetType.CONVERSATION,
        target_id: conv?._id || null,
        is_read: false,
        delivery_logs: [
          {
            recipient_user_id: agreement.proposer_user_id._id,
            channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
            status: ENUMS.NotificationDeliveryLogsStatus.SENT,
            dispatched_at: new Date(),
          },
        ],
      });
    }

    return {
      success: true,
      action: 'REJECT',
      message: 'Đã từ chối thỏa thuận. Kết nối vẫn giữ mở để hai bên trao đổi thêm.',
      agreement: rejectedAgreement,
    };
  }

  // UC16 E1: request đã đóng (ví dụ một thỏa thuận khác vừa được xác nhận) thì không cho xác nhận nữa
  const request = conv?.request_id;
  if (request && request.status === ENUMS.ParentRequestsStatus.CLOSED) {
    throw new AppError('Yêu cầu tìm gia sư này đã đóng (E1). Không thể xác nhận thỏa thuận.', 409);
  }

  const confirmedAgreement = await changeAgreementStatus(
    agreement._id,
    [ENUMS.TutoringAgreementsStatus.PENDING],
    { status: ENUMS.TutoringAgreementsStatus.CONFIRMED, accepted_by_user_id: user.id }
  );

  // UC16 Step 4 & SDS 3.7 Queries 05-07: Đóng bài yêu cầu và đóng tự động các thỏa thuận đang mở khác của cùng yêu cầu
  if (request && request._id) {
    const requestId = request._id;
    // Chỉ đóng khi request chưa CLOSED: hai thỏa thuận của cùng request được xác nhận đồng thời thì chỉ một bên thắng
    const closedRequest = await ParentRequest.findOneAndUpdate(
      { _id: requestId, status: { $ne: ENUMS.ParentRequestsStatus.CLOSED } },
      { $set: { status: ENUMS.ParentRequestsStatus.CLOSED } },
      { new: true }
    ).lean();
    if (!closedRequest) {
      // Trả thỏa thuận về PENDING vì request đã bị đóng bởi thỏa thuận khác
      await TutoringAgreement.updateOne(
        { _id: agreement._id },
        { $set: { status: ENUMS.TutoringAgreementsStatus.PENDING, accepted_by_user_id: null } }
      );
      throw new AppError('Yêu cầu tìm gia sư này đã đóng (E1). Không thể xác nhận thỏa thuận.', 409);
    }

    const relatedConversationIds = await Conversation.find({ request_id: requestId }).distinct('_id');
    const otherOpenAgreements = await TutoringAgreement.find({
      conversation_id: { $in: relatedConversationIds },
      _id: { $ne: agreement._id },
      status: { $in: [ENUMS.TutoringAgreementsStatus.DRAFT, ENUMS.TutoringAgreementsStatus.PENDING] },
    }).lean();

    if (otherOpenAgreements.length > 0) {
      const bulkOps = otherOpenAgreements.map((other) => {
        const isProposedByParent =
          parentUserId && String(other.proposer_user_id) === String(parentUserId);
        const closedStatus = isProposedByParent
          ? ENUMS.TutoringAgreementsStatus.CANCELLED
          : ENUMS.TutoringAgreementsStatus.REJECTED;
        return {
          updateOne: {
            filter: { _id: other._id },
            update: { $set: { status: closedStatus } },
          },
        };
      });
      await TutoringAgreement.bulkWrite(bulkOps);
    }
  }

  const now = new Date();
  if (parentUserId) {
    await Notification.create({
      recipient_user_id: parentUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: 'Kết nối dạy học đã được xác nhận thành công!',
      body: `Thỏa thuận dạy kèm môn ${agreement.agreed_subject} đã chính thức được cả hai bên xác nhận. Bạn có thể gửi đánh giá gia sư sau buổi học đầu tiên.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conv?._id || null,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: parentUserId,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: now,
        },
      ],
    });
  }

  if (tutorUserId) {
    await Notification.create({
      recipient_user_id: tutorUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: 'Thỏa thuận kết nối đã được xác nhận!',
      body: `Thỏa thuận dạy học môn ${agreement.agreed_subject} đã hoàn tất.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conv?._id || null,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: tutorUserId,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: now,
        },
      ],
    });
  }

  return {
    success: true,
    action: 'CONFIRM',
    message: 'Thỏa thuận kết nối dạy học đã được xác nhận thành công (POST-1)! Bài yêu cầu đã được đóng.',
    agreement: confirmedAgreement,
    canRate: true,
    canCreateClassroom: true,
  };
};

/**
 * Phụ huynh gửi đánh giá gia sư sau khi thỏa thuận đã CONFIRMED
 * @param {Object} user - req.user { id, role }
 * @param {string} agreementId
 * @param {Object} payload - { rating, knowledge_rating, punctuality_rating, communication_rating, comment }
 * @returns {Promise<Object>}
 */
export const rateTutor = async (user, agreementId, payload) => {
  assertRole(user, ENUMS.UserRole.PARENT);

  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Không tìm thấy thỏa thuận kết nối.', 404);
  }

  const agreement = await TutoringAgreement.findById(agreementId).populate({
    path: 'conversation_id',
  });

  if (!agreement || agreement.status !== ENUMS.TutoringAgreementsStatus.CONFIRMED) {
    throw new AppError('Chỉ có thể đánh giá gia sư cho các thỏa thuận đã được xác nhận (CONFIRMED).', 400);
  }

  const parentUserId = agreement.conversation_id?.parent_user_id;
  if (parentUserId && String(parentUserId) !== String(user.id)) {
    throw new AppError('Chỉ phụ huynh sở hữu thỏa thuận này mới có quyền đánh giá gia sư (BR-07).', 403);
  }

  const existing = await Review.findOne({ agreement_id: agreement._id }).lean();
  if (existing) {
    throw new AppError('Thỏa thuận này đã được đánh giá trước đó.', 409);
  }

  const tutorProfileId = agreement.conversation_id?.tutor_profile_id;
  const reviewParentId = parentUserId || user.id;

  const review = await Review.create({
    tutor_profile_id: tutorProfileId,
    agreement_id: agreement._id,
    parent_user_id: reviewParentId,
    rating: payload.rating,
    knowledge_rating: payload.knowledge_rating ?? payload.rating,
    punctuality_rating: payload.punctuality_rating ?? payload.rating,
    communication_rating: payload.communication_rating ?? payload.rating,
    comment: payload.comment || null,
    status: ENUMS.ReviewsStatus.APPROVED,
  });

  // Cập nhật lại average_rating của TutorProfile
  if (tutorProfileId) {
    const allReviews = await Review.find({
      tutor_profile_id: tutorProfileId,
      status: ENUMS.ReviewsStatus.APPROVED,
    })
      .select('rating')
      .lean();
    if (allReviews.length > 0) {
      const avg =
        allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / allReviews.length;
      await TutorProfile.findByIdAndUpdate(tutorProfileId, {
        average_rating: Math.round(avg * 100) / 100,
      });
    }
  }

  return {
    success: true,
    message: 'Cảm ơn bạn đã gửi đánh giá chất lượng giảng dạy của gia sư!',
    review,
  };
};
