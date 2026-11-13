import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ClassMember } from '../../src/models/ClassMember.js';
import { Notification } from '../../src/models/Notification.js';
import { ParentChildLink } from '../../src/models/ParentChildLink.js';
import { User } from '../../src/models/User.js';
import * as notificationService from '../../src/services/notification.service.js';

const newId = () => new mongoose.Types.ObjectId().toString();

// Giả lập chuỗi query Mongoose: Model.find(...).select(...).lean()
const queryResult = (value) => ({
  select: () => ({ lean: async () => value }),
});

test('notifyParentsOfClassStudents: báo phụ huynh của học sinh trong lớp, bỏ người là thành viên lớp và người tắt thông báo', async (t) => {
  const classId = newId();
  const studentA = newId();
  const studentB = newId();
  const parentFollowing = newId();
  const parentMember = newId();
  const parentOptedOut = newId();

  t.mock.method(ClassMember, 'find', () => queryResult([
    { user_id: studentA },
    { user_id: studentB },
    { user_id: parentMember },
  ]));
  t.mock.method(User, 'find', (filter) => {
    if (filter.role === 'STUDENT') {
      return queryResult([
        { _id: studentA, full_name: 'Minh An' },
        { _id: studentB, full_name: 'Bảo Ngọc' },
      ]);
    }
    return queryResult([
      { _id: parentFollowing, notification_preferences: null },
      { _id: parentOptedOut, notification_preferences: { enable_in_app: true, notify_on_sessions: false } },
    ]);
  });
  t.mock.method(ParentChildLink, 'find', () => queryResult([
    { parent_user_id: parentFollowing, student_user_id: studentA },
    { parent_user_id: parentFollowing, student_user_id: studentB },
    { parent_user_id: parentMember, student_user_id: studentA },
    { parent_user_id: parentOptedOut, student_user_id: studentB },
  ]));
  const inserted = [];
  t.mock.method(Notification, 'insertMany', async (docs) => {
    inserted.push(...docs);
    return docs;
  });

  const createdCount = await notificationService.notifyParentsOfClassStudents({
    classId: classId,
    category: 'SESSION',
    targetType: 'CLASSROOM',
    targetId: classId,
    preferenceKey: 'notify_on_sessions',
    excludeUserIds: [parentMember],
    buildContent: (childNames) => ({ title: `Lịch học mới cho ${childNames.join(', ')}`, body: 'x' }),
  });

  assert.equal(createdCount, 1);
  assert.equal(inserted.length, 1);
  assert.equal(String(inserted[0].recipient_user_id), parentFollowing);
  assert.equal(inserted[0].title, 'Lịch học mới cho Minh An, Bảo Ngọc');
  assert.equal(inserted[0].is_read, false);
});

test('notifyParentsOfClassStudents: lỗi DB chỉ ghi log, không làm hỏng thao tác của gia sư', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(ClassMember, 'find', () => {
    throw new Error('db down');
  });

  const createdCount = await notificationService.notifyParentsOfClassStudents({
    classId: newId(),
    category: 'SESSION',
    targetType: 'CLASSROOM',
    targetId: newId(),
    preferenceKey: null,
    buildContent: () => ({ title: 't', body: 'b' }),
  });
  assert.equal(createdCount, 0);
});

test('getNotifications: thông báo tin nhắn 1-1 trỏ thẳng tới hội thoại, thông báo thỏa thuận vẫn về trang hợp đồng', async (t) => {
  const conversationId = newId();
  const sortedResult = (value) => ({ sort: () => ({ limit: () => ({ lean: async () => value }) }) });
  t.mock.method(Notification, 'find', () => sortedResult([
    {
      _id: newId(),
      category: 'CONVERSATION',
      title: `${notificationService.DIRECT_MESSAGE_TITLE_PREFIX}Phạm Thu Hà`,
      target_type: 'CONVERSATION',
      target_id: conversationId,
    },
    {
      _id: newId(),
      category: 'CONVERSATION',
      title: 'Đề xuất thỏa thuận mới',
      target_type: 'CONVERSATION',
      target_id: conversationId,
    },
  ]));
  t.mock.method(Notification, 'countDocuments', async () => 2);

  const result = await notificationService.getNotifications({ id: newId(), role: 'TUTOR' });

  assert.equal(result.notifications[0].deepLink, `/tutor/messages/${conversationId}`);
  assert.equal(result.notifications[1].deepLink, '/tutor/contracts');
});

