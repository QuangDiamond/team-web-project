import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  KeyRound,
  Plus,
  Search,
  AlertTriangle,
  LoaderCircle,
  BookOpen,
  Users,
  UserCheck,
  Copy,
  Link as LinkIcon,
  ArrowRight,
  Sparkles,
  Archive,
} from 'lucide-react';
import { getMyClassrooms } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth.jsx';
import CreateClassroomModal from './CreateClassroomModal';
import JoinClassModal from './JoinClassModal';
import './classroom.css';

export default function ClassroomsPage() {
  const { user } = useAuth();
  const isTutor = user?.role === 'TUTOR';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAgreementId = isTutor ? searchParams.get('agreement') || '' : '';
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

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    if (initialAgreementId) {
      setSearchParams((params) => {
        params.delete('agreement');
        return params;
      }, { replace: true });
    }
  };

  const getClassroomDetailUrl = (id) => {
    if (user?.role === 'TUTOR') return `/tutor/classes/${id}`;
    if (user?.role === 'PARENT') return `/parent/classes/${id}`;
    return `/student/classes/${id}`;
  };

  return (
    <div className="classroom-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="copy-toast" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="classroom-header">
        <div className="classroom-header-info">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={26} style={{ color: '#e85a2c' }} />
            <span>Lớp học của tôi</span>
          </h1>
          <p>
            {isTutor
              ? 'Quản lý các lớp học trực tuyến, tạo lớp mới và chia sẻ mã tham gia cho học viên của bạn.'
              : user?.role === 'PARENT'
                ? 'Theo dõi danh sách các lớp học con đang theo học, tiến độ làm bài và điểm số từ gia sư.'
                : 'Theo dõi các lớp học trực tuyến đã tham gia, làm bài tập và trao đổi cùng gia sư.'}
          </p>
        </div>

        {/* Nút hành động chính */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={isTutor ? 'btn-outline-gray' : 'btn-primary-orange'}
            style={{ padding: '12px 18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsJoinModalOpen(true)}
          >
            <KeyRound size={16} />
            <span>Tham gia bằng mã</span>
          </button>
          {isTutor && (
            <button
              type="button"
              className="btn-primary-orange"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              <span>Tạo lớp học mới</span>
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
            Tất cả lớp
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
          <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ color: '#94a3b8' }} />
          </span>
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
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <LoaderCircle size={32} className="spin" style={{ color: '#e85a2c' }} />
          </div>
          <p>Đang tải danh sách lớp học của bạn...</p>
        </div>
      ) : classrooms.length === 0 ? (
        /* Empty State */
        <div className="classroom-empty-state">
          {searchQuery ? (
            <>
              <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <Search size={42} style={{ color: '#94a3b8' }} />
              </div>
              <h3>Không tìm thấy lớp học phù hợp</h3>
              <p>Không tìm thấy lớp học nào khớp với từ khóa "{searchQuery}". Vui lòng thử tìm kiếm khác.</p>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => setSearchQuery('')}
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </>
          ) : activeTab === 'ARCHIVED' ? (
            <>
              <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <Archive size={42} style={{ color: '#94a3b8' }} />
              </div>
              <h3>Chưa có lớp học nào được lưu trữ</h3>
              <p>
                Khi một lớp học kết thúc hoặc tạm ngưng, bạn có thể chuyển lớp sang trạng thái Lưu trữ để lưu lại toàn bộ dữ liệu lịch sử bài tập, điểm số và xem lại bất cứ lúc nào.
              </p>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => setActiveTab('ACTIVE')}
              >
                Xem các lớp đang hoạt động
              </button>
            </>
          ) : (
            <>
              <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <BookOpen size={42} style={{ color: '#94a3b8' }} />
              </div>
              <h3>Chưa có lớp học nào</h3>
              <p>
                {isTutor
                  ? 'Bạn chưa có lớp học nào đang hoạt động. Hãy tạo lớp học đầu tiên để chia sẻ mã tham gia và kết nối học sinh ngay hôm nay!'
                  : 'Bạn chưa tham gia lớp học nào. Hãy sử dụng mã tham gia hoặc liên kết mời do gia sư cung cấp để gia nhập lớp học ngay nhé!'}
              </p>
              {isTutor ? (
                <button
                  type="button"
                  className="btn-primary-orange"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>Khởi tạo lớp học đầu tiên</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary-orange"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setIsJoinModalOpen(true)}
                >
                  <KeyRound size={16} />
                  <span>Tham gia lớp học bằng mã</span>
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        /* Grid danh sách lớp học */
        <div className="classroom-grid">
          {classrooms.map((cls) => {
            const studentCount = typeof cls.student_count === 'number' ? cls.student_count : (cls.member_count || 0);
            const capacity = cls.capacity || 20;
            const percent = Math.min(Math.round((studentCount / capacity) * 100), 100);

            return (
              <div key={cls._id} className="classroom-card">
                <div className="card-top">
                  <div className="card-badges">
                    <span className="badge badge-subject">{cls.subject || 'Chung'}</span>
                    <span className="badge badge-grade">{cls.grade || 'Mọi trình độ'}</span>
                    <span className="badge badge-status">
                      {cls.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
                    </span>
                    {cls.is_owner || user?.role === 'TUTOR' ? (
                      <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <GraduationCap size={13} /> Bạn là Gia sư
                      </span>
                    ) : user?.role === 'PARENT' ? (
                      <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} /> Bạn là Phụ huynh
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={13} /> Bạn là Học sinh
                      </span>
                    )}
                  </div>

                  <h3 className="card-title">{cls.name}</h3>
                  {cls.description && <p className="card-desc">{cls.description}</p>}
                </div>

                <div>
                  {/* Mã tham gia lớp */}
                  <div className="join-code-box">
                    <div>
                      <div className="join-code-label">Mã tham gia lớp</div>
                      <div className="join-code-value">{cls.join_code}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleCopy(cls.join_code, 'mã lớp')}
                      title="Sao chép mã tham gia"
                    >
                      <Copy size={13} />
                      <span>Sao chép</span>
                    </button>
                  </div>

                  {/* Tiến độ sĩ số lớp */}
                  <div className="capacity-row">
                    <span>Sĩ số học viên</span>
                    <span>
                      <strong>{studentCount}</strong> / {capacity} học sinh ({percent}%)
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
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() =>
                        handleCopy(
                          cls.invite_link || `${window.location.origin}/join-class/${cls.join_code}`,
                          'đường dẫn mời tham gia'
                        )
                      }
                    >
                      <LinkIcon size={13} />
                      <span>Liên kết mời</span>
                    </button>
                    <Link
                      to={getClassroomDetailUrl(cls._id)}
                      className="btn-primary-orange"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Vào lớp học</span>
                      <ArrowRight size={14} />
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
        isOpen={isModalOpen || Boolean(initialAgreementId)}
        initialAgreementId={initialAgreementId}
        existingClassrooms={classrooms}
        onClose={handleCloseCreateModal}
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
