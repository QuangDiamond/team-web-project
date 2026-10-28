import React, { useEffect, useState } from 'react';
import { moderationService } from '../../services/moderationService';
import '../../styles/Moderation.css';

const ACTION_OPTIONS = [
  {
    key: 'NONE',
    title: 'Bỏ qua báo cáo (Dismiss)',
    desc: 'Báo cáo không vi phạm tiêu chuẩn cộng đồng hoặc không đủ bằng chứng.'
  },
  {
    key: 'CONTENT_HIDDEN',
    title: 'Tạm ẩn nội dung (Content Hidden)',
    desc: 'Tạm ẩn nội dung khỏi trang tìm kiếm công khai để chờ người dùng đính chính.'
  },
  {
    key: 'CONTENT_REMOVED',
    title: 'Gỡ bỏ nội dung (Content Removed)',
    desc: 'Xóa vĩnh viễn nội dung vi phạm nghiêm trọng (lừa đảo, thông tin giả mạo).'
  },
  {
    key: 'WARNING_SENT',
    title: 'Gửi cảnh cáo đến người dùng (Warning Sent)',
    desc: 'Gửi thông báo cảnh cáo chính thức vi phạm điều khoản dịch vụ (BR-22).'
  },
  {
    key: 'USER_BANNED',
    title: 'Khóa tài khoản vi phạm (Lock User - UC39)',
    desc: 'Khóa tài khoản người dùng do tái phạm nhiều lần hoặc vi phạm đặc biệt nghiêm trọng.'
  }
];

