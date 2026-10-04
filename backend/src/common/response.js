import { responseCode } from "./constants/constants.js";

export const responseCommon = (
  {res,
  data = null,
  message = "",
  statusCode = 200,
  success = responseCode.SUCCESSED} = {}
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};