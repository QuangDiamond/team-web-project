import { AppError } from '../common/utils/AppError.js';
import { ENUMS } from '../models/enums.js';
import * as agreementRepo from '../repositories/agreement.repository.js';

export const getConnections = async (userId) => {
  const agreements = await agreementRepo.findAllAgreements();

  return {
    connections: agreements.map((agr) => {
      const conv = agr.conversation_id || {};
      const req = conv.request_id || {};
      const parentUser = conv.parent_user_id || {};
      const tutorProfile = conv.tutor_profile_id || {};
      const tutorUser = tutorProfile.user_id || {};

      return {
        _id: agr._id,
        agreed_subject: agr.agreed_subject || req.subject_name || 'Môn học chung',
        agreed_schedule: agr.agreed_schedule || req.schedule || 'Thỏa thuận linh hoạt',
        agreed_price: agr.agreed_price ? Number(agr.agreed_price) : req.budget ? Number(req.budget) : 250000,
        status: agr.status,
        created_at: agr.created_at,
        updated_at: agr.updated_at,
        conversation_id: conv._id,
        proposer: {
          _id: agr.proposer_user_id?._id,
          full_name: agr.proposer_user_id?.full_name || 'Người dùng TuConnector',
          role: agr.proposer_user_id?.role,
        },
        accepted_by: {
          _id: agr.accepted_by_user_id?._id,
          full_name: agr.accepted_by_user_id?.full_name || 'Chưa xác nhận',
          role: agr.accepted_by_user_id?.role,
        },
        parent: {
          _id: parentUser._id,
          full_name: parentUser.full_name || 'Phụ huynh học sinh',
          avatar_url: parentUser.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          email: parentUser.email,
          phone: parentUser.phone,
        },
        tutor: {
          _id: tutorProfile._id,
          user_id: tutorUser._id,
          full_name: tutorUser.full_name || 'Gia sư TuConnector',
          avatar_url: tutorProfile.avatar_url || tutorUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          headline: tutorProfile.headline || 'Gia sư chuyên môn cao',
          email: tutorUser.email,
        },
        request: {
          _id: req._id,
          title: req.title || 'Yêu cầu tìm gia sư',
          status: req.status,
          grade_level: req.grade_level,
        },
        canRate: agr.status === 'CONFIRMED',
        canCreateClassroom: agr.status === 'CONFIRMED',
      };
    }),
  };
};

