// Kiểm tra dữ liệu seed với validator trong init_tuconnector.js mà không cần kết nối MongoDB:
// đúng kiểu BSON, đúng enum, đủ field bắt buộc, không thừa field lạ, _id không trùng, unique index không trùng.
const fs = require('fs');
const path = require('path');
const { BSON } = require('mongodb');

const schemas = {}; const indexes = [];
const fakeDb = {
  getSiblingDB: () => ({
    getCollectionNames: () => [],
    createCollection: (n, o) => { schemas[n] = o.validator.$jsonSchema; },
    runCommand: () => {},
    getCollection: (n) => ({ createIndex: (k, o) => indexes.push({ n, k, o: o || {} }) }),
  }),
};
new Function('db', 'print', fs.readFileSync(path.join(__dirname, 'init_tuconnector.js'), 'utf8'))(fakeDb, () => {});

const bsonTypeOf = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (v instanceof Date) return 'date';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'boolean') return 'bool';
  if (v && v._bsontype) return { ObjectId: 'objectId', Int32: 'int', Double: 'double', Decimal128: 'decimal', Long: 'long' }[v._bsontype] || v._bsontype;
  if (typeof v === 'object') return 'object';
  return typeof v;
};
function check(v, s, p, errs) {
  const t = bsonTypeOf(v);
  const allowed = [].concat(s.bsonType);
  if (!allowed.includes(t)) return errs.push(`${p}: kiểu ${t}, cần ${allowed.join('|')}`);
  if (s.enum && !s.enum.some((e) => e === (t === 'string' ? v : null))) errs.push(`${p}: giá trị "${v}" không thuộc enum`);
  if (t === 'object' && s.properties) {
    for (const r of s.required || []) if (!(r in v)) errs.push(`${p}.${r}: thiếu field bắt buộc`);
    for (const k of Object.keys(v)) {
      if (!s.properties[k]) errs.push(`${p}.${k}: field không có trong schema`);
      else check(v[k], s.properties[k], `${p}.${k}`, errs);
    }
  }
  if (t === 'array' && s.items) v.forEach((x, i) => check(x, s.items, `${p}[${i}]`, errs));
}
const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? undefined : a[x]), o);

let bad = 0, total = 0;
const dir = path.join(__dirname, 'collections');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
  const name = path.basename(f, '.js');
  if (!schemas[name]) { console.log(`✗ ${name}: không có collection này trong init_tuconnector.js`); bad++; continue; }
  const docs = require(path.join(dir, f));
  const errs = [];
  const seen = new Set();
  docs.forEach((doc, i) => {
    const raw = BSON.deserialize(BSON.serialize(doc), { promoteValues: false });
    check(raw, schemas[name], `[${i}]`, errs);
    const id = String(doc._id); if (seen.has(id)) errs.push(`[${i}]: _id trùng`); seen.add(id);
  });
  for (const ix of indexes.filter((x) => x.n === name && x.o.unique)) {
    const keys = Object.keys(ix.k); const vals = new Set();
    for (const doc of docs) {
      const parts = keys.map((k) => get(doc, k));
      if (ix.o.partialFilterExpression && parts.some((p) => p == null)) continue;
      const key = parts.map(String).join('|');
      if (vals.has(key)) errs.push(`trùng unique index (${keys.join(', ')}): ${key}`);
      vals.add(key);
    }
  }
  total += docs.length;
  if (errs.length) { bad++; console.log(`✗ ${name}`); errs.forEach((e) => console.log('   ' + e)); }
  else console.log(`✓ ${name.padEnd(28)} ${docs.length} document`);
}
const missing = Object.keys(schemas).filter((n) => !fs.existsSync(path.join(dir, n + '.js')));
if (missing.length) console.log('Chưa có file seed cho:', missing.join(', '));
console.log(bad ? `\nCó ${bad} collection lỗi.` : `\nTất cả hợp lệ: ${total} document.`);
process.exitCode = bad ? 1 : 0;
