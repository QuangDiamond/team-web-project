// Giá tiền có thể về dạng số hoặc Decimal128 của Mongo ({ $numberDecimal: "199000" })
export const toNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'object' && value.$numberDecimal !== undefined) {
    return Number(value.$numberDecimal);
  }
  return Number(value);
};

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

// Định dạng VND, vd: 199000 -> "199.000 ₫"
export const formatVnd = (value) => {
  return vndFormatter.format(toNumber(value));
};
