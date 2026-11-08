import { parseQuery } from '../common/utils/pagination.js';
import { statsQuerySchema } from '../common/validator/statsSchema.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import * as statsService from '../services/stats.service.js';

export const getPublicHomeStats = asyncHandler(async (_req, res) => {
  const result = await statsService.getPublicHomeStats();

  return responseCommon(res, result, 'Lấy dữ liệu trang chủ thành công.', 200, 1);
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { period } = parseQuery(statsQuerySchema, req.query);
  const result = await statsService.getDashboardStats(req.user, period);

  return responseCommon(res, result, 'Lấy thống kê hệ thống thành công.', 200, 1);
});

export const exportStatsReport = asyncHandler(async (req, res) => {
  const { period } = parseQuery(statsQuerySchema, req.query);
  const result = await statsService.exportStatsReport(req.user, period);

  return responseCommon(res, result, 'Xuất báo cáo hệ thống thành công.', 200, 1);
});
