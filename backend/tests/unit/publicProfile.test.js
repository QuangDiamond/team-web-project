import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User } from '../../src/models/User.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { TutorPost } from '../../src/models/TutorPost.js';
import { Review } from '../../src/models/Review.js';
import { ParentRequest } from '../../src/models/ParentRequest.js';
import { maskContact } from '../../src/common/utils/contactMask.js';
import { REQUEST_LIFETIME_DAYS } from '../../src/common/utils/requestRules.js';
import { getTutorPublicProfile, getParentPublicProfile } from '../../src/services/discovery.service.js';
import { toTutorRequestDto } from '../../src/services/tutorRequest.service.js';
import { toReceivedInvitationDto } from '../../src/services/invitation.service.js';
import { discoveryRoutes } from '../../src/routes/discovery.routes.js';
import { authentication } from '../../src/common/middlewares/auth.middleware.js';

const newId = () => new mongoose.Types.ObjectId();
const contact = 'Email me@example.com call +84 912 345 678 visit https://example.com/contact';
const masked = 'Email *** call *** visit ***';
const unavailable = (error) => error.status === 404 && error.message === 'This profile is not available';

const assertFields = (value, fields) => {
  assert.deepEqual(Object.keys(value).sort(), fields.split(' ').sort());
};

// Deliberately return unprojected rows so DTO tests also catch accidental object spreading.
const queryMock = (rows, calls = {}) => ({
  select(fields) { calls.select = fields; return this; },
  sort(order) { calls.sort = order; return this; },
  skip(skip) { calls.skip = skip; return this; },
  limit(limit) { calls.limit = limit; return this; },
  async lean() { return rows; },
});

test('contact mask covers emails, links, local/international phones and preserves ordinary text', () => {
  assert.equal(maskContact(contact), masked);
  for (const value of ['0912345678', '0912.345.678', '0912-345-678', '+1 (212) 555-0199',
    'www.example.com/a', 'example.vn/contact', 'mailto:me@example.com', 'tel:+84912345678']) {
    assert.equal(maskContact(value), '***', value);
  }
  assert.equal(maskContact('Grade 12, 2024, Monday 18:30'), 'Grade 12, 2024, Monday 18:30');
  assert.equal(maskContact(null), null);
  assert.equal(maskContact(undefined), null);
});

test('tutor response has exact allowlists, nested masks, shared pagination and public filters', async (t) => {
  const profileId = newId();
  const userId = newId();
  const childId = newId();
  const profile = {
    _id: profileId, user_id: userId, is_complete: true, is_address_hidden: true,
    headline: contact, bio: contact, address: 'Private street', average_rating: 4.5,
    availability_status: 'AVAILABLE', cover_url: 'https://cdn.example/cover.png',
    experiences: [{ title: contact, company: contact, start_date: null, end_date: null, student_id: childId }],
    educations: [{ school: contact, degree: contact, graduation_year: 2024, description: contact, student_id: childId }],
    achievements: [{ title: contact, description: contact, student_id: childId }],
    email: 'private@example.com', phone: '0912345678', student_id: childId,
  };
  const user = { _id: userId, full_name: contact, avatar_url: 'https://cdn.example/avatar.png',
    role: 'TUTOR', account_status: 'ACTIVE', password_hash: 'secret', student_profile: { student_id: childId } };
  const post = { _id: newId(), title: contact, subject_name: contact, grade_level: contact,
    teaching_mode: 'ONLINE', price: mongoose.Types.Decimal128.fromString('150000'), schedule: contact,
    description: contact, status: 'PUBLISHED', image_urls: ['private'], student_id: childId };
  const review = { _id: newId(), rating: 5, comment: contact, tutor_reply: contact, created_at: new Date(),
    parent_user_id: newId(), agreement_id: newId(), email: 'private@example.com' };
  const postCalls = {};
  const reviewCalls = {};
  t.mock.method(TutorProfile, 'findById', () => queryMock(profile));
  t.mock.method(User, 'findById', () => queryMock(user));
  const postFind = t.mock.method(TutorPost, 'find', () => queryMock([post], postCalls));
  const postCount = t.mock.method(TutorPost, 'countDocuments', async () => 7);
  const reviewFind = t.mock.method(Review, 'find', () => queryMock([review], reviewCalls));
  const reviewCount = t.mock.method(Review, 'countDocuments', async () => 4);

  const result = await getTutorPublicProfile(String(profileId), { page: '2', limit: '3' });
  assertFields(result, 'profile posts reviews');
  assertFields(result.profile, '_id user_id full_name avatar_url cover_url headline bio address availability_status average_rating experiences educations achievements');
  assertFields(result.profile.experiences[0], 'title company start_date end_date');
  assertFields(result.profile.educations[0], 'school degree graduation_year description');
  assertFields(result.profile.achievements[0], 'title description');
  assertFields(result.posts.items[0], '_id title subject_name grade_level teaching_mode price schedule description');
  assertFields(result.reviews.items[0], '_id rating comment tutor_reply created_at');
  assert.equal(result.profile.address, null);
  assert.equal(result.profile.avatar_url, user.avatar_url);
  assert.equal(result.profile.cover_url, profile.cover_url);
  assert.equal(result.profile.full_name, masked);
  assert.equal(result.profile.experiences[0].company, masked);
  assert.equal(result.profile.educations[0].degree, masked);
  assert.equal(result.profile.achievements[0].description, masked);
  assert.equal(result.posts.items[0].schedule, masked);
  assert.equal(result.posts.items[0].price, 150000);
  assert.equal(result.reviews.items[0].comment, masked);
  assert.equal(result.reviews.items[0].tutor_reply, masked);
  assert.equal(JSON.stringify(result).includes(String(childId)), false);
  assert.equal(JSON.stringify(result).includes('me@example.com'), false);
  assert.deepEqual(result.posts.pagination, { page: 2, limit: 3, total: 7, totalPages: 3 });
  assert.deepEqual(result.reviews.pagination, { page: 2, limit: 3, total: 4, totalPages: 2 });
  for (const calls of [postCalls, reviewCalls]) {
    assert.equal(calls.skip, 3);
    assert.equal(calls.limit, 3);
    assert.deepEqual(calls.sort, { created_at: -1, _id: -1 });
  }
  assert.deepEqual(postFind.mock.calls[0].arguments[0], { profile_id: profileId, status: 'PUBLISHED' });
  assert.deepEqual(reviewFind.mock.calls[0].arguments[0], { tutor_profile_id: profileId, status: 'APPROVED' });
  assert.deepEqual(postCount.mock.calls[0].arguments, postFind.mock.calls[0].arguments);
  assert.deepEqual(reviewCount.mock.calls[0].arguments, reviewFind.mock.calls[0].arguments);

  profile.is_address_hidden = false;
  profile.address = contact;
  profile.avatar_url = 'https://cdn.example/profile.png';
  const visible = await getTutorPublicProfile(String(profileId));
  assert.equal(visible.profile.address, masked);
  assert.equal(visible.profile.avatar_url, profile.avatar_url);
});

