import { AppError } from '../common/utils/AppError.js';
import { ContentReport } from '../models/ContentReport.js';
import { Notification } from '../models/Notification.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorPost } from '../models/TutorPost.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';

const OPEN_REPORT_STATUSES = [ENUMS.ContentReportsStatus.PENDING, ENUMS.ContentReportsStatus.INVESTIGATING];

/**
 * Tìm bài đăng gia sư bị báo cáo và người viết bài
 * @param {string} postId
 * @returns {Promise<{ authorUserId: string, title: string }>}
 */
const findReportedPost = async (postId) => {
  const post = await TutorPost.findById(postId).select('profile_id title subject_name status').lean();
  if (!post) {
    throw new AppError('Không tìm thấy bài đăng cần báo cáo', 404);
  }
  if (post.status === ENUMS.TutorPostsStatus.DELETED) {
    throw new AppError('Bài đăng này đã bị gỡ', 404);
  }
  const profile = await TutorProfile.findById(post.profile_id).select('user_id').lean();
  if (!profile) {
    throw new AppError('Không tìm thấy gia sư của bài đăng', 404);
  }
  let title = post.title;
  if (!title) {
    title = `Bài đăng môn ${post.subject_name || ''}`.trim();
  }
  return { authorUserId: String(profile.user_id), title: title };
};

/**
 * Tìm yêu cầu tìm gia sư bị báo cáo và phụ huynh đăng yêu cầu
 * @param {string} requestId
 * @returns {Promise<{ authorUserId: string, title: string }>}
 */
const findReportedRequest = async (requestId) => {
  const request = await ParentRequest.findById(requestId).select('parent_user_id title').lean();
  if (!request) {
    throw new AppError('Không tìm thấy yêu cầu cần báo cáo', 404);
  }
  let title = request.title;
  if (!title) {
    title = 'Yêu cầu tìm gia sư';
  }
  return { authorUserId: String(request.parent_user_id), title: title };
};

/**
 * Ẩn nội dung khỏi trang công khai trong lúc chờ Admin xử lý (SDS 9.2 query 02, BR-17).
 * Chỉ đổi khi nội dung đang công khai; Admin chọn "không vi phạm" sẽ khôi phục.
 * @param {'POST'|'REQUEST'} targetType
 * @param {string} targetId
 * @returns {Promise<void>}
 */
const moveTargetToModeration = async (targetType, targetId) => {
  if (targetType === ENUMS.ContentReportsTargetType.POST) {
    await TutorPost.findOneAndUpdate(
      { _id: targetId, status: ENUMS.TutorPostsStatus.PUBLISHED },
      { $set: { status: ENUMS.TutorPostsStatus.PENDING_MODERATION } }
    );
    return;
  }
  await ParentRequest.findOneAndUpdate(
    { _id: targetId, status: ENUMS.ParentRequestsStatus.OPEN },
    { $set: { status: ENUMS.ParentRequestsStatus.PENDING_MODERATION } }
  );
};

/**
 * Báo cho tác giả (nội dung đang được kiểm duyệt) và tất cả Admin đang hoạt động (có báo cáo mới)
 * Lỗi chỉ ghi log, báo cáo vẫn được tạo.
 * @param {Object} params - { reason, targetType, authorUserId, title }
 * @returns {Promise<void>}
 */
const notifyAboutNewReport = async ({ reason, targetType, authorUserId, title }) => {
  try {
    let contentLabel = 'Yêu cầu tìm gia sư';
    if (targetType === ENUMS.ContentReportsTargetType.POST) {
      contentLabel = 'Bài đăng';
    }

    const admins = await User.find({
      role: ENUMS.UserRole.ADMIN,
      account_status: ENUMS.UserAccountStatus.ACTIVE,
    })
      .select('_id')
      .lean();

    const notifications = [
      {
        recipient_user_id: authorUserId,
        category: ENUMS.NotificationsCategory.SYSTEM,
        title: `${contentLabel} của bạn đang được kiểm duyệt`,
        body: `"${title}" đã bị người dùng báo cáo và tạm ẩn khỏi trang công khai cho đến khi Admin xem xét xong.`,
        is_read: false,
      },
    ];
    for (const admin of admins) {
      notifications.push({
        recipient_user_id: admin._id,
        category: ENUMS.NotificationsCategory.SYSTEM,
        title: `Báo cáo vi phạm mới: ${contentLabel.toLowerCase()}`,
        body: `"${title}" – lý do: ${reason}`,
        is_read: false,
      });
    }
    await Notification.insertMany(notifications);
  } catch (error) {
    console.warn('[UC38] Không thể gửi thông báo báo cáo vi phạm:', error.message);
  }
};

/**
 * Người dùng báo cáo bài đăng gia sư / yêu cầu tìm gia sư (UC38, SDS 9.2 ReportService.createReport)
 * @param {Object} user - req.user { id, role }
 * @param {Object} data - { target_type: 'POST'|'REQUEST', target_id, reason }
 * @returns {Promise<Object>} báo cáo vừa tạo
 */
export const createReport = async (user, data) => {
  let target;
  if (data.target_type === ENUMS.ContentReportsTargetType.POST) {
    target = await findReportedPost(data.target_id);
  } else {
    target = await findReportedRequest(data.target_id);
  }

  if (target.authorUserId === String(user.id)) {
    throw new AppError('Bạn không thể báo cáo nội dung của chính mình', 403);
  }

  const existingOpenReport = await ContentReport.findOne({
    reporter_user_id: user.id,
    target_type: data.target_type,
    target_id: data.target_id,
    status: { $in: OPEN_REPORT_STATUSES },
  }).lean();
  if (existingOpenReport) {
    throw new AppError('Bạn đã báo cáo nội dung này, Admin đang xem xét', 409);
  }

  const report = await ContentReport.create({
    reporter_user_id: user.id,
    target_type: data.target_type,
    target_id: data.target_id,
    reason: data.reason,
    severity: ENUMS.ContentReportsSeverity.MEDIUM,
    status: ENUMS.ContentReportsStatus.PENDING,
  });

  await moveTargetToModeration(data.target_type, data.target_id);
  await notifyAboutNewReport({
    reason: data.reason,
    targetType: data.target_type,
    authorUserId: target.authorUserId,
    title: target.title,
  });

  return report.toObject();
};
