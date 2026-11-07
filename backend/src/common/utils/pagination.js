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

// Tạo object pagination trả về cho frontend
export const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages };
};
