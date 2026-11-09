import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgreementForm, getConnectedRequests } from '../src/utils/agreementForm.js';

const conversations = [
  { _id: 'c1', request_id: 'r1', request_title: 'Tìm gia sư', tutor_name: 'Gia sư A', subject_name: 'Toán', grade_level: 'Lớp 9', schedule: 'Thứ 3, 5 — 19:30 đến 21:00', budget: { $numberDecimal: '250000' } },
  { _id: 'c2', request_id: 'r1', request_title: 'Tìm gia sư', tutor_name: 'Gia sư B' },
  { _id: 'c3', request_id: 'r2', request_title: 'Tìm gia sư', tutor_name: 'Gia sư C' },
  { _id: 'c4', request_id: null, request_title: 'Hội thoại cũ' },
];

test('request picker groups by ID, not duplicate titles, and excludes missing requests', () => {
  assert.deepEqual(getConnectedRequests(conversations), [
    { value: 'r1', label: 'Tìm gia sư' }, { value: 'r2', label: 'Tìm gia sư' },
  ]);
  assert.deepEqual(getConnectedRequests([]), []);
});

test('agreement defaults use the selected request and keep decimal tuition numeric', () => {
  assert.deepEqual(createAgreementForm(conversations[0]), {
    requestId: 'r1', conversationId: 'c1', subject: 'Toán Lớp 9',
    schedule: 'Thứ 3, 5 — 19:30 đến 21:00', price: '250000',
  });
  assert.equal(createAgreementForm(conversations[2]).conversationId, 'c3');
  assert.equal(createAgreementForm(undefined).conversationId, '');
});
