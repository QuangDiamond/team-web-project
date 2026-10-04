import { responseCode } from "./constants/constants.js";

export const responseCommon = (
  res,
  data = null,
  message = null,
  statusCode = 200,
  success = responseCode.SUCCESSED,
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};