test('invalid and missing profiles, incomplete tutors and inactive/wrong-role accounts return generic 404', async (t) => {
  const id = String(newId());
  const profile = { _id: newId(), user_id: newId(), is_complete: true };
  const user = { _id: profile.user_id, role: 'TUTOR', account_status: 'ACTIVE' };
  const profileFind = t.mock.method(TutorProfile, 'findById', () => queryMock(profile));
  const userFind = t.mock.method(User, 'findById', () => queryMock(user));
  for (const invalid of ['bad-id', '', undefined]) {
    await assert.rejects(getTutorPublicProfile(invalid), unavailable);
    await assert.rejects(getParentPublicProfile(invalid), unavailable);
  }
  assert.equal(profileFind.mock.callCount(), 0);
  assert.equal(userFind.mock.callCount(), 0);
  profile.is_complete = false;
  await assert.rejects(getTutorPublicProfile(id), unavailable);
  assert.equal(userFind.mock.callCount(), 0);
  profile.is_complete = true;
  for (const status of ['SUSPENDED', 'BANNED']) {
    user.account_status = status;
    await assert.rejects(getTutorPublicProfile(id), unavailable);
    user.role = 'PARENT';
    await assert.rejects(getParentPublicProfile(id), unavailable);
    user.role = 'TUTOR';
  }
  user.account_status = 'ACTIVE';
  user.role = 'STUDENT';
  await assert.rejects(getTutorPublicProfile(id), unavailable);
  await assert.rejects(getParentPublicProfile(id), unavailable);
  userFind.mock.mockImplementation(() => queryMock(null));
  await assert.rejects(getTutorPublicProfile(id), unavailable);
  await assert.rejects(getParentPublicProfile(id), unavailable);
  profileFind.mock.mockImplementation(() => queryMock(null));
  await assert.rejects(getTutorPublicProfile(id), unavailable);
});

