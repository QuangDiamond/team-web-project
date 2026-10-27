import {Router} from 'express';
import { validator } from '../common/validator/validator.js';
import { login, me, register } from '../controllers/auth.controller.js';
import { loginSchema, registerSchema } from '../common/validator/authSchema.js';
import { authentication } from '../common/middlewares/auth.middleware.js';
export const authRoute = Router();

authRoute.post('/register', validator(registerSchema), register)
authRoute.post('/login', validator(loginSchema), login)
authRoute.get('/me', authentication, me)