// Seed tối thiểu cho UC39/UC17: 1 tài khoản ADMIN + các Plan / CreditPack mặc định.
// Chạy lại nhiều lần vẫn an toàn: admin đã có thì bỏ qua, collection đã có dữ liệu thì không nạp lại.
// Chạy: npm run seed:admin (đọc MONGODB_URI, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD từ backend/.env)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/environment.js';
import { User } from '../src/models/User.js';
import { Plan } from '../src/models/Plan.js';
import { CreditPack } from '../src/models/CreditPack.js';
import { createUser } from '../src/services/user.service.js';

const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@1234';
const DEFAULT_ADMIN_NAME = 'System Admin';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const seedJsonDir = path.resolve(currentDir, '../../database/seeders/tuconnector-seed/json');

// File JSON xuất từ Compass dùng Extended JSON ({ "$oid" }, { "$numberInt" }, { "$numberDecimal" }),
// đổi về giá trị thường để đưa vào Mongoose model
const convertExtendedJsonValue = (value) => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value.$oid !== undefined) {
    return new mongoose.Types.ObjectId(value.$oid);
  }
  if (value.$numberInt !== undefined) {
    return Number(value.$numberInt);
  }
  if (value.$numberDecimal !== undefined) {
    return value.$numberDecimal;
  }
  return value;
};

const readSeedJson = (fileName) => {
  const filePath = path.join(seedJsonDir, fileName);
  const documents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return documents.map((document) => {
    const converted = {};
    for (const key of Object.keys(document)) {
      converted[key] = convertExtendedJsonValue(document[key]);
    }
    return converted;
  });
};

const seedAdmin = async () => {
  const email = process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    if (existedUser.role !== 'ADMIN') {
      throw new Error(`User ${email} already exists but is not an ADMIN, choose another SEED_ADMIN_EMAIL`);
    }
    console.log(`Admin ${email} already exists, skipped`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await createUser({
    full_name: DEFAULT_ADMIN_NAME,
    email: email,
    password_hash: passwordHash,
    role: 'ADMIN',
  });
  // Admin do seed tạo không cần bấm link kích hoạt email
  await User.findByIdAndUpdate(admin._id, {
    email_verify_status: true,
    is_onboarded: true,
    account_status: 'ACTIVE',
  });
  console.log(`Created admin ${email}`);
};

const seedCollectionIfEmpty = async (Model, fileName, label) => {
  const total = await Model.countDocuments();
  if (total > 0) {
    console.log(`${label} already has ${total} documents, skipped`);
    return;
  }
  const documents = readSeedJson(fileName);
  await Model.insertMany(documents);
  console.log(`Inserted ${documents.length} ${label}`);
};

const main = async () => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is not configured.');
  }
  await mongoose.connect(env.mongodbUri);
  try {
    await seedAdmin();
    await seedCollectionIfEmpty(Plan, 'PLANS.json', 'plans');
    await seedCollectionIfEmpty(CreditPack, 'CREDIT_PACKS.json', 'credit packs');
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
