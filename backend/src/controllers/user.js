import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import * as userService from '../services/user.service.js';

export const getAll = async (req, res) => {
  try {
    const data = await userService.getAll(req, res);
    return responseCommon({
      res,
      data,
      statusCode: 200,
      success: responseCode.SUCCESSED,
    });
  } catch (error) {
    return responseCommon({
      res,
      data:error,
      statusCode: 500,
      success: responseCode.FAILED,
    });
  }
};
