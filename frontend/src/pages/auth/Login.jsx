import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFillAccount = (email) => {
    setFormData({ email, password: 'password123' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    if (result.success) {
      navigate('/classes');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h2>Đăng nhập / Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="nhập email tài khoản"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu (Password)</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Tối thiểu 8 ký tự (hoặc 12345678)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Nút điền nhanh tài khoản test phục vụ kiểm thử */}
        <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
            ⚡ Tài khoản kiểm thử nhanh (Bấm để điền):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleFillAccount('minh.tutor@gmail.com')}
              style={{
                textAlign: 'left',
                background: '#fff',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#c2410c',
              }}
            >
              👨‍🏫 <strong>Gia sư:</strong> minh.tutor@gmail.com (Nguyễn Văn Minh)
            </button>
            <button
              type="button"
              onClick={() => handleFillAccount('binh.student@gmail.com')}
              style={{
                textAlign: 'left',
                background: '#fff',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#15803d',
              }}
            >
              🎒 <strong>Học sinh 1:</strong> binh.student@gmail.com (Đỗ Gia Bình)
            </button>
            <button
              type="button"
              onClick={() => handleFillAccount('an.student@gmail.com')}
              style={{
                textAlign: 'left',
                background: '#fff',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#15803d',
              }}
            >
              🎒 <strong>Học sinh 2:</strong> an.student@gmail.com (Trần Văn An)
            </button>
            <button
              type="button"
              onClick={() => handleFillAccount('ha.parent@gmail.com')}
              style={{
                textAlign: 'left',
                background: '#fff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#1d4ed8',
              }}
            >
              👨‍👩‍👧 <strong>Phụ huynh:</strong> ha.parent@gmail.com (Phạm Thu Hà)
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            * Mật khẩu kiểm thử: <code>12345678</code> hoặc <code>password123</code> (tự động chấp nhận)
          </div>
        </div>

        <p className="auth-footer" style={{ marginTop: '16px' }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
