import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Buffer } from 'node:buffer';
import { tutorProfileBodySchema } from '../../src/common/validator/tutorProfileSchema.js';
import { resolveTeachingCategories, toTutorProfileDto } from '../../src/services/tutorProfile.service.js';
import { Subject } from '../../src/models/Subject.js';
import { GradeLevel } from '../../src/models/GradeLevel.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { User } from '../../src/models/User.js';
import { updateUserAvatar } from '../../src/services/avatar.service.js';
import { isValidAvatarFile } from '../../src/common/middlewares/avatarUpload.middleware.js';
import { v2 as cloudinary } from 'cloudinary';

const subjectId = '507f1f77bcf86cd799439011';
const gradeId = '507f1f77bcf86cd799439012';
const fields = { headline: 'Tutor', bio: 'About me', address: 'Hanoi' };

test('profile category selections reject duplicate, forged name and invalid IDs while old clients remain compatible', () => {
  const selection = { type: 'subjects', category_id: subjectId };
  assert.equal(tutorProfileBodySchema.parse(fields).teaching_categories, undefined);
  assert.equal(tutorProfileBodySchema.safeParse({ ...fields, teaching_categories: [selection] }).success, true);
  for (const selections of [[selection, selection], [{ ...selection, category_id: 'invalid' }], [{ ...selection, name: 'Injected' }], Array(51).fill(selection)]) {
    assert.equal(tutorProfileBodySchema.safeParse({ ...fields, teaching_categories: selections }).success, false);
  }
  assert.deepEqual(toTutorProfileDto({ _id: subjectId }).teaching_categories, []);
});

test('profile resolves both category types and retains only previously saved inactive selections', async (t) => {
  t.mock.method(Subject, 'find', () => ({ select: () => ({ lean: async () => [{ _id: subjectId, name: 'Toán', is_active: true }] }) }));
  t.mock.method(GradeLevel, 'find', () => ({ select: () => ({ lean: async () => [{ _id: gradeId, name: 'IELTS', is_active: false }] }) }));
  const selections = [{ type: 'subjects', category_id: subjectId }, { type: 'grades', category_id: gradeId }];
  await assert.rejects(resolveTeachingCategories(selections), /không còn khả dụng/);
  const result = await resolveTeachingCategories(selections, [selections[1]]);
  assert.deepEqual(result.map((item) => item.name), ['Toán', 'IELTS']);
  assert.deepEqual(await resolveTeachingCategories([]), []);
  const profile = new TutorProfile({ teaching_categories: result });
  assert.equal(profile.validateSync(), undefined);
});

test('avatar checks reject SVG, spoofed MIME, missing and oversized files', () => {
  const png = { mimetype: 'image/png', size: 9, buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]) };
  assert.equal(isValidAvatarFile(png), true);
  assert.equal(isValidAvatarFile({ ...png, mimetype: 'image/jpeg' }), false);
  assert.equal(isValidAvatarFile({ ...png, mimetype: 'image/svg+xml' }), false);
  assert.equal(isValidAvatarFile({ ...png, size: 6 * 1024 * 1024 }), false);
  assert.equal(isValidAvatarFile(null), false);
});

test('avatar upload updates only its owner and cleans up a new upload if database save fails', async (t) => {
  for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    const previous = process.env[key];
    process.env[key] = 'test-placeholder';
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
  t.mock.method(User, 'findById', () => ({ select: () => ({ lean: async () => ({ _id: subjectId }) }) }));
  t.mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => {
    assert.equal(options.folder, `avatars/${subjectId}`);
    return { end: () => callback(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/new.jpg', public_id: 'new' }) };
  });
  const update = t.mock.method(User, 'updateOne', async (filter, change) => {
    assert.deepEqual(filter, { _id: subjectId });
    assert.deepEqual(Object.keys(change.$set), ['avatar_url']);
    return { matchedCount: 1 };
  });
  const destroy = t.mock.method(cloudinary.uploader, 'destroy', async () => ({}));
  const result = await updateUserAvatar(subjectId, { buffer: Buffer.from('image') });
  assert.equal(result.avatar_url.endsWith('new.jpg'), true);
  update.mock.mockImplementation(async () => { throw new Error('DB failure'); });
  await assert.rejects(updateUserAvatar(subjectId, { buffer: Buffer.from('image') }), /DB failure/);
  assert.equal(destroy.mock.callCount(), 1);
});
