import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { toReceivedApplicationDto } from '../../src/services/application.service.js';
import { toReceivedInvitationDto } from '../../src/services/invitation.service.js';

const newId = () => new mongoose.Types.ObjectId();

test('received application DTO exposes the tutor summary and conversation id only', () => {
  const tutor = { profile_id: String(newId()), full_name: 'Tutor A', headline: 'h', average_rating: 4.5, avatar_url: null, is_active: true };
  const dto = toReceivedApplicationDto(
    { _id: newId(), status: 'CONTINUED', note: 'hi', match_score: 88, created_at: new Date(), request_id: newId(), tutor_profile_id: newId() },
    tutor,
    'conv-1'
  );
  assert.equal(dto.status, 'CONTINUED');
  assert.equal(dto.conversation_id, 'conv-1');
  assert.equal(dto.tutor.full_name, 'Tutor A');
  assert.equal('request_id' in dto, false);
  assert.equal('tutor_profile_id' in dto, false);
});

test('received invitation DTO exposes only its parent navigation ID and excludes private parent/student data', () => {
  const parentId = newId();
  const request = {
    _id: newId(), title: 'T', subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'OFFLINE',
    budget: mongoose.Types.Decimal128.fromString('200000'), location_address: 'Cầu Giấy',
    parent_user_id: newId(), student_id: newId(), status: 'OPEN', created_at: new Date(),
    parent: { email: 'private@example.com' }, student: { full_name: 'Private child' },
    email: 'private@example.com', phone: '0912345678', contact: 'Private contact',
  };
  const dto = toReceivedInvitationDto(
    { _id: newId(), status: 'PENDING', message: 'm', created_at: new Date(), parent_user_id: parentId, request_id: request._id,
      parent: { email: 'private@example.com' }, parent_user: { phone: '0912345678' },
      email: 'private@example.com', phone: '0912345678', contact: 'Private contact', student_id: request.student_id },
    request,
    null
  );
  const text = JSON.stringify(dto);
  assert.equal(text.includes(String(request.parent_user_id)), false);
  assert.equal(text.includes(String(request.student_id)), false);
  assert.equal(dto.parent_user_id, String(parentId));
  for (const value of [dto, dto.request]) {
    for (const forbidden of ['student_id', 'student', 'parent', 'parent_user', 'email', 'phone', 'contact']) {
      assert.equal(forbidden in value, false, forbidden);
    }
  }
  assert.equal('parent_user_id' in dto.request, false);
  assert.equal(dto.request.budget, 200000);
  assert.equal(dto.request.is_available, true);
  assert.equal(dto.conversation_id, null);
});

test('received invitation DTO carries the request details the tutor needs to decide', () => {
  const request = {
    _id: newId(), title: 'T', subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'ONLINE', budget: null,
    schedule: 'T2, T4 · 4:00 PM - 6:00 PM', description: 'Ôn thi vào 10', tutor_requirements: 'Có kinh nghiệm', location_address: null,
    status: 'OPEN', created_at: new Date(),
  };
  const dto = toReceivedInvitationDto({ _id: newId(), status: 'PENDING', credits_spent: 3 }, request, null);
  assert.equal(dto.request.schedule, 'T2, T4 · 4:00 PM - 6:00 PM');
  assert.equal(dto.request.description, 'Ôn thi vào 10');
  assert.equal(dto.request.tutor_requirements, 'Có kinh nghiệm');
  assert.equal(dto.credits_spent, 3);
});

test('received invitation DTO marks an old or closed request as unavailable', () => {
  const oldRequest = { _id: newId(), status: 'OPEN', created_at: new Date('2020-01-01'), budget: null };
  assert.equal(toReceivedInvitationDto({ _id: newId(), status: 'PENDING' }, oldRequest, null).request.is_available, false);
  const closed = { _id: newId(), status: 'CLOSED', created_at: new Date(), budget: null };
  assert.equal(toReceivedInvitationDto({ _id: newId(), status: 'PENDING' }, closed, null).request.is_available, false);
  assert.equal(toReceivedInvitationDto({ _id: newId(), status: 'PENDING' }, null, null).request, null);
});
