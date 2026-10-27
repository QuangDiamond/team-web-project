import jwt from 'jsonwebtoken';
import {User} from '../models/User.js';
import * as userService from "../services/user.service.js"
import {AppError} from '../common/utils/AppError.js';
import bcrypt from 'bcryptjs';

const issueToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
};

export const register = async ({ full_name, email, password, role}) =>{
    if(await User.findOne({email})) throw new AppError('Email already existed', 409);
    // if(await User.findOne({username})) throw new AppError('Username already existed', 409);
    const hashed = await bcrypt.hash(password, 10);
    const newUser = {full_name, email, password_hash: hashed, role}
    const user = await userService.createUser(newUser, "Regular");
    const { password_hash: _, ...safeUser } = user.toObject();
    return {user:safeUser, token: issueToken(user)};
}

export const login = async (userLogin) =>{
    const {email, password} = userLogin;
    let user = await User.findOne({email: email}).select("+password_hash");
    if(!user || !(await bcrypt.compare(password, user.password_hash))){
        throw new AppError("Invalid username or password", 401)
    }
    user = await userService.updateUserLogin(user._id);
    const { password_hash: _, ...safeUser } = user.toObject();
    return {user: safeUser, token: issueToken(user)};
}

export const me = async (userId) =>{
    const me = await User.findById(userId).select("-password_hash -has_password");
    if(!me) throw new AppError("User not found", 404);
    // const rs = {_id:me._id, email: me.email}
    return me;
}