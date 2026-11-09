import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { buildMarketplaceSeed, demoId, DEMO_PASSWORD, MARKETPLACE_SUBJECT_NAMES, MARKETPLACE_GRADE_NAMES } from '../../scripts/fixtures/marketplace.js';
import { marketplaceModels } from '../../scripts/seed-marketplace.js';

test('marketplace seed has valid linked records, usable passwords and consistent credits', async () => {
  const categories = Object.fromEntries([...MARKETPLACE_SUBJECT_NAMES, ...MARKETPLACE_GRADE_NAMES].map((name) => [name, demoId(name)]));
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const options = { passwordHash, categories, plans: { TUTOR: demoId('tutor-plan'), PARENT: demoId('parent-plan') }, now: new Date('2026-11-09T12:00:00Z') };
  const data = buildMarketplaceSeed(options);
  assert.equal(await bcrypt.compare('Abc123456!', passwordHash), true);
  assert.equal(await bcrypt.compare('wrong-password', passwordHash), false);
  assert.equal(data.users.length, 44);
  assert.equal(data.profiles.length, 16);
  assert.equal(data.posts.length, 32);
  assert.equal(data.requests.length, 108);
  assert.equal(data.applications.length, 72);
  assert.equal(data.invitations.length, 24);
  assert.deepEqual(new Set(data.applications.map((item) => item.status)), new Set(['PENDING', 'CONTINUED', 'SKIPPED']));
  assert.deepEqual(new Set(data.invitations.map((item) => item.status)), new Set(['PENDING', 'ACCEPTED', 'DECLINED']));

  const ids = (items) => new Set(items.map((item) => String(item._id)));
  const userIds = ids(data.users);
  const profileIds = ids(data.profiles);
  const requestIds = ids(data.requests);
  const conversationIds = ids(data.conversations);
  for (const [key, Model] of Object.entries(marketplaceModels)) {
    assert.equal(ids(data[key]).size, data[key].length);
    for (const document of data[key]) await new Model(document).validate();
  }
  for (const profile of data.profiles) assert.ok(userIds.has(String(profile.user_id)));
  for (const post of data.posts) assert.ok(profileIds.has(String(post.profile_id)));
  const chatPairs = new Set(data.conversations.map((chat) => `${chat.request_id}:${chat.tutor_profile_id}`));
  assert.equal(chatPairs.size, data.conversations.length);
  for (const [index, request] of data.requests.entries()) {
    assert.ok(userIds.has(String(request.parent_user_id)));
    assert.equal(data.applications.filter((application) => String(application.request_id) === String(request._id)).length, index < 12 ? 6 : 0);
    assert.ok(categories[request.subject_name]);
    assert.ok(categories[request.grade_level]);
  }
  const newRequests = data.requests.slice(12);
  assert.equal(new Set(newRequests.map((request) => request.subject_name)).size, 12);
  assert.ok(new Set(newRequests.map((request) => request.grade_level)).size >= 16);
  assert.equal(new Set(newRequests.map((request) => request.teaching_mode)).size, 3);
  assert.equal(new Set(newRequests.map((request) => request.location_address)).size, 6);
  assert.equal(new Set(newRequests.map((request) => request.schedule)).size, 8);
  assert.ok(new Set(newRequests.map((request) => request.budget.toString())).size >= 10);
  for (const parent of data.users.filter((user) => user.role === 'PARENT').slice(4)) {
    assert.equal(newRequests.filter((request) => String(request.parent_user_id) === String(parent._id)).length, 4);
  }
  for (const item of [...data.applications, ...data.invitations]) {
    assert.ok(requestIds.has(String(item.request_id)));
    assert.ok(profileIds.has(String(item.tutor_profile_id)));
    const shouldHaveChat = item.status === 'CONTINUED' || item.status === 'ACCEPTED';
    assert.equal(chatPairs.has(`${item.request_id}:${item.tutor_profile_id}`), shouldHaveChat);
  }
  for (const message of data.messages) {
    assert.ok(conversationIds.has(String(message.conversation_id)));
    assert.ok(userIds.has(String(message.sender_user_id)));
  }
  for (const user of data.users) {
    const balance = data.transactions.filter((item) => String(item.user_id) === String(user._id)).reduce((sum, item) => sum + item.amount, 0);
    assert.equal(balance, user.credit_wallet.balance);
    assert.ok(balance > 0);
    assert.notEqual(user.password_hash, DEMO_PASSWORD);
  }
  const again = buildMarketplaceSeed(options);
  for (const key of Object.keys(marketplaceModels)) assert.deepEqual([...ids(data[key])], [...ids(again[key])]);
});
