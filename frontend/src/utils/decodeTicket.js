// Đọc phần payload của ticket (JWT) do backend tạo khi đăng ký bằng Google,
// chỉ để hiển thị tên + email ở "Account summary". Không kiểm tra chữ ký, backend sẽ kiểm tra.
// Trả về { full_name, google_email } hoặc null nếu ticket hỏng
export const decodeTicket = (ticket) => {
  if (!ticket) {
    return null;
  }

  const parts = ticket.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    // JWT dùng base64url: đổi về base64 thường trước khi giải mã
    const base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const binary = atob(base64);
    // Giải mã UTF-8 để tên tiếng Việt hiển thị đúng
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json);
    return {
      full_name: payload.full_name || '',
      google_email: payload.google_email || '',
    };
  } catch {
    return null;
  }
};
