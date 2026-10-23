const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  { _id: ids.mat_1, class_id: ids.class_toan9, topic_id: ids.topic_dai_so, uploader_profile_id: ids.tp_minh, title: 'Lý thuyết căn bậc hai', material_type: 'DOCUMENT', file_url: 'https://cdn.tuconnector.vn/materials/can-bac-hai.pdf', file_size: 1048576, visibility: 'ALL_MEMBERS', created_at: d('2026-10-12T10:00:00+07:00'), updated_at: d('2026-10-12T10:00:00+07:00') },
  { _id: ids.mat_2, class_id: ids.class_toan9, topic_id: ids.topic_hinh_hoc, uploader_profile_id: ids.tp_minh, title: 'Video: hệ thức lượng', material_type: 'LINK', file_url: 'https://youtube.com/watch?v=seed', file_size: null, visibility: 'STUDENTS_ONLY', created_at: d('2026-10-14T10:00:00+07:00'), updated_at: d('2026-10-14T10:00:00+07:00') },
];
