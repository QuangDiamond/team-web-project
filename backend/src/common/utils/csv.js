// BOM để Excel đọc đúng tiếng Việt (UTF-8)
const UTF8_BOM = '﻿';

// Ô chữ bắt đầu bằng = + - @ (hoặc tab / CR) bị Excel hiểu là công thức -> thêm ' phía trước (chống CSV injection)
const FORMULA_START_REGEX = /^[=+\-@\t\r]/;

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const pad2 = (number) => String(number).padStart(2, '0');

/**
 * Định dạng ngày giờ theo giờ Việt Nam (UTC+7) cho Excel (D16)
 * @param {Date} date - thời điểm
 * @returns {string} dd/MM/yyyy HH:mm
 */
const formatVietnamDateTime = (date) => {
  const vietnamTime = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  const day = pad2(vietnamTime.getUTCDate());
  const month = pad2(vietnamTime.getUTCMonth() + 1);
  const hours = pad2(vietnamTime.getUTCHours());
  const minutes = pad2(vietnamTime.getUTCMinutes());
  return `${day}/${month}/${vietnamTime.getUTCFullYear()} ${hours}:${minutes}`;
};

/**
 * Chuyển 1 giá trị thành ô CSV an toàn: escape dấu ", bọc "" khi có , " xuống dòng, chặn công thức
 * @param {*} value - giá trị ô (null/undefined -> rỗng, Date -> dd/MM/yyyy HH:mm giờ Việt Nam)
 * @returns {string} ô CSV
 */
const toCsvCell = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return String(value);
  }

  let text = String(value);
  if (value instanceof Date) {
    text = formatVietnamDateTime(value);
  }
  if (FORMULA_START_REGEX.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    text = `"${text.replaceAll('"', '""')}"`;
  }
  return text;
};

/**
 * Tạo nội dung file CSV (có BOM, xuống dòng CRLF)
 * @param {string[]} headers - tên cột
 * @param {Array<Array<*>>} rows - mỗi phần tử là 1 dòng, đúng thứ tự cột
 * @returns {string} nội dung CSV
 */
export const buildCsv = (headers, rows) => {
  const lines = [headers.map(toCsvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(toCsvCell).join(','));
  }
  return UTF8_BOM + lines.join('\r\n') + '\r\n';
};
