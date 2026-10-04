import { responseCode } from "../constants/constants";
import { responseCommon } from "../response";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return responseCommon(res, null, "Validation failed", 400, responseCode.FAILED);
    }

    req.body = result.data;

    next();
  };
};