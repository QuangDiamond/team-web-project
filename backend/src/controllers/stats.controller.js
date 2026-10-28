import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as statsService from '../services/stats.service.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const period = req.query.period || '30d';
  const result = await statsService.getDashboardStats(period);
  return responseCommon(
    res,
    result,
    'Lấy thống kê hệ thống (UC42 / SC40 Admin Dashboard) thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const exportStatsReport = asyncHandler(async (req, res) => {
  const period = req.query.period || '30d';
  const result = await statsService.exportStatsReport(period);
  return responseCommon(
    res,
    result,
    'Xuất báo cáo hệ thống thành công!',
    200,
    responseCode.SUCCESSED
  );
});
