import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getConnections,
  confirmAgreement,
  proposeAgreement,
  rateTutor,
} from '../../services/agreementService';
import '../../styles/MyConnections.css';

export default function MyConnections() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [activeConversations, setActiveConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    conversationId: '',
    subject: '',
    schedule: '',
    price: '250000',
  });

  const [ratingModalTarget, setRatingModalTarget] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [toast, setToast] = useState(null);

  let messagesBasePath = '/parent/messages';
  if (user && user.role === 'TUTOR') {
    messagesBasePath = '/tutor/messages';
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getConnections();
      const loadedConnections = data?.connections || [];
      const loadedConversations = data?.activeConversations || [];
      setConnections(loadedConnections);
      setActiveConversations(loadedConversations);
      if (loadedConversations.length > 0 && !proposeForm.conversationId) {
        const firstConv = loadedConversations[0];
        setProposeForm({
          conversationId: firstConv._id,
          subject: firstConv.subject_name || '',
          schedule: firstConv.schedule || '',
          price: String(firstConv.budget || 250000),
        });
      }
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

  const handleSelectConversation = (convId) => {
    const selected = activeConversations.find((c) => c._id === convId);
    if (selected) {
      setProposeForm({
        conversationId: selected._id,
        subject: selected.subject_name || '',
        schedule: selected.schedule || '',
        price: String(selected.budget || 250000),
      });
    } else {
      setProposeForm({ ...proposeForm, conversationId: convId });
    }
  };

  const handleConfirmAction = async (agreement, action) => {
    if (processingId) return;
    setProcessingId(agreement._id);

    try {
      const res = await confirmAgreement(agreement._id, action);
      showToast(
        res?.message ||
          (action === 'CONFIRM'
            ? 'Đã xác nhận thỏa thuận kết nối thành công!'
            : 'Đã từ chối thỏa thuận.')
      );
      await loadData();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật thỏa thuận', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!proposeForm.conversationId) {
      showToast('Vui lòng chọn phòng trò chuyện để đề xuất thỏa thuận', 'error');
      return;
    }
    if (!proposeForm.subject.trim()) {
      showToast('Vui lòng nhập môn học đã thống nhất', 'error');
      return;
    }

    try {
      const res = await proposeAgreement({
        conversationId: proposeForm.conversationId,
        agreedSubject: proposeForm.subject,
        agreedSchedule: proposeForm.schedule,
        agreedPrice: Number(proposeForm.price),
      });
      setProposeModalOpen(false);
      showToast(res?.message || 'Đã gửi đề xuất thỏa thuận kết nối!');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi gửi đề xuất', 'error');
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingModalTarget) return;

    try {
      const res = await rateTutor(ratingModalTarget._id, {
        rating: ratingScore,
        comment: ratingComment,
      });
      showToast(res?.message || 'Cảm ơn bạn đã gửi đánh giá!');
      setRatingModalTarget(null);
      setRatingComment('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Lỗi gửi đánh giá', 'error');
    }
  };

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
      {toast && (
        <div className={`toast-alert ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="conn-header-row">
        <div>
          <h2 className="conn-title">Hợp đồng &amp; Thỏa thuận kết nối</h2>
          <p className="conn-subtitle">
            Quản lý các thỏa thuận dạy kèm đã chốt và xác nhận kết nối hai bên (UC16)
          </p>
        </div>

        <button
          type="button"
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

      <div className="conn-kpi-grid">
        <div className="conn-kpi-card">
          <div className="conn-kpi-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="conn-kpi-val">{totalCount}</div>
            <div className="conn-kpi-lbl">Tổng số thỏa thuận</div>
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
            <div className="conn-kpi-lbl">Đã xác nhận (Confirmed)</div>
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
            <div className="conn-kpi-lbl">Chờ xác nhận</div>
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
            <div className="conn-kpi-lbl">Cần đánh giá gia sư</div>
          </div>
        </div>
      </div>

      <div className="conn-toolbar">
        <div className="conn-tabs">
          <button
            type="button"
            className={`conn-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả <span className="conn-tab-pill">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`conn-tab-btn ${activeTab === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CONFIRMED')}
          >
            Đã xác nhận <span className="conn-tab-pill">{confirmedCount}</span>
          </button>
          <button
            type="button"
            className={`conn-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Đang chờ <span className="conn-tab-pill">{pendingCount}</span>
          </button>
          <button
            type="button"
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

      {loading ? (
        <div className="conn-empty-state">
          <p>Đang tải danh sách thỏa thuận kết nối từ hệ thống...</p>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="conn-empty-state">
          <h3>Chưa có thỏa thuận kết nối nào</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sau khi mở hội thoại 1-1, bạn và đối tác có thể bấm &ldquo;Đề xuất thỏa thuận mới&rdquo; để ghi nhận hợp đồng dạy kèm tại đây.
          </p>
        </div>
      ) : (
        <div className="conn-cards-grid">
          {filteredConnections.map((conn) => {
            const isConfirmed = conn.status === 'CONFIRMED';
            const isPending = conn.status === 'PENDING';
            const partner =
              user && user.role === 'TUTOR'
                ? conn.parent || {}
                : conn.tutor || {};
            const partnerRoleLabel =
              user && user.role === 'TUTOR'
                ? 'Phụ huynh học sinh'
                : conn.tutor?.headline || 'Gia sư TuConnector';

            return (
              <div
                key={conn._id}
                className={`conn-card ${isConfirmed ? 'confirmed' : isPending ? 'pending' : 'rejected'}`}
              >
                <div className="conn-partner-row">
                  <div className="conn-partner-profile">
                    <img
                      src={
                        partner.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      }
                      alt={partner.full_name}
                      className="conn-partner-avatar"
                    />
                    <div>
                      <div className="conn-partner-name">{partner.full_name}</div>
                      <div className="conn-partner-role">{partnerRoleLabel}</div>
                    </div>
                  </div>

                  <span
                    className={`conn-status-badge ${
                      isConfirmed ? 'confirmed' : isPending ? 'pending' : 'rejected'
                    }`}
                  >
                    {isConfirmed
                      ? '✓ Đã xác nhận'
                      : isPending
                      ? '⏳ Chờ xác nhận'
                      : conn.status === 'CANCELLED'
                      ? '⊘ Đã hủy'
                      : '✕ Từ chối'}
                  </span>
                </div>

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
                      <span className="conn-term-label">Khung giờ &amp; Lịch học chốt</span>
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
                        {conn.agreed_price
                          ? `${Number(conn.agreed_price).toLocaleString('vi-VN')} đ`
                          : '250.000 đ'}{' '}
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500' }}>
                          / buổi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="conn-proposer-note">
                  Đề xuất bởi: <strong>{conn.proposer?.full_name || 'Đối tác'}</strong>{' '}
                  {conn.created_at && `· ${new Date(conn.created_at).toLocaleDateString('vi-VN')}`}
                  {isConfirmed && conn.request?.status === 'CLOSED' && (
                    <span style={{ color: '#059669', marginLeft: '0.5rem', fontWeight: '600' }}>
                      (Bài yêu cầu đã đóng)
                    </span>
                  )}
                </div>

                <div className="conn-card-actions">
                  {isPending && String(conn.proposer?._id) !== String(user?.id) && (
                    <>
                      <button
                        type="button"
                        className="btn-conn decline"
                        onClick={() => handleConfirmAction(conn, 'REJECT')}
                        disabled={processingId === conn._id}
                      >
                        Từ chối
                      </button>

                      <button
                        type="button"
                        className="btn-conn confirm"
                        onClick={() => handleConfirmAction(conn, 'CONFIRM')}
                        disabled={processingId === conn._id}
                      >
                        {processingId === conn._id ? 'Đang xác nhận...' : 'Xác nhận đồng ý (Confirm)'}
                      </button>
                    </>
                  )}

                  {isPending && String(conn.proposer?._id) === String(user?.id) && (
                    <button
                      type="button"
                      className="btn-conn decline"
                      onClick={() => handleConfirmAction(conn, 'CANCEL')}
                      disabled={processingId === conn._id}
                    >
                      {processingId === conn._id ? 'Đang hủy...' : 'Hủy đề xuất'}
                    </button>
                  )}

                  {isConfirmed && user?.role === 'PARENT' && (
                    <>
                      {!conn.hasRated ? (
                        <button
                          type="button"
                          className="btn-conn rate"
                          onClick={() => setRatingModalTarget(conn)}
                        >
                          ⭐ Đánh giá gia sư
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: '700' }}>
                          ✓ Đã đánh giá {conn.review?.rating || 5}★
                        </span>
                      )}
                    </>
                  )}

                  {isConfirmed && user?.role === 'TUTOR' && (
                    <button
                      type="button"
                      className="btn-conn rate"
                      onClick={() =>
                        showToast(
                          `Gợi ý UC19: Bạn có thể tạo lớp học mới cho môn "${conn.agreed_subject}" theo lịch ${conn.agreed_schedule}.`
                        )
                      }
                    >
                      🏫 Tạo lớp học (UC19)
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-conn chat"
                    onClick={() =>
                      navigate(
                        conn.conversation_id
                          ? `${messagesBasePath}/${conn.conversation_id}`
                          : messagesBasePath
                      )
                    }
                  >
                    💬 Mở phòng chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {proposeModalOpen && (
        <div className="conn-modal-overlay" onClick={() => setProposeModalOpen(false)}>
          <div className="conn-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="conn-modal-header">
              <span className="conn-modal-title">Đề xuất thỏa thuận dạy học</span>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setProposeModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeSubmit} className="conn-modal-body">
              <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Chọn phòng hội thoại 1-1 đang hoạt động để gửi đề xuất chốt môn học, lịch dạy và mức học phí.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Phòng hội thoại đang mở: *
                </label>
                {activeConversations.length === 0 ? (
                  <p style={{ color: '#EF4444', fontSize: '0.8125rem' }}>
                    Bạn chưa có phòng hội thoại 1-1 nào đang hoạt động.
                  </p>
                ) : (
                  <select
                    value={proposeForm.conversationId}
                    onChange={(e) => handleSelectConversation(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                    required
                  >
                    <option value="">-- Chọn hội thoại --</option>
                    {activeConversations.map((conv) => (
                      <option key={conv._id} value={conv._id}>
                        {conv.request_title} ({conv.parent_name} - {conv.tutor_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Môn học &amp; Khối lớp chốt: *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Toán lớp 9 ôn thi vào 10"
                  value={proposeForm.subject}
                  onChange={(e) => setProposeForm({ ...proposeForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Khung giờ &amp; Lịch học đã thống nhất:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thứ 3 & Thứ 5 (19:30 – 21:00)"
                  value={proposeForm.schedule}
                  onChange={(e) => setProposeForm({ ...proposeForm, schedule: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-conn decline"
                  onClick={() => setProposeModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-conn confirm"
                  disabled={activeConversations.length === 0}
                >
                  Gửi đề xuất thỏa thuận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ratingModalTarget && (
        <div className="conn-modal-overlay" onClick={() => setRatingModalTarget(null)}>
          <div className="conn-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="conn-modal-header">
              <span className="conn-modal-title">Đánh giá gia sư</span>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setRatingModalTarget(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRatingSubmit} className="conn-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <img
                  src={
                    ratingModalTarget.tutor?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt="Gia sư"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-conn decline"
                  onClick={() => setRatingModalTarget(null)}
                >
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
    </div>
  );
}
