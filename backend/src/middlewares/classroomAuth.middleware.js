import jwt from 'jsonwebtoken';
import { AppError } from '../common/utils/AppError.js';
import { User } from '../models/User.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { env } from '../config/environment.js';

export const requireTutorAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Đọc token từ Authorization header hoặc cookie
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Quy tắc: Không có token trả 401
    if (!token) {
      return next(new AppError('Bạn cần đăng nhập để thực hiện chức năng này', 401));
    }

    let user = null;
    try {
      const payload = jwt.verify(token, env.jwtSecret || process.env.JWT_SECRET);
      const userId = payload?.sub || payload?.id;
      if (userId) {
        user = await User.findById(userId);
      }
    } catch {
      return next(new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401));
    }

    if (!user) {
      return next(new AppError('Tài khoản không tồn tại trên hệ thống', 401));
    }

    // Quy tắc: Tài khoản bị Admin khóa (BANNED, SUSPENDED) thì mọi API trả 403
    if (user.account_status && user.account_status !== 'ACTIVE') {
      return next(new AppError('Tài khoản của bạn đã bị khóa bởi Quản trị viên', 403));
    }

    // Quy tắc: Role không đúng thì 403 (Chỉ TUTOR mới được tạo/quản lý lớp học)
    if (user.role !== 'TUTOR') {
      return next(new AppError('Chỉ tài khoản Gia sư (TUTOR) mới có quyền thực hiện chức năng này', 403));
    }

    // Lấy hoặc tạo TutorProfile liên kết
    let tutorProfile = await TutorProfile.findOne({ user_id: user._id });
    if (!tutorProfile) {
      tutorProfile = await TutorProfile.create({
        user_id: user._id,
        headline: 'Gia sư TuConnector',
        bio: 'Hồ sơ gia sư trên hệ thống',
        is_complete: true,
        availability_status: 'AVAILABLE',
      });
    }

    req.user = user;
    req.tutorProfile = tutorProfile;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware cho phép bất kỳ người dùng đã đăng nhập (Học sinh, Phụ huynh, Gia sư)
 * Phục vụ UC24 (Tham gia lớp học), UC27 (Làm bài tập)
 */
export const requireUserAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Quy tắc: Không có token trả 401
    if (!token) {
      return next(new AppError('Bạn cần đăng nhập để thực hiện chức năng này', 401));
    }

    let user = null;
    try {
      const payload = jwt.verify(token, env.jwtSecret || process.env.JWT_SECRET);
      const userId = payload?.sub || payload?.id;
      if (userId) {
        user = await User.findById(userId);
      }
    } catch {
      return next(new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401));
    }

    if (!user) {
      return next(new AppError('Tài khoản không tồn tại trên hệ thống', 401));
    }

    // Quy tắc: Tài khoản bị Admin khóa (BANNED, SUSPENDED) thì mọi API trả 403
    if (user.account_status && user.account_status !== 'ACTIVE') {
      return next(new AppError('Tài khoản của bạn đã bị khóa bởi Quản trị viên', 403));
    }

    let tutorProfile = null;
    if (user.role === 'TUTOR') {
      tutorProfile = await TutorProfile.findOne({ user_id: user._id });
      if (!tutorProfile) {
        tutorProfile = await TutorProfile.create({
          user_id: user._id,
          headline: 'Gia sư TuConnector',
          bio: 'Hồ sơ gia sư trên hệ thống',
          is_complete: true,
          availability_status: 'AVAILABLE',
        });
      }
    }

    req.user = user;
    req.tutorProfile = tutorProfile;
    next();
  } catch (error) {
    next(error);
  }
};
