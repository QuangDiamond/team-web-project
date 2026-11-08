import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { ENUMS } from '../models/enums.js';
import { ContentReport } from '../models/ContentReport.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { User } from '../models/User.js';
import { TutorPost } from '../models/TutorPost.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { Review } from '../models/Review.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';

const loadTargetPreview = async (report) => {
  if (!report.target_id || !mongoose.isValidObjectId(report.target_id)) {
    return null;
  }

  if (report.target_type === ENUMS.ContentReportsTargetType.POST) {
    const post = await TutorPost.findById(report.target_id)
      .populate({
        path: 'profile_id',
        populate: { path: 'user_id', select: 'full_name email role' },
      })
      .lean();
    if (!post) return null;
    const owner = post.profile_id?.user_id;
    return {
      title: `Bài đăng môn ${post.subject_name || ''}`,
      content: post.description || '',
      author_name: owner?.full_name || 'Gia sư TuConnector',
      author_role: owner?.role || 'TUTOR',
      author_id: owner?._id ? String(owner._id) : null,
      status: post.status,
    };
  }

  if (report.target_type === ENUMS.ContentReportsTargetType.REQUEST) {
    const req = await ParentRequest.findById(report.target_id)
      .populate({ path: 'parent_user_id', select: 'full_name email role' })
      .lean();
    if (!req) return null;
    return {
      title: req.title || 'Yêu cầu tìm gia sư',
      content: req.description || '',
      author_name: req.parent_user_id?.full_name || 'Phụ huynh',
      author_role: 'PARENT',
      author_id: req.parent_user_id?._id ? String(req.parent_user_id._id) : null,
      status: req.status,
    };
  }

  if (report.target_type === ENUMS.ContentReportsTargetType.REVIEW) {
    const review = await Review.findById(report.target_id)
      .populate({ path: 'parent_user_id', select: 'full_name email role' })
      .lean();
    if (!review) return null;
    return {
      title: `Đánh giá ${review.rating || 5} sao`,
      content: review.comment || '',
      author_name: review.parent_user_id?.full_name || 'Phụ huynh',
      author_role: 'PARENT',
      author_id: review.parent_user_id?._id ? String(review.parent_user_id._id) : null,
      status: review.status,
    };
  }

  if (report.target_type === ENUMS.ContentReportsTargetType.MESSAGE) {
    const msg = await Message.findById(report.target_id)
      .populate({ path: 'sender_user_id', select: 'full_name email role' })
      .lean();
    if (!msg) return null;
    return {
      title: 'Tin nhắn hội thoại',
      content: msg.content || '',
      author_name: msg.sender_user_id?.full_name || 'Người dùng',
      author_role: msg.sender_user_id?.role || 'USER',
      author_id: msg.sender_user_id?._id ? String(msg.sender_user_id._id) : null,
    };
  }

  if (report.target_type === ENUMS.ContentReportsTargetType.USER) {
    const targetUser = await User.findById(report.target_id)
      .select('full_name email role account_status')
      .lean();
    if (!targetUser) return null;
    return {
      title: `Tài khoản: ${targetUser.full_name}`,
      content: `Email: ${targetUser.email} — Trạng thái: ${targetUser.account_status}`,
      author_name: targetUser.full_name,
      author_role: targetUser.role,
      author_id: String(targetUser._id),
    };
  }

  return null;
};

/**
 * Lấy danh sách báo cáo vi phạm cho Admin (UC38/UC40)
 * @param {Object} adminUser - req.user { id, role }
 * @param {Object} filter - { status?, severity?, target_type? }
 * @returns {Promise<{ summary: Object, reports: Object[] }>}
 */
export const getReports = async (adminUser, filter = {}) => {
  assertRole(adminUser, ENUMS.UserRole.ADMIN);

  const query = {};
  if (filter.status && filter.status !== 'ALL') {
    query.status = filter.status;
  }
  if (filter.severity && filter.severity !== 'ALL') {
    query.severity = filter.severity;
  }
  if (filter.target_type && filter.target_type !== 'ALL') {
    query.target_type = filter.target_type;
  }

  const [reports, allReports] = await Promise.all([
    ContentReport.find(query)
      .populate('reporter_user_id', 'full_name email role avatar_url')
      .populate('resolved_by_admin_id', 'full_name email')
      .sort({ created_at: -1 })
      .lean(),
    ContentReport.find({}).select('status severity').lean(),
  ]);

  const enrichedReports = await Promise.all(
    reports.map(async (report) => {
      const targetPreview = await loadTargetPreview(report);
      return {
        ...report,
        target_preview: targetPreview,
      };
    })
  );

  const total = allReports.length;
  const pendingCount = allReports.filter((r) => r.status === 'PENDING').length;
  const criticalCount = allReports.filter(
    (r) => r.severity === 'CRITICAL' && r.status === 'PENDING'
  ).length;
  const resolvedCount = allReports.filter((r) => r.status === 'RESOLVED').length;

  return {
    summary: {
      total,
      pendingCount,
      criticalCount,
      resolvedCount,
    },
    reports: enrichedReports,
  };
};

