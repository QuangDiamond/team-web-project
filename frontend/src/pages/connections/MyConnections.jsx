import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConnections, confirmAgreement, proposeAgreement } from '../../services/agreementService';
import '../../styles/MyConnections.css';

export default function MyConnections() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Modals state
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    subject: '',
    schedule: '',
    price: '250000',
    conversationId: 'conv_sample',
  });

  const [ratingModalTarget, setRatingModalTarget] = useState(null); // SC24 Rate Tutor modal
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [sharePublicly, setSharePublicly] = useState(true);

  const [classroomPromptModal, setClassroomPromptModal] = useState(null); // UC21
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getConnections();
      setConnections(data.connections || []);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách kết nối', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirmAction = async (agreement, action) => {
    if (processingId) return;
    setProcessingId(agreement._id);

    try {
      await confirmAgreement(agreement._id, action);

      if (action === 'CONFIRM') {
        setConnections((prev) =>
          prev.map((c) =>
            c._id === agreement._id
              ? {
                  ...c,
                  status: 'CONFIRMED',
                  canRate: true,
                  canCreateClassroom: true,
                  request: { ...c.request, status: 'CLOSED' },
                }
              : c
          )
        );
        showToast('Đã xác nhận thỏa thuận kết nối thành công (POST-1)! Bài yêu cầu đã được đóng.');
      } else {
        setConnections((prev) =>
          prev.map((c) =>
            c._id === agreement._id ? { ...c, status: 'REJECTED' } : c
          )
        );
        showToast('Đã từ chối thỏa thuận. Kết nối vẫn giữ mở để hai bên trao đổi thêm.');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật thỏa thuận', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!proposeForm.subject.trim()) {
      showToast('Vui lòng nhập môn học đã thống nhất', 'error');
      return;
    }

    try {
      const res = await proposeAgreement({
        agreedSubject: proposeForm.subject,
        agreedSchedule: proposeForm.schedule,
        agreedPrice: Number(proposeForm.price),
        conversationId: proposeForm.conversationId,
      });

      const newAgr = {
        _id: res.agreement?._id || 'agr_' + Date.now(),
        agreed_subject: proposeForm.subject,
        agreed_schedule: proposeForm.schedule,
        agreed_price: Number(proposeForm.price),
        status: 'PENDING',
        created_at: new Date(),
        parent: {
          full_name: 'Nguyễn Thu Hà',
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        },
        tutor: {
          full_name: 'Gia sư TuConnector',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          headline: 'Gia sư chuyên môn cao',
        },
        proposer: {
          full_name: 'Tôi',
        },
      };

      setConnections((prev) => [newAgr, ...prev]);
      setProposeModalOpen(false);
      showToast('Đã gửi đề xuất thỏa thuận kết nối! Đang chờ đối tác bấm xác nhận.');
    } catch (err) {
      showToast(err.message || 'Lỗi khi gửi đề xuất', 'error');
    }
  };

  const handleRatingSubmit = (e) => {
    e.preventDefault();
    if (!ratingModalTarget) return;

    setConnections((prev) =>
      prev.map((c) =>
        c._id === ratingModalTarget._id ? { ...c, hasRated: true } : c
      )
    );

    showToast('Cảm ơn bạn đã gửi đánh giá! Nhận xét đã được lưu trên hồ sơ gia sư (UC38).');
    setRatingModalTarget(null);
    setRatingComment('');
  };

  // Filter & Search
  const filteredConnections = connections
    .filter((c) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'RATEABLE') return c.canRate && !c.hasRated;
      return c.status === activeTab;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const tutorName = (c.tutor?.full_name || '').toLowerCase();
      const parentName = (c.parent?.full_name || '').toLowerCase();
      const subject = (c.agreed_subject || '').toLowerCase();
      return tutorName.includes(q) || parentName.includes(q) || subject.includes(q);
    });

  const totalCount = connections.length;
  const confirmedCount = connections.filter((c) => c.status === 'CONFIRMED').length;
  const pendingCount = connections.filter((c) => c.status === 'PENDING').length;
  const rateableCount = connections.filter((c) => c.canRate && !c.hasRated).length;

  return (
    <div className="connections-page">
      {/* Toast */}
      {toast && (
        <div className={`toast-alert ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="conn-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="separator">/</span>
        <span className="current">Kết nối của tôi</span>
      </nav>

      {/* Header */}
      <div className="conn-header-row">
        <div>
          <h1 className="conn-title">Kết nối của tôi</h1>
          <p className="conn-subtitle">
            Quản lý các thỏa thuận dạy kèm đã chốt và xác nhận kết nối hai bên
          </p>
        </div>

        <button
          className="btn-propose-new"
          onClick={() => setProposeModalOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Đề xuất thỏa thuận mới
        </button>
      </div>

      {/* KPI Stats */}
      <div className="conn-kpi-grid">
        <div className="conn-kpi-card">
          <div className="conn-kpi-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="conn-kpi-val">{totalCount}</div>
            <div className="conn-kpi-lbl">Tổng số phiên kết nối</div>
          </div>
        </div>

        <div className="conn-kpi-card">
          <div className="conn-kpi-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="conn-kpi-val">{confirmedCount}</div>
            <div className="conn-kpi-lbl">Đã xác nhận thành công (Confirmed)</div>
          </div>
        </div>

        <div className="conn-kpi-card">
          <div className="conn-kpi-icon amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="conn-kpi-val">{pendingCount}</div>
            <div className="conn-kpi-lbl">Chờ xác nhận (Pending)</div>
          </div>
        </div>

        <div className="conn-kpi-card">
          <div className="conn-kpi-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <div className="conn-kpi-val">{rateableCount}</div>
            <div className="conn-kpi-lbl">Cần đánh giá gia sư (UC38)</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="conn-toolbar">
        <div className="conn-tabs">
          <button
            className={`conn-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả <span className="conn-tab-pill">{totalCount}</span>
          </button>
          <button
            className={`conn-tab-btn ${activeTab === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CONFIRMED')}
          >
            Đã xác nhận <span className="conn-tab-pill">{confirmedCount}</span>
          </button>
          <button
            className={`conn-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Đang chờ <span className="conn-tab-pill">{pendingCount}</span>
          </button>
          <button
            className={`conn-tab-btn ${activeTab === 'RATEABLE' ? 'active' : ''}`}
            onClick={() => setActiveTab('RATEABLE')}
          >
            Cần đánh giá <span className="conn-tab-pill">{rateableCount}</span>
          </button>
        </div>

        <input
          type="text"
          placeholder="Tìm theo tên đối tác, môn học..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="conn-search-input"
        />
      </div>

      {/* Connections List */}
      {loading ? (
        <div className="conn-empty-state">
          <p>Đang tải danh sách kết nối...</p>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="conn-empty-state">
          <h3>Không tìm thấy thỏa thuận kết nối nào</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sau khi mở phiên chat 1-1 qua SC17/SC29, bạn và đối tác có thể bấm "Mark as agreed" để ghi nhận thỏa thuận tại đây.
          </p>
        </div>
      ) : (
        <div className="conn-cards-grid">
          {filteredConnections.map((conn) => {
            const isConfirmed = conn.status === 'CONFIRMED';
            const isPending = conn.status === 'PENDING';
            const isRejected = conn.status === 'REJECTED';
            const partner = conn.tutor || conn.parent || {};

            return (
              <div
                key={conn._id}
                className={`conn-card ${isConfirmed ? 'confirmed' : isPending ? 'pending' : 'rejected'}`}
              >
                {/* Partner Header */}
                <div className="conn-partner-row">
                  <div className="conn-partner-profile">
                    <img
                      src={partner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={partner.full_name}
                      className="conn-partner-avatar"
                    />
                    <div>
                      <div className="conn-partner-name">{partner.full_name}</div>
                      <div className="conn-partner-role">
                        {partner.headline || 'Gia sư / Phụ huynh'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`conn-status-badge ${
                      isConfirmed ? 'confirmed' : isPending ? 'pending' : 'rejected'
                    }`}
                  >
                    {isConfirmed ? '✓ Đã xác nhận' : isPending ? '⏳ Chờ xác nhận' : '✕ Từ chối'}
                  </span>
                </div>

                {/* Agreement Terms Box */}
                <div className="conn-terms-box">
                  <div className="conn-term-row">
                    <div className="conn-term-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div className="conn-term-content">
                      <span className="conn-term-label">Môn học đã thống nhất</span>
                      <div className="conn-term-val">{conn.agreed_subject}</div>
                    </div>
                  </div>

                  <div className="conn-term-row">
                    <div className="conn-term-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="conn-term-content">
                      <span className="conn-term-label">Khung giờ & Lịch học chốt</span>
                      <div className="conn-term-val">{conn.agreed_schedule}</div>
                    </div>
                  </div>

                  <div className="conn-term-row">
                    <div className="conn-term-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    </div>
                    <div className="conn-term-content">
                      <span className="conn-term-label">Mức học phí thống nhất</span>
                      <div className="conn-term-val price">
                        {conn.agreed_price ? `${Number(conn.agreed_price).toLocaleString('vi-VN')} đ` : '250.000 đ'}{' '}
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500' }}>/ buổi</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="conn-proposer-note">
                  Đề xuất bởi: <strong>{conn.proposer?.full_name || 'Đối tác'}</strong>{' '}
                  {conn.created_at && `· ${new Date(conn.created_at).toLocaleDateString('vi-VN')}`}
                  {isConfirmed && conn.request?.status === 'CLOSED' && (
                    <span style={{ color: '#059669', marginLeft: '0.5rem', fontWeight: '600' }}>
                      (Bài yêu cầu đã được đóng thành công)
                    </span>
                  )}
                </div>

                {/* Card Actions */}
                <div className="conn-card-actions">
                  {isPending && (
                    <>
                      <button
                        className="btn-conn decline"
                        onClick={() => handleConfirmAction(conn, 'REJECT')}
                        disabled={processingId === conn._id}
                      >
                        Từ chối
                      </button>

                      <button
                        className="btn-conn confirm"
                        onClick={() => handleConfirmAction(conn, 'CONFIRM')}
                        disabled={processingId === conn._id}
                      >
                        {processingId === conn._id ? 'Đang xác nhận...' : 'Xác nhận đồng ý (Confirm)'}
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <>
                      {!conn.hasRated ? (
                        <button
                          className="btn-conn rate"
                          onClick={() => setRatingModalTarget(conn)}
                          title="Đánh giá gia sư sau buổi học (UC38)"
                        >
                          ⭐ Đánh giá gia sư
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: '700' }}>
                          ✓ Đã gửi đánh giá 5★
                        </span>
                      )}

                      <button
                        className="btn-conn classroom"
                        onClick={() => setClassroomPromptModal(conn)}
                        title="Tạo lớp học trực tuyến (UC21)"
                      >
                        🏫 Tạo lớp học
                      </button>
                    </>
                  )}

                  <button
                    className="btn-conn chat"
                    onClick={() => navigate('/messages')}
                    title="Mở phòng chat 1-1 trực tiếp"
                  >
                    💬 Chat 1-1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Propose New Agreement (Mark as agreed) */}
      {proposeModalOpen && (
        <div className="conn-modal-overlay" onClick={() => setProposeModalOpen(false)}>
          <div className="conn-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="conn-modal-header">
              <span className="conn-modal-title">Đề xuất thỏa thuận dạy học (Mark as agreed)</span>
              <button className="btn-close-modal" onClick={() => setProposeModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleProposeSubmit} className="conn-modal-body">
              <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Sau khi trao đổi với phụ huynh trong phòng chat hoặc ngoài nền tảng, bạn có thể gửi đề xuất này để hai bên chính thức chốt môn, lịch học và mức giá.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Môn học & Khối lớp chốt: *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Toán lớp 9 ôn thi vào 10"
                  value={proposeForm.subject}
                  onChange={(e) => setProposeForm({ ...proposeForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Khung giờ & Lịch học đã thống nhất:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thứ 3 & Thứ 5 (19:30 – 21:00)"
                  value={proposeForm.schedule}
                  onChange={(e) => setProposeForm({ ...proposeForm, schedule: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Mức học phí thống nhất (VNĐ / buổi): *
                </label>
                <input
                  type="number"
                  placeholder="250000"
                  step="10000"
                  value={proposeForm.price}
                  onChange={(e) => setProposeForm({ ...proposeForm, price: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-conn decline" onClick={() => setProposeModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-conn confirm">
                  Gửi đề xuất thỏa thuận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rate Tutor (SC24 / UC38) */}
      {ratingModalTarget && (
        <div className="conn-modal-overlay" onClick={() => setRatingModalTarget(null)}>
          <div className="conn-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="conn-modal-header">
              <span className="conn-modal-title">Đánh giá gia sư & dịch vụ</span>
              <button className="btn-close-modal" onClick={() => setRatingModalTarget(null)}>✕</button>
            </div>

            <form onSubmit={handleRatingSubmit} className="conn-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <img
                  src={ratingModalTarget.tutor?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="Tutor"
                  style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontWeight: '800', color: '#0F172A', fontSize: '1.125rem' }}>
                    {ratingModalTarget.tutor?.full_name}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                    Môn: {ratingModalTarget.agreed_subject}
                  </p>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontWeight: '700', color: '#0F172A' }}>
                Buổi học của bạn và gia sư như thế nào?
              </p>

              <div className="star-rating-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= ratingScore ? 'active' : ''}`}
                    onClick={() => setRatingScore(star)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#334155' }}>
                Chia sẻ nhận xét chi tiết:
              </label>
              <textarea
                className="rate-textarea"
                placeholder="Gia sư có đúng giờ, giảng giải dễ hiểu và nhiệt tình không?..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569', margin: '1rem 0 1.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sharePublicly}
                  onChange={(e) => setSharePublicly(e.target.checked)}
                  style={{ accentColor: '#F4673A' }}
                />
                Hiển thị đánh giá công khai trên trang cá nhân của gia sư
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-conn decline" onClick={() => setRatingModalTarget(null)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-conn confirm">
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Suggest Create Classroom (UC21) */}
      {classroomPromptModal && (
        <div className="conn-modal-overlay" onClick={() => setClassroomPromptModal(null)}>
          <div className="conn-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="conn-modal-body" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>

              <h3 style={{ fontSize: '1.375rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>
                Tạo lớp học trực tuyến (UC21)
              </h3>

              <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: '1.6', maxWidth: '460px', margin: '0 auto 1.75rem' }}>
                Kết nối môn <strong>{classroomPromptModal.agreed_subject}</strong> đã xác nhận. Bạn có thể khởi tạo Không gian lớp học số trên TuConnector để quản lý tài liệu, điểm danh buổi học và giao bài tập trực tuyến có AI hỗ trợ chấm bài!
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button className="btn-conn decline" onClick={() => setClassroomPromptModal(null)}>
                  Để sau
                </button>
                <button
                  className="btn-conn confirm"
                  onClick={() => {
                    setClassroomPromptModal(null);
                    showToast('Điều hướng tới tính năng Tạo lớp học...');
                  }}
                >
                  Tạo lớp học ngay 🎓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
