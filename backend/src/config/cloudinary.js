import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../common/utils/AppError.js';

const configureCloudinary = () => {
  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    throw new AppError('Cloudinary is not configured on the server', 503);
  }

  cloudinary.config(cloudinaryConfig);
};

/**
 * Decode and resize a user avatar using the existing Cloudinary connection.
 * @param {Object} file - Validated image buffer.
 * @param {string} userId - Authenticated owner.
 * @returns {Promise<Object>} Uploaded image details.
 */
export const uploadAvatarToCloudinary = (file, userId) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: `avatars/${userId}`, resource_type: 'image', format: 'jpg',
      transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'auto' }],
    }, (error, result) => {
      if (error || !result?.secure_url || !result?.public_id) {
        reject(new AppError('Không thể tải ảnh đại diện. Vui lòng thử lại.', 502));
        return;
      }
      resolve(result);
    });
    stream.end(file.buffer);
  });
};

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File contents held in memory
 * @param {string} fileName - Original file name
 * @returns {Promise<Object>} Cloudinary upload response
 */
export const uploadClassMaterialToCloudinary = (fileBuffer, fileName) => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'class-materials',
        resource_type: 'auto',
        filename_override: fileName,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(new AppError('Could not upload the material to Cloudinary', 502));
          return;
        }
        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an uploaded file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Cloudinary resource type
 * @returns {Promise<Object>} Cloudinary deletion response
 */
export const deleteClassMaterialFromCloudinary = (publicId, resourceType) => {
  configureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
