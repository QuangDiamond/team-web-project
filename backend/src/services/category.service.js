import mongoose from 'mongoose';
import { Subject } from '../models/Subject.js';
import { GradeLevel } from '../models/GradeLevel.js';
import { TutorPost } from '../models/TutorPost.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { AppError } from '../common/utils/AppError.js';

/**
 * Load authoritative active teaching catalogs for both suggestion directions.
 * @returns {Promise<{subjects: Object[], grades: Object[], catalog: Map}>} Active names keyed by type and ID.
 */
export const loadActiveTeachingCatalog = async () => {
  const [subjects, grades] = await Promise.all([
    Subject.find({ is_active: true }).select('_id name').lean(),
    GradeLevel.find({ is_active: true }).select('_id name').lean(),
  ]);
  const catalog = new Map();
  for (const item of subjects) catalog.set('subjects:' + item._id, item.name);
  for (const item of grades) catalog.set('grades:' + item._id, item.name);
  return { subjects, grades, catalog };
};

/**
 * Resolve a supported catalog without accepting arbitrary collection names.
 * @param {string} type - subjects or grades.
 * @returns {Object} Mongoose catalog model.
 */
export const getCategoryModel = (type) => {
  if (type === 'subjects') return Subject;
  if (type === 'grades') return GradeLevel;
  throw new AppError('Category type not found', 404);
};

/**
 * Save catalog settings, validate duplicate names and record the admin change.
 * @param {string} type - Catalog type.
 * @param {string|null} id - Existing item ID, or null to create.
 * @param {Object} data - Validated settings and reason.
 * @param {Object} admin - Admin ID and IP address.
 * @returns {Promise<Object>} Saved catalog item.
 */
export const saveCategory = async (type, id, data, admin) => {
  const Model = getCategoryModel(type);
  if (type === 'grades' && data.name.length > 50) {
    throw new AppError('Tên cấp học / trình độ tối đa 50 ký tự', 422);
  }
  let item = new Model();
  if (id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Category not found', 404);
    item = await Model.findById(id);
    if (!item) throw new AppError('Category not found', 404);
  }
  const duplicate = await Model.findOne({ name: data.name }).collation({ locale: 'vi', strength: 2 });
  if (duplicate && String(duplicate._id) !== String(item._id)) {
    throw new AppError('Tên danh mục đã tồn tại', 409);
  }
  let before = null;
  if (id) before = item.toObject();
  if (id && item.name !== data.name) {
    let field = 'subject_name';
    if (type === 'grades') field = 'grade_level';
    const [post, request, profile] = await Promise.all([
      TutorPost.exists({ [field]: item.name }), ParentRequest.exists({ [field]: item.name }),
      TutorProfile.exists({ teaching_categories: { $elemMatch: { type, category_id: item._id } } }),
    ]);
    if (post || request || profile) throw new AppError('Danh mục đang được sử dụng. Hãy tắt và tạo mục mới thay vì đổi tên.', 409);
  }
  item.set({ name: data.name, sort_order: data.sort_order, is_active: data.is_active });
  await item.save();
  await AdminAuditLog.create({
    admin_user_id: admin.id, ip_address: admin.ip, action: 'UPDATE_SETTINGS', reason: data.reason,
    details_json: { category: type, operation: id ? 'UPDATE' : 'CREATE', before, after: item.toObject() },
  });
  return item;
};

/**
 * Delete unused catalog entries while preserving names referenced by existing content.
 * @param {string} type - Catalog type.
 * @param {string} id - Item ID.
 * @param {string} reason - Admin reason.
 * @param {Object} admin - Admin ID and IP address.
 * @returns {Promise<{deleted: boolean}>} Deletion result.
 */
export const deleteCategory = async (type, id, reason, admin) => {
  const Model = getCategoryModel(type);
  if (!mongoose.isValidObjectId(id)) throw new AppError('Category not found', 404);
  const item = await Model.findById(id).lean();
  if (!item) throw new AppError('Category not found', 404);
  let field = 'subject_name';
  if (type === 'grades') field = 'grade_level';
  const [post, request, profile] = await Promise.all([
    TutorPost.exists({ [field]: item.name }), ParentRequest.exists({ [field]: item.name }),
    TutorProfile.exists({ teaching_categories: { $elemMatch: { type, category_id: item._id } } }),
  ]);
  if (post || request || profile) throw new AppError('Danh mục đang được sử dụng. Hãy tắt thay vì xóa.', 409);
  await Model.deleteOne({ _id: item._id });
  await AdminAuditLog.create({
    admin_user_id: admin.id, ip_address: admin.ip, action: 'UPDATE_SETTINGS', reason,
    details_json: { category: type, operation: 'DELETE', before: item, after: null },
  });
  return { deleted: true };
};
