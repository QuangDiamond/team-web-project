import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyClassrooms } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth.jsx';
import CreateClassroomModal from './CreateClassroomModal';
import JoinClassModal from './JoinClassModal';
import './classroom.css';

export default function ClassroomsPage() {
  const { user } = useAuth();
  const isTutor = user?.role === 'TUTOR';
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, ARCHIVED
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await getMyClassrooms(params);
      setClassrooms(res?.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleCopy = (text, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}!`);
    }
  };

  const handleClassroomCreated = () => {
    fetchClassrooms();
  };

  return (
    <div className="classroom-container">
      {/* Toast Notification */}
      {toastMessage && <div className="copy-toast">✨ {toastMessage}</div>}

      {/* Header */}
      <div className="classroom-header">
        <div className="classroom-header-info">
          <h1>
            <span>🏫</span> Lớp học của tôi (Classes)
          </h1>
          <p>
            {isTutor
              ? 'Quản lý các lớp học trực tuyến, tạo lớp mới và chia sẻ mã tham gia cho học viên của bạn.'
              : 'Theo dõi các lớp học trực tuyến đã tham gia, làm bài tập và trao đổi cùng gia sư.'}
          </p>
        </div>

        {/* Nút hành động chính chuẩn Figma */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={isTutor ? 'btn-outline-gray' : 'btn-primary-orange'}
            style={{ padding: '12px 18px', fontSize: '15px' }}
            onClick={() => setIsJoinModalOpen(true)}
          >
            <span>🔑</span> Tham gia bằng mã (UC24)
          </button>
          {isTutor && (
            <button
              type="button"
              className="btn-primary-orange"
              onClick={() => setIsModalOpen(true)}
            >
              <span>➕</span> Tạo lớp học mới (UC21)
            </button>
          )}
        </div>
      </div>

      {/* Thanh điều khiển, Tab lọc & Tìm kiếm */}
      <div className="classroom-controls">
        <div className="classroom-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả lớp ({classrooms.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Đang hoạt động
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ARCHIVED' ? 'active' : ''}`}
            onClick={() => setActiveTab('ARCHIVED')}
          >
            Đã lưu trữ
          </button>
        </div>

        <div className="classroom-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên lớp, môn học, mã..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="error-alert">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Đang tải danh sách lớp học của bạn...</p>
        </div>
      ) : classrooms.length === 0 ? (
        /* Empty State */
        <div className="classroom-empty-state">
          <div className="empty-icon">📚</div>
          <h3>Chưa có lớp học nào phù hợp</h3>
          <p>
            {isTutor
              ? 'Bạn chưa có lớp học nào đang hoạt động. Hãy tạo lớp học đầu tiên để chia sẻ mã tham gia và kết nối học sinh ngay hôm nay!'
              : 'Bạn chưa tham gia lớp học nào. Hãy sử dụng mã tham gia hoặc link mời do gia sư cung cấp để gia nhập lớp học ngay nhé!'}
          </p>
          {isTutor ? (
            <button
              type="button"
              className="btn-primary-orange"
              onClick={() => setIsModalOpen(true)}
            >
              <span>➕</span> Khởi tạo lớp học đầu tiên
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary-orange"
              onClick={() => setIsJoinModalOpen(true)}
            >
              <span>🔑</span> Tham gia lớp học bằng mã (UC24)
            </button>
          )}
        </div>
      ) : (
        /* Grid danh sách lớp học */
        <div className="classroom-grid">
          {classrooms.map((cls) => {
            const memberCount = cls.member_count || 0;
            const capacity = cls.capacity || 20;
            const percent = Math.min(Math.round((memberCount / capacity) * 100), 100);

            return (
              <div key={cls._id} className="classroom-card">
                <div className="card-top">
                  <div className="card-badges">
                    <span className="badge badge-subject">{cls.subject || 'Chung'}</span>
                    <span className="badge badge-grade">{cls.grade || 'Mọi trình độ'}</span>
                    <span className="badge badge-status">
                      {cls.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
                    </span>
                    {cls.is_owner ? (
                      <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 600 }}>
                        👨‍🏫 Bạn là Gia sư
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                        🎒 Bạn là Học sinh
                      </span>
                    )}
                  </div>

                  <h3 className="card-title">{cls.name}</h3>
                  {cls.description && <p className="card-desc">{cls.description}</p>}
                </div>

                <div>
                  {/* Mã tham gia lớp (Join Code) */}
                  <div className="join-code-box">
                    <div>
                      <div className="join-code-label">Mã tham gia lớp</div>
                      <div className="join-code-value">{cls.join_code}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      onClick={() => handleCopy(cls.join_code, 'mã lớp')}
                      title="Sao chép mã tham gia"
                    >
                      📋 Copy
                    </button>
                  </div>

                  {/* Tiến độ sĩ số lớp */}
                  <div className="capacity-row">
                    <span>Sĩ số học viên</span>
                    <span>
                      <strong>{memberCount}</strong> / {capacity} học viên ({percent}%)
                    </span>
                  </div>
                  <div className="capacity-progress-bar">
                    <div
                      className="capacity-progress-fill"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  {/* Hành động */}
                  <div className="card-actions">
                    <button
                      type="button"
                      className="btn-outline-gray"
                      onClick={() =>
                        handleCopy(
                          cls.invite_link || `${window.location.origin}/join-class/${cls.join_code}`,
                          'đường dẫn mời tham gia'
                        )
                      }
                    >
                      🔗 Link mời
                    </button>
                    <Link to={`/classes/${cls._id}`} className="btn-primary-orange">
                      Vào lớp học →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Lớp Học (UC21) */}
      <CreateClassroomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClassroomCreated={handleClassroomCreated}
        showToast={showToast}
      />

      {/* Modal Tham Gia Lớp Học (UC24) */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );
}
