const crypto = require('crypto');
const { ObjectId } = require('mongodb');

module.exports = Array.from({ length: 12 }, (_, index) => {
  const grade = index + 1;
  const id = crypto.createHash('md5').update(`tuconnector:grade:${grade}`).digest('hex').slice(0, 24);
  return { _id: new ObjectId(id), name: `Lớp ${grade}`, sort_order: grade, is_active: true };
});
