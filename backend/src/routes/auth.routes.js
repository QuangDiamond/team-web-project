import {Router} from 'express';
import { validator } from '../common/validators/validator.js';
import { login, me, register } from '../controllers/auth.controller.js';
import { loginSchema, registerSchema } from '../common/validators/auth.validator.js';
import { authentication } from '../common/middlewares/auth.middleware.js';
export const authRoute = Router();

authRoute.post('/register', validator(registerSchema), register)
authRoute.post('/login', validator(loginSchema), login)
authRoute.post('/me', authentication, me)