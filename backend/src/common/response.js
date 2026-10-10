import { responseCode } from './constants/constants.js';

export const responseCommon = (
  resOrOptions = {},
  dataArg = null,
  messageArg = '',
  statusCodeArg = 200,
  successArg = responseCode.SUCCESSED,
) => {
  // Support both:
  //   responseCommon({ res, data, message, statusCode, success })
  //   responseCommon(res, data, message, statusCode, success)
  if (resOrOptions && typeof resOrOptions.status === 'function') {
    const res = resOrOptions;
    return res.status(statusCodeArg).json({
      success: successArg,
      message: messageArg,
      data: dataArg,
    });
  }

  const {
    res,
    data = null,
    message = '',
    statusCode = 200,
    success = responseCode.SUCCESSED,
  } = resOrOptions || {};

  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};
