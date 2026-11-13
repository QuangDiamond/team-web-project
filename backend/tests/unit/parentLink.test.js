import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { inviteStudentSchema, respondParentLinkSchema, parentLinkListQuerySchema } from '../../src/common/validator/parentLinkSchema.js';
import { decideInvite, toParentLinkDto } from '../../src/services/parentLink.service.js';

const newId = () => new mongoose.Types.ObjectId();
const NOW = new Date('2026-11-13T00:00:00Z');
const daysAgo = (days) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

test('invite decision: new link is created, accepted and pending links are rejected', () => {
  assert.deepEqual(decideInvite(null, NOW), { action: 'CREATE' });
  assert.equal(decideInvite({ status: 'ACCEPTED' }, NOW).action, 'REJECT');
  assert.equal(decideInvite({ status: 'PENDING' }, NOW).action, 'REJECT');
  assert.match(decideInvite({ status: 'ACCEPTED' }, NOW).message, /already linked/);
  assert.match(decideInvite({ status: 'PENDING' }, NOW).message, /already waiting/);
});

test('invite decision: a declined student can only be invited again after 7 days', () => {
  assert.equal(decideInvite({ status: 'DECLINED', updated_at: daysAgo(1) }, NOW).action, 'REJECT');
  assert.equal(decideInvite({ status: 'DECLINED', updated_at: daysAgo(6.9) }, NOW).action, 'REJECT');
  assert.equal(decideInvite({ status: 'DECLINED', updated_at: daysAgo(7) }, NOW).action, 'REOPEN');
  assert.equal(decideInvite({ status: 'DECLINED', updated_at: daysAgo(30) }, NOW).action, 'REOPEN');
  // Thiếu updated_at thì lấy created_at; thiếu cả hai coi như đã lâu
  assert.equal(decideInvite({ status: 'DECLINED', created_at: daysAgo(2) }, NOW).action, 'REJECT');
  assert.equal(decideInvite({ status: 'DECLINED' }, NOW).action, 'REOPEN');
});

test('invite body: email is trimmed and lower-cased, and only student_email is accepted', () => {
  assert.equal(inviteStudentSchema.parse({ student_email: '  Student.One@Example.COM ' }).student_email, 'student.one@example.com');
  assert.equal(inviteStudentSchema.safeParse({}).success, false);
  assert.equal(inviteStudentSchema.safeParse({ student_email: 'not-an-email' }).success, false);
  assert.equal(inviteStudentSchema.safeParse({ student_email: '' }).success, false);
  assert.equal(inviteStudentSchema.safeParse({ student_email: `${'a'.repeat(250)}@x.vn` }).success, false);
  assert.equal(inviteStudentSchema.safeParse({ student_email: 'a@b.vn', parent_user_id: String(newId()) }).success, false);
  assert.equal(inviteStudentSchema.safeParse({ student_email: 'a@b.vn', status: 'ACCEPTED' }).success, false);
});

test('respond body and list query accept only valid values', () => {
  assert.equal(respondParentLinkSchema.safeParse({ action: 'ACCEPT' }).success, true);
  assert.equal(respondParentLinkSchema.safeParse({ action: 'DECLINE' }).success, true);
  assert.equal(respondParentLinkSchema.safeParse({ action: 'accept' }).success, false);
  assert.equal(respondParentLinkSchema.safeParse({ action: 'ACCEPT', status: 'ACCEPTED' }).success, false);
  assert.equal(parentLinkListQuerySchema.parse({}).limit, 10);
  assert.equal(parentLinkListQuerySchema.safeParse({ status: 'ACCEPTED' }).success, true);
  assert.equal(parentLinkListQuerySchema.safeParse({ status: 'BOGUS' }).success, false);
});

test('link DTO shows the other side by viewer role and never leaks password data', () => {
  const link = { _id: newId(), status: 'PENDING', created_at: NOW, updated_at: NOW, parent_user_id: newId(), student_user_id: newId() };
  const other = { _id: newId(), full_name: 'Học sinh A', email: 'a@x.vn', avatar_url: null, password_hash: 'secret-hash', phone: '0900000000' };

  const asParent = toParentLinkDto(link, other, 'PARENT');
  assert.equal(asParent.student.full_name, 'Học sinh A');
  assert.equal('parent' in asParent, false);
  const asStudent = toParentLinkDto(link, other, 'STUDENT');
  assert.equal(asStudent.parent.email, 'a@x.vn');
  assert.equal('student' in asStudent, false);
  assert.equal(JSON.stringify([asParent, asStudent]).includes('secret-hash'), false);
  assert.equal(JSON.stringify([asParent, asStudent]).includes('0900000000'), false);
  assert.equal(toParentLinkDto(link, null, 'PARENT').student, null);
});
