// Xuất mỗi collection ra json/<Tên>.json (Extended JSON) để import tay bằng MongoDB Compass:
// Compass → chọn collection → Add Data → Import JSON or CSV file → chọn file tương ứng.
// Extended JSON giữ đúng kiểu ObjectId, Date, Decimal128, Int32, Double.
const fs = require('fs');
const path = require('path');
const { EJSON } = require('mongodb').BSON;

const dir = path.join(__dirname, 'collections');
const out = path.join(__dirname, 'json');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
  const name = path.basename(f, '.js');
  const docs = require(path.join(dir, f));
  fs.writeFileSync(path.join(out, name + '.json'), EJSON.stringify(docs, null, 2, { relaxed: false }));
}
console.log('Đã xuất ra thư mục json/');
