// _id cố định cho mọi document seed, để các file tham chiếu chéo nhau đúng.
// Mỗi _id được sinh ổn định từ tên (chạy lại vẫn ra đúng giá trị đó).
// Thêm document mới: thêm 1 tên vào danh sách NAMES rồi dùng ids.<tên>.
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const NAMES = [
  // User
  'user_admin', 'user_tutor_minh', 'user_tutor_lan', 'user_tutor_huy',
  'user_parent_ha', 'user_parent_tuan', 'user_student_an', 'user_student_binh', 'user_student_chi',
  // TUTOR_PROFILES
  'tp_minh', 'tp_lan', 'tp_huy',
  // PLANS, CREDIT_PACKS
  'plan_tutor_free', 'plan_tutor_pro', 'plan_parent_free', 'plan_parent_pro', 'pack_10', 'pack_30',
  // Tìm gia sư
  'req_toan9', 'req_anh7', 'req_ly11', 'post_minh_toan', 'post_lan_anh', 'post_huy_ly',
  'apply_minh_toan9', 'apply_huy_toan9', 'apply_huy_ly11', 'inv_lan_anh7', 'inv_minh_ly11',
  'bm_huy_ly11', 'ss_ha_toan', 'ais_ly11_huy', 'aips_minh_ly11',
  // Chat, thỏa thuận
  'conv_ha_minh', 'conv_tuan_lan', 'conv_class_toan9',
  'msg_1', 'msg_2', 'msg_3', 'msg_4', 'msg_5', 'msg_6',
  'agr_ha_minh', 'agr_tuan_lan',
  // Lớp học
  'class_toan9', 'class_toan8_minh', 'class_anh7_lan', 'class_anh8_lan', 'class_ly11_huy', 'class_ly10_huy',
  'topic_dai_so', 'topic_hinh_hoc', 'topic_chapter3', 'mem_an', 'mem_ha', 'mem_binh_minh_toan8', 'mem_binh_lan_anh7',
  'mem_chi_lan_anh8', 'mem_chi_huy_ly11', 'mem_an_huy_ly10', 'ann_1', 'mat_1', 'mat_2',
  'mat_meomeo', 'mat_zip_thu', 'mat_oke_roi', 'mat_adfasdf', 'mat_sdfa', 'mat_sdf',
  'asg_1', 'q_1', 'q_2', 'q_3', 'sub_an_1',
  'rule_toan9', 'ses_1', 'ses_2', 'ses_hup_1113', 'ses_hup_1114', 'ses_meommeoe_1115',
  'scr_1', 'rem_1', 'rem_2', 'cal_minh', 'sync_ses2_minh',
  // Thanh toán, credit
  'order_1', 'order_2', 'order_3',
  'tx_minh_grant', 'tx_minh_apply', 'tx_huy_grant', 'tx_huy_apply_1', 'tx_huy_apply_2', 'tx_lan_grant',
  'tx_ha_grant', 'tx_ha_purchase', 'tx_ha_invite', 'tx_tuan_grant', 'tx_tuan_invite',
  // Khác
  'rev_1', 'noti_1', 'noti_2', 'noti_3', 'pcl_ha_an', 'pcl_tuan_binh', 'pcl_ha_chi',
  'evt_chi', 'prt_tuan', 'sess_minh', 'audit_1', 'report_1',
];

const FIXED_ID_VALUES = {
  topic_chapter3: '6af5cf214abfef91af5e459a',
  mat_meomeo: '6af5cf384abfef91af5e45a3',
  mat_zip_thu: '6af5eb303576a53feee02103',
  mat_oke_roi: '6af5ed013576a53feee02174',
  mat_adfasdf: '6af5ede83576a53feee02197',
  mat_sdfa: '6af5eeec3576a53feee021d2',
  mat_sdf: '6af5f5d371cb9f64a6149dd2',
  ses_hup_1113: '6af60716afbd064579414e44',
  ses_hup_1114: '6af60824afbd064579414e4c',
  ses_meommeoe_1115: '6af60829afbd064579414e54',
};

const ids = {};
for (const n of NAMES) {
  const fixedId = FIXED_ID_VALUES[n];
  const idHex = fixedId || crypto.createHash('md5').update('tuconnector:' + n).digest('hex').slice(0, 24);
  ids[n] = new ObjectId(idHex);
}
module.exports = new Proxy(ids, {
  get(t, k) {
    if (typeof k === 'string' && !(k in t)) throw new Error(`ids.${k} chưa khai báo trong ids.js`);
    return t[k];
  },
});
