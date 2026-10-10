import { responseCode } from "../common/constants/constants.js";
import { responseCommon } from "../common/response.js";
import { asyncHandler } from "../common/utils/asyncHandler.js";
import * as  authService from '../services/auth.service.js'

export const register = asyncHandler (async (req, res) =>{
    return responseCommon(res, await authService.register(req.body), "Register successfully!", 201, responseCode.SUCCESSED);
})

export const login = asyncHandler (async (req, res) =>{
    return responseCommon(res, await authService.login(req.body), "Login successfully!", 200, responseCode.SUCCESSED);
})

export const me = asyncHandler (async (req, res) =>{
    return responseCommon(res, await authService.me(req.user.id), "Get current user successfully!", 200, responseCode.SUCCESSED)
})