export default function Moderation() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pendingCount: 0,
    criticalCount: 0,
    resolvedCount: 0
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Selected report for resolution modal
  const [activeReport, setActiveReport] = useState(null);
  const [selectedAction, setSelectedAction] = useState('CONTENT_HIDDEN');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAuditSection, setShowAuditSection] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await moderationService.getReports({
        status: statusFilter,
        severity: severityFilter,
        target_type: targetTypeFilter
      });
      setReports(res.reports || []);
      setSummary(
        res.summary || {
          total: 0,
          pendingCount: 0,
          criticalCount: 0,
          resolvedCount: 0
        }
      );
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await moderationService.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchAuditLogs();
  }, [statusFilter, severityFilter, targetTypeFilter]);

  const handleOpenResolveModal = (report) => {
    setActiveReport(report);
    setSelectedAction(report.action_taken && report.action_taken !== 'NONE' ? report.action_taken : 'CONTENT_HIDDEN');
    setAdminNote(report.admin_note || '');
  };

  const handleCloseResolveModal = () => {
    setActiveReport(null);
    setAdminNote('');
  };

  const handleSubmitResolution = async () => {
    if (!adminNote.trim()) {
      showToast('⚠️ Quy tắc BR-20: Vui lòng nhập lý do/ghi chú xử lý của Admin.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await moderationService.resolveReport(activeReport._id, {
        action: selectedAction,
        admin_note: adminNote.trim(),
        ban_user_id: activeReport.reporter_user_id?._id
      });
      showToast(res.message || 'Đã xử lý báo cáo thành công!');
      handleCloseResolveModal();
      fetchReports();
      fetchAuditLogs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'badge-severity sev-critical';
      case 'HIGH':
        return 'badge-severity sev-high';
      case 'MEDIUM':
        return 'badge-severity sev-medium';
      default:
        return 'badge-severity sev-low';
    }
  };

  const getStatusBadgeClass = (st) => {
    switch (st) {
      case 'PENDING':
        return 'badge-status status-pending';
      case 'INVESTIGATING':
        return 'badge-status status-investigating';
      case 'RESOLVED':
        return 'badge-status status-resolved';
      default:
        return 'badge-status status-dismissed';
    }
  };

  return (
    <div className="mod-page">
      <div className="mod-container">
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🛡️</span> {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="mod-header">
          <div className="mod-title-wrap">
            <div className="mod-shield-badge">🛡️</div>
            <div className="mod-title-box">
              <h1>Kiểm duyệt nội dung & Báo cáo vi phạm</h1>
              <p>
                Xử lý khiếu nại, bài đăng vi phạm và nhật ký kiểm duyệt hệ thống
                theo quy tắc BR-20
              </p>
            </div>
          </div>

          <button
            className="mod-audit-btn"
            onClick={() => setShowAuditSection(!showAuditSection)}
          >
            <span>📜</span> {showAuditSection ? 'Ẩn Audit Log' : 'Xem Audit Log (BR-20)'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mod-stats-grid">
          <div className="stat-card">
            <div className="stat-icon icon-total">📋</div>
            <div className="stat-info">
              <div className="stat-val">{summary.total}</div>
              <div className="stat-lbl">Tổng số báo cáo</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-pending">⏳</div>
            <div className="stat-info">
              <div className="stat-val">{summary.pendingCount}</div>
              <div className="stat-lbl">Đang chờ xử lý</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-critical">🚨</div>
            <div className="stat-info">
              <div className="stat-val">{summary.criticalCount}</div>
              <div className="stat-lbl">Mức độ khẩn cấp</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-resolved">✅</div>
            <div className="stat-info">
              <div className="stat-val">{summary.resolvedCount}</div>
              <div className="stat-lbl">Đã giải quyết</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mod-filters-bar">
          <div className="mod-status-tabs">
            {['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map(
              (st) => (
                <button
                  key={st}
                  className={`status-tab-btn ${
                    statusFilter === st ? 'active' : ''
                  }`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'ALL' && 'Tất cả trạng thái'}
                  {st === 'PENDING' && 'Chờ xử lý'}
                  {st === 'INVESTIGATING' && 'Đang xác minh'}
                  {st === 'RESOLVED' && 'Đã xử lý'}
                  {st === 'DISMISSED' && 'Đã bỏ qua'}
                </button>
              )
            )}
          </div>

          <div className="mod-select-filters">
            <select
              className="mod-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">Mọi mức độ nghiêm trọng</option>
              <option value="CRITICAL">🔴 Critical (Khẩn cấp)</option>
              <option value="HIGH">🟠 High (Cao)</option>
              <option value="MEDIUM">🟡 Medium (Vừa)</option>
              <option value="LOW">🟢 Low (Thấp)</option>
            </select>

            <select
              className="mod-select"
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
            >
              <option value="ALL">Mọi loại đối tượng</option>
              <option value="POST">Bài đăng gia sư (POST)</option>
              <option value="REQUEST">Yêu cầu tìm gia sư (REQUEST)</option>
              <option value="REVIEW">Đánh giá & Rating (REVIEW)</option>
              <option value="MESSAGE">Tin nhắn hội thoại (MESSAGE)</option>
              <option value="USER">Tài khoản người dùng (USER)</option>
              <option value="CLASSROOM">Lớp học (CLASSROOM)</option>
            </select>
          </div>
        </div>

        {/* Reports list */}
        {loading ? (
          <div
            style={{
              background: 'white',
              padding: '60px',
              textAlign: 'center',
              borderRadius: '16px'
            }}
          >
            <h3>Đang tải danh sách kiểm duyệt...</h3>
          </div>
        ) : reports.length === 0 ? (
          <div
            style={{
              background: 'white',
              padding: '60px',
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px solid #edf2f7'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h3>Hàng đợi kiểm duyệt trống</h3>
            <p style={{ color: '#94a3b8' }}>
              Không có nội dung hoặc báo cáo vi phạm nào phù hợp với bộ lọc hiện
              tại.
            </p>
          </div>
        ) : (
          <div className="mod-reports-list">
            {reports.map((item) => (
              <div
                key={item._id}
                className={`report-item-card ${
                  item.severity === 'CRITICAL'
                    ? 'border-critical'
                    : item.severity === 'HIGH'
                    ? 'border-high'
                    : ''
                }`}
              >
                <div className="report-top-meta">
                  <div className="meta-badges-group">
                    <span className="badge-target">{item.target_type}</span>
                    <span className={getSeverityBadgeClass(item.severity)}>
                      {item.severity}
                    </span>
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status}
                    </span>
                  </div>

                  <span className="report-date">
                    Tạo lúc: {new Date(item.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="report-body-box">
                  <div className="report-reason-row">
                    <span>⚠️ Lý do vi phạm:</span> {item.reason}
                  </div>

                  {item.content_snippet && (
                    <div className="report-content-preview">
                      <div className="preview-title">
                        {item.content_snippet.title} — {item.content_snippet.author}
                      </div>
                      <div className="preview-body">
                        "{item.content_snippet.body_preview}"
                      </div>
                    </div>
                  )}

                  {item.reporter_user_id && (
                    <div className="report-reporter-info">
                      <span>Người báo cáo:</span>
                      <img
                        src={
                          item.reporter_user_id.avatar_url ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                        }
                        alt=""
                        className="reporter-avatar"
                      />
                      <strong>{item.reporter_user_id.full_name}</strong>
                      <span>({item.reporter_user_id.role})</span>
                      <span>· {item.reporter_user_id.email}</span>
                    </div>
                  )}
                </div>

                <div className="report-footer-actions">
                  <div>
                    {item.admin_note && (
                      <span className="resolved-note-tag">
                        <span>📝 Ghi chú Admin:</span> {item.admin_note} (Hành
                        động: {item.action_taken})
                      </span>
                    )}
                  </div>

                  <button
                    className="btn-handle-report"
                    onClick={() => handleOpenResolveModal(item)}
                  >
                    <span>⚖️</span> Xử lý báo cáo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit Logs Section per BR-20 */}
        {showAuditSection && (
          <div className="audit-logs-section">
            <div className="audit-section-header">
              <h2>
                <span>📜</span> Nhật ký kiểm duyệt (Admin Audit Logs - BR-20)
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Ghi vết bắt buộc mọi quyết định xử lý
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Admin thực hiện</th>
                    <th>Hành động</th>
                    <th>Lý do xử lý (BR-20)</th>
                    <th>Chi tiết đối tượng</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: 'nowrap', color: '#94a3b8' }}>
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <strong>{log.admin_user_id?.full_name || 'Admin'}</strong>
                      </td>
                      <td>
                        <span className="audit-action-tag">{log.action}</span>
                      </td>
                      <td>{log.reason}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {log.details_json
                          ? JSON.stringify(log.details_json)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resolution Modal */}
        {activeReport && (
          <div className="mod-modal-overlay" onClick={handleCloseResolveModal}>
            <div
              className="mod-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mod-modal-header">
                <h3>⚖️ Quyết định kiểm duyệt báo cáo vi phạm</h3>
                <button
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                  onClick={handleCloseResolveModal}
                >
                  ✕
                </button>
              </div>

              <div className="mod-modal-body">
                <div style={{ marginBottom: '16px' }}>
                  <span
                    className={getSeverityBadgeClass(activeReport.severity)}
                    style={{ marginRight: '8px' }}
                  >
                    {activeReport.severity}
                  </span>
                  <span className="badge-target">{activeReport.target_type}</span>
                  <p
                    style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#1e293b'
                    }}
                  >
                    <strong>Lý do tố cáo:</strong> {activeReport.reason}
                  </p>
                </div>

                <div className="action-options-group">
                  {ACTION_OPTIONS.map((act) => (
                    <div
                      key={act.key}
                      className={`action-radio-box ${
                        selectedAction === act.key ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedAction(act.key)}
                    >
                      <input
                        type="radio"
                        name="resolutionAction"
                        checked={selectedAction === act.key}
                        onChange={() => setSelectedAction(act.key)}
                      />
                      <div>
                        <div className="action-title">{act.title}</div>
                        <div className="action-desc">{act.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="br20-banner">
                  <span>📌</span>
                  <span>
                    <strong>Quy định BR-20:</strong> Mọi hành động can thiệp nội
                    dung và tài khoản của Admin phải ghi rõ căn cứ và lý do xử lý
                    để lưu vào nhật ký kiểm toán.
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '6px'
                    }}
                  >
                    Lý do / Căn cứ xử lý của Admin <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="admin-note-input"
                    placeholder="Ví dụ: Nội dung vi phạm chính sách hiển thị số điện thoại cá nhân theo quy định BR-22..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="mod-modal-footer">
                <button
                  className="mod-audit-btn"
                  onClick={handleCloseResolveModal}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  className="btn-handle-report"
                  onClick={handleSubmitResolution}
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận xử lý (BR-20)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
