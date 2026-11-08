import { AppError } from './AppError.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Đọc page / limit từ query. Chưa có validator cho query nên giá trị sai thì dùng mặc định thay vì báo lỗi
export const getPagination = (query) => {
  let page = Number.parseInt(query.page, 10);
  if (!Number.isInteger(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Validate query bằng Zod schema (validator() chỉ đọc req.body nên query được validate tại controller)
 * @param {import('zod').ZodType} schema
 * @param {Object} query - req.query
 * @returns {Object} dữ liệu đã parse (có giá trị mặc định)
 */
export const parseQuery = (schema, query) => {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 422, result.error.flatten().fieldErrors);
  }
  return result.data;
};

/**
 * Tạo object pagination theo chuẩn AGENTS.md
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
export const buildPagination = (page, limit, total) => {
  return {
    page: page,
    limit: limit,
    total: total,
    totalPages: Math.ceil(total / limit),
  };
};
