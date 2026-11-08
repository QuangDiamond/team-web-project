import { CheckCheck, Gavel, MessageSquareWarning, UserRound } from 'lucide-react';
import { getUserRoleLabel } from '../../utils/userDisplay';
import { getModerationLabel } from './moderationLabels';
export default function ReportCard({
  report,
  onResolve
}) {
  const preview = report.target_preview;
  const reporter = report.reporter_user_id;
  const canResolve = report.status === 'PENDING' || report.status === 'INVESTIGATING';
  return <article className={`mod-report mod-report-${report.severity}`}>
      <div className="mod-report-header">
        <div className="mod-badges">
          {[report.target_type, report.severity, report.status].map(value => <span key={value} className={`mod-badge mod-badge-${value}`}>{getModerationLabel(value)}</span>)}
        </div>
        <time className="mod-meta" dateTime={report.created_at}>{new Date(report.created_at).toLocaleString('vi-VN')}</time>
      </div>
      <p className="mod-report-reason"><MessageSquareWarning size={18} aria-hidden="true" /><strong>Lý do báo cáo:</strong> {report.reason}</p>
      {preview && <blockquote className="mod-preview"><p><strong>{preview.title}</strong></p><p>{preview.content}</p><footer>{preview.author_name} · {getUserRoleLabel(preview.author_role)}</footer></blockquote>}
      {reporter && <div className="mod-reporter">
        {reporter.avatar_url ? <img src={reporter.avatar_url} alt="" /> : <UserRound size={18} aria-hidden="true" />}
        <span>Người báo cáo: <strong>{reporter.full_name}</strong> · {getUserRoleLabel(reporter.role)} · {reporter.email}</span>
      </div>}
      {report.admin_note && <p className="mod-note"><strong>Ghi chú quản trị viên:</strong> {report.admin_note} · {getModerationLabel(report.action_taken)}</p>}
      <div className="mod-report-actions">
        {canResolve ? <button type="button" className="btn btn-primary btn-sm" onClick={() => onResolve(report)}><Gavel size={16} aria-hidden="true" /> Xử lý báo cáo</button> : <span className="mod-completed"><CheckCheck size={18} aria-hidden="true" /> Đã xử lý · {getModerationLabel(report.action_taken)}</span>}
      </div>
    </article>;
}
