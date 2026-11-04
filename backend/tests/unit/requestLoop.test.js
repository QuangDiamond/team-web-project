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

test('received invitation DTO never exposes parent or student information', () => {
  const request = {
    _id: newId(), title: 'T', subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'OFFLINE',
    budget: mongoose.Types.Decimal128.fromString('200000'), location_address: 'Cầu Giấy',
    parent_user_id: newId(), student_id: newId(), status: 'OPEN', created_at: new Date(),
  };
  const dto = toReceivedInvitationDto(
    { _id: newId(), status: 'PENDING', message: 'm', created_at: new Date(), parent_user_id: newId(), request_id: request._id },
    request,
    null
  );
  const text = JSON.stringify(dto);
  assert.equal(text.includes(String(request.parent_user_id)), false);
  assert.equal(text.includes(String(request.student_id)), false);
  assert.equal('parent_user_id' in dto, false);
  assert.equal(dto.request.budget, 200000);
  assert.equal(dto.request.is_available, true);
  assert.equal(dto.conversation_id, null);
});

test('received invitation DTO marks an old or closed request as unavailable', () => {
  const oldRequest = { _id: newId(), status: 'OPEN', created_at: new Date('2020-01-01'), budget: null };
  assert.equal(toReceivedInvitationDto({ _id: newId(), status: 'PENDING' }, oldRequest, null).request.is_available, false);
  const closed = { _id: newId(), status: 'CLOSED', created_at: new Date(), budget: null };
  assert.equal(toReceivedInvitationDto({ _id: newId(), status: 'PENDING' }, closed, null).request.is_available, false);
  assert.equal(toReceivedInvitationDto({ _id: newId(), status: 'PENDING' }, null, null).request, null);
});
