import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery, buildPagination } from '../common/utils/pagination.js';
import { categoryQuerySchema } from '../common/validator/categorySchema.js';
import { getCategoryModel, saveCategory, deleteCategory } from '../services/category.service.js';

const list = async (req, res, publicOnly) => {
  const Model = getCategoryModel(req.params.type);
  const { page, limit, q } = parseQuery(categoryQuerySchema, req.query);
  const filter = {};
  if (publicOnly) filter.is_active = true;
  if (q) filter.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [items, total] = await Promise.all([
    Model.find(filter).sort({ sort_order: 1, name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return responseCommon(res, { items, pagination: buildPagination(page, limit, total) }, 'Get categories successfully');
};
export const listPublicCategories = asyncHandler((req, res) => list(req, res, true));
export const listAdminCategories = asyncHandler((req, res) => list(req, res, false));
export const createCategory = asyncHandler(async (req, res) => {
  const data = await saveCategory(req.params.type, null, req.body, { id: req.user.id, ip: req.ip });
  return responseCommon(res, data, 'Category created', 201);
});
export const updateCategory = asyncHandler(async (req, res) => {
  const data = await saveCategory(req.params.type, req.params.id, req.body, { id: req.user.id, ip: req.ip });
  return responseCommon(res, data, 'Category updated');
});
export const removeCategory = asyncHandler(async (req, res) => {
  const data = await deleteCategory(req.params.type, req.params.id, req.body.reason, { id: req.user.id, ip: req.ip });
  return responseCommon(res, data, 'Category deleted');
});
