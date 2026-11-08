import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  confirmAgreementSchema,
  proposeAgreementSchema,
  rateTutorSchema,
} from '../../src/common/validator/agreementSchema.js';
import { resolveReportSchema } from '../../src/common/validator/moderationSchema.js';
import { updatePreferencesSchema } from '../../src/common/validator/notificationSchema.js';
import * as agreementService from '../../src/services/agreement.service.js';
import * as moderationService from '../../src/services/moderation.service.js';
import * as statsService from '../../src/services/stats.service.js';
import * as notificationService from '../../src/services/notification.service.js';

const newId = () => new mongoose.Types.ObjectId().toString();

test('UC16 agreement schemas: proposeAgreementSchema validates ObjectId and positive price', () => {
  const valid = proposeAgreementSchema.safeParse({
    conversation_id: newId(),
    agreed_subject: 'Toán lớp 9',
    agreed_schedule: 'Thứ 3, Thứ 5 (19:00 - 20:30)',
    agreed_price: '250000',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.agreed_price, 250000);

  // Rejects invalid ObjectId, negative price, or unknown fields
  assert.equal(proposeAgreementSchema.safeParse({ conversation_id: 'invalid-id' }).success, false);
  assert.equal(proposeAgreementSchema.safeParse({ agreed_price: -100 }).success, false);
  assert.equal(proposeAgreementSchema.safeParse({ status: 'CONFIRMED' }).success, false);
});

test('UC16 agreement schemas: confirmAgreementSchema allows CONFIRM, REJECT, CANCEL only', () => {
  for (const action of ['CONFIRM', 'REJECT', 'CANCEL']) {
    assert.equal(confirmAgreementSchema.safeParse({ action }).success, true, action);
  }
  assert.equal(confirmAgreementSchema.safeParse({ action: 'APPROVE' }).success, false);
  assert.equal(confirmAgreementSchema.safeParse({ action: 'CONFIRM', extra: true }).success, false);
});

test('UC16 / UC36 rateTutorSchema: enforces 1-5 integer ratings (BR-07)', () => {
  const ok = rateTutorSchema.safeParse({
    rating: '5',
    knowledge_rating: 5,
    punctuality_rating: 4,
    communication_rating: 5,
    comment: 'Gia sư dạy rất dễ hiểu!',
  });
  assert.equal(ok.success, true);
  assert.equal(ok.data.rating, 5);

  assert.equal(rateTutorSchema.safeParse({ rating: 0 }).success, false);
  assert.equal(rateTutorSchema.safeParse({ rating: 6 }).success, false);
  assert.equal(rateTutorSchema.safeParse({ rating: 4.5 }).success, false);
});

test('UC33 notification preferences schema: validates boolean flags and rejects unknown fields', () => {
  const ok = updatePreferencesSchema.safeParse({
    enable_in_app: true,
    enable_email: true,
    enable_sms: false,
    notify_on_sessions: true,
    notify_on_assignments: false,
    notify_on_messages: true,
  });
  assert.equal(ok.success, true);
  assert.equal(updatePreferencesSchema.safeParse({ enable_email: 'yes' }).success, false);
  assert.equal(updatePreferencesSchema.safeParse({ unknown_flag: true }).success, false);
});

test('UC38 moderation resolveReportSchema: enforces action enum and mandatory admin_note (BR-16)', () => {
  for (const action of ['NONE', 'WARNING_SENT', 'CONTENT_HIDDEN', 'CONTENT_REMOVED', 'USER_BANNED']) {
    const parsed = resolveReportSchema.safeParse({
      action,
      admin_note: 'Xử lý theo quy định kiểm duyệt BR-16',
    });
    assert.equal(parsed.success, true, action);
  }

  // Missing or blank admin_note must fail
  assert.equal(resolveReportSchema.safeParse({ action: 'CONTENT_HIDDEN', admin_note: '   ' }).success, false);
  assert.equal(resolveReportSchema.safeParse({ action: 'INVALID', admin_note: 'note' }).success, false);
});

test('Role guards on UC16, UC38, UC40 services reject unauthorized roles with 403', async () => {
  const studentUser = { id: newId(), role: 'STUDENT' };
  const parentUser = { id: newId(), role: 'PARENT' };
  const tutorUser = { id: newId(), role: 'TUTOR' };

  // Student cannot access agreements (only PARENT and TUTOR)
  await assert.rejects(
    () => agreementService.getConnections(studentUser),
    (err) => err.status === 403
  );

  // Tutor cannot rate tutor (only PARENT per BR-07)
  await assert.rejects(
    () => agreementService.rateTutor(tutorUser, newId(), { rating: 5 }),
    (err) => err.status === 403
  );

  // Non-ADMIN cannot access Moderation (UC38) or System Statistics (UC40)
  await assert.rejects(
    () => moderationService.getReports(parentUser, {}),
    (err) => err.status === 403
  );
  await assert.rejects(
    () => moderationService.getAuditLogs(tutorUser),
    (err) => err.status === 403
  );
  await assert.rejects(
    () => statsService.getDashboardStats(parentUser, '30d'),
    (err) => err.status === 403
  );
});

test('UC33 notification service validates notificationId format with 404 on invalid ObjectId', async () => {
  const user = { id: newId(), role: 'PARENT' };
  await assert.rejects(
    () => notificationService.markAsRead(user, 'bad-id'),
    (err) => err.status === 404
  );
  await assert.rejects(
    () => notificationService.deleteNotification(user, 'bad-id'),
    (err) => err.status === 404
  );
});

