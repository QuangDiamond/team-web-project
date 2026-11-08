import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import * as moderationService from '../services/moderation.service.js';

export const getReports = asyncHandler(async (req, res) => {
  const { status, severity, target_type } = req.query;
  const result = await moderationService.getReports(req.user, {
    status,
    severity,
    target_type,
  });

  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy danh sách báo cáo vi phạm thành công.',
    data: result,
  });
});

export const getReportDetails = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const result = await moderationService.getReportDetails(req.user, reportId);

  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy chi tiết báo cáo vi phạm thành công.',
    data: result,
  });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const result = await moderationService.resolveReport(req.user, reportId, req.body);

  return responseCommon(res, 200, {
    success: 1,
    message: result.message,
    data: result.report,
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await moderationService.getAuditLogs(req.user);

  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy nhật ký kiểm duyệt của Admin thành công.',
    data: logs,
  });
});
