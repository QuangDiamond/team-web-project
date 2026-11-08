import 'dotenv/config';
import { generateCloudinarySignature } from '../common/utils/cloudinaryUtils.js';

const timestamp = Math.floor(Date.now() / 1000);
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!apiSecret) {
  throw new Error('CLOUDINARY_API_SECRET is missing from the backend .env file');
}

const signature = generateCloudinarySignature(apiSecret, timestamp);

console.log({ timestamp, signature });
