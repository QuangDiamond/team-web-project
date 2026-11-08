import { AppError } from './AppError.js';

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
