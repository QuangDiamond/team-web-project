import crypto from 'crypto';
import { responseCode } from "../common/constants/constants.js";
import { responseCommon } from "../common/response.js";
import { asyncHandler } from "../common/utils/asyncHandler.js";
import * as  authService from '../services/auth.service.js'
import { env } from '../config/environment.js';
import * as passwordService from '../services/password.service.js';
import { UserSession } from '../models/UserSession.js';
import {
    ACCESS_TOKEN_TTL_MS,
    REFRESH_TOKEN_TTL_MS,
    hashRefreshToken,
    isRememberToken,
} from '../common/utils/authSession.js';

const OAUTH_STATE_COOKIE = 'oauth_state';
const ACCESS_COOKIE = 'token';
const REFRESH_COOKIE = 'refresh_token';
// Refresh token chỉ cần gửi kèm các API auth (router mount ở /api trong app.js)
const REFRESH_COOKIE_PATH = '/api/auth/v1';

const getCookieOptions = () => {
    return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' };
};

/**
 * UC02-6 / UC02-7: access token 30 phút + refresh token 7 ngày, đều httpOnly.
 * Không chọn "Remember me" thì cookie không có maxAge (mất khi đóng trình duyệt)
 */
const setAuthCookies = (res, token, refreshToken, remember) => {
    const refreshOptions = { ...getCookieOptions(), path: REFRESH_COOKIE_PATH };
    const accessOptions = getCookieOptions();
    if (remember) {
        refreshOptions.maxAge = REFRESH_TOKEN_TTL_MS;
        accessOptions.maxAge = ACCESS_TOKEN_TTL_MS;
    }
    res.cookie(REFRESH_COOKIE, refreshToken, refreshOptions);
    res.cookie(ACCESS_COOKIE, token, accessOptions);
};

const clearAuthCookies = (res) => {
    res.clearCookie(REFRESH_COOKIE, { ...getCookieOptions(), path: REFRESH_COOKIE_PATH });
    res.clearCookie(ACCESS_COOKIE, getCookieOptions());
};

const getRefreshCookie = (req) => {
    if (!req.cookies) {
        return undefined;
    }
    return req.cookies[REFRESH_COOKIE];
};

export const forgotPassword = asyncHandler(async (req, res) => {
    passwordService.forgotPassword(req.body.email);
    return responseCommon(res, null, 'If the email exists, a reset link has been sent', 200, responseCode.SUCCESSED);
});

export const resetPassword = asyncHandler(async (req, res) => {
    await passwordService.resetPassword(req.body);
    clearAuthCookies(res);
    return responseCommon(res, null, 'Password reset successfully. Please log in', 200, responseCode.SUCCESSED);
});

export const changePassword = asyncHandler(async (req, res) => {
    // Mọi phiên cũ bị thu hồi, phiên mới giữ lựa chọn "Remember me" của phiên hiện tại
    const remember = isRememberToken(getRefreshCookie(req));
    const { user, token, refreshToken } = await passwordService.changePassword(req.user.id, req.body, remember);
    setAuthCookies(res, token, refreshToken, remember);
    return responseCommon(res, user, 'Password changed successfully', 200, responseCode.SUCCESSED);
});

export const register = asyncHandler (async (req, res) =>{
    const user = await authService.register(req.body);
    return responseCommon(res, user, "Register successfully! Please check your email to verify your account", 201, responseCode.SUCCESSED);
})

export const login = asyncHandler (async (req, res) =>{
    const { user, token, refreshToken } = await authService.login(req.body);
    setAuthCookies(res, token, refreshToken, req.body.remember_me);
    return responseCommon(res, user, "Login successfully!", 200, responseCode.SUCCESSED);
})

export const refresh = asyncHandler (async (req, res) =>{
    const { token, refreshToken, remember } = await authService.refreshSession(getRefreshCookie(req));
    setAuthCookies(res, token, refreshToken, remember);
    return responseCommon(res, null, "Refresh token successfully!", 200, responseCode.SUCCESSED);
})

// Cookie là httpOnly nên frontend không tự xóa được, phải gọi API này. Thu hồi luôn phiên hiện tại (UC02-A2)
export const logout = asyncHandler (async (req, res) =>{
    const refreshToken = getRefreshCookie(req);
    if (typeof refreshToken === 'string' && refreshToken.length > 0) {
        await UserSession.updateOne({ refresh_token: hashRefreshToken(refreshToken) }, { $set: { is_revoked: true } });
    }
    clearAuthCookies(res);
    return responseCommon(res, null, "Logout successfully!", 200, responseCode.SUCCESSED);
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
        setAuthCookies(res, result.token, result.refreshToken, true);
        // UC02: đăng nhập xong chuyển tới dashboard theo role (D2)
        return res.redirect(`${env.corsOrigin}/dashboard`);
    } catch (error) {
        console.error('Google callback failed:', error);
        // Tài khoản bị khóa (UC37): báo riêng để màn Login hiện đúng thông báo
        if (error.status === 403) {
            return res.redirect(`${env.corsOrigin}/login?oauth=locked`);
        }
        return res.redirect(failedUrl);
    }
}

export const googleComplete = asyncHandler (async (req, res) =>{
    const { user, token, refreshToken } = await authService.completeGoogleRegister(req.body);
    setAuthCookies(res, token, refreshToken, true);
    return responseCommon(res, user, "Register with Google successfully!", 201, responseCode.SUCCESSED);
})
