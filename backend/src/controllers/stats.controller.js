import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import * as statsService from '../services/stats.service.js';

export const getPublicHomeStats = asyncHandler(async (_req, res) => {
  const result = await statsService.getPublicHomeStats();

  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy dữ liệu trang chủ thành công.',
    data: result,
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const result = await statsService.getDashboardStats(req.user, period);

  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy thống kê hệ thống thành công.',
    data: result,
  });
});

export const exportStatsReport = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const result = await statsService.exportStatsReport(req.user, period);

  return responseCommon(res, 200, {
    success: 1,
    message: 'Xuất báo cáo hệ thống thành công.',
    data: result,
  });
});
