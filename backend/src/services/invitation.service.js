import { AppError } from '../common/utils/AppError.js';
import { ENUMS } from '../models/enums.js';
import * as invRepo from '../repositories/invitation.repository.js';

export const getInvitations = async (tutorProfileId) => {
  const invitations = await invRepo.findInvitationsByTutorProfileId(tutorProfileId);

  return {
    invitations: invitations.map((inv) => ({
      _id: inv._id,
      message: inv.message,
      status: inv.status,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      parent: {
        _id: inv.parent_user_id?._id,
        full_name: inv.parent_user_id?.full_name || 'Phụ huynh học sinh',
        email: inv.parent_user_id?.email,
        phone: inv.parent_user_id?.phone,
        avatar_url: inv.parent_user_id?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      },
      request: inv.request_id
        ? {
            _id: inv.request_id._id,
            title: inv.request_id.title,
            subject_name: inv.request_id.subject_name,
            grade_level: inv.request_id.grade_level,
            teaching_mode: inv.request_id.teaching_mode,
            budget: inv.request_id.budget,
            schedule: inv.request_id.schedule,
            description: inv.request_id.description,
            location_address: inv.request_id.location_address,
            status: inv.request_id.status,
          }
        : null,
      tutor: {
        _id: inv.tutor_profile_id?._id,
        user_id: inv.tutor_profile_id?.user_id?._id,
        full_name: inv.tutor_profile_id?.user_id?.full_name,
        credit_balance: inv.tutor_profile_id?.user_id?.credit_wallet?.balance ?? 0,
      },
    })),
  };
};

export const respondToInvitation = async (invitationId, { action, reason, tutorUserId }) => {
  const normalizedAction = (action || '').toUpperCase();
  if (!['CONTINUE', 'ACCEPT', 'SKIP', 'DECLINE'].includes(normalizedAction)) {
    throw new AppError('Hành động không hợp lệ. Chỉ chấp nhận Continue (Accept) hoặc Skip (Decline).', 400);
  }

  const invitation = await invRepo.findInvitationById(invitationId);
  if (!invitation) {
    throw new AppError('Không tìm thấy lời mời dạy kèm.', 404);
  }

  const tutorProfile = invitation.tutor_profile_id;
  const tutorUser = tutorProfile?.user_id;

  if (!tutorUser) {
    throw new AppError('Không tìm thấy hồ sơ người dùng của gia sư.', 404);
  }

  // Luồng A1: Skip / Decline
  if (normalizedAction === 'SKIP' || normalizedAction === 'DECLINE') {
    invitation.status = ENUMS.TutorInvitationsStatus.DECLINED;
    await invitation.save();

    // Gửi thông báo đến phụ huynh (A1 / POST-2)
    if (invitation.parent_user_id?._id) {
      await invRepo.createNotification({
        recipient_user_id: invitation.parent_user_id._id,
        category: ENUMS.NotificationsCategory.INVITATION,
        title: 'Gia sư đã từ chối lời mời dạy',
        body: `Gia sư ${tutorUser.full_name || ''} đã từ chối lời mời dạy cho yêu cầu "${invitation.request_id?.title || 'Tìm gia sư'}". Hệ thống gợi ý bạn có thể gửi lời mời tới các gia sư phù hợp khác (UC09).`,
        target_type: ENUMS.NotificationsTargetType.CONVERSATION,
        target_id: null,
        is_read: false,
        delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
      });
    }

    return {
      success: true,
      action: 'DECLINE',
      message: 'Bạn đã từ chối lời mời dạy này. Không có Connection Credit nào bị trừ.',
      invitation: {
        _id: invitation._id,
        status: invitation.status,
      },
    };
  }

  // Luồng chính: CONTINUE / ACCEPT
  // Ngoại lệ E2: Kiểm tra yêu cầu của phụ huynh còn mở không
  const request = invitation.request_id;
  if (!request || request.status !== 'OPEN') {
    throw new AppError(
      'Yêu cầu tìm gia sư này hiện không còn mở (E2: Request already closed - đã đóng hoặc đã tìm được gia sư khác).',
      400,
      { code: 'REQUEST_CLOSED' }
    );
  }

  // Ngoại lệ E1: Kiểm tra số dư credit gia sư (cần >= 1)
  const currentCredit = tutorUser.credit_wallet?.balance ?? 0;
  if (currentCredit < 1) {
    throw new AppError(
      'Bạn cần tối thiểu 1 Connection Credit để chấp nhận lời mời và mở cuộc trò chuyện (E1: No credits left). Lời mời vẫn được giữ ở trạng thái Chờ (Pending). Vui lòng nạp thêm credit hoặc nâng cấp gói Pro!',
      400,
      { code: 'INSUFFICIENT_CREDITS', balance: currentCredit }
    );
  }

  // Bước 3 & 4: Trừ 1 credit của gia sư (POST-1)
  await invRepo.deductTutorCredit(tutorUser._id);

  // Ghi log giao dịch CreditTransaction (amount: -1, type: USED_INVITATION)
  await invRepo.createCreditTransaction({
    user_id: tutorUser._id,
    amount: -1,
    type: ENUMS.CreditTransactionsType.USED_INVITATION,
    related_invitation_id: invitation._id,
  });

  // Cập nhật trạng thái lời mời sang ACCEPTED
  invitation.status = ENUMS.TutorInvitationsStatus.ACCEPTED;
  await invitation.save();

  // Mở hoặc kích hoạt phòng chat 1-1 trực tiếp giữa hai bên
  const conversation = await invRepo.findOrCreateDirectConversation({
    parent_user_id: invitation.parent_user_id?._id,
    tutor_profile_id: tutorProfile._id,
    request_id: request._id,
  });

  // Gửi thông báo đến phụ huynh (POST-1)
  if (invitation.parent_user_id?._id) {
    await invRepo.createNotification({
      recipient_user_id: invitation.parent_user_id._id,
      category: ENUMS.NotificationsCategory.INVITATION,
      title: 'Gia sư đã chấp nhận lời mời dạy của bạn!',
      body: `Gia sư ${tutorUser.full_name || ''} đã đồng ý lời mời dạy cho yêu cầu "${request.title}". Phòng chat 1-1 đã được mở, bạn có thể bắt đầu nhắn tin ngay.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: conversation._id,
      is_read: false,
      delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
    });
  }

  return {
    success: true,
    action: 'CONTINUE',
    message: 'Bạn đã chấp nhận lời mời dạy thành công! Hệ thống đã trừ 1 credit và kích hoạt phòng chat 1-1 với phụ huynh.',
    conversationId: conversation._id,
    tutorRemainingCredits: currentCredit - 1,
    invitation: {
      _id: invitation._id,
      status: invitation.status,
    },
  };
};
