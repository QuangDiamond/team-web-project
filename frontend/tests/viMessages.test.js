import assert from 'node:assert/strict';
import { test } from 'node:test';
import { translateSystemMessage } from '../src/utils/viMessages.js';

test('upload errors explain how to correct the file instead of showing a generic failure', () => {
  const mismatch = translateSystemMessage('The file content does not match its file extension');
  assert.match(mismatch, /Nội dung file không khớp với đuôi file/);
  assert.match(mismatch, /lưu hoặc xuất lại đúng định dạng/);
  assert.match(mismatch, /Đổi tên đuôi file không chuyển đổi định dạng/);
  assert.match(translateSystemMessage('File must be 20 MB or smaller'), /20 MB/);
  assert.match(translateSystemMessage('A file is required for this material type'), /chọn file/);
  assert.match(translateSystemMessage('A URL is required for link material'), /nhập liên kết/);
});

test('class material success responses explain which action completed', () => {
  assert.equal(translateSystemMessage('Class material created successfully!'), 'Tải tài liệu lên thành công.');
  assert.equal(translateSystemMessage('Class material updated successfully!'), 'Cập nhật tài liệu thành công.');
  assert.equal(translateSystemMessage('Class material deleted successfully!'), 'Xóa tài liệu thành công.');
  assert.equal(
    translateSystemMessage('Class material updated, but the previous Cloudinary file could not be removed.'),
    'Cập nhật tài liệu thành công, nhưng chưa xóa được file cũ trên Cloudinary.',
  );
  assert.equal(
    translateSystemMessage('Class material deleted, but its Cloudinary file could not be removed.'),
    'Đã xóa tài liệu, nhưng chưa xóa được file trên Cloudinary.',
  );
});

test('Vietnamese system messages cover errors, dynamic validation and status labels', () => {
  assert.equal(translateSystemMessage('Invalid username or password'), 'Email hoặc mật khẩu không đúng.');
  assert.equal(translateSystemMessage('Reason must be at most 500 characters'), 'Lý do không được quá 500 ký tự.');
  assert.equal(translateSystemMessage('About you must be at most 50 words'), 'Giới thiệu bản thân không được quá 50 từ.');
  assert.equal(translateSystemMessage('The account is already SUSPENDED'), 'Tài khoản đã ở trạng thái tạm khóa.');
  assert.equal(translateSystemMessage('Only tutor accounts can use this feature'), 'Chức năng này chỉ dành cho gia sư.');
  assert.equal(translateSystemMessage('Only pending orders can be cancelled (status: SUCCESS)'), 'Chỉ có thể thực hiện thao tác này khi yêu cầu còn đang chờ xử lý.');
  assert.equal(translateSystemMessage('Yêu cầu đang ở trạng thái PENDING.'), 'Yêu cầu đang ở trạng thái đang chờ.');
  assert.equal(translateSystemMessage('An unknown backend diagnostic'), 'Không thể thực hiện yêu cầu. Vui lòng kiểm tra thông tin và thử lại.');
  assert.equal(translateSystemMessage('A completed operation', true), 'Thao tác thành công.');
  assert.equal(translateSystemMessage('Quantity must be at most 10'), 'Số lượng không được quá 10.');
  assert.equal(translateSystemMessage('Budget must be greater than 0'), 'Ngân sách phải lớn hơn 0.');
  assert.equal(translateSystemMessage("Role must be one of these ['TUTOR', 'PARENT', 'STUDENT']"), 'Vai trò không hợp lệ. Vui lòng chọn trong danh sách.');
  assert.equal(translateSystemMessage('End date must not be before start date'), 'Ngày kết thúc không được trước ngày bắt đầu.');
  assert.equal(typeof translateSystemMessage('toString'), 'string');
});
