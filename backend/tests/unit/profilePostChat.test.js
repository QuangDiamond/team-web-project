import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { tutorProfileBodySchema } from '../../src/common/validator/tutorProfileSchema.js';
import {
  createTutorPostSchema,
  tutorPostListQuerySchema,
  tutorPostStatusSchema,
  updateTutorPostSchema,
} from '../../src/common/validator/tutorPostSchema.js';
import { sendMessageSchema } from '../../src/common/validator/chatSchema.js';
import { toTutorProfileDto } from '../../src/services/tutorProfile.service.js';
import { toTutorPostDto } from '../../src/services/tutorPost.service.js';
import { toMessageDto } from '../../src/services/chat.service.js';

const newId = () => new mongoose.Types.ObjectId();

const validProfile = { headline: 'Gia sư Toán', bio: 'Giới thiệu', address: 'Cầu Giấy, Hà Nội' };

test('profile body: required fields, defaults and trimming', () => {
  const result = tutorProfileBodySchema.safeParse({ ...validProfile, headline: '  Gia sư Toán  ' });
  assert.equal(result.success, true);
  assert.equal(result.data.headline, 'Gia sư Toán');
  assert.equal(result.data.is_address_hidden, false);
  assert.equal(result.data.availability_status, 'AVAILABLE');
  assert.deepEqual([result.data.experiences, result.data.educations, result.data.achievements], [[], [], []]);
  for (const missing of ['headline', 'bio', 'address']) {
    const body = { ...validProfile };
    delete body[missing];
    assert.equal(tutorProfileBodySchema.safeParse(body).success, false, missing);
  }
});

test('profile body: rejects system fields and bad enums', () => {
  for (const extra of [{ user_id: String(newId()) }, { is_complete: false }, { average_rating: 5 }, { avatar_url: 'http://x' }]) {
    assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, ...extra }).success, false);
  }
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, availability_status: 'BUSY' }).success, false);
});

test('profile body: experiences convert dates, validate order, limit size', () => {
  const ok = tutorProfileBodySchema.safeParse({
    ...validProfile,
    experiences: [{ title: 'Giáo viên', company: 'ABC school', start_date: '2020-01-01', end_date: '2022-06-30' }],
  });
  assert.equal(ok.success, true);
  assert.ok(ok.data.experiences[0].start_date instanceof Date);
  assert.equal(ok.data.experiences[0].company, 'ABC school');

  const wrongOrder = tutorProfileBodySchema.safeParse({
    ...validProfile,
    experiences: [{ title: 'X', company: 'School', start_date: '2022-01-01', end_date: '2020-01-01' }],
  });
  assert.equal(wrongOrder.success, false);
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, experiences: [{ title: 'X', start_date: 'not-a-date' }] }).success, false);
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, experiences: Array.from({ length: 11 }, () => ({ title: 'X' })) }).success, false);
});

test('profile body requires every item field except Details and limits About you to 50 words', () => {
  const items = {
    experiences: { title: 'Tutor', company: 'School', start_date: '2020-01-01', end_date: '2024-01-01' },
    educations: { school: 'University', degree: 'Bachelor', graduation_year: 2024 },
    achievements: { title: 'Teaching award' },
  };
  for (const [section, item] of Object.entries(items)) {
    assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, [section]: [item] }).success, true, section);
    for (const field of Object.keys(item)) {
      const invalidValues = field === 'end_date' ? [undefined, ''] : [undefined, null, ''];
      for (const value of invalidValues) {
        const result = tutorProfileBodySchema.safeParse({ ...validProfile, [section]: [{ ...item, [field]: value }] });
        assert.equal(result.success, false, `${section}.${field}: ${value}`);
        assert.ok(result.error.issues.some((issue) => issue.path[0] === section && issue.path[2] === field));
      }
    }
  }
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, experiences: [{ ...items.experiences, end_date: null }] }).success, true);
  const fiftyWords = Array(50).fill('dạy').join(' \n\t ');
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, bio: `  ${fiftyWords}  ` }).success, true);
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, bio: `${fiftyWords} thêm` }).success, false);
});

test('profile body: educations and achievements', () => {
  const ok = tutorProfileBodySchema.safeParse({
    ...validProfile,
    educations: [{ school: 'ĐH Sư phạm', degree: 'Cử nhân Toán', graduation_year: '2024', description: '' }],
    achievements: [{ title: 'IELTS 8.0' }],
  });
  assert.equal(ok.success, true);
  assert.equal(ok.data.educations[0].graduation_year, 2024);
  assert.equal(ok.data.achievements[0].description, null);
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, educations: [{ school: 'X', graduation_year: 1800 }] }).success, false);
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, educations: [{ degree: 'no school' }] }).success, false);
  assert.equal(tutorProfileBodySchema.safeParse({ ...validProfile, achievements: [{ title: '' }] }).success, false);
});

