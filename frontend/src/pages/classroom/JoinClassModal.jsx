import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  X,
  AlertTriangle,
  Search,
  Users,
  GraduationCap,
  ArrowRight,
  Send,
  Loader2,
} from 'lucide-react';
import { previewClassroom, joinClassroom } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function JoinClassModal({ isOpen, onClose, showToast }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setJoinCode('');
    setSelectedChildId('');
    setPreview(null);
    setError('');
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLookup = async (codeToLookup) => {
    const raw = codeToLookup || joinCode;
    // Extract code if user pasted a full URL
    let cleanCode = raw.trim();
    if (cleanCode.includes('/join-class/')) {
      cleanCode = cleanCode.split('/join-class/').pop().split('?')[0];
    }
    cleanCode = cleanCode.toUpperCase();
    setJoinCode(cleanCode);

    if (!cleanCode || cleanCode.length < 4) {
      setError('Vui lòng nhập mã tham gia hợp lệ (ít nhất 4 ký tự)');
      return;
    }

    try {
      setLoadingPreview(true);
      setError('');
      const res = await previewClassroom(cleanCode);
      setPreview(res?.data || null);
    } catch (err) {
      setPreview(null);
      setError(err?.response?.data?.message || err.message || 'Không tìm thấy lớp học với mã này');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;

    try {
      setJoining(true);
      setError('');
      const res = await joinClassroom(joinCode.trim(), selectedChildId || null);
      if (showToast) {
        if (user?.role === 'PARENT' && selectedChildId) {
          showToast('Đã tham gia lớp và gửi yêu cầu liên kết đến học sinh!');
        } else {
          showToast('Tham gia lớp học thành công!');
        }
      }
      handleClose();
      if (res?.data?.class_id) {
        const targetUrl =
          user?.role === 'TUTOR'
            ? `/tutor/classes/${res.data.class_id}`
            : user?.role === 'PARENT'
            ? `/parent/classes/${res.data.class_id}`
            : `/student/classes/${res.data.class_id}`;
        navigate(targetUrl);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tham gia lớp học');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="#e85a2c" />
            <span>Tham gia lớp học</span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-alert">
              <AlertTriangle size={16} />
              <div>{error}</div>
            </div>
          )}

          <div className="form-group">
            <label>
              Nhập mã tham gia (Join Code) hoặc đường dẫn mời: <span className="required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="VD: TC1A2B hoặc dán link mời"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
              />
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => handleLookup()}
                disabled={loadingPreview}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {loadingPreview ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Tìm lớp</span>
                  </>
                )}
              </button>
            </div>
            <div className="form-help-text">Mã tham gia do Gia sư cung cấp cho học viên và phụ huynh.</div>
          </div>

          {/* Xem trước lớp học nếu tìm thấy */}
          {preview && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
              }}
            >
              <div className="card-badges" style={{ marginBottom: '8px' }}>
                <span className="badge badge-subject">{preview.subject}</span>
                <span className="badge badge-grade">{preview.grade}</span>
                <span className="badge badge-status">
                  {preview.status === 'ACTIVE' ? 'Đang mở đăng ký' : 'Đã đóng'}
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a' }}>{preview.name}</h3>

              {preview.description && (
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>{preview.description}</p>
              )}

              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} />
                <span>
                  Sĩ số: <strong>{preview.member_count}</strong> / {preview.capacity} học viên
                </span>
              </div>

              {/* Luồng UC24: Nếu là Phụ huynh, cho phép chọn và liên kết con đang ở trong lớp */}
              {user?.role === 'PARENT' && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    <Users size={14} />
                    <span>Bạn là Phụ huynh. Chọn con đang học trong lớp để theo dõi:</span>
                  </label>
                  {preview.students && preview.students.length > 0 ? (
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
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
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                      (Lớp hiện chưa có học sinh nào, bạn có thể tham gia trước)
                    </div>
                  )}
                </div>
              )}

              {/* Hướng dẫn riêng cho Gia sư */}
              {user?.role === 'TUTOR' ? (
                <div style={{ marginTop: '14px', padding: '14px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <GraduationCap size={32} color="#c2410c" />
                  </div>
                  <div style={{ color: '#c2410c', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                    Bạn đang đăng nhập với vai trò Gia sư
                  </div>
                  <div style={{ color: '#9a3412', fontSize: '13px', marginBottom: '12px' }}>
                    Mã tham gia này dành cho Học sinh & Phụ huynh. Bạn có thể vào xem hoặc chỉnh sửa lớp học ngay.
                  </div>
                  <button
                    type="button"
                    className="btn-primary-orange"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      handleClose();
                      const targetUrl =
                        user?.role === 'TUTOR'
                          ? `/tutor/classes/${preview._id}`
                          : user?.role === 'PARENT'
                          ? `/parent/classes/${preview._id}`
                          : `/student/classes/${preview._id}`;
                      navigate(targetUrl);
                    }}
                  >
                    <ArrowRight size={15} />
                    <span>Vào trang quản lý lớp học</span>
                  </button>
                </div>
              ) : null}

              {preview.is_full && (
                <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} />
                  <span>Lớp học đã đạt sĩ số tối đa, không thể nhận thêm học viên.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={joining}>
            Đóng
          </button>
          {user?.role !== 'TUTOR' && (
            <button
              type="button"
              className="btn-primary-orange"
              onClick={handleJoin}
              disabled={joining || !preview || preview.is_full}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {joining ? (
                <>
                  <Loader2 size={15} className="spin" />
                  <span>Đang tham gia...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Tham gia lớp học</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
