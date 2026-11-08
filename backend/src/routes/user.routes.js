import {Router} from 'express';
import { getAll } from'../controllers/user.js';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { avatarBodySchema } from '../common/validator/avatarSchema.js';
import { uploadAvatarFile, validateAvatarFile } from '../common/middlewares/avatarUpload.middleware.js';
import { uploadMyAvatar } from '../controllers/avatar.controller.js';
export const userRoutes =Router();

// Every authenticated role may update its own avatar; no client-supplied user ID.
userRoutes.post('/me/avatar', authentication, uploadAvatarFile, validator(avatarBodySchema), validateAvatarFile, uploadMyAvatar);

userRoutes.get('/get', getAll);
