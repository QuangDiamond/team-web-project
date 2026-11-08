import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { buildMarketplaceSeed, demoId, DEMO_PASSWORD, MARKETPLACE_SUBJECT_NAMES, MARKETPLACE_GRADE_NAMES } from './fixtures/marketplace.js';
import { User } from '../src/models/User.js';
import { TutorProfile } from '../src/models/TutorProfile.js';
import { TutorPost } from '../src/models/TutorPost.js';
import { ParentRequest } from '../src/models/ParentRequest.js';
import { ApplyRequest } from '../src/models/ApplyRequest.js';
import { TutorInvitation } from '../src/models/TutorInvitation.js';
import { Conversation } from '../src/models/Conversation.js';
import { Message } from '../src/models/Message.js';
import { CreditTransaction } from '../src/models/CreditTransaction.js';
import { Subject } from '../src/models/Subject.js';
import { GradeLevel } from '../src/models/GradeLevel.js';
import { Plan } from '../src/models/Plan.js';

export const marketplaceModels = {
  users: User, profiles: TutorProfile, posts: TutorPost, requests: ParentRequest,
  applications: ApplyRequest, invitations: TutorInvitation, conversations: Conversation,
  messages: Message, transactions: CreditTransaction,
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (process.argv.slice(2).some((argument) => argument !== '--dry-run')) {
    throw new Error('Usage: npm run seed:marketplace -- [--dry-run]');
  }
  if (!dryRun) {
    const { env } = await import('../src/config/environment.js');
    if (env.nodeEnv === 'production') throw new Error('Demo seed is disabled in production.');
    if (!env.mongodbUri) throw new Error('MONGODB_URI is required.');
    await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
  }

  const plans = {};
  for (const role of ['TUTOR', 'PARENT']) {
    if (dryRun) {
      plans[role] = demoId(`plan:${role}`);
      continue;
    }
    const plan = await Plan.findOne({ target_role: role, monthly_price: 0, is_active: true }).lean();
    if (!plan) throw new Error(`Missing active Free plan for ${role}. Initialize plans first.`);
    plans[role] = plan._id;
  }

  const categories = {};
  const categoryBatches = [];
  for (const [Model, names] of [[Subject, MARKETPLACE_SUBJECT_NAMES], [GradeLevel, MARKETPLACE_GRADE_NAMES]]) {
    const documents = [];
    for (const name of names) {
      const existing = dryRun ? null : await Model.findOne({ name }).lean();
      if (existing && !existing.is_active) throw new Error(`Category is inactive: ${name}. No data was written.`);
      const document = existing || { _id: demoId(`category:${Model.modelName}:${name}`), name, is_active: true };
      categories[name] = document._id;
      documents.push(document);
    }
    categoryBatches.push([Model, documents]);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const dataset = buildMarketplaceSeed({ passwordHash, categories, plans });
  const batches = [...categoryBatches, ...Object.entries(marketplaceModels).map(([key, Model]) => [Model, dataset[key]])];
  // Validate every document before the first write; never replace existing accounts or seed edits.
  for (const [Model, documents] of batches) {
    for (const document of documents) {
      await new Model(document).validate();
    }
  }
  if (!dryRun) {
    for (const user of dataset.users) {
      const collision = await User.findOne({ email: user.email, _id: { $ne: user._id } }).lean();
      if (collision) throw new Error(`Email already belongs to another account: ${user.email}. No data was written.`);
    }
  }
  for (const [Model, documents] of batches) {
    if (dryRun) {
      console.log(`${Model.collection.name}: ${documents.length} documents validated.`);
      continue;
    }
    const result = await Model.bulkWrite(documents.map((document) => ({ updateOne: {
      filter: { _id: document._id },
      update: { $setOnInsert: new Model(document).toObject({ getters: false }) },
      upsert: true, timestamps: false,
    } })), { ordered: true, timestamps: false });
    console.log(`${Model.collection.name}: inserted ${result.upsertedCount}; existing documents preserved.`);
  }
  console.log(dryRun ? 'Dry run passed. No database connection or writes.' : 'Marketplace demo seed completed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error('Marketplace seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
