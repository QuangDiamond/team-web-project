import { AppError } from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

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

export const authentication = (req, res, next) =>{
    const token = getToken(req);
    if(!token) return next(new AppError('Unauthorize', 401));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if(!payload || typeof payload.sub !== "string"){
           return next(new AppError('Invalid or expired token', 401));
        }

        req.user = {
            id: payload.sub,
            role: payload.role,
        }

        return next();
    } catch (error) {
        return next(new AppError(error.message, 401));
    }
}