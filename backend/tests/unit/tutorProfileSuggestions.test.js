import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSuggestions, refreshSuggestions } from '../../src/services/tutorRequest.service.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { Subject } from '../../src/models/Subject.js';
import { GradeLevel } from '../../src/models/GradeLevel.js';
import { ParentRequest } from '../../src/models/ParentRequest.js';
import { ApplyRequest } from '../../src/models/ApplyRequest.js';
import { BookmarkedRequest } from '../../src/models/BookmarkedRequest.js';
import { TutorPost } from '../../src/models/TutorPost.js';
import { AiPostSuggestion } from '../../src/models/AiPostSuggestion.js';
import { matchesAnyTeachingCategory } from '../../src/services/tutorMatching.service.js';

const id = (index) => '507f1f77bcf86cd7994390' + String(index).padStart(2, '0');
const user = { id: id(1), role: 'TUTOR' };
const profile = { _id: id(2), is_complete: true, teaching_categories: [{ type: 'subjects', category_id: id(3) }, { type: 'grades', category_id: id(4) }] };
const query = (data) => ({ select() { return this; }, sort() { return this; }, lean: async () => data });

test('tutor suggestions match profile categories without posts/cache, exclude applied/expired requests and paginate', async (t) => {
  t.mock.method(TutorProfile, 'findOne', () => query(profile));
  t.mock.method(Subject, 'find', () => query([{ _id: id(3), name: 'Tiếng Anh' }]));
  t.mock.method(GradeLevel, 'find', () => query([{ _id: id(4), name: 'IELTS' }]));
  const requests = Array.from({ length: 12 }, (_, index) => ({
    _id: id(index + 10), title: 'Request ' + index, subject_name: 'Tiếng Anh', grade_level: 'IELTS',
    status: 'OPEN', created_at: new Date(Date.now() - index * 1000), budget: 100000,
  }));
  requests.push({ ...requests[0], _id: id(50), grade_level: 'TOEIC' });
  requests.push({ ...requests[0], _id: id(51), created_at: new Date('2000-01-01') });
  requests.push({ ...requests[0], _id: id(52), status: 'CLOSED' });
  t.mock.method(ParentRequest, 'find', (filter) => {
    assert.equal(filter.status, 'OPEN');
    assert.deepEqual(filter._id.$nin, [id(10)]);
    return query(requests.filter((item) => String(item._id) !== id(10)));
  });
  t.mock.method(ApplyRequest, 'distinct', async (_field, filter) => {
    assert.equal(String(filter.tutor_profile_id), id(2));
    assert.deepEqual(filter.status, { $ne: 'WITHDRAWN' });
    return [id(10)];
  });
  t.mock.method(ApplyRequest, 'aggregate', async () => []);
  t.mock.method(ApplyRequest, 'find', () => query([]));
  t.mock.method(BookmarkedRequest, 'find', () => query([]));
  t.mock.method(TutorPost, 'find', () => { throw new Error('Posts must not be required'); });
  t.mock.method(AiPostSuggestion, 'find', () => { throw new Error('AI cache must not be read'); });
  const result = await getSuggestions(user, { page: 2, limit: 9 });
  assert.equal(result.pagination.total, 12);
  assert.equal(result.items.length, 3);
  assert.equal(result.items[0]._id, id(19));
  assert.equal(result.items[1]._id, id(20));
  assert.equal(result.items[2]._id, id(21));
  assert.equal((await refreshSuggestions(user)).pagination.total, 12);
});

test('tutor with no teaching categories receives a profile hint, not a publish-post hint', async (t) => {
  t.mock.method(TutorProfile, 'findOne', () => query({ ...profile, teaching_categories: [] }));
  const result = await getSuggestions(user, { page: 1, limit: 9 });
  assert.deepEqual(result.items, []);
  assert.match(result.hint, /hồ sơ/);
});

test('inactive category selections cannot produce suggestions', async (t) => {
  t.mock.method(TutorProfile, 'findOne', () => query(profile));
  t.mock.method(Subject, 'find', () => query([]));
  t.mock.method(GradeLevel, 'find', () => query([]));
  t.mock.method(ParentRequest, 'find', () => { throw new Error('Requests should not be loaded without any active category'); });
  const result = await getSuggestions(user, { page: 1, limit: 9 });
  assert.equal(result.pagination.total, 0);
  assert.match(result.hint, /hồ sơ/);
});

test('any-category matching accepts subject OR level without mixing category types', () => {
  const catalog = new Map([['subjects:' + id(3), 'Toán'], ['grades:' + id(4), 'Lớp 9']]);
  assert.equal(matchesAnyTeachingCategory({ subject_name: 'toan', grade_level: 'Lớp 12' }, profile.teaching_categories, catalog), true);
  assert.equal(matchesAnyTeachingCategory({ subject_name: 'Vật lý', grade_level: 'Lớp 9' }, profile.teaching_categories, catalog), true);
  assert.equal(matchesAnyTeachingCategory({ subject_name: 'Vật lý', grade_level: 'Lớp 12' }, profile.teaching_categories, catalog), false);
  assert.equal(matchesAnyTeachingCategory({ subject_name: 'Lớp 9', grade_level: 'Toán' }, profile.teaching_categories, catalog), false);
  assert.equal(matchesAnyTeachingCategory({ subject_name: 'Toán', grade_level: 'Lớp 9' }, profile.teaching_categories, new Map()), false);
  assert.equal(matchesAnyTeachingCategory({}, profile.teaching_categories, catalog), false);
});

for (const type of ['subjects', 'grades']) {
  test(`tutor with only ${type} selections receives matching requests`, async (t) => {
    const selections = profile.teaching_categories.filter((item) => item.type === type);
    t.mock.method(TutorProfile, 'findOne', () => query({ ...profile, teaching_categories: selections }));
    t.mock.method(Subject, 'find', () => query([{ _id: id(3), name: 'Toán' }]));
    t.mock.method(GradeLevel, 'find', () => query([{ _id: id(4), name: 'Lớp 9' }]));
    t.mock.method(ApplyRequest, 'distinct', async () => []);
    t.mock.method(ApplyRequest, 'aggregate', async () => []);
    t.mock.method(ApplyRequest, 'find', () => query([]));
    t.mock.method(BookmarkedRequest, 'find', () => query([]));
    const request = {
      _id: id(20), subject_name: type === 'subjects' ? 'Toán' : 'Vật lý',
      grade_level: type === 'grades' ? 'Lớp 9' : 'Lớp 12', status: 'OPEN', created_at: new Date(),
    };
    t.mock.method(ParentRequest, 'find', () => query([request]));
    const result = await getSuggestions(user, { page: 1, limit: 9 });
    assert.equal(result.pagination.total, 1);
    assert.equal(result.items[0]._id, request._id);
  });
}