export const proposeAgreement = async ({
  conversationId,
  proposerUserId,
  agreedSubject,
  agreedSchedule,
  agreedPrice,
}) => {
  const conversation = await agreementRepo.findActiveConversationById(conversationId);
  if (!conversation) {
    throw new AppError('Không tìm thấy phòng trò chuyện 1-1.', 404);
  }

  // Tiền điều kiện PRE-1: Phải có phòng chat đang hoạt động
  if (!conversation.is_active) {
    throw new AppError('Phòng chat phải đang ở trạng thái hoạt động để có thể đề xuất xác nhận thỏa thuận (PRE-1).', 400);
  }

  const newAgreement = await agreementRepo.createAgreement({
    conversation_id: conversation._id,
    proposer_user_id: proposerUserId || conversation.parent_user_id?._id,
    agreed_subject: agreedSubject || conversation.request_id?.subject_name || 'Môn học',
    agreed_schedule: agreedSchedule || conversation.request_id?.schedule || 'Lịch học thỏa thuận',
    agreed_price: agreedPrice || conversation.request_id?.budget || 250000,
    status: ENUMS.TutoringAgreementsStatus.PENDING,
  });

  // Gửi thông báo đến đối tác tham gia chat
  const recipientUserId =
    proposerUserId === conversation.parent_user_id?._id?.toString()
      ? conversation.tutor_profile_id?.user_id?._id
      : conversation.parent_user_id?._id;

  if (recipientUserId) {
    await agreementRepo.createNotification({
      recipient_user_id: recipientUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: 'Đề xuất xác nhận thỏa thuận kết nối dạy học!',
      body: `Đối tác đã gửi đề xuất chốt thỏa thuận môn ${newAgreement.agreed_subject} với mức học phí ${Number(newAgreement.agreed_price).toLocaleString('vi-VN')} đ/buổi. Vui lòng xác nhận tại mục Kết nối của tôi.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
      is_read: false,
      delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
    });
  }

  return {
    success: true,
    message: 'Đã gửi đề xuất thỏa thuận kết nối thành công! Đang chờ đối tác bấm xác nhận.',
    agreement: newAgreement,
  };
};

export const confirmAgreement = async (agreementId, { action, userId }) => {
  const normalizedAction = (action || '').toUpperCase();
  if (!['CONFIRM', 'REJECT'].includes(normalizedAction)) {
    throw new AppError('Hành động không hợp lệ. Chỉ chấp nhận CONFIRM hoặc REJECT.', 400);
  }

  const agreement = await agreementRepo.findAgreementById(agreementId);
  if (!agreement) {
    throw new AppError('Không tìm thấy bản ghi thỏa thuận kết nối dạy học.', 404);
  }

  const conv = agreement.conversation_id;
  const parentUserId = conv?.parent_user_id?._id;
  const tutorUserId = conv?.tutor_profile_id?.user_id?._id;

  // Luồng A1: Từ chối thỏa thuận (Not yet / Decline)
  if (normalizedAction === 'REJECT') {
    agreement.status = ENUMS.TutoringAgreementsStatus.REJECTED;
    await agreement.save();

    // Thông báo cho người đề xuất
    if (agreement.proposer_user_id?._id) {
      await agreementRepo.createNotification({
        recipient_user_id: agreement.proposer_user_id._id,
        category: ENUMS.NotificationsCategory.CONVERSATION,
        title: 'Thỏa thuận kết nối chưa được xác nhận',
        body: `Đối tác chưa đồng ý thỏa thuận môn ${agreement.agreed_subject}. Hai bên có thể tiếp tục trao đổi thêm trong phòng chat.`,
        target_type: ENUMS.NotificationsTargetType.CONVERSATION,
        target_id: conv?._id,
        is_read: false,
        delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
      });
    }

    return {
      success: true,
      action: 'REJECT',
      message: 'Đã từ chối thỏa thuận. Kết nối vẫn giữ mở để hai bên trao đổi thêm.',
      agreement,
    };
  }

  // Luồng chính: CONFIRM (POST-1)
  agreement.status = ENUMS.TutoringAgreementsStatus.CONFIRMED;
  agreement.accepted_by_user_id = userId || parentUserId || tutorUserId;
  await agreement.save();

  // Đóng bài đăng tìm gia sư gốc (POST-1: Request is Closed)
  if (conv?.request_id?._id) {
    await agreementRepo.updateParentRequestStatus(conv.request_id._id, 'CLOSED');
  }

  // Gửi thông báo đến cả Phụ huynh và Gia sư
  if (parentUserId) {
    await agreementRepo.createNotification({
      recipient_user_id: parentUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: 'Kết nối dạy học đã được xác nhận thành công! 🎉',
      body: `Thỏa thuận dạy kèm môn ${agreement.agreed_subject} đã chính thức được cả hai bên xác nhận. Bạn có thể gửi đánh giá gia sư sau buổi học đầu tiên (UC38).`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conv?._id,
      is_read: false,
      delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
    });
  }

  if (tutorUserId) {
    await agreementRepo.createNotification({
      recipient_user_id: tutorUserId,
      category: ENUMS.NotificationsCategory.CONVERSATION,
      title: 'Thỏa thuận kết nối đã được xác nhận! 🎓',
      body: `Thỏa thuận dạy học môn ${agreement.agreed_subject} đã hoàn tất. Bạn có thể tiến hành tạo Lớp học mới (UC21) trên TuConnector để bắt đầu giảng dạy và giao bài tập.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conv?._id,
      is_read: false,
      delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
    });
  }

  return {
    success: true,
    action: 'CONFIRM',
    message: 'Thỏa thuận kết nối dạy học đã được xác nhận thành công (POST-1)! Bài yêu cầu đã được đóng và chức năng đánh giá/tạo lớp học đã được mở.',
    agreement,
    canRate: true,
    canCreateClassroom: true,
  };
};