test('profile DTO formats dates and keeps the rating', () => {
  const dto = toTutorProfileDto({
    _id: newId(), headline: 'h', bio: 'b', address: 'a', is_address_hidden: true, is_complete: true, availability_status: 'AVAILABLE',
    average_rating: 4.5,
    experiences: [{ title: 'T', company: null, start_date: new Date('2020-03-04T00:00:00Z'), end_date: null }],
    educations: [{ school: 'S', degree: null, graduation_year: 2024, description: null }],
    achievements: [{ title: 'A', description: null }],
  });
  assert.equal(dto.experiences[0].start_date, '2020-03-04');
  assert.equal(dto.experiences[0].end_date, null);
  assert.equal(dto.average_rating, 4.5);
  assert.equal(dto.is_address_hidden, true);
  assert.equal('user_id' in dto, false);
});

const validPost = {
  title: 'Gia sư Toán lớp 9', subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'OFFLINE',
  price: '150000', schedule: 'Tối thứ 3', description: 'Dạy kèm',
};

test('post schemas: create defaults to DRAFT, price coerced, system fields rejected', () => {
  const created = createTutorPostSchema.safeParse(validPost);
  assert.equal(created.success, true);
  assert.equal(created.data.status, 'DRAFT');
  assert.equal(created.data.price, 150000);
  assert.equal(createTutorPostSchema.safeParse({ ...validPost, status: 'PUBLISHED' }).success, true);
  for (const status of ['HIDDEN', 'DELETED', 'PENDING_MODERATION']) {
    assert.equal(createTutorPostSchema.safeParse({ ...validPost, status }).success, false, status);
  }
  for (const extra of [{ profile_id: String(newId()) }, { image_urls: [] }, { created_at: 'x' }]) {
    assert.equal(createTutorPostSchema.safeParse({ ...validPost, ...extra }).success, false);
  }
  assert.equal(createTutorPostSchema.safeParse({ ...validPost, price: '0' }).success, false);
  // Học phí phải lớn hơn 1.000đ: đúng 1000 bị từ chối, 1001 hợp lệ
  assert.equal(createTutorPostSchema.safeParse({ ...validPost, price: '1000' }).success, false);
  assert.equal(createTutorPostSchema.safeParse({ ...validPost, price: '1001' }).success, true);
  assert.equal(createTutorPostSchema.safeParse({ ...validPost, teaching_mode: 'EITHER' }).success, false);
  assert.equal(createTutorPostSchema.safeParse({ ...validPost, title: '  ' }).success, false);
});

test('post schemas: update has no status, status endpoint only allows DRAFT/PUBLISHED/HIDDEN', () => {
  assert.equal(updateTutorPostSchema.safeParse(validPost).success, true);
  assert.equal(updateTutorPostSchema.safeParse({ ...validPost, status: 'PUBLISHED' }).success, false);
  for (const status of ['DRAFT', 'PUBLISHED', 'HIDDEN']) assert.equal(tutorPostStatusSchema.safeParse({ status }).success, true);
  for (const status of ['DELETED', 'PENDING_MODERATION', 'x']) assert.equal(tutorPostStatusSchema.safeParse({ status }).success, false);
  assert.deepEqual(tutorPostListQuerySchema.parse({}), { page: 1, limit: 10 });
});

test('post DTO: price as number and moderation lock flag', () => {
  const dto = toTutorPostDto({ _id: newId(), ...validPost, price: mongoose.Types.Decimal128.fromString('150000'), status: 'PENDING_MODERATION', profile_id: newId() });
  assert.equal(dto.price, 150000);
  assert.equal(dto.is_locked, true);
  assert.equal('profile_id' in dto, false);
  assert.equal(toTutorPostDto({ _id: newId(), ...validPost, status: 'PUBLISHED' }).is_locked, false);
});

test('message body: trimmed, required, length limited, no system fields', () => {
  assert.equal(sendMessageSchema.parse({ content: '  xin chào  ' }).content, 'xin chào');
  assert.equal(sendMessageSchema.safeParse({ content: '   ' }).success, false);
  assert.equal(sendMessageSchema.safeParse({}).success, false);
  assert.equal(sendMessageSchema.safeParse({ content: 'x'.repeat(2001) }).success, false);
  assert.equal(sendMessageSchema.safeParse({ content: 'hi', sender_user_id: String(newId()) }).success, false);
  assert.equal(sendMessageSchema.safeParse({ content: 'hi', message_type: 'FILE' }).success, false);
});

test('message DTO marks my messages and hides the sender id', () => {
  const me = newId();
  const dto = toMessageDto({ _id: newId(), content: 'hi', message_type: 'TEXT', sender_user_id: me, created_at: new Date(), conversation_id: newId() }, String(me));
  assert.equal(dto.sender_is_me, true);
  assert.equal('sender_user_id' in dto, false);
  assert.equal(toMessageDto({ _id: newId(), content: 'hi', sender_user_id: newId() }, String(me)).sender_is_me, false);
});
