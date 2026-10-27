import crypto from 'crypto';
import { responseCode } from "../common/constants/constants.js";
import { responseCommon } from "../common/response.js";
import { asyncHandler } from "../common/utils/asyncHandler.js";
import * as  authService from '../services/auth.service.js'
import { env } from '../config/environment.js';

const OAUTH_STATE_COOKIE = 'oauth_state';

const setAuthCookie = (res, token) => {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
    });
}

export const register = asyncHandler (async (req, res) =>{
    const user = await authService.register(req.body);
    return responseCommon(res, user, "Register successfully! Please check your email to verify your account", 201, responseCode.SUCCESSED);
})

export const login = asyncHandler (async (req, res) =>{
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token);
    return responseCommon(res, user, "Login successfully!", 200, responseCode.SUCCESSED);
})

export const me = asyncHandler (async (req, res) =>{
    return responseCommon(res, await authService.me(req.user.id), "Get current user successfully!", 200, responseCode.SUCCESSED)
})

// User bấm link trong email (mở bằng trình duyệt) nên redirect về trang Login thay vì trả JSON
export const verifyEmail = asyncHandler (async (req, res) =>{
    const isVerified = await authService.verifyEmail(req.query.token);
    if (isVerified) {
        return res.redirect(`${env.corsOrigin}/login?verify=success`);
    }
    return res.redirect(`${env.corsOrigin}/login?verify=invalid`);
})

export const resendVerification = asyncHandler (async (req, res) =>{
    await authService.resendVerification(req.body.email);
    return responseCommon(res, null, "If the email is registered and not verified, a verification email has been sent", 200, responseCode.SUCCESSED);
})

export const googleRedirect = asyncHandler (async (req, res) =>{
    // state lưu trong cookie để chống CSRF, so khớp lại ở callback
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    });
    return res.redirect(authService.getGoogleAuthUrl(state));
})

// Google redirect trình duyệt về đây nên mọi kết quả (kể cả lỗi) đều redirect về frontend thay vì trả JSON
export const googleCallback = async (req, res) =>{
    const failedUrl = `${env.corsOrigin}/login?oauth=failed`;
    const savedState = req.cookies[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE);

    if (!req.query.code || !savedState || req.query.state !== savedState) {
        return res.redirect(failedUrl);
    }

    try {
        const result = await authService.handleGoogleCallback(req.query.code);
        if (result.registerTicket) {
            return res.redirect(`${env.corsOrigin}/register/complete?ticket=${result.registerTicket}`);
        }
        setAuthCookie(res, result.token);
        return res.redirect(`${env.corsOrigin}/`);
    } catch (error) {
        console.error('Google callback failed:', error);
        return res.redirect(failedUrl);
    }
}

export const googleComplete = asyncHandler (async (req, res) =>{
    const { user, token } = await authService.completeGoogleRegister(req.body);
    setAuthCookie(res, token);
    return responseCommon(res, user, "Register with Google successfully!", 201, responseCode.SUCCESSED);
})
