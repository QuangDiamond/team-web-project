const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const MARKETPLACE_GRADES = ['IELTS', 'TOEIC', 'JLPT N5', 'JLPT N4', 'JLPT N3', 'Giao tiếp', 'Cơ bản', 'Nâng cao'];
const marketplaceId = (name) => new ObjectId(crypto.createHash('sha256').update('tuconnector:marketplace-demo:v1:grade:' + name).digest('hex').slice(0, 24));

module.exports = Array.from({ length: 12 }, (_, index) => {
  const grade = index + 1;
  const id = crypto.createHash('md5').update(`tuconnector:grade:${grade}`).digest('hex').slice(0, 24);
  return { _id: new ObjectId(id), name: `Lớp ${grade}`, sort_order: grade, is_active: true };
}).concat(MARKETPLACE_GRADES.map((name, index) => ({ _id: marketplaceId(name), name, sort_order: 13 + index, is_active: true })));
