import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import { updateUserAvatar } from '../services/avatar.service.js';

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  const data = await updateUserAvatar(req.user.id, req.file);
  return responseCommon(res, data, 'Đã cập nhật ảnh đại diện');
});
