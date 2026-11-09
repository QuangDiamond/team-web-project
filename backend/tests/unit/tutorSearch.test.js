import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tutorSearchSchema } from '../../src/common/validator/discoverySchema.js';
import { searchPublicTutors, toInvitableTutorDto } from '../../src/services/invitation.service.js';
import { User } from '../../src/models/User.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { TutorPost } from '../../src/models/TutorPost.js';

test('search validates pagination, bounded prices, rating and query text', () => {
  assert.deepEqual(tutorSearchSchema.parse({}), { page: 1, limit: 10 });
  for (const query of [
    { limit: '101' }, { page: '-1' }, { min_rating: '6' }, { min_price: '-1' },
    { min_price: '200', max_price: '100' }, { mode: 'UNKNOWN' }, { q: 'x'.repeat(101) },
  ]) assert.equal(tutorSearchSchema.safeParse(query).success, false);
});

test('public tutor DTO excludes private fields and masks contact text', () => {
  const result = toInvitableTutorDto({ _id: 'p1', headline: 'Call 0912345678', address: 'private', bio: 'private' },
    { full_name: 'Tutor', email: 'private@example.com', password_hash: 'secret' },
    { subjects: ['Contact private@example.com'], minPrice: 100 });
  assert.equal(result.headline.includes('0912345678'), false);
  assert.equal(result.subjects[0].includes('private@example.com'), false);
  for (const field of ['email', 'password_hash', 'address', 'bio', 'user_id']) assert.equal(field in result, false);
  assert.deepEqual(result.teaching_categories, []);
});

test('tutor cards expose only public teaching-category fields with contact masking', () => {
  const result = toInvitableTutorDto({
    _id: 'p1', teaching_categories: [
      { type: 'subjects', category_id: 's1', name: 'Toán', private_note: 'private' },
      { type: 'grades', category_id: 'g1', name: 'Liên hệ private@example.com' },
    ],
  }, { full_name: 'Tutor' }, { subjects: [], minPrice: null });
  assert.deepEqual(result.teaching_categories[0], { type: 'subjects', category_id: 's1', name: 'Toán' });
  assert.equal(result.teaching_categories[1].name.includes('private@example.com'), false);
  assert.deepEqual(Object.keys(result.teaching_categories[1]), ['type', 'category_id', 'name']);
});

test('public search filters active complete tutors before paging and keeps post filters together', async (t) => {
  const chain = (data) => ({
    select() { return this; }, sort() { return this; }, skip() { return this; },
    limit() { return this; }, lean: async () => data,
  });
  t.mock.method(User, 'find', (filter) => {
    assert.deepEqual(filter, { role: 'TUTOR', account_status: 'ACTIVE' });
    return chain([{ _id: 'u1', full_name: 'Tutor' }]);
  });
  t.mock.method(TutorPost, 'distinct', async (_field, filter) => {
    assert.equal(filter.status, 'PUBLISHED');
    assert.equal(filter.teaching_mode, 'ONLINE');
    assert.deepEqual(filter.price, { $gte: 100, $lte: 200 });
    assert.equal(filter.subject_name.test('Toán'), true);
    assert.equal(filter.subject_name.test('Toán nâng cao'), false);
    assert.equal(filter.grade_level.test('IELTS'), true);
    assert.equal(filter.grade_level.test('TOEIC'), false);
    return ['p1'];
  });
  t.mock.method(TutorProfile, 'find', (filter) => {
    assert.equal(filter.is_complete, true);
    assert.deepEqual(filter._id, { $in: ['p1'] });
    assert.deepEqual(filter.is_address_hidden, { $ne: true });
    assert.equal(filter.address.test('Hà Nội'), true);
    assert.deepEqual(filter.average_rating, { $gte: 4 });
    return chain([]);
  });
  t.mock.method(TutorProfile, 'countDocuments', async () => 0);
  t.mock.method(TutorPost, 'find', () => chain([]));
  const result = await searchPublicTutors(tutorSearchSchema.parse({ subject: 'Toán', grade: 'IELTS', mode: 'ONLINE', area: 'Hà Nội', min_price: '100', max_price: '200', min_rating: '4' }));
  assert.deepEqual(result, { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
});
