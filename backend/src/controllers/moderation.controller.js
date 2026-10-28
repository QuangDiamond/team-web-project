import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as moderationService from '../services/moderation.service.js';

export const getReports = asyncHandler(async (req, res) => {
  const result = await moderationService.getReports({
    status: req.query.status,
    severity: req.query.severity,
    target_type: req.query.target_type,
  });
  return responseCommon(
    res,
    result,
    'Lấy danh sách báo cáo vi phạm thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const getReportDetails = asyncHandler(async (req, res) => {
  const result = await moderationService.getReportDetails(req.params.reportId);
  return responseCommon(
    res,
    result,
    'Lấy chi tiết báo cáo thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const resolveReport = asyncHandler(async (req, res) => {
  const adminUser = req.user || { id: null, full_name: 'Admin System' };
  const result = await moderationService.resolveReport(adminUser, req.params.reportId, {
    action: req.body.action,
    admin_note: req.body.admin_note,
    ban_user_id: req.body.ban_user_id,
  });
  return responseCommon(
    res,
    result,
    result.message,
    200,
    responseCode.SUCCESSED
  );
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await moderationService.getAuditLogs(limit);
  return responseCommon(
    res,
    result,
    'Lấy danh sách nhật ký kiểm duyệt (Admin Audit Logs) thành công!',
    200,
    responseCode.SUCCESSED
  );
});
