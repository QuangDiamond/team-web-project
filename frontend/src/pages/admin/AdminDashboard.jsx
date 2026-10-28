import React, { useEffect, useState } from 'react';
import { statsService } from '../../services/statsService';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [exportModalData, setExportModalData] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await statsService.getStats(period);
      setStats(res);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const handleExportReport = async () => {
    try {
      const report = await statsService.exportReport(period);
      setExportModalData(report);
      showToast('Đã trích xuất báo cáo hệ thống thành công (A1)!');
    } catch {
      showToast('Có lỗi xảy ra khi xuất báo cáo.');
    }
  };

  if (!stats && loading) {
    return (
      <div className="dash-page">
        <div className="dash-container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <h3>Đang tải số liệu thống kê hệ thống (SC40)...</h3>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const trends = stats?.trends || { labels: [], revenue: [], userGrowth: [] };
  const maxRevenue = Math.max(...(trends.revenue || [1]), 1);

  return (
    <div className="dash-page">
      <div className="dash-container">
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
            <span>📊</span> {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="dash-header">
          <div className="dash-title-wrap">
            <div className="dash-icon-badge">📈</div>
            <div className="dash-title-box">
              <h1>Bảng điều khiển hệ thống & Thống kê KPI (SC40)</h1>
              <p>
                Theo dõi hiệu suất vận hành người dùng, doanh thu, kết nối gia sư
                và hoạt động lớp học (UC42)
              </p>
            </div>
          </div>

          <div className="dash-header-controls">
            <div className="period-switcher">
              <button
                className={`period-btn ${period === '7d' ? 'active' : ''}`}
                onClick={() => setPeriod('7d')}
              >
                7 ngày
              </button>
              <button
                className={`period-btn ${period === '30d' ? 'active' : ''}`}
                onClick={() => setPeriod('30d')}
              >
                30 ngày
              </button>
              <button
                className={`period-btn ${period === '90d' ? 'active' : ''}`}
                onClick={() => setPeriod('90d')}
              >
                90 ngày
              </button>
              <button
                className={`period-btn ${period === '1y' ? 'active' : ''}`}
                onClick={() => setPeriod('1y')}
              >
                1 năm
              </button>
            </div>

            <button
              className="btn-export-report"
              onClick={handleExportReport}
              title="Xuất báo cáo thống kê định dạng JSON / Excel (A1)"
            >
              <span>📥</span> Xuất báo cáo (A1)
            </button>
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="kpi-cards-grid">
          {/* Card 1: Users */}
          <div className="kpi-card kpi-users">
            <div className="kpi-top">
              <span className="kpi-title">Tổng người dùng</span>
              <div className="kpi-icon-pill pill-users">👥</div>
            </div>
            <div className="kpi-value">{kpis.totalUsers?.toLocaleString('vi-VN')}</div>
            <div className="kpi-subtext">
              <span>{kpis.activeParents} Phụ huynh</span> · <span>{kpis.activeTutors} Gia sư</span> · <span>{kpis.activeStudents} Học sinh</span>
            </div>
          </div>

          {/* Card 2: GMV Revenue */}
          <div className="kpi-card kpi-revenue">
            <div className="kpi-top">
              <span className="kpi-title">Tổng doanh thu (GMV)</span>
              <div className="kpi-icon-pill pill-revenue">💰</div>
            </div>
            <div className="kpi-value">
              {kpis.totalGmv ? `${(kpis.totalGmv / 1000000).toFixed(1)}M đ` : '0 đ'}
            </div>
            <div className="kpi-subtext">
              <strong>+18.4%</strong> so với kỳ trước · Gói Pro & Credit
            </div>
          </div>

          {/* Card 3: Confirmed Connections */}
          <div className="kpi-card kpi-connections">
            <div className="kpi-top">
              <span className="kpi-title">Kết nối thành công (UC18)</span>
              <div className="kpi-icon-pill pill-connections">🤝</div>
            </div>
            <div className="kpi-value">{kpis.confirmedConnections}</div>
            <div className="kpi-subtext">
              Tỉ lệ khớp nối: <strong>{kpis.conversionRate}%</strong>
            </div>
          </div>

          {/* Card 4: Classrooms & AI */}
          <div className="kpi-card kpi-classes">
            <div className="kpi-top">
              <span className="kpi-title">Lớp học & Trợ lý AI</span>
              <div className="kpi-icon-pill pill-classes">🏫</div>
            </div>
            <div className="kpi-value">{kpis.activeClassrooms} lớp</div>
            <div className="kpi-subtext">
              Đã tạo <strong>{kpis.aiQuotaUtilized?.toLocaleString('vi-VN')}</strong> bài tập & câu hỏi AI
            </div>
          </div>
        </div>

        {/* Middle Section: Chart & Role Breakdown */}
        <div className="dash-middle-grid">
          {/* Revenue Trend Visual Bar Chart */}
          <div className="dash-panel">
            <div className="panel-title-box">
              <h3>
                <span>📊</span> Biểu đồ doanh thu theo chu kỳ ({period})
              </h3>
              <span className="panel-tag">VNĐ / Kỳ</span>
            </div>

            <div className="bar-chart-container">
              {trends.labels?.map((label, idx) => {
                const val = trends.revenue[idx] || 0;
                const heightPct = Math.max(15, Math.round((val / maxRevenue) * 90));
                return (
                  <div key={idx} className="bar-col">
                    <div
                      className="bar-fill"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="bar-tooltip">
                        {val.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="bar-label">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Distribution Panel */}
          <div className="dash-panel">
            <div className="panel-title-box">
              <h3>
                <span>👥</span> Phân bổ tài khoản
              </h3>
              <span className="panel-tag">Theo vai trò</span>
            </div>

            <div className="role-dist-list">
              {stats?.roleDistribution?.map((r, idx) => (
                <div key={idx} className="role-dist-row">
                  <div className="role-dist-meta">
                    <span className="role-dist-name">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: r.color,
                          display: 'inline-block'
                        }}
                      />
                      {r.role}
                    </span>
                    <span className="role-dist-val">
                      {r.count} ({r.percent}%)
                    </span>
                  </div>
                  <div className="role-dist-bar-track">
                    <div
                      className="role-dist-bar-fill"
                      style={{
                        width: `${r.percent}%`,
                        background: r.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '24px',
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #edf2f7',
                fontSize: '12px',
                color: '#64748b'
              }}
            >
              💡 <strong>Nhận định:</strong> Lượng phụ huynh đăng ký chiếm tỷ trọng
              lớn nhất (50.7%), tương ứng với nhu cầu cao tìm gia sư ôn thi học kỳ
              và tuyển sinh vào 10.
            </div>
          </div>
        </div>

        {/* Bottom 3-Column Panels */}
        <div className="dash-bottom-grid">
          {/* Conversion Funnel */}
          <div className="dash-panel">
            <div className="panel-title-box">
              <h3>
                <span>🎯</span> Phễu kết nối gia sư
              </h3>
            </div>
            <div>
              <div className="funnel-step-box">
                <span className="funnel-step-title">1. Yêu cầu tìm gia sư mở</span>
                <span className="funnel-step-val">{kpis.totalRequests}</span>
              </div>
              <div className="funnel-step-box">
                <span className="funnel-step-title">2. Ứng tuyển & Lời mời</span>
                <span className="funnel-step-val">530 lượt</span>
              </div>
              <div className="funnel-step-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <span className="funnel-step-title" style={{ color: '#166534' }}>
                  3. Thỏa thuận xác nhận (UC18)
                </span>
                <span className="funnel-step-val" style={{ color: '#16a34a' }}>
                  {kpis.confirmedConnections}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="dash-panel">
            <div className="panel-title-box">
              <h3>
                <span>💳</span> Cơ cấu dòng tiền
              </h3>
            </div>
            <div>
              <div className="quick-metric-item">
                <span className="quick-metric-label">Gói nâng cấp Pro</span>
                <span className="quick-metric-val">
                  {kpis.planUpgradeRevenue?.toLocaleString('vi-VN')} đ (62%)
                </span>
              </div>
              <div className="quick-metric-item">
                <span className="quick-metric-label">Gói nạp Credit</span>
                <span className="quick-metric-val">
                  {kpis.creditPackRevenue?.toLocaleString('vi-VN')} đ (38%)
                </span>
              </div>
              <div className="quick-metric-item">
                <span className="quick-metric-label">Phí giao dịch cổng VNPay</span>
                <span className="quick-metric-val">Miễn phí 0 đ</span>
              </div>
            </div>
          </div>

          {/* System Operations & Compliance */}
          <div className="dash-panel">
            <div className="panel-title-box">
              <h3>
                <span>🛡️</span> Kiểm duyệt & Tuân thủ
              </h3>
            </div>
            <div>
              <div className="quick-metric-item">
                <span className="quick-metric-label">Báo cáo vi phạm đang chờ (SC43)</span>
                <span className="quick-metric-val" style={{ color: '#dc2626' }}>4 mục</span>
              </div>
              <div className="quick-metric-item">
                <span className="quick-metric-label">Thời gian phản hồi TB</span>
                <span className="quick-metric-val">12 phút</span>
              </div>
              <div className="quick-metric-item">
                <span className="quick-metric-label">Audit Logs lưu trữ (BR-20)</span>
                <span className="quick-metric-val">100% đầy đủ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Report Modal (Alternative Flow A1) */}
        {exportModalData && (
          <div
            className="noti-modal-overlay"
            onClick={() => setExportModalData(null)}
          >
            <div
              className="noti-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="noti-modal-header">
                <h3>📥 Xuất báo cáo hệ thống thành công</h3>
                <button
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                  onClick={() => setExportModalData(null)}
                >
                  ✕
                </button>
              </div>

              <div className="noti-modal-body">
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                  Tệp báo cáo thống kê KPI theo chu kỳ <strong>{period}</strong> đã
                  được kết xuất sẵn sàng cho kiểm toán và báo cáo quản trị:
                </p>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#334155',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {exportModalData.filename}
                </div>

                <div
                  style={{
                    background: '#eff6ff',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1e40af',
                    lineHeight: '1.5'
                  }}
                >
                  {exportModalData.summaryText}
                </div>
              </div>

              <div className="noti-modal-footer">
                <button
                  className="btn-mark-all"
                  onClick={() => setExportModalData(null)}
                >
                  Đóng
                </button>
                <a
                  className="btn-open-deeplink"
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(
                    JSON.stringify(exportModalData.data, null, 2)
                  )}`}
                  download={exportModalData.filename}
                >
                  Tải tệp JSON xuống ⬇️
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
