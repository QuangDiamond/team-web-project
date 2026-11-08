import { useEffect, useState } from 'react';
import { moderationService } from '../services/moderationService';
const EMPTY_SUMMARY = {
  total: 0,
  pendingCount: 0,
  criticalCount: 0,
  resolvedCount: 0
};
export function useModeration() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [auditLogs, setAuditLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let ignore = false;
    const loadReports = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await moderationService.getReports({
          status: statusFilter,
          severity: severityFilter,
          target_type: targetTypeFilter
        });
        if (!ignore) {
          setReports(response.reports || []);
          setSummary(response.summary || EMPTY_SUMMARY);
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(error.message || 'Không thể tải danh sách báo cáo.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    const loadAuditLogs = async () => {
      setAuditLoading(true);
      setAuditError('');
      try {
        const logs = await moderationService.getAuditLogs();
        if (!ignore) {
          setAuditLogs(logs || []);
        }
      } catch (error) {
        if (!ignore) {
          setAuditError(error.message || 'Không thể tải nhật ký kiểm duyệt.');
        }
      } finally {
        if (!ignore) {
          setAuditLoading(false);
        }
      }
    };
    loadReports();
    loadAuditLogs();
    return () => {
      ignore = true;
    };
  }, [statusFilter, severityFilter, targetTypeFilter, revision]);
  const reload = () => setRevision(value => value + 1);
  return {
    reports,
    summary,
    auditLogs,
    loading,
    loadError,
    auditLoading,
    auditError,
    reload,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    targetTypeFilter,
    setTargetTypeFilter
  };
}
