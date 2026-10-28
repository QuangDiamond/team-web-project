import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvitations, respondToInvitation } from '../../services/invitationService';
import '../../styles/InvitationsInbox.css';

export default function InvitationsInbox() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({ credit_balance: 5, plan_name: 'Gói Pro Tutor' });
  const [invitations, setInvitations] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState(null); // Review request modal
  const [declineTarget, setDeclineTarget] = useState(null); // Decline confirm modal
  const [declineReason, setDeclineReason] = useState('');
  const [successConnectData, setSuccessConnectData] = useState(null); // Accept success modal
  const [creditAlertModal, setCreditAlertModal] = useState(false); // E1 modal
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getInvitations();
      if (data.tutorWallet) {
        setWallet(data.tutorWallet);
      }
      setInvitations(data.invitations || []);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách lời mời dạy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAccept = async (inv) => {
    // Kiểm tra ngoại lệ E2: Yêu cầu của phụ huynh đã đóng
    if (inv.request && inv.request.status !== 'OPEN') {
      showToast('Yêu cầu tìm gia sư này hiện không còn mở (E2: Request already closed).', 'error');
      return;
    }

    // Kiểm tra ngoại lệ E1: Gia sư không đủ credit
    if ((wallet.credit_balance ?? 0) < 1) {
      setCreditAlertModal(true);
      return;
    }

    if (processingId) return;
    setProcessingId(inv._id);

    try {
      const res = await respondToInvitation(inv._id, 'CONTINUE');

      // Cập nhật trạng thái lời mời và trừ 1 credit hiển thị
      setInvitations((prev) =>
        prev.map((item) =>
          item._id === inv._id ? { ...item, status: 'ACCEPTED' } : item
        )
      );

      setWallet((prev) => ({
        ...prev,
        credit_balance: Math.max(0, (prev.credit_balance || 1) - 1),
      }));

      setSuccessConnectData({
        parentName: inv.parent?.full_name || 'Phụ huynh',
        requestTitle: inv.request?.title || 'Yêu cầu tìm gia sư',
        conversationId: res?.conversationId || 'conv_1',
      });

      showToast('Đã chấp nhận lời mời dạy! Phòng chat 1-1 đã kích hoạt (POST-1).');
    } catch (err) {
      if (err.message && err.message.includes('E1')) {
        setCreditAlertModal(true);
      } else {
        showToast(err.message || 'Không thể chấp nhận lời mời', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineTarget) return;

    try {
      await respondToInvitation(declineTarget._id, 'SKIP', declineReason);

      setInvitations((prev) =>
        prev.map((item) =>
          item._id === declineTarget._id ? { ...item, status: 'DECLINED' } : item
        )
      );

      showToast('Đã từ chối lời mời dạy. Không có credit nào bị trừ (A1 / POST-2).');
    } catch (err) {
      showToast(err.message || 'Lỗi khi từ chối lời mời', 'error');
    } finally {
      setDeclineTarget(null);
      setDeclineReason('');
    }
  };

  // Filter & Search
  const filteredInvitations = invitations
    .filter((inv) => {
      if (activeTab === 'ALL') return true;
      return inv.status === activeTab;
    })
    .filter((inv) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const parentName = (inv.parent?.full_name || '').toLowerCase();
      const reqTitle = (inv.request?.title || '').toLowerCase();
      const subject = (inv.request?.subject_name || '').toLowerCase();
      const msg = (inv.message || '').toLowerCase();
      return parentName.includes(q) || reqTitle.includes(q) || subject.includes(q) || msg.includes(q);
    });

  const totalCount = invitations.length;
  const pendingCount = invitations.filter((i) => i.status === 'PENDING').length;
  const acceptedCount = invitations.filter((i) => i.status === 'ACCEPTED').length;
  const declinedCount = invitations.filter((i) => i.status === 'DECLINED').length;

  return (
    <div className="inbox-page">
      {/* Toast */}
      {toast && (
        <div className={`toast-alert ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="inbox-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="separator">/</span>
        <span className="current">Lời mời dạy kèm</span>
      </nav>

      {/* Header */}
      <div className="inbox-header-row">
        <div>
          <h1 className="inbox-header-title">Lời mời dạy kèm từ phụ huynh</h1>
          <p className="inbox-header-subtitle">
            Tiếp nhận và phản hồi các đề nghị dạy kèm trực tiếp từ phụ huynh học sinh
          </p>
        </div>
      </div>

      {/* Tutor Credit Wallet Banner */}
      <div className="wallet-summary-banner">
        <div className="wallet-info-group">
          <div className="wallet-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <circle cx="16" cy="15" r="1.5" />
            </svg>
          </div>
          <div className="wallet-details">
            <h3>
              Ví Connection Credit:{' '}
              <span className="wallet-credit-pill">{wallet.credit_balance} Credits khả dụng</span>
            </h3>
            <p>
              Gói hiện tại: <strong>{wallet.plan_name}</strong>. Khi bạn bấm <strong>Tiếp tục / Chấp nhận</strong>, hệ thống sẽ tự động trừ 1 credit từ ví để mở kết nối và phiên chat 1-1 với phụ huynh.
            </p>
          </div>
        </div>

        <Link to="/payment" className="btn-buy-credit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Nạp thêm Credit
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="inbox-filter-bar">
        <div className="inbox-tabs">
          <button
            className={`inbox-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả <span className="inbox-tab-badge">{totalCount}</span>
          </button>
          <button
            className={`inbox-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Mới nhận <span className="inbox-tab-badge">{pendingCount}</span>
          </button>
          <button
            className={`inbox-tab-btn ${activeTab === 'ACCEPTED' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACCEPTED')}
          >
            Đã đồng ý <span className="inbox-tab-badge">{acceptedCount}</span>
          </button>
          <button
            className={`inbox-tab-btn ${activeTab === 'DECLINED' ? 'active' : ''}`}
            onClick={() => setActiveTab('DECLINED')}
          >
            Đã từ chối <span className="inbox-tab-badge">{declinedCount}</span>
          </button>
        </div>

        <input
          type="text"
          placeholder="Tìm theo tên phụ huynh, môn học..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="inbox-search-input"
        />
      </div>

      {/* Invitations List */}
      {loading ? (
        <div className="inbox-empty-box">
          <p>Đang tải danh sách lời mời dạy...</p>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="inbox-empty-box">
          <div className="inbox-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3>Không có lời mời nào trong mục này</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Các lời mời dạy mới từ phụ huynh sẽ xuất hiện tại đây khi họ xem hồ sơ công khai của bạn.
          </p>
        </div>
      ) : (
        <div className="invitations-list">
          {filteredInvitations.map((inv) => {
            const isPending = inv.status === 'PENDING';
            const isAccepted = inv.status === 'ACCEPTED';
            const isDeclined = inv.status === 'DECLINED';
            const parent = inv.parent || {};
            const req = inv.request || {};

            return (
              <div
                key={inv._id}
                className={`invitation-card ${isPending ? 'pending' : isAccepted ? 'accepted' : 'declined'}`}
              >
                {/* Card Top: Sender & Time */}
                <div className="invitation-card-top">
                  <div className="sender-profile-info">
                    <img
                      src={parent.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                      alt={parent.full_name}
                      className="sender-avatar"
                    />
                    <div className="sender-name-box">
                      <div className="sender-name">
                        <span>{parent.full_name}</span>
                        {parent.verified !== false && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563EB">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                      </div>
                      <span className="sender-role-label">Phụ huynh · {parent.location || 'Hà Nội'}</span>
                    </div>
                  </div>

                  <div className="invitation-time-status">
                    <span className="time-stamp">
                      {new Date(inv.created_at).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                    <span
                      className={`inv-status-chip ${
                        isPending ? 'pending' : isAccepted ? 'accepted' : 'declined'
                      }`}
                    >
                      {isPending ? 'Chờ phản hồi' : isAccepted ? 'Đã chấp nhận' : 'Đã từ chối'}
                    </span>
                  </div>
                </div>

                {/* Parent's personal invitation message */}
                {inv.message && (
                  <div className="parent-message-bubble">
                    <strong>Lời nhắn từ phụ huynh:</strong>
                    "{inv.message}"
                  </div>
                )}

                {/* Attached Tutoring Request Preview */}
                {inv.request && (
                  <div className="associated-request-box">
                    <div className="req-header-row">
                      <span className="req-title">{req.title}</span>
                      <div className="req-chips-group">
                        <span className="req-chip subject">Môn {req.subject_name}</span>
                        <span className="req-chip grade">{req.grade_level}</span>
                        <span className="req-chip mode">
                          {req.teaching_mode === 'ONLINE'
                            ? 'Học Online'
                            : req.teaching_mode === 'OFFLINE'
                            ? 'Tại nhà'
                            : 'Hybrid'}
                        </span>
                      </div>
                    </div>

                    <div className="req-details-grid">
                      <div className="req-detail-col">
                        <strong>Học phí đề xuất</strong>
                        <span style={{ color: '#F4673A', fontWeight: '700' }}>
                          {req.budget ? `${Number(req.budget).toLocaleString('vi-VN')} đ/buổi` : 'Thỏa thuận'}
                        </span>
                      </div>
                      <div className="req-detail-col">
                        <strong>Lịch học</strong>
                        <span>{req.schedule || 'Linh hoạt'}</span>
                      </div>
                      <div className="req-detail-col">
                        <strong>Địa điểm</strong>
                        <span>{req.location_address || 'Toàn quốc'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="invitation-actions-row">
                  {inv.request && (
                    <button
                      className="btn-inv details"
                      onClick={() => setSelectedRequest(inv.request)}
                    >
                      Xem chi tiết yêu cầu
                    </button>
                  )}

                  {isPending && (
                    <>
                      <button
                        className="btn-inv decline"
                        onClick={() => setDeclineTarget(inv)}
                        disabled={processingId === inv._id}
                      >
                        Từ chối (Skip)
                      </button>

                      <button
                        className="btn-inv accept"
                        onClick={() => handleAccept(inv)}
                        disabled={processingId === inv._id}
                        title="Trừ 1 connection credit và mở phòng chat 1-1 với phụ huynh"
                      >
                        {processingId === inv._id ? 'Đang kết nối...' : 'Chấp nhận & Mở chat (Continue)'}
                      </button>
                    </>
                  )}

                  {isAccepted && (
                    <button
                      className="btn-inv chat"
                      onClick={() => navigate('/messages')}
                    >
                      Vào phòng chat 1-1 💬
                    </button>
                  )}

                  {isDeclined && (
                    <button
                      className="btn-inv details"
                      onClick={() => handleAccept(inv)}
                    >
                      Chấp nhận lại
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Review Full Parent Request */}
      {selectedRequest && (
        <div className="inbox-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inbox-modal-header">
              <span className="inbox-modal-title">Chi tiết yêu cầu tìm gia sư</span>
              <button className="btn-close-modal" onClick={() => setSelectedRequest(null)}>✕</button>
            </div>
            <div className="inbox-modal-body">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>
                {selectedRequest.title}
              </h3>
              <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {selectedRequest.description || 'Không có mô tả bổ sung.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Môn & Lớp</span>
                  <p style={{ fontWeight: '700', color: '#0F172A', marginTop: '0.2rem' }}>
                    {selectedRequest.subject_name} · {selectedRequest.grade_level}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Mức học phí</span>
                  <p style={{ fontWeight: '700', color: '#F4673A', marginTop: '0.2rem' }}>
                    {selectedRequest.budget ? `${Number(selectedRequest.budget).toLocaleString('vi-VN')} đ/buổi` : 'Thỏa thuận'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Lịch học</span>
                  <p style={{ fontWeight: '700', color: '#0F172A', marginTop: '0.2rem' }}>{selectedRequest.schedule}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Địa điểm</span>
                  <p style={{ fontWeight: '700', color: '#0F172A', marginTop: '0.2rem' }}>{selectedRequest.location_address}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-inv details" onClick={() => setSelectedRequest(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Decline Reason Confirmation (A1) */}
      {declineTarget && (
        <div className="inbox-modal-overlay" onClick={() => setDeclineTarget(null)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inbox-modal-header">
              <span className="inbox-modal-title">Xác nhận từ chối lời mời dạy</span>
              <button className="btn-close-modal" onClick={() => setDeclineTarget(null)}>✕</button>
            </div>
            <div className="inbox-modal-body">
              <p style={{ color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn từ chối lời mời dạy từ phụ huynh <strong>{declineTarget.parent?.full_name}</strong>? Thao tác này sẽ gửi thông báo đến phụ huynh và bạn không bị trừ Connection Credit.
              </p>

              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Lý do từ chối (tùy chọn):
              </label>
              <textarea
                placeholder="Ví dụ: Hiện tại tôi đã kín lịch dạy vào các buổi tối trong tuần..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.875rem' }}
              />

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn-inv details" onClick={() => setDeclineTarget(null)}>Hủy bỏ</button>
                <button className="btn-inv decline" style={{ backgroundColor: '#DC2626', color: '#FFF' }} onClick={handleConfirmDecline}>
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Connection Success (POST-1) */}
      {successConnectData && (
        <div className="inbox-modal-overlay" onClick={() => setSuccessConnectData(null)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-dialog">
              <div className="success-icon-badge">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="success-modal-title">
                Đã chấp nhận lời mời từ {successConnectData.parentName}!
              </h2>

              <p className="success-modal-desc">
                Phòng chat 1-1 trực tiếp đã được kích hoạt. Bạn và phụ huynh có thể trao đổi ngay về mục tiêu học tập, lịch học cụ thể và thống nhất học phí.
              </p>

              <div className="credit-deducted-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Hệ thống đã trừ 1 Connection Credit từ ví của bạn (POST-1).</span>
              </div>

              <div className="success-actions-row">
                <button
                  className="btn-inv details"
                  onClick={() => setSuccessConnectData(null)}
                >
                  Ở lại xem lời mời khác
                </button>

                <button
                  className="btn-inv accept"
                  onClick={() => {
                    setSuccessConnectData(null);
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

      {/* MODAL: E1 Insufficient Credits Exception */}
      {creditAlertModal && (
        <div className="inbox-modal-overlay" onClick={() => setCreditAlertModal(false)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-dialog">
              <div className="success-icon-badge" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <h2 className="success-modal-title">
                Bạn cần tối thiểu 1 Connection Credit!
              </h2>

              <p className="success-modal-desc">
                (Ngoại lệ E1): Số dư Connection Credit của bạn hiện bằng 0. Lời mời dạy vẫn được lưu giữ an toàn ở trạng thái Chờ (Pending). Vui lòng mua thêm gói credit hoặc nâng cấp gói Pro để tiếp tục mở kết nối với phụ huynh.
              </p>

              <div className="success-actions-row">
                <button
                  className="btn-inv details"
                  onClick={() => setCreditAlertModal(false)}
                >
                  Để sau
                </button>

                <button
                  className="btn-buy-credit"
                  onClick={() => {
                    setCreditAlertModal(false);
                    navigate('/payment');
                  }}
                >
                  Nâng cấp gói & Mua Credit ngay (UC19)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
