import {Router} from 'express';
import { validator } from '../common/validator/validator.js';
import {
    login,
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
authRoute.get('/google/callback', googleCallback)
authRoute.post('/google/complete', validator(googleCompleteSchema), googleComplete)

authRoute.get('/me', authentication, me)
