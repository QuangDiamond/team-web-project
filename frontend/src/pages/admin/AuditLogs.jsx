import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import ModerationAudit from '../../components/moderation/ModerationAudit';
import { moderationService } from '../../services/moderationService';
import '../../styles/auditLogs.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let ignore = false;
    const loadLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await moderationService.getAuditLogs();
        if (!ignore) {
          setLogs(response || []);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Không thể tải nhật ký kiểm duyệt.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadLogs();
    return () => {
      ignore = true;
    };
  }, [revision]);

  return (
    <div className="audit-logs-page">
      <PageHeader eyebrow="QUẢN TRỊ" title="Nhật ký kiểm duyệt" description="Theo dõi các quyết định kiểm duyệt và lý do xử lý." />
      <ModerationAudit logs={logs} loading={loading} error={error} onRetry={() => setRevision((value) => value + 1)} />
    </div>
  );
}
