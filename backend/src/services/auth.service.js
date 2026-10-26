import jwt from 'jsonwebtoken';
import {User} from '../models/User.js';
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
    const user = await User.create({full_name, email, password_hash: hashed, role});
    const { password: _, ...safeUser } = user.toObject();
    return {user:safeUser, token: issueToken(user)};
}

export const login = async (userLogin) =>{
    const {email, password} = userLogin;
    const user = await User.findOne({email: email}).select("+password");
    if(!user || !(await bcrypt.compare(password, user.password))){
        throw new AppError("Invalid username or password", 401)
    }
    const { password: _, ...safeUser } = user.toObject();
    return {user: safeUser, token: issueToken(user)};
}

export const me = async (userId) =>{
    const me = await User.findById(userId);
    if(!me) throw new AppError("User not found", 404);
    const rs = {_id:me._id, username: me.username, email: me.email}
    return rs;
}