import {AppError} from "./utils/AppError.js";

export const validator = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const {issues} = result.error; 
      return next(new AppError(issues[0].message, 422, result.error.flatten().fieldErrors))
    }

    req.body = result.data;

    next();
  };
};