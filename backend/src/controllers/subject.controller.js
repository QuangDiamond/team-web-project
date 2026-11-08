import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { buildPagination, getPagination } from '../common/utils/pagination.js';
import { Subject } from '../models/Subject.js';

// Danh sách môn học đang bật, dùng cho ô chọn môn (CRUD đơn giản nên gọi model trực tiếp)
export const listSubjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { is_active: true };

  const [items, total] = await Promise.all([
    Subject.find(filter).sort({ sort_order: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Subject.countDocuments(filter),
  ]);

  const data = { items: items, pagination: buildPagination(page, limit, total) };
  return responseCommon(res, data, 'Get subjects successfully!', 200, responseCode.SUCCESSED);
});
