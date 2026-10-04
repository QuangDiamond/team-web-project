import { userRoutes } from "./user.routes.js";
import {Router} from 'express';
export const router = Router();

router.use('/user', userRoutes)