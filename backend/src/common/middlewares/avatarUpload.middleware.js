import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fields: 0, fileSize: MAX_AVATAR_BYTES } });

export const uploadAvatarFile = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (error) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
      next(new AppError('Chỉ tải lên một ảnh đại diện không quá 5 MB.', status));
      return;
    }
    next();
  });
};

export const isValidAvatarFile = (file) => {
  if (!file?.buffer || file.size > MAX_AVATAR_BYTES) return false;
  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg') return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === 'image/png') return bytes.length > 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (file.mimetype === 'image/webp') return bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
};

export const validateAvatarFile = (req, _res, next) => {
  if (!isValidAvatarFile(req.file)) {
    next(new AppError('Vui lòng chọn ảnh JPEG, PNG hoặc WebP hợp lệ, tối đa 5 MB.', 422));
    return;
  }
  next();
};
