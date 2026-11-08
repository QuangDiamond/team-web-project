import { User } from '../models/User.js';
import { AppError } from '../common/utils/AppError.js';
import { uploadAvatarToCloudinary, deleteClassMaterialFromCloudinary } from '../config/cloudinary.js';

/**
 * Upload an avatar and update only the authenticated user's account.
 * @param {string} userId - Authenticated user ID.
 * @param {Object} file - Validated Multer image.
 * @returns {Promise<{avatar_url: string}>} New avatar URL.
 */
export const updateUserAvatar = async (userId, file) => {
  const account = await User.findById(userId).select('_id').lean();
  if (!account) throw new AppError('User not found', 404);
  const upload = await uploadAvatarToCloudinary(file, userId);
  try {
    const result = await User.updateOne({ _id: userId }, { $set: { avatar_url: upload.secure_url } });
    if (!result.matchedCount) throw new AppError('User not found', 404);
  } catch (error) {
    try {
      await deleteClassMaterialFromCloudinary(upload.public_id, 'image');
    } catch {
      console.warn('Could not clean up an unsaved avatar');
    }
    throw error;
  }
  // shortcut: previous avatar assets remain; add an ownership-checked cleanup job if storage usage grows.
  return { avatar_url: upload.secure_url };
};
