import SectionCard from '../common/SectionCard';
import Alert from '../common/Alert';
import EmptyState from '../common/EmptyState';
import { getModerationLabel } from './moderationLabels';
export default function ModerationAudit({
  logs,
  loading,
  error,
  onRetry
}) {
  return <SectionCard title="Nhật ký kiểm duyệt">
    {loading && <p role="status" className="mod-meta">Đang tải nhật ký...</p>}
    {error && <Alert type="error">{error} <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Thử lại</button></Alert>}
    {!loading && !error && logs.length === 0 && <EmptyState title="Chưa có nhật ký kiểm duyệt" />}
    {!loading && !error && logs.length > 0 && <div className="mod-table-wrap"><table className="data-table">
      <caption className="visually-hidden">Các quyết định kiểm duyệt và lý do xử lý</caption>
      <thead><tr><th scope="col">Thời gian</th><th scope="col">Quản trị viên</th><th scope="col">Hành động</th><th scope="col">Lý do</th><th scope="col">Đối tượng</th></tr></thead>
      <tbody>{logs.map(log => <tr key={log._id}>
        <td>{new Date(log.created_at).toLocaleString('vi-VN')}</td><td>{log.admin_user_id?.full_name || 'Quản trị viên'}</td>
        <td>{getModerationLabel(log.action)}</td><td>{log.reason}</td>
        <td>{log.details_json ? <details><summary>Xem chi tiết</summary><pre className="mod-audit-detail">{JSON.stringify(log.details_json, null, 2)}</pre></details> : '—'}</td>
      </tr>)}</tbody>
    </table></div>}
  </SectionCard>;
}
