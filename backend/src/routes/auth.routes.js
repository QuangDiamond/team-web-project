import {Router} from 'express';
import { validator } from '../common/validator/validator.js';
import {
    login,
    logout,
    me,
    register,
    verifyEmail,
    resendVerification,
    googleRedirect,
    googleCallback,
    googleComplete,
} from '../controllers/auth.controller.js';
import {
    loginSchema,
    registerSchema,
    resendVerificationSchema,
    googleCompleteSchema,
} from '../common/validator/authSchema.js';
import { authentication } from '../common/middlewares/auth.middleware.js';
export const authRoute = Router();

// Các API dưới đây public (chưa đăng nhập) nên không qua authentication
authRoute.post('/register', validator(registerSchema), register)
authRoute.post('/login', validator(loginSchema), login)
authRoute.get('/verify-email', verifyEmail)
authRoute.post('/resend-verification', validator(resendVerificationSchema), resendVerification)
authRoute.get('/google', googleRedirect)
authRoute.get('/oauth/redirect', googleCallback)
authRoute.post('/google/complete', validator(googleCompleteSchema), googleComplete)
// Logout chỉ xóa cookie, token hết hạn vẫn phải logout được nên không qua authentication
authRoute.post('/logout', logout)

authRoute.get('/me', authentication, me)
