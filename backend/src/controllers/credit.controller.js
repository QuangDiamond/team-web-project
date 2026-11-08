import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { getBalance } from '../services/credit.service.js';

export const balance = asyncHandler(async (req, res) => {
  const currentBalance = await getBalance(req.user.id);
  return responseCommon(res, { balance: currentBalance }, 'Get credit balance successfully!', 200, responseCode.SUCCESSED);
});
