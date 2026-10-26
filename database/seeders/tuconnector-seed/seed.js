// Nạp dữ liệu mẫu vào MongoDB.
//   MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/" node seed.js
//   thêm --drop để xóa dữ liệu cũ của các collection trước khi nạp
//   thêm --only=User,PLANS để chỉ nạp vài collection
//   dùng luôn URI của backend: node --env-file=../../../backend/.env seed.js
// Nên chạy init_tuconnector.js trước để có validator + index.
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
// Tên DB: biến DB_NAME nếu có, không thì lấy theo URI (vd .../WDP_DB), URI không ghi tên DB thì dùng 'tuconnector'
const DB_NAME = process.env.DB_NAME || (URI || '').match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/)?.[1] || 'WDP_DB';
const DROP = process.argv.includes('--drop');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice(7).split(',') : null;

if (!URI) {
  console.error('Thiếu biến môi trường MONGODB_URI');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const dir = path.join(__dirname, 'collections');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  let total = 0;
  try {
    for (const f of files) {
      const name = path.basename(f, '.js');
      if (ONLY && !ONLY.includes(name)) continue;
      const docs = require(path.join(dir, f));
      const col = db.collection(name);
      if (DROP) await col.deleteMany({});
      if (docs.length) {
        // upsert theo _id: chạy lại nhiều lần không bị lỗi trùng khóa
        const ops = docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } }));
        await col.bulkWrite(ops, { ordered: true });
      }
      total += docs.length;
      console.log(`${name.padEnd(28)} ${docs.length} document`);
    }
    console.log(`Xong: ${total} document vào DB ${DB_NAME}.`);
  } catch (e) {
    console.error('Lỗi:', e.message);
    if (e.errInfo) console.error(JSON.stringify(e.errInfo, null, 2)); // chi tiết lỗi validator
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
