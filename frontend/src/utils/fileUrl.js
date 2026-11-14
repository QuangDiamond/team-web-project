/**
 * Tiện ích xử lý URL và dung lượng tệp tải lên
 */

/**
 * Lấy URL đầy đủ cho tệp đính kèm (hỗ trợ cả link ngoài lẫn tệp tải lên server /uploads)
 * @param {string} url - Đường dẫn tệp (tương đối hoặc tuyệt đối)
 * @returns {string} URL hợp lệ để mở/tải tệp
 */
export const getAttachmentUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendHost = (
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    'http://localhost:9999/api'
  ).replace(/\/api\/?$/, '');

  return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Định dạng dung lượng tệp từ bytes sang chuỗi hiển thị thân thiện (B, KB, MB)
 * @param {number} bytes - Dung lượng tính theo bytes
 * @returns {string} Chuỗi hiển thị (VD: "2.4 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

