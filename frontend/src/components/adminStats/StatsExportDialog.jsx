import { Download } from 'lucide-react';
import Modal from '../common/Modal';
export default function StatsExportDialog({
  report,
  onClose
}) {
  return <Modal title="Báo cáo thống kê hệ thống" onClose={onClose}>
      <p>{report.summaryText}</p>
      <p className="admin-stats-export-filename">{report.filename}</p>
      <div className="admin-stats-export-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Đóng</button>
        <a className="btn btn-primary" href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report.data, null, 2))}`} download={report.filename}>
          <Download size={18} aria-hidden="true" /> Tải báo cáo JSON
        </a>
      </div>
    </Modal>;
}
