import { AppError } from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { passwordVersion } from '../utils/authSession.js';

export const ACCOUNT_LOCKED_MESSAGE = 'Your account has been suspended or banned';

export const getToken = (req) =>{
    if(req.cookies.token){
        return req.cookies.token;
    }

    const authorization = req.headers.authorization;
    if(!authorization) return null;

    const [scheme, token] = authorization?.split(" ") ?? [];
    
    if(scheme !== "Bearer"){
        return null;
    }

    return token;
}

// D19: đọc user từ DB mỗi request để khóa tài khoản / đổi role có hiệu lực ngay (thu hồi phiên, UC37)
export const authentication = async (req, res, next) =>{
    const token = getToken(req);
    if(!token) return next(new AppError('Unauthorize', 401));

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next(new AppError(error.message, 401));
    }
    if(!payload || typeof payload.sub !== "string" || !mongoose.isValidObjectId(payload.sub)){
        return next(new AppError('Invalid or expired token', 401));
    }

    const user = await User.findById(payload.sub).select('role account_status password_hash');
    if(!user){
        return next(new AppError('Unauthorize', 401));
    }
    if(user.account_status !== 'ACTIVE'){
        return next(new AppError(ACCOUNT_LOCKED_MESSAGE, 403));
    }
    if (payload.password_version !== passwordVersion(user.password_hash)) {
        return next(new AppError('Invalid or expired token', 401));
    }

    req.user = {
        id: payload.sub,
        role: user.role,
    }
    return next();
}

// Chặn theo role, luôn đặt sau authentication (cần req.user). Vd: authorize('ADMIN')
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Unauthorize', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError('Forbidden', 403));
        }
        return next();
    };
}
