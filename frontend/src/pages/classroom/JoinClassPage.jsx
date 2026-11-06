import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { previewClassroom, joinClassroom } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth.jsx';
import './classroom.css';

export default function JoinClassPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [joinCode, setJoinCode] = useState(code || '');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchPreview = useCallback(async (c) => {
    if (!c || c.length < 4) return;
    try {
      setLoading(true);
      setError('');
      const res = await previewClassroom(c.toUpperCase());
      setPreview(res?.data || null);
    } catch (err) {
      setPreview(null);
      setError(err?.response?.data?.message || err.message || 'Không tìm thấy lớp học');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (code) {
      fetchPreview(code);
    }
  }, [code, fetchPreview]);

  const handleJoin = async () => {
    const targetCode = (joinCode || code || '').trim().toUpperCase();
    if (!targetCode) return;

    try {
      setJoining(true);
      setError('');
      const res = await joinClassroom(targetCode, selectedChildId || null);
      setSuccess(true);
      setTimeout(() => {
        if (res?.data?.class_id) {
          navigate(`/classes/${res.data.class_id}`);
        } else {
          navigate('/classes');
        }
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tham gia lớp học');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="classroom-container" style={{ maxWidth: '600px', marginTop: '48px' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
          Tham gia lớp học (UC24)
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px 0' }}>
          Nhập mã tham gia do gia sư cung cấp để kết nối và bắt đầu buổi học.
        </p>

        {error && (
          <div className="error-alert" style={{ textAlign: 'left' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {success ? (
          <div style={{ padding: '24px 0' }}>
            <div style={{ fontSize: '42px', color: '#16a34a', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 6px 0' }}>Tham gia lớp học thành công!</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Đang chuyển hướng tới trang lớp học...</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="VD: TC1A2B"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => fetchPreview(joinCode)}
                disabled={loading}
              >
                {loading ? 'Đang kiểm tra...' : '🔍 Xem trước'}
              </button>
            </div>

            {/* Thông tin lớp học xem trước */}
            {preview && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left',
                  marginBottom: '24px',
                }}
              >
                <div className="card-badges" style={{ marginBottom: '8px' }}>
                  <span className="badge badge-subject">{preview.subject}</span>
                  <span className="badge badge-grade">{preview.grade}</span>
                  <span className="badge badge-status">
                    {preview.status === 'ACTIVE' ? 'Đang mở đăng ký' : 'Đã đóng'}
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>
                  {preview.name}
                </h3>

                {preview.description && (
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px 0' }}>
                    {preview.description}
                  </p>
                )}

                <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
                  👥 Sĩ số hiện tại: <strong>{preview.member_count}</strong> / {preview.capacity} học viên
                </div>

                {/* Luồng UC24: Nếu là Phụ huynh, cho phép chọn và liên kết con đang ở trong lớp */}
                {user?.role === 'PARENT' && (
                  <div style={{ marginTop: '12px', marginBottom: '12px', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      👨‍👩‍👧 Bạn đang tham gia với vai trò Phụ huynh. Chọn con đang học trong lớp:
                    </label>
                    {preview.students && preview.students.length > 0 ? (
                      <select
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          background: '#fff',
                        }}
                      >
                        <option value="">-- Chưa liên kết con / Tham gia theo dõi chung --</option>
                        {preview.students.map((st) => (
                          <option key={st._id} value={st._id}>
                            {st.full_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                        (Lớp hiện chưa có học sinh nào, bạn có thể tham gia trước hoặc liên kết sau)
                      </div>
                    )}
                  </div>
                )}

                {preview.is_full ? (
                  <div style={{ color: '#dc2626', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
                    ⚠️ Lớp học đã đạt sĩ số tối đa.
                  </div>
                ) : !user ? (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px',
                      background: '#fffbeb',
                      borderRadius: '8px',
                      border: '1px solid #fef3c7',
                      fontSize: '14px',
                      color: '#b45309',
                      textAlign: 'center',
                    }}
                  >
                    🔒 Bạn cần đăng nhập để tham gia lớp học.{' '}
                    <Link
                      to={`/login?redirect=/join-class/${(joinCode || code || '').trim().toUpperCase()}`}
                      style={{ color: '#e85a2c', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-primary-orange"
                    style={{ width: '100%', marginTop: '16px', padding: '12px', justifyContent: 'center' }}
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? 'Đang tham gia...' : '🚀 Xác nhận tham gia lớp học'}
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '14px' }}>
              <Link to="/classes" style={{ color: '#64748b', textDecoration: 'none' }}>
                ← Quay lại danh sách lớp học của tôi
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