test('parent response excludes child/account data and filters OPEN requests using shared expiry and pagination', async (t) => {
  const userId = newId();
  const childId = newId();
  t.mock.method(User, 'findById', () => queryMock({ _id: userId, full_name: contact, avatar_url: null,
    role: 'PARENT', account_status: 'ACTIVE', email: 'private@example.com', student_profile: { _id: childId } }));
  const calls = {};
  const request = { _id: newId(), title: contact, subject_name: contact, grade_level: contact,
    teaching_mode: 'OFFLINE', budget: mongoose.Types.Decimal128.fromString('250000'), schedule: contact,
    description: contact, location_address: contact, student_id: childId, child_name: 'Private child' };
  const find = t.mock.method(ParentRequest, 'find', () => queryMock([request], calls));
  const count = t.mock.method(ParentRequest, 'countDocuments', async () => 203);
  const before = Date.now();
  const result = await getParentPublicProfile(String(userId), { page: '2', limit: '101' });
  const after = Date.now();
  assertFields(result, 'profile requests');
  assertFields(result.profile, 'user_id full_name avatar_url');
  assertFields(result.requests.items[0], '_id title subject_name grade_level teaching_mode budget schedule description location_address');
  assert.equal(result.profile.user_id, String(userId));
  assert.equal(result.profile.full_name, masked);
  for (const field of ['title', 'subject_name', 'grade_level', 'schedule', 'description', 'location_address']) {
    assert.equal(result.requests.items[0][field], masked);
  }
  assert.equal(result.requests.items[0].budget, 250000);
  assert.equal(JSON.stringify(result).includes(String(childId)), false);
  assert.equal(JSON.stringify(result).includes('Private child'), false);
  assert.deepEqual(result.requests.pagination, { page: 2, limit: 100, total: 203, totalPages: 3 });
  assert.equal(calls.skip, 100);
  assert.equal(calls.limit, 100);
  assert.deepEqual(calls.sort, { created_at: -1, _id: -1 });
  const filter = find.mock.calls[0].arguments[0];
  assert.equal(filter.parent_user_id, userId);
  assert.equal(filter.status, 'OPEN');
  const lifetime = REQUEST_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
  assert.ok(filter.created_at.$gte.getTime() >= before - lifetime);
  assert.ok(filter.created_at.$gte.getTime() <= after - lifetime);
  assert.deepEqual(count.mock.calls[0].arguments[0], filter);
});

test('empty public lists use default pagination, including tutors without published posts', async (t) => {
  const user = { _id: newId(), role: 'TUTOR', account_status: 'ACTIVE' };
  t.mock.method(User, 'findById', () => queryMock(user));
  t.mock.method(TutorProfile, 'findById', () => queryMock({ _id: newId(), user_id: user._id, is_complete: true }));
  for (const model of [TutorPost, Review, ParentRequest]) {
    t.mock.method(model, 'find', () => queryMock([]));
    t.mock.method(model, 'countDocuments', async () => 0);
  }
  const tutor = await getTutorPublicProfile(String(newId()), { page: '-1', limit: 'bad' });
  const empty = { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  assert.deepEqual(tutor.posts, empty);
  assert.deepEqual(tutor.reviews, empty);
  assert.deepEqual(tutor.profile.experiences, []);
  user.role = 'PARENT';
  const parent = await getParentPublicProfile(String(user._id));
  assert.deepEqual(parent.requests, empty);
});

test('routes allow guest tutor viewing and authenticate/authorize parent viewing', () => {
  const tutor = discoveryRoutes.stack.find((layer) => layer.route.path === '/tutors/:profileId').route;
  const parent = discoveryRoutes.stack.find((layer) => layer.route.path === '/parents/:userId').route;
  assert.equal(tutor.methods.get, true);
  assert.equal(tutor.stack.length, 1);
  assert.equal(parent.methods.get, true);
  assert.equal(parent.stack[0].handle, authentication);
  const authorize = parent.stack[1].handle;
  for (const role of ['TUTOR', 'PARENT', 'ADMIN']) {
    authorize({ user: { role } }, {}, (error) => assert.equal(error, undefined));
  }
  authorize({ user: { role: 'STUDENT' } }, {}, (error) => assert.equal(error.status, 403));
  authorize({}, {}, (error) => assert.equal(error.status, 401));
});

test('request and invitation DTOs add only the parent profile link ID', () => {
  const parentId = newId();
  const request = { _id: newId(), parent_user_id: parentId, title: 'Math', budget: '100', student_id: newId() };
  const dto = toTutorRequestDto(request, { applicationCount: 2, isBookmarked: true, hasApplied: false });
  assert.equal(dto.parent_user_id, String(parentId));
  assert.equal(dto.title, 'Math');
  assert.equal(dto.application_count, 2);
  assert.equal(dto.is_bookmarked, true);
  assert.equal('student_id' in dto, false);
  const invitation = { _id: newId(), parent_user_id: parentId, status: 'PENDING', message: 'Hello' };
  const received = toReceivedInvitationDto(invitation, request, 'conversation-id');
  assert.equal(received.parent_user_id, String(parentId));
  assert.equal(received.message, 'Hello');
  assert.equal(received.conversation_id, 'conversation-id');
  assert.equal(received.request.title, 'Math');
  assert.equal('student_id' in received.request, false);
  assert.equal(toReceivedInvitationDto(invitation, null, null).parent_user_id, String(parentId));
  assert.equal(toTutorRequestDto({ _id: newId() }, {}).parent_user_id, null);
});
