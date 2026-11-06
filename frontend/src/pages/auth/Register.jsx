import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TUTOR',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }

    setLoading(true);
    const result = await register({
      full_name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    if (result.success) {
      navigate('/classes');
    } else {
      setError(result.error || 'Đăng ký thất bại');
    }
    setLoading(false);
  };

  return (
    <div className="page auth-page">
      <div className="auth-card" style={{ maxWidth: '420px', margin: '40px auto' }}>
        <h2>Đăng ký tài khoản</h2>
        {error && <div className="error-message" style={{ color: '#dc2626', marginBottom: '12px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label htmlFor="role">Vai trò của bạn <span style={{ color: '#e85a2c' }}>*</span></label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="TUTOR">👨‍🏫 Gia sư (Tutor) - Tạo và quản lý lớp học</option>
              <option value="STUDENT">🎒 Học sinh (Student) - Tham gia lớp, làm bài tập</option>
              <option value="PARENT">👨‍👩‍👧 Phụ huynh (Parent) - Theo dõi con, xem điểm</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label htmlFor="name">Họ và tên</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="VD: Nguyễn Văn A"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', background: '#e85a2c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '16px', textAlign: 'center' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#e85a2c', fontWeight: 600 }}>Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
