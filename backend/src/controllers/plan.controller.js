import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { getPagination, buildPagination } from '../common/utils/pagination.js';
import { Plan } from '../models/Plan.js';
import { CreditPack } from '../models/CreditPack.js';
import * as planService from '../services/plan.service.js';

// Thông tin Admin đang thao tác, dùng để ghi audit log (BR-16)
const getAdminContext = (req) => {
  return {
    adminUserId: req.user.id,
    ipAddress: req.ip,
  };
};

export const getPlans = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const plans = await Plan.find().sort({ target_role: 1, monthly_price: 1, _id: 1 }).skip(skip).limit(limit);
  const total = await Plan.countDocuments();

  const data = {
    items: plans.map(planService.toPlanResponse),
    pagination: buildPagination(page, limit, total),
  };
  return responseCommon(res, data, 'Get plans successfully!', 200, responseCode.SUCCESSED);
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await planService.updatePlan(req.params.id, req.body, getAdminContext(req));
  return responseCommon(res, plan, 'Update plan successfully!', 200, responseCode.SUCCESSED);
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await planService.createPlan(req.body, getAdminContext(req));
  return responseCommon(res, plan, 'Create plan successfully!', 201, responseCode.SUCCESSED);
});

export const getCreditPacks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const creditPacks = await CreditPack.find().sort({ target_role: 1, price: 1, _id: 1 }).skip(skip).limit(limit);
  const total = await CreditPack.countDocuments();

  const data = {
    items: creditPacks.map(planService.toCreditPackResponse),
    pagination: buildPagination(page, limit, total),
  };
  return responseCommon(res, data, 'Get credit packs successfully!', 200, responseCode.SUCCESSED);
});

export const createCreditPack = asyncHandler(async (req, res) => {
  const creditPack = await planService.createCreditPack(req.body, getAdminContext(req));
  return responseCommon(res, creditPack, 'Create credit pack successfully!', 201, responseCode.SUCCESSED);
});

export const updateCreditPack = asyncHandler(async (req, res) => {
  const creditPack = await planService.updateCreditPack(req.params.id, req.body, getAdminContext(req));
  return responseCommon(res, creditPack, 'Update credit pack successfully!', 200, responseCode.SUCCESSED);
});

export const updateCreditPackStatus = asyncHandler(async (req, res) => {
  const creditPack = await planService.updateCreditPackStatus(req.params.id, req.body, getAdminContext(req));
  return responseCommon(res, creditPack, 'Update credit pack status successfully!', 200, responseCode.SUCCESSED);
});
