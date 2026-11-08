import { createHash } from 'node:crypto';
import { URL } from 'node:url';

/**
 * Create a Cloudinary signature for an upload request that signs only the timestamp.
 * @param {string} apiSecret - Cloudinary API secret used to create the signature.
 * @param {string | number} timestamp - Unix timestamp included in the upload request.
 * @returns {string} SHA-1 signature as a hexadecimal string.
 */
export const generateCloudinarySignature = (apiSecret, timestamp) => {
  const stringToSign = `timestamp=${timestamp}${apiSecret}`;
  return createHash('sha1').update(stringToSign).digest('hex');
};

/**
 * Extract the public ID from a direct Cloudinary upload URL.
 * @param {string} fileUrl - Cloudinary URL without delivery transformations.
 * @returns {string} Public ID, including any folder path.
 * @throws {TypeError} If fileUrl is not a valid URL.
 * @throws {Error} If the URL does not contain a Cloudinary upload path.
 */
export const getCloudinaryPublicIdFromUrl = (fileUrl) => {
  const parsedUrl = new URL(fileUrl);
  const uploadPath = parsedUrl.pathname.split('/upload/')[1];

  if (!uploadPath) {
    throw new Error('URL is not a Cloudinary upload URL');
  }

  const pathWithoutVersion = uploadPath.replace(/^v\d+\//, '');
  const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');

  return decodeURIComponent(publicId);
};

/**
 * Read the Cloudinary resource type and public ID from an uploaded asset URL
 * @param {string} fileUrl - Cloudinary secure URL
 * @returns {{ publicId: string, resourceType: string }|null} Asset details, or null for external URLs
 */
export const getCloudinaryAssetDetailsFromUrl = (fileUrl) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    return null;
  }

  if (parsedUrl.hostname !== 'res.cloudinary.com') {
    return null;
  }

  const resourceMatch = parsedUrl.pathname.match(/\/(image|video|raw)\/upload\/(.+)$/);
  if (!resourceMatch) {
    return null;
  }

  const resourceType = resourceMatch[1];
  let publicId = resourceMatch[2].replace(/^v\d+\//, '');
  if (resourceType !== 'raw') {
    publicId = publicId.replace(/\.[^/.]+$/, '');
  }

  return {
    publicId: decodeURIComponent(publicId),
    resourceType: resourceType,
  };
};

/**
 * Get the secure public URL from a Cloudinary upload response.
 * @param {Object | null | undefined} cloudinaryResponse - Response returned by Cloudinary.
 * @returns {string | null} The response's secure_url, or null if it is unavailable.
 */
export const getCloudinaryPublicUrl = (cloudinaryResponse) => {
  return cloudinaryResponse?.secure_url || null;
};
