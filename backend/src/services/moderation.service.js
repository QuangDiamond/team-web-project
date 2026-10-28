import { AppError } from '../common/utils/AppError.js';
import * as moderationRepo from '../repositories/moderation.repository.js';
import { Notification } from '../models/Notification.js';

export const getReports = async (filter = {}) => {
  const reports = await moderationRepo.findReports(filter);
  
  // Calculate summary statistics for admin
  const total = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const criticalCount = reports.filter((r) => r.severity === 'CRITICAL' && r.status === 'PENDING').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return {
    summary: {
      total,
      pendingCount,
      criticalCount,
      resolvedCount,
    },
    reports,
  };
};

export const getReportDetails = async (reportId) => {
  const report = await moderationRepo.findReportById(reportId);
  if (!report) {
    throw new AppError('Không tìm thấy báo cáo vi phạm.', 404);
  }
  return report;
};

export const resolveReport = async (adminUser, reportId, payload) => {
  const { action, admin_note, ban_user_id } = payload;

  // BR-20: Mọi hành động của Admin phải có lý do / ghi chú xử lý
  if (!admin_note || !admin_note.trim()) {
    throw new AppError('Quy tắc BR-20: Vui lòng nhập lý do/ghi chú xử lý của Admin.', 400);
  }

  const existingReport = await moderationRepo.findReportById(reportId);
  if (!existingReport) {
    throw new AppError('Không tìm thấy báo cáo vi phạm.', 404);
  }

  // Determine final status
  const finalStatus = action === 'NONE' ? 'DISMISSED' : 'RESOLVED';

  // Apply User Ban if requested (Alternative Flow A1: Repeated violations / lock user)
  let targetUserId = existingReport.reporter_user_id?._id || null;
  if (action === 'USER_BANNED' && ban_user_id) {
    await moderationRepo.updateUserStatus(ban_user_id, 'BANNED');
    targetUserId = ban_user_id;
  }

  // Update ContentReport record
  const updatedReport = await moderationRepo.updateReport(reportId, {
    status: finalStatus,
    action_taken: action,
    admin_note: admin_note.trim(),
    resolved_by_admin_id: adminUser?.id || null,
    resolved_at: new Date(),
  });

  // Map audit action according to BR-20
  let auditAction = 'MODERATE_CONTENT';
  if (action === 'USER_BANNED') auditAction = 'LOCK_USER';
  else if (action === 'WARNING_SENT') auditAction = 'WARN_USER';

  // Write to ADMIN_AUDIT_LOGS per BR-20
  await moderationRepo.createAuditLog({
    admin_user_id: adminUser?.id || null,
    target_user_id: targetUserId,
    action: auditAction,
    reason: admin_note.trim(),
    details_json: {
      report_id: reportId,
      target_type: existingReport.target_type,
      target_id: existingReport.target_id,
      action_taken: action,
      resolved_at: new Date(),
    },
  });

  // Notify reporter if exists
  if (existingReport.reporter_user_id) {
    try {
      await Notification.create({
        recipient_user_id: existingReport.reporter_user_id,
        category: 'SYSTEM',
        title: 'Báo cáo của bạn đã được kiểm duyệt xử lý',
        body: `Báo cáo về "${existingReport.target_type}" đã được Ban Quản Trị xem xét và xử lý: ${admin_note.trim()}`,
        target_type: 'ASSIGNMENT', // fallback enum
        is_read: false,
      });
    } catch {
      // Ignored if not saved
    }
  }

  return {
    success: true,
    message: `Đã xử lý báo cáo thành công với hành động: ${action}`,
    report: updatedReport,
  };
};

export const getAuditLogs = async (limit = 20) => {
  return await moderationRepo.findAuditLogs(limit);
};
