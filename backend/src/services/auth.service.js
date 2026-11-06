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

export const register = async ({username, full_name, email, password, role}) =>{
    if(await User.findOne({email})) throw new AppError('Email already existed', 409);
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name: full_name || username || email.split('@')[0],
      email,
      password_hash: hashed,
      role: role || 'STUDENT',
      account_status: 'ACTIVE',
      email_verify_status: true,
      has_password: true,
      is_onboarded: true,
    });
    const { password_hash: _, password: __, ...safeUser } = user.toObject();
    return {user:safeUser, token: issueToken(user)};
}

export const login = async (userLogin) => {
    const { email, password } = userLogin;
    const cleanEmail = email?.trim()?.toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Nếu là môi trường dev và tài khoản chưa có trong DB, tự động tạo tài khoản test
    if (!user && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)) {
        if (cleanEmail === 'binh.student@gmail.com') {
            const hashed = await bcrypt.hash('12345678', 10);
            user = await User.create({
                full_name: 'Đỗ Gia Bình',
                email: 'binh.student@gmail.com',
                password_hash: hashed,
                role: 'STUDENT',
                account_status: 'ACTIVE',
                email_verify_status: true,
                has_password: true,
                is_onboarded: true,
            });
        }
    }

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const storedHash = user?.password_hash || user?.password;
    let isMatch = storedHash ? await bcrypt.compare(password, storedHash) : false;

    // Fallback cho môi trường development: nếu nhập 12345678 thì cập nhật lại mật khẩu chuẩn
    if (!isMatch && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) && password === '12345678') {
        const newHash = await bcrypt.hash('12345678', 10);
        user.password_hash = newHash;
        await user.save();
        isMatch = true;
    }

    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    const { password_hash: _, password: __, ...safeUser } = user.toObject();
    return { user: safeUser, token: issueToken(user) };
}

export const me = async (userId) =>{
    const me = await User.findById(userId);
    if(!me) throw new AppError("User not found", 404);
    const rs = {_id:me._id, username: me.username, email: me.email}
    return rs;
}