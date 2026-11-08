import { getAuditActionLabel } from '../../utils/userDisplay';
import { formatDateTime } from '../../utils/paymentDisplay';

// Lịch sử thao tác của Admin trên tài khoản này (BR-16), mới nhất trước
export default function UserAuditList({ auditLogs }) {
  return (
    <section className="card user-audit" aria-labelledby="user-audit-title">
      <h2 id="user-audit-title" className="user-side-title">Thao tác quản trị gần đây</h2>
      {auditLogs.length === 0 && <p className="user-side-text">Chưa có thao tác quản trị nào trên tài khoản này.</p>}
      {auditLogs.length > 0 && (
        <ol className="audit-list">
          {auditLogs.map((log, index) => {
            let adminName = 'Quản trị viên không xác định';
            if (log.admin && log.admin.full_name) {
              adminName = log.admin.full_name;
            }
            return (
              <li key={`${log.created_at}-${index}`} className="audit-item">
                <p className="audit-action">{getAuditActionLabel(log.action)}</p>
                <p className="audit-reason">“{log.reason}”</p>
                <p className="audit-meta">{adminName} · {formatDateTime(log.created_at)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
