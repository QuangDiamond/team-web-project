import { AppError } from '../common/utils/AppError.js';
import { ENUMS } from '../models/enums.js';
import * as appRepo from '../repositories/application.repository.js';

export const getApplicationsByRequest = async (requestId) => {
  let request = null;

  if (requestId && requestId !== 'default') {
    request = await appRepo.findParentRequestById(requestId);
  }

  if (!request) {
    request = await appRepo.findFirstOpenParentRequest();
  }

  if (!request) {
    throw new AppError('Không tìm thấy bài đăng yêu cầu tìm gia sư.', 404);
  }

  const applications = await appRepo.findApplicationsByRequestId(request._id);

  return {
    request: {
      _id: request._id,
      title: request.title,
      subject_name: request.subject_name,
      grade_level: request.grade_level,
      teaching_mode: request.teaching_mode,
      budget: request.budget,
      schedule: request.schedule,
      description: request.description,
      location_address: request.location_address,
      status: request.status,
      tutor_requirements: request.tutor_requirements,
      created_at: request.created_at,
    },
    applications: applications.map((app) => ({
      _id: app._id,
      note: app.note,
      match_score: app.match_score,
      status: app.status,
      created_at: app.created_at,
      updated_at: app.updated_at,
      tutor: {
        _id: app.tutor_profile_id?._id,
        user_id: app.tutor_profile_id?.user_id?._id,
        full_name: app.tutor_profile_id?.user_id?.full_name || 'Gia sư TuConnector',
        email: app.tutor_profile_id?.user_id?.email,
        phone: app.tutor_profile_id?.user_id?.phone,
        avatar_url: app.tutor_profile_id?.avatar_url || app.tutor_profile_id?.user_id?.avatar_url,
        headline: app.tutor_profile_id?.headline || 'Gia sư chuyên môn cao',
        bio: app.tutor_profile_id?.bio,
        address: app.tutor_profile_id?.address,
        is_address_hidden: app.tutor_profile_id?.is_address_hidden,
        is_complete: app.tutor_profile_id?.is_complete,
        availability_status: app.tutor_profile_id?.availability_status,
        average_rating: app.tutor_profile_id?.average_rating || 5.0,
        experiences: app.tutor_profile_id?.experiences || [],
        achievements: app.tutor_profile_id?.achievements || [],
        educations: app.tutor_profile_id?.educations || [],
        account_status: app.tutor_profile_id?.user_id?.account_status,
        credit_balance: app.tutor_profile_id?.user_id?.credit_wallet?.balance ?? 0,
      },
    })),
  };
};

