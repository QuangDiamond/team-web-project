import { toast } from 'sonner';
import { useState } from 'react';
import { Download, LoaderCircle, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import StatsOverview from '../../components/adminStats/StatsOverview';
import StatsCharts from '../../components/adminStats/StatsCharts';
import StatsDetails from '../../components/adminStats/StatsDetails';
import StatsExportDialog from '../../components/adminStats/StatsExportDialog';
import StatsPeriodSummary from '../../components/adminStats/StatsPeriodSummary';
import useAdminStats from '../../hooks/useAdminStats';
import { statsService } from '../../services/statsService';
import '../../styles/AdminDashboard.css';

const PERIODS = [
  { value: '7d', label: '7 ngày gần nhất' },
  { value: '30d', label: '30 ngày gần nhất' },
  { value: '90d', label: '90 ngày gần nhất' },
  { value: '1y', label: '365 ngày gần nhất' },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState('30d');
  const [report, setReport] = useState(null);
  const [exporting, setExporting] = useState(false);
  const stats = useAdminStats(period);
  const periodLabel = PERIODS.find((option) => option.value === period).label;

  const exportReport = async () => {
    setExporting(true);

    try {
      const result = await statsService.exportReport(period);
      setReport(result);
    } catch (error) {
      toast.error(error.message || 'Không thể xuất báo cáo. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-stats">
      <PageHeader
        eyebrow="QUẢN TRỊ"
        title="Thống kê hệ thống"
        description="Số liệu được tổng hợp từ tài khoản, đơn thanh toán, kết nối và lớp học trong hệ thống."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportReport}
            disabled={stats.loading || !!stats.error || exporting}
          >
            {exporting ? (
              <LoaderCircle size={18} className="spin" aria-hidden="true" />
            ) : (
              <Download size={18} aria-hidden="true" />
            )}
            {exporting ? 'Đang xuất...' : 'Xuất báo cáo JSON'}
          </button>
        }
      />
      <div className="card admin-stats-toolbar">
        <label htmlFor="admin-stats-period">Khoảng thời gian thống kê</label>
        <select
          id="admin-stats-period"
          value={period}
          disabled={exporting}
          onChange={(event) => setPeriod(event.target.value)}
        >
          {PERIODS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-outline"
          onClick={stats.reload}
          disabled={stats.loading}
        >
          <RefreshCw size={18} aria-hidden="true" />
          Làm mới
        </button>
      </div>

      {stats.loading && (
        <p role="status" className="admin-stats-loading">
          <LoaderCircle size={20} className="spin" aria-hidden="true" />
          Đang tải thống kê hệ thống...
        </p>
      )}
      {stats.error && (
        <Alert type="error">
          {stats.error.message}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={stats.reload}
          >
            Thử lại
          </button>
        </Alert>
      )}
      {!stats.loading && stats.data && (
        <>
          <p className="admin-stats-meta">
            Các chỉ số tổng quan là số liệu tích lũy; khoảng thời gian đã chọn áp dụng cho mục "Phát sinh trong kỳ" và biểu đồ.
          </p>
          <StatsOverview kpis={stats.data.kpis} />
          {stats.data.periodKpis && (
            <StatsPeriodSummary periodKpis={stats.data.periodKpis} periodLabel={periodLabel} />
          )}
          <StatsCharts
            trends={stats.data.trends}
            roles={stats.data.roleDistribution}
            periodLabel={periodLabel}
          />
          <StatsDetails kpis={stats.data.kpis} />
        </>
      )}
      {report && (
        <StatsExportDialog report={report} onClose={() => setReport(null)} />
      )}
    </div>
  );
}