/**
 * Lấy chi tiết một báo cáo vi phạm
 * @param {Object} adminUser - req.user { id, role }
 * @param {string} reportId
 * @returns {Promise<Object>}
 */
export const getReportDetails = async (adminUser, reportId) => {
  assertRole(adminUser, ENUMS.UserRole.ADMIN);

  if (!mongoose.isValidObjectId(reportId)) {
    throw new AppError('Không tìm thấy báo cáo vi phạm.', 404);
  }

  const report = await ContentReport.findById(reportId)
    .populate('reporter_user_id', 'full_name email role avatar_url')
    .populate('resolved_by_admin_id', 'full_name email')
    .lean();

  if (!report) {
    throw new AppError('Không tìm thấy báo cáo vi phạm.', 404);
  }

  const targetPreview = await loadTargetPreview(report);
  return {
    ...report,
    target_preview: targetPreview,
  };
};

/**
 * Xử lý báo cáo vi phạm kèm ghi chú kiểm duyệt theo quy tắc BR-20 (UC38/UC40)
 * @param {Object} adminUser - req.user { id, role }
 * @param {string} reportId
 * @param {Object} payload - { action, admin_note, ban_user_id? }
 * @returns {Promise<{ report: Object, message: string }>}
 */
export const resolveReport = async (adminUser, reportId, payload) => {
  assertRole(adminUser, ENUMS.UserRole.ADMIN);

  if (!mongoose.isValidObjectId(reportId)) {
    throw new AppError('Không tìm thấy báo cáo vi phạm.', 404);
  }

  const { action, admin_note, ban_user_id } = payload;
  const existingReport = await ContentReport.findById(reportId).lean();
  if (!existingReport) {
    throw new AppError('Không tìm thấy báo cáo vi phạm.', 404);
  }

  // UC38 Exception E1: Item already handled
  if (
    existingReport.status === ENUMS.ContentReportsStatus.RESOLVED ||
    existingReport.status === ENUMS.ContentReportsStatus.DISMISSED
  ) {
    throw new AppError(
      `Báo cáo vi phạm này đã được xử lý trước đó (E1 - Trạng thái: ${existingReport.status}).`,
      409
    );
  }

  const targetPreview = await loadTargetPreview(existingReport);
  const finalStatus =
    action === ENUMS.ContentReportsActionTaken.NONE
      ? ENUMS.ContentReportsStatus.DISMISSED
      : ENUMS.ContentReportsStatus.RESOLVED;

  // Cập nhật trạng thái nội dung bị báo cáo theo SDS 9.2 (APPROVE/NONE khôi phục, HIDE/REMOVE ẩn hoặc gỡ bỏ)
  if (
    existingReport.target_id &&
    mongoose.isValidObjectId(existingReport.target_id)
  ) {
    if (existingReport.target_type === ENUMS.ContentReportsTargetType.POST) {
      if (action === ENUMS.ContentReportsActionTaken.NONE) {
        await TutorPost.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.TutorPostsStatus.PUBLISHED,
        });
      } else if (action === ENUMS.ContentReportsActionTaken.CONTENT_HIDDEN) {
        await TutorPost.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.TutorPostsStatus.HIDDEN,
        });
      } else if (action === ENUMS.ContentReportsActionTaken.CONTENT_REMOVED) {
        await TutorPost.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.TutorPostsStatus.DELETED,
        });
      }
    } else if (existingReport.target_type === ENUMS.ContentReportsTargetType.REQUEST) {
      if (action === ENUMS.ContentReportsActionTaken.NONE) {
        await ParentRequest.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.ParentRequestsStatus.OPEN,
        });
      } else if (
        action === ENUMS.ContentReportsActionTaken.CONTENT_HIDDEN ||
        action === ENUMS.ContentReportsActionTaken.CONTENT_REMOVED
      ) {
        await ParentRequest.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.ParentRequestsStatus.CANCELLED,
        });
      }
    } else if (existingReport.target_type === ENUMS.ContentReportsTargetType.REVIEW) {
      if (action === ENUMS.ContentReportsActionTaken.NONE) {
        await Review.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.ReviewsStatus.APPROVED,
        });
      } else if (
        action === ENUMS.ContentReportsActionTaken.CONTENT_HIDDEN ||
        action === ENUMS.ContentReportsActionTaken.CONTENT_REMOVED
      ) {
        await Review.findByIdAndUpdate(existingReport.target_id, {
          status: ENUMS.ReviewsStatus.REJECTED,
        });
      }
    } else if (existingReport.target_type === ENUMS.ContentReportsTargetType.MESSAGE) {
      if (action === ENUMS.ContentReportsActionTaken.CONTENT_REMOVED) {
        await Message.deleteOne({ _id: existingReport.target_id });
      }
    }
  }

  let targetUserId = targetPreview?.author_id || existingReport.reporter_user_id || null;
  const effectiveBanUserId = ban_user_id || targetPreview?.author_id;
  if (
    action === ENUMS.ContentReportsActionTaken.USER_BANNED &&
    effectiveBanUserId &&
    mongoose.isValidObjectId(effectiveBanUserId)
  ) {
    await User.findByIdAndUpdate(effectiveBanUserId, {
      account_status: ENUMS.UserAccountStatus.BANNED,
    });
    targetUserId = effectiveBanUserId;
  }

  const updatedReport = await ContentReport.findByIdAndUpdate(
    reportId,
    {
      status: finalStatus,
      action_taken: action,
      admin_note: admin_note.trim(),
      resolved_by_admin_id: adminUser.id,
      resolved_at: new Date(),
    },
    { new: true }
  )
    .populate('reporter_user_id', 'full_name email role avatar_url')
    .populate('resolved_by_admin_id', 'full_name email')
    .lean();

  let auditAction = ENUMS.AdminAuditLogsAction.MODERATE_CONTENT;
  if (action === ENUMS.ContentReportsActionTaken.USER_BANNED) {
    auditAction = ENUMS.AdminAuditLogsAction.LOCK_USER;
  } else if (action === ENUMS.ContentReportsActionTaken.WARNING_SENT) {
    auditAction = ENUMS.AdminAuditLogsAction.WARN_USER;
  }

  await AdminAuditLog.create({
    admin_user_id: adminUser.id,
    target_user_id:
      targetUserId && mongoose.isValidObjectId(targetUserId) ? targetUserId : null,
    action: auditAction,
    reason: admin_note.trim(),
    details_json: {
      reportId: String(existingReport._id),
      target_type: existingReport.target_type,
      target_id: existingReport.target_id ? String(existingReport.target_id) : null,
      action_taken: action,
    },
    ip_address: '127.0.0.1',
  });

  if (existingReport.reporter_user_id) {
    await Notification.create({
      recipient_user_id: existingReport.reporter_user_id,
      category: ENUMS.NotificationsCategory.SYSTEM,
      title: 'Cập nhật kết quả xử lý báo cáo vi phạm',
      body: `Báo cáo của bạn về mục [${existingReport.target_type}] đã được Admin xử lý với quyết định: ${action}. Ghi chú: ${admin_note.trim()}`,
      target_type: null,
      target_id: null,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: existingReport.reporter_user_id,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: new Date(),
        },
      ],
    });
  }

  // SDS 9.2: Thông báo cho tác giả của nội dung bị báo cáo (nếu có và khác người báo cáo)
  if (
    targetPreview?.author_id &&
    mongoose.isValidObjectId(targetPreview.author_id) &&
    String(targetPreview.author_id) !== String(existingReport.reporter_user_id)
  ) {
    await Notification.create({
      recipient_user_id: targetPreview.author_id,
      category: ENUMS.NotificationsCategory.SYSTEM,
      title: 'Thông báo kiểm duyệt nội dung từ Quản trị viên',
      body: `Nội dung [${existingReport.target_type}] của bạn đã được Admin kiểm duyệt với quyết định: ${action}. Lý do: ${admin_note.trim()}`,
      target_type: null,
      target_id: null,
      is_read: false,
      delivery_logs: [
        {
          recipient_user_id: targetPreview.author_id,
          channel: ENUMS.NotificationDeliveryLogsChannel.IN_APP,
          status: ENUMS.NotificationDeliveryLogsStatus.SENT,
          dispatched_at: new Date(),
        },
      ],
    });
  }

  return {
    report: {
      ...updatedReport,
      target_preview: targetPreview,
    },
    message: `Đã xử lý báo cáo thành công với hành động: ${action}`,
  };
};

/**
 * Lấy danh sách nhật ký kiểm duyệt của Admin (BR-20)
 * @param {Object} adminUser - req.user { id, role }
 * @returns {Promise<Object[]>}
 */
export const getAuditLogs = async (adminUser) => {
  assertRole(adminUser, ENUMS.UserRole.ADMIN);

  return AdminAuditLog.find({})
    .populate('admin_user_id', 'full_name email')
    .populate('target_user_id', 'full_name email role account_status')
    .sort({ created_at: -1 })
    .limit(30)
    .lean();
};
