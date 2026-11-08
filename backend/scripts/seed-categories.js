import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { env } from '../src/config/environment.js';
import { Subject } from '../src/models/Subject.js';
import { GradeLevel } from '../src/models/GradeLevel.js';

const require = createRequire(import.meta.url);
const subjects = require('../../database/seeders/tuconnector-seed/collections/SUBJECTS.js');
const grades = require('../../database/seeders/tuconnector-seed/collections/GRADE_LEVELS.js');

try {
  if (!env.mongodbUri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
  for (const [Model, documents] of [[Subject, subjects], [GradeLevel, grades]]) {
    await Model.bulkWrite(documents.map((document) => ({ updateOne: {
      filter: { name: document.name }, update: { $setOnInsert: document }, upsert: true,
    } })));
    await Model.collection.createIndex({ name: 1 }, { unique: true });
    console.log(`${Model.modelName}: initialized missing items; existing settings preserved.`);
  }
} catch (error) {
  console.error('Category initialization failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
