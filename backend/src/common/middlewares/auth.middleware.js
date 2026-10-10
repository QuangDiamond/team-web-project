import { AppError } from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

export const authentication = (req, res, next) =>{
    const authorization = req.headers.authorization;
    const [scheme, token] = authorization?.split(" ") ?? [];
    
    if(scheme !== "Bearer" || !token){
        return next(new AppError('Unauthorized', 401));
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`${payload}, type: ${typeof(payload)}`)
        if(!payload || typeof payload.sub !== "string"){
            next(new AppError('Invalid or expired token', 401));
        }

        req.user = {
            id: payload.sub,
            role: payload.role,
        }

        return next();
    } catch (error) {
        next(new AppError(error.message, 500));
    }
}