export const respondToApplication = async (applicationId, { action, parentUserId }) => {
  const normalizedAction = (action || '').toUpperCase();
  if (!['CONTINUE', 'SKIP'].includes(normalizedAction)) {
    throw new AppError('Hành động không hợp lệ. Chỉ chấp nhận CONTINUE hoặc SKIP.', 400);
  }

  const application = await appRepo.findApplicationById(applicationId);
  if (!application) {
    throw new AppError('Không tìm thấy đơn ứng tuyển của gia sư.', 404);
  }

  const tutorProfile = application.tutor_profile_id;
  const tutorUser = tutorProfile?.user_id;

  if (!tutorUser) {
    throw new AppError('Không tìm thấy thông tin tài khoản của gia sư.', 404);
  }

  const effectiveParentId = parentUserId || application.request_id?.parent_user_id || '670000000000000000000001';

  // Luồng A1: Skip
  if (normalizedAction === 'SKIP') {
    application.status = ENUMS.ApplyRequestsStatus.SKIPPED;
    await application.save();

    // Gửi thông báo cho gia sư (Alternative Flow A1: POST-2)
    await appRepo.createNotification({
      recipient_user_id: tutorUser._id,
      category: ENUMS.NotificationsCategory.APPLICATION,
      title: 'Cập nhật trạng thái ứng tuyển',
      body: `Phụ huynh đã xem xét hồ sơ ứng tuyển của bạn cho yêu cầu "${application.request_id?.title || 'Tìm gia sư'}" và chọn bỏ qua. Bạn không bị trừ Connection Credit.`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: null,
      is_read: false,
      delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
    });

    return {
      success: true,
      action: 'SKIP',
      message: 'Đã bỏ qua ứng viên thành công. Gia sư không bị trừ credit.',
      application: {
        _id: application._id,
        status: application.status,
      },
    };
  }

  // Luồng chính: CONTINUE
  // Ngoại lệ E2: Kiểm tra tài khoản gia sư có bị khóa không
  if (tutorUser.account_status && tutorUser.account_status !== 'ACTIVE') {
    throw new AppError('Tài khoản của gia sư này đang bị tạm khóa hoặc đình chỉ hoạt động (E2). Nút Tiếp tục đã bị vô hiệu hóa.', 400);
  }

  // Ngoại lệ E1: Gia sư không đủ credit (cần >= 1 credit)
  const currentCredit = tutorUser.credit_wallet?.balance ?? 0;
  if (currentCredit < 1) {
    // Thông báo cho gia sư nạp credit
    await appRepo.createNotification({
      recipient_user_id: tutorUser._id,
      category: ENUMS.NotificationsCategory.APPLICATION,
      title: 'Phụ huynh muốn kết nối với bạn!',
      body: `Phụ huynh quan tâm đến đơn ứng tuyển của bạn cho yêu cầu "${application.request_id?.title || 'Tìm gia sư'}", nhưng số dư Connection Credit của bạn đã hết. Vui lòng nạp thêm credit để tự động mở phòng chat 1-1!`,
      target_type: ENUMS.NotificationsTargetType.CONVERSATION,
      target_id: null,
      is_read: false,
      delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
    });

    throw new AppError(
      'Gia sư hiện không còn đủ Connection Credit để kết nối (E1). Hồ sơ được giữ ở trạng thái Chờ (Pending) và hệ thống đã gửi thông báo đến gia sư nạp thêm credit.',
      400,
      { code: 'INSUFFICIENT_CREDITS', tutorName: tutorUser.full_name }
    );
  }

  // Bước 4 & 5: Trừ 1 credit của gia sư
  await appRepo.deductTutorCredit(tutorUser._id);

  // Ghi nhận log giao dịch CreditTransaction (amount: -1, type: USED_APPLY)
  await appRepo.createCreditTransaction({
    user_id: tutorUser._id,
    amount: -1,
    type: ENUMS.CreditTransactionsType.USED_APPLY,
    related_apply_id: application._id,
  });

  // Cập nhật trạng thái ứng tuyển sang CONTINUED
  application.status = ENUMS.ApplyRequestsStatus.CONTINUED;
  await application.save();

  // Mở phòng chat 1-1 giữa Phụ huynh và Gia sư
  const conversation = await appRepo.findOrCreateDirectConversation({
    parent_user_id: effectiveParentId,
    tutor_profile_id: tutorProfile._id,
    request_id: application.request_id?._id,
  });

  // Gửi thông báo đến Gia sư (POST-1)
  await appRepo.createNotification({
    recipient_user_id: tutorUser._id,
    category: ENUMS.NotificationsCategory.APPLICATION,
    title: 'Phụ huynh đã chấp nhận kết nối!',
    body: `Phụ huynh của yêu cầu "${application.request_id?.title || 'Tìm gia sư'}" đã chấp nhận đơn ứng tuyển của bạn. 1 Connection Credit đã được trừ và phòng chat 1-1 đã sẵn sàng để hai bên trao đổi!`,
    target_type: ENUMS.NotificationsTargetType.CONVERSATION,
    target_id: conversation._id,
    is_read: false,
    delivery_logs: [{ channel: 'IN_APP', status: 'SENT', sent_at: new Date() }],
  });

  return {
    success: true,
    action: 'CONTINUE',
    message: 'Đã chấp nhận kết nối gia sư thành công! Hệ thống đã trừ 1 credit của gia sư và kích hoạt phòng chat 1-1.',
    conversationId: conversation._id,
    tutorRemainingCredits: currentCredit - 1,
    application: {
      _id: application._id,
      status: application.status,
    },
  };
};
