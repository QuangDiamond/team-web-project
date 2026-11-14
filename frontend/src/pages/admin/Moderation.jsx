import { toast } from 'sonner';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import ReportCard from '../../components/moderation/ReportCard';
import ResolutionDialog from '../../components/moderation/ResolutionDialog';
import { getModerationLabel } from '../../components/moderation/moderationLabels';
import { useModeration } from '../../hooks/useModeration';
import '../../styles/Moderation.css';

export default function Moderation() {
  const data = useModeration();
  const [activeReport, setActiveReport] = useState(null);
  const resolved = (text) => {
    toast.success(text);
    setActiveReport(null);
    data.reload();
  };
  return (
    <div className="mod-page">
      <PageHeader eyebrow="QUẢN TRỊ" title="Kiểm duyệt nội dung" description="Xem xét báo cáo vi phạm và theo dõi các quyết định xử lý." />

      <div className="stat-grid">
        <StatCard label="Tổng số báo cáo" value={data.summary.total} />
        <StatCard label="Chờ xử lý" value={data.summary.pendingCount} tone="warning" />
        <StatCard label="Khẩn cấp" value={data.summary.criticalCount} tone="warning" />
        <StatCard label="Đã giải quyết" value={data.summary.resolvedCount} tone="success" />
      </div>
      <section className="card mod-filters" aria-label="Bộ lọc báo cáo">
        <div className="mod-status-tabs" role="group" aria-label="Trạng thái báo cáo">
          {['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map((value) => <button type="button" key={value} className="mod-filter-button" aria-pressed={data.statusFilter === value} onClick={() => data.setStatusFilter(value)}>{value === 'ALL' ? 'Tất cả' : getModerationLabel(value)}</button>)}
        </div>
        <div className="mod-select-filters">
          <label>Mức độ<select value={data.severityFilter} onChange={(event) => data.setSeverityFilter(event.target.value)}><option value="ALL">Mọi mức độ</option>{['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => <option key={value} value={value}>{getModerationLabel(value)}</option>)}</select></label>
          <label>Loại đối tượng<select value={data.targetTypeFilter} onChange={(event) => data.setTargetTypeFilter(event.target.value)}><option value="ALL">Mọi đối tượng</option>{['POST', 'REQUEST', 'REVIEW', 'MESSAGE', 'USER', 'CLASSROOM'].map((value) => <option key={value} value={value}>{getModerationLabel(value)}</option>)}</select></label>
        </div>
      </section>
      {data.loading && <p role="status" className="mod-meta">Đang tải danh sách báo cáo...</p>}
      {data.loadError && <Alert type="error">{data.loadError} <button type="button" className="btn btn-outline btn-sm" onClick={data.reload}>Thử lại</button></Alert>}
      {!data.loading && !data.loadError && data.reports.length === 0 && <div className="card"><EmptyState icon={ShieldCheck} title="Hàng đợi kiểm duyệt trống" description="Không có báo cáo phù hợp với bộ lọc hiện tại." /></div>}
      {!data.loading && !data.loadError && <div className="mod-reports-list">{data.reports.map((report) => <ReportCard key={report._id} report={report} onResolve={setActiveReport} />)}</div>}
      {activeReport && <ResolutionDialog report={activeReport} onClose={() => setActiveReport(null)} onResolved={resolved} />}
    </div>
  );
}
