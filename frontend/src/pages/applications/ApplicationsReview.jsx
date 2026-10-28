import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getApplicationsByRequest, respondToApplication } from '../../services/applicationService';
import '../../styles/ApplicationsReview.css';

export default function ApplicationsReview() {
  const { requestId = 'req_ly11' } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('MATCH_DESC');

  // Modals & Feedback state
  const [selectedTutor, setSelectedTutor] = useState(null); // SC06 Modal
  const [actionSuccessData, setActionSuccessData] = useState(null); // Success connect modal
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [requestId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getApplicationsByRequest(requestId);
      setRequestData(data.request);
      setApplications(data.applications || []);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách ứng tuyển', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleRespond = async (app, action) => {
    if (processingId) return;
    setProcessingId(app._id);

    try {
      const res = await respondToApplication(app._id, action);

      if (action === 'CONTINUE') {
        // Cập nhật trạng thái ứng tuyển trong danh sách
        setApplications((prev) =>
          prev.map((item) =>
            item._id === app._id ? { ...item, status: 'CONTINUED' } : item
          )
        );

        setActionSuccessData({
          tutorName: app.tutor?.full_name || 'Gia sư',
          conversationId: res?.conversationId || 'conv_1',
          remainingCredits: res?.tutorRemainingCredits,
        });

        showToast('Kết nối thành công! Phòng chat 1-1 đã được kích hoạt.');
      } else if (action === 'SKIP') {
        setApplications((prev) =>
          prev.map((item) =>
            item._id === app._id ? { ...item, status: 'SKIPPED' } : item
          )
        );
        showToast('Đã bỏ qua ứng viên. Gia sư không bị trừ Connection Credit (POST-2).');
      }
    } catch (err) {
      showToast(err.message || 'Không thể xử lý yêu cầu phản hồi', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter & Search Logic
  const filteredApplications = applications
    .filter((app) => {
      if (activeTab === 'ALL') return true;
      return app.status === activeTab;
    })
    .filter((app) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const tutorName = (app.tutor?.full_name || '').toLowerCase();
      const headline = (app.tutor?.headline || '').toLowerCase();
      const note = (app.note || '').toLowerCase();
      return tutorName.includes(q) || headline.includes(q) || note.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'MATCH_DESC') {
        return (b.match_score || 0) - (a.match_score || 0);
      }
      if (sortBy === 'RATING_DESC') {
        return (b.tutor?.average_rating || 0) - (a.tutor?.average_rating || 0);
      }
      if (sortBy === 'RATE_ASC') {
        return (a.tutor?.hourly_rate || 0) - (b.tutor?.hourly_rate || 0);
      }
      if (sortBy === 'RATE_DESC') {
        return (b.tutor?.hourly_rate || 0) - (a.tutor?.hourly_rate || 0);
      }
      return 0;
    });

  // KPI counts
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const continuedCount = applications.filter((a) => a.status === 'CONTINUED').length;
  const skippedCount = applications.filter((a) => a.status === 'SKIPPED').length;
  const avgMatch = totalCount
    ? Math.round(applications.reduce((acc, a) => acc + (a.match_score || 0), 0) / totalCount)
    : 0;

  return (
    <div className="applications-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-alert ${toast.type}`}>
          {toast.type === 'error' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="app-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="separator">/</span>
        <Link to="/requests">Yêu cầu tìm gia sư</Link>
        <span className="separator">/</span>
        <span className="current">Phản hồi gia sư quan tâm (SC17)</span>
      </nav>

      {/* Parent Request Summary Banner */}
      {requestData && (
        <div className="request-summary-card">
          <div className="request-card-header">
            <div className="request-badges-group">
              <span className="badge-tag subject">Môn {requestData.subject_name || 'Vật lý'}</span>
              <span className="badge-tag grade">{requestData.grade_level || 'Lớp 11'}</span>
              <span className="badge-tag mode">
                {requestData.teaching_mode === 'HYBRID'
                  ? 'Online + Offline'
                  : requestData.teaching_mode === 'ONLINE'
                  ? 'Học Online'
                  : 'Học tại nhà'}
              </span>
              <span className="badge-tag status-open">Đang mở ứng tuyển</span>
            </div>
            <Link to="/requests" className="btn-card profile" style={{ width: 'auto', padding: '0.4rem 0.85rem' }}>
              Chỉnh sửa bài đăng
            </Link>
          </div>

          <h1 className="request-title">{requestData.title}</h1>
          <p className="request-desc">{requestData.description}</p>

          <div className="request-meta-grid">
            <div className="meta-item">
              <div className="meta-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div>
                <div className="meta-label">Ngân sách dự kiến</div>
                <div className="meta-value">
                  {requestData.budget ? `${Number(requestData.budget).toLocaleString('vi-VN')} đ/buổi` : 'Thỏa thuận'}
                </div>
              </div>
            </div>

            <div className="meta-item">
              <div className="meta-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="meta-label">Lịch học mong muốn</div>
                <div className="meta-value">{requestData.schedule || 'Linh hoạt các tối'}</div>
              </div>
            </div>

            <div className="meta-item">
              <div className="meta-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="meta-label">Khu vực học tập</div>
                <div className="meta-value">{requestData.location_address || 'Toàn quốc'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="kpi-stats-container">
        <div className="kpi-stat-card">
          <div className="kpi-icon orange">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="kpi-value">{totalCount}</div>
            <div className="kpi-title">Tổng số gia sư quan tâm</div>
          </div>
        </div>

        <div className="kpi-stat-card">
          <div className="kpi-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="kpi-value">{avgMatch}%</div>
            <div className="kpi-title">Độ tương thích AI trung bình</div>
          </div>
        </div>

        <div className="kpi-stat-card">
          <div className="kpi-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="kpi-value">{continuedCount}</div>
            <div className="kpi-title">Đã kết nối trao đổi (Continued)</div>
          </div>
        </div>

        <div className="kpi-stat-card">
          <div className="kpi-icon gray">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="kpi-value">{pendingCount}</div>
            <div className="kpi-title">Đang chờ phản hồi (Pending)</div>
          </div>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="filter-toolbar">
        <div className="status-tabs">
          <button
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả <span className="tab-count">{totalCount}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Chờ phản hồi <span className="tab-count">{pendingCount}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'CONTINUED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CONTINUED')}
          >
            Đã kết nối <span className="tab-count">{continuedCount}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'SKIPPED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SKIPPED')}
          >
            Đã bỏ qua <span className="tab-count">{skippedCount}</span>
          </button>
        </div>

        <div className="sort-search-group">
          <input
            type="text"
            placeholder="Tìm theo tên gia sư, kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sort-select"
            style={{ width: '220px' }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="MATCH_DESC">Điểm AI cao nhất</option>
            <option value="RATING_DESC">Đánh giá sao cao nhất</option>
            <option value="RATE_ASC">Học phí: Thấp đến cao</option>
            <option value="RATE_DESC">Học phí: Cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* Applications Cards Grid */}
      {loading ? (
        <div className="empty-applications-state">
          <div className="empty-title">Đang tải danh sách hồ sơ gia sư...</div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-applications-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="empty-title">Không tìm thấy hồ sơ ứng tuyển phù hợp</div>
          <p className="empty-desc">
            Vui lòng thử chọn tab khác hoặc thay đổi từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="applications-grid">
          {filteredApplications.map((app, index) => {
            const tutor = app.tutor || {};
            const isTopMatch = index === 0 && (app.match_score || 0) >= 90;
            const isPending = app.status === 'PENDING';
            const isContinued = app.status === 'CONTINUED';
            const isSkipped = app.status === 'SKIPPED';

            return (
              <div
                key={app._id}
                className={`application-card ${isTopMatch ? 'top-match' : ''} ${
                  isContinued ? 'continued' : ''
                } ${isSkipped ? 'skipped' : ''}`}
              >
                {/* Header Row */}
                <div className="card-header-row">
                  <div className="tutor-avatar-wrapper">
                    <img
                      src={tutor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={tutor.full_name}
                      className="tutor-avatar-img"
                    />
                    <span className="online-indicator" title="Gia sư sẵn sàng nhận lớp" />
                  </div>

                  <div className="tutor-info-box">
                    <div className="tutor-name-row">
                      <span className="tutor-name">{tutor.full_name}</span>
                      <svg className="verified-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="tutor-headline">{tutor.headline}</div>
                  </div>

                  {/* AI Match Score Badge */}
                  <div
                    className={`match-score-badge ${
                      app.match_score >= 90 ? 'high' : app.match_score >= 80 ? 'medium' : 'standard'
                    }`}
                    title="Điểm tương thích do thuật toán Gemini AI tính toán dựa trên mục tiêu, môn học, lịch dạy và phong cách học"
                  >
                    <span>★ {app.match_score}%</span>
                  </div>
                </div>

                {/* Rating & Rate Stats Row */}
                <div className="card-stats-row">
                  <div className="rating-display">
                    <span className="rating-star">★</span>
                    <span>{tutor.average_rating ? Number(tutor.average_rating).toFixed(1) : '5.0'}</span>
                    <span className="review-count">({tutor.total_reviews || 24} đánh giá)</span>
                  </div>

                  <div className="rate-display">
                    {tutor.hourly_rate ? `${Number(tutor.hourly_rate).toLocaleString('vi-VN')} đ` : '250.000 đ'}
                    <span className="rate-unit"> / buổi</span>
                  </div>
                </div>

                {/* Tutor's Introductory Note */}
                <div className="tutor-note-box">
                  "{app.note || 'Rất mong có cơ hội được đồng hành giảng dạy cùng học sinh.'}"
                </div>

                {/* Status Indicator Banner */}
                {isContinued && (
                  <div className="status-indicator-banner continued">
                    ✓ Đã chấp nhận kết nối – Phòng chat 1-1 đang hoạt động
                  </div>
                )}
                {isSkipped && (
                  <div className="status-indicator-banner skipped">
                    ✕ Đã chọn bỏ qua hồ sơ này
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="card-actions-row">
                  <button
                    className="btn-card profile"
                    onClick={() => setSelectedTutor(tutor)}
                  >
                    Xem hồ sơ
                  </button>

                  {isPending && (
                    <>
                      <button
                        className="btn-card skip"
                        title="Bỏ qua ứng viên này"
                        onClick={() => handleRespond(app, 'SKIP')}
                        disabled={processingId === app._id}
                      >
                        Bỏ qua
                      </button>

                      <button
                        className="btn-card continue"
                        title="Tiếp tục trao đổi (Trừ 1 connection credit của gia sư và mở phòng chat 1-1)"
                        onClick={() => handleRespond(app, 'CONTINUE')}
                        disabled={processingId === app._id}
                      >
                        {processingId === app._id ? 'Đang kết nối...' : 'Tiếp tục trao đổi'}
                      </button>
                    </>
                  )}

                  {isContinued && (
                    <button
                      className="btn-card chat-now"
                      onClick={() => navigate('/messages')}
                    >
                      Nhắn tin ngay 💬
                    </button>
                  )}

                  {isSkipped && (
                    <button
                      className="btn-card skip"
                      onClick={() => handleRespond(app, 'CONTINUE')}
                    >
                      Xem xét lại
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SC06: Tutor Public Profile Modal */}
      {selectedTutor && (
        <div className="modal-overlay" onClick={() => setSelectedTutor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Hồ sơ chi tiết gia sư (SC06)</span>
              <button className="btn-close-modal" onClick={() => setSelectedTutor(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="profile-modal-hero">
                <img
                  src={selectedTutor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={selectedTutor.full_name}
                  className="profile-modal-avatar"
                />
                <div className="profile-modal-info">
                  <h3>{selectedTutor.full_name}</h3>
                  <p>{selectedTutor.headline}</p>
                  <p style={{ marginTop: '0.35rem', color: '#F4673A', fontWeight: '700' }}>
                    ★ {selectedTutor.average_rating ? Number(selectedTutor.average_rating).toFixed(1) : '5.0'} ·{' '}
                    {selectedTutor.total_reviews || 30} lượt đánh giá hài lòng
                  </p>
                </div>
              </div>

              <div className="profile-section-title">
                <span>Giới thiệu bản thân</span>
              </div>
              <p className="profile-bio-text">{selectedTutor.bio || 'Chưa có thông tin giới thiệu chi tiết.'}</p>

              {/* Experiences Timeline */}
              {selectedTutor.experiences?.length > 0 && (
                <>
                  <div className="profile-section-title">
                    <span>Kinh nghiệm giảng dạy & làm việc</span>
                  </div>
                  <div className="timeline-list">
                    {selectedTutor.experiences.map((exp, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-role">{exp.role}</div>
                        <div className="timeline-org">
                          {exp.organization} · {exp.period}
                        </div>
                        <div className="timeline-desc">{exp.description}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Educations */}
              {selectedTutor.educations?.length > 0 && (
                <>
                  <div className="profile-section-title">
                    <span>Học vấn & Bằng cấp</span>
                  </div>
                  <div className="timeline-list">
                    {selectedTutor.educations.map((edu, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-role">{edu.degree}</div>
                        <div className="timeline-org">
                          {edu.institution} · {edu.year}
                        </div>
                        <div className="timeline-desc">{edu.grade}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Achievements */}
              {selectedTutor.achievements?.length > 0 && (
                <>
                  <div className="profile-section-title">
                    <span>Giải thưởng & Thành tích</span>
                  </div>
                  <div className="timeline-list">
                    {selectedTutor.achievements.map((ach, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-role">{ach.title}</div>
                        <div className="timeline-org">
                          {ach.issued_by} · {ach.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Contact Protection Banner (BR-19) */}
              <div className="contact-protection-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <strong>Chính sách bảo vệ thông tin liên hệ (BR-19):</strong> Số điện thoại và thông tin liên lạc cá nhân được bảo mật. Hai bên sẽ trao đổi và thống nhất lịch học an toàn thông qua phòng chat 1-1 trên nền tảng TuConnector sau khi bấm Tiếp tục trao đổi.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCCESS: Connection Opened (POST-1) */}
      {actionSuccessData && (
        <div className="modal-overlay" onClick={() => setActionSuccessData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-dialog">
              <div className="success-icon-badge">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="success-modal-title">
                Kết nối thành công với {actionSuccessData.tutorName}!
              </h2>

              <p className="success-modal-desc">
                Hồ sơ ứng tuyển đã được chuyển sang trạng thái <strong>Đã kết nối (Continued)</strong>. Phòng chat trực tiếp 1-1 đã sẵn sàng để phụ huynh và gia sư bắt đầu trao đổi chi tiết về lộ trình và lịch học.
              </p>

              <div className="credit-deducted-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Hệ thống đã trừ 1 Connection Credit từ ví của gia sư theo quy định kết nối (POST-1).</span>
              </div>

              <div className="success-actions-row">
                <button
                  className="btn-card profile"
                  onClick={() => setActionSuccessData(null)}
                >
                  Ở lại xem danh sách
                </button>

                <button
                  className="btn-card continue"
                  onClick={() => {
                    setActionSuccessData(null);
                    navigate('/messages');
                  }}
                >
                  Vào phòng chat 1-1 ngay 💬
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
