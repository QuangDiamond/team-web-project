import {Router} from 'express';
import { getAll } from'../controllers/user.js';
export const userRoutes =Router();

userRoutes.get('/get', getAll);