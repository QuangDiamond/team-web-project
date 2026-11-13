import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import * as reportService from '../services/report.service.js';

// UC38 – người dùng gửi báo cáo vi phạm; Admin xử lý ở /moderation/v1
export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user, req.body);
  return responseCommon(res, report, 'Đã gửi báo cáo. Admin sẽ xem xét nội dung này.', 201, 1);
});
