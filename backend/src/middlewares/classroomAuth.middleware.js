import jwt from 'jsonwebtoken';
import { AppError } from '../common/utils/AppError.js';
import { User } from '../models/User.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { env } from '../config/environment.js';

export const requireTutorAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Đọc token từ Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      // 2. Hoặc đọc từ cookie
      token = req.cookies.token;
    }

    let user = null;

    if (token) {
      try {
        const payload = jwt.verify(token, env.jwtSecret || process.env.JWT_SECRET);
        const userId = payload?.sub || payload?.id;
        if (userId) {
          user = await User.findById(userId);
        }
      } catch (err) {
        console.warn('[ClassroomAuth] Token verification failed:', err.message);
      }
    }

    // 3. Fallback cho môi trường development nếu chưa đăng nhập qua auth
    if (!user && env.nodeEnv !== 'production') {
      user = await User.findOne({ role: 'TUTOR' });
      if (!user) {
        user = await User.findOne();
      }
    }

    if (!user) {
      return next(new AppError('Bạn cần đăng nhập để thực hiện chức năng này', 401));
    }

    // 4. Kiểm tra quyền hạn: Chỉ TUTOR mới được truy cập các tác vụ gia sư
    if (user.role !== 'TUTOR') {
      return next(new AppError('Chỉ tài khoản Gia sư (TUTOR) mới có quyền thực hiện chức năng này', 403));
    }

    // 5. Lấy hoặc tạo TutorProfile liên kết
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

    let user = null;
    if (token) {
      try {
        const payload = jwt.verify(token, env.jwtSecret || process.env.JWT_SECRET);
        const userId = payload?.sub || payload?.id;
        if (userId) {
          user = await User.findById(userId);
        }
      } catch (err) {
        console.warn('[ClassroomAuth] Token verification failed:', err.message);
      }
    }

    if (!user && env.nodeEnv !== 'production') {
      user = await User.findOne({ role: 'TUTOR' }) || await User.findOne();
    }

    if (!user) {
      return next(new AppError('Bạn cần đăng nhập để thực hiện chức năng này', 401));
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
