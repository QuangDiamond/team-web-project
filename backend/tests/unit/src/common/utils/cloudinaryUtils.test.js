import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCloudinarySignature,
  getCloudinaryPublicIdFromUrl,
  getCloudinaryPublicUrl,
} from '../../../../../src/common/utils/cloudinaryUtils.js';


// test do cloudinary đưa ra để check xem có băm ra đúng expectation ko ? từ 1 timestamp cho trước. 
// Kiểm tra xem hàm băm có hoạt động như mong đợi hay ko ?
test('generateCloudinarySignature creates the expected Cloudinary signature', () => {
  const signature = generateCloudinarySignature('abcd', '1315060510');

  assert.equal(signature, 'a21ad0f63beb4de2e5575204b79ab90bffb02c10');
});

// ok check lại thì đây là để lấy id từ URL public thật, đã review test do AI tạo, đúng ý. 
test('getCloudinaryPublicIdFromUrl extracts the public ID from a Cloudinary URL', () => {
  const fileUrl = 'https://res.cloudinary.com/dsqguwjmo/image/upload/v1794106266/btrg535kzl2fezpjrmw7.jpg';
  const publicId = getCloudinaryPublicIdFromUrl(fileUrl);

  assert.equal(publicId, 'btrg535kzl2fezpjrmw7');
});




test('getCloudinaryPublicUrl returns the secure URL from a Cloudinary response', () => {
  // object mà cloudinary trả về khi upload ảnh lên
  const cloudinaryResponse = {
    "asset_id": "12f3597b5775bffd5f45c76918223ff5",
    "public_id": "btrg535kzl2fezpjrmw7",
    "version": 1794106266,
    "version_id": "400e3e43ad14892496ba8848e155a9da",
    "signature": "0075b8a371399694558b81c81a948f40a0f5a462",
    "width": 3840,
    "height": 2160,
    "format": "jpg",
    "resource_type": "image",
    "created_at": "2026-11-08T02:51:06Z",
    "tags": [],
    "bytes": 1928174,
    "type": "upload",
    "etag": "2b8100401e03c57d8e2e1b8d70b727d2",
    "placeholder": false,
    "url": "http://res.cloudinary.com/dsqguwjmo/image/upload/v1794106266/btrg535kzl2fezpjrmw7.jpg",
    "secure_url": "https://res.cloudinary.com/dsqguwjmo/image/upload/v1794106266/btrg535kzl2fezpjrmw7.jpg",
    "asset_folder": "",
    "display_name": "btrg535kzl2fezpjrmw7",
    "original_filename": "azir-lol-legends-of-runeterra-uhdpaper.com-4K-5.3240",
    "api_key": "297818131978846"
  };

  // publicUrl được lấy từ hàm
  const publicUrl = getCloudinaryPublicUrl(cloudinaryResponse);

  // đánh giá xem hàm hoạt động như expect hay ko ?
  assert.equal(
    publicUrl,
    'https://res.cloudinary.com/dsqguwjmo/image/upload/v1794106266/btrg535kzl2fezpjrmw7.jpg'
  );
});
