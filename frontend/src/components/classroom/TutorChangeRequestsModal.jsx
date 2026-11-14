import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Loader2,
  X,
  MessageSquare,
  User,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  getScheduleChangeRequests,
  respondScheduleChangeRequest,
} from '../../services/classroomService';
import { formatDate } from '../../utils/dateFormat';

export default function TutorChangeRequestsModal({
  isOpen,
  onClose,
  classId,
  onSuccess,
}) {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'ALL'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const loadRequests = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError('');
      const res = await getScheduleChangeRequests(classId);
      setRequests(res?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách yêu cầu đổi lịch');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  if (!isOpen) return null;

  const handleRespond = async (requestId, status, comment = '') => {
    try {
      setProcessingId(requestId);
      await respondScheduleChangeRequest(classId, requestId, {
        status,
        tutor_comment: comment.trim() || undefined,
      });

      toast.success(status === 'APPROVED' ? 'Đã chấp thuận yêu cầu đổi lịch!' : 'Đã từ chối yêu cầu đổi lịch.');
      setRejectingId(null);
      setRejectionNote('');
      await loadRequests();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Thao tác không thành công');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const formatSessionTime = (startTime, endTime) => {
    if (!startTime || !endTime) return '—';
    const s = new Date(startTime);
    const e = new Date(endTime);
    const timeStr = `${s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    const dateStr = s.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${timeStr}, ${dateStr}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Yêu cầu đổi / hủy lịch học
              </h2>
              <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>
                Xét duyệt các yêu cầu thay đổi lịch học từ học viên theo quy định BR-10 / UC28.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'PENDING' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'PENDING' ? '#ffffff' : '#475569',
            }}
          >
            <span>Chờ xét duyệt</span>
            {pendingCount > 0 && (
              <span
                style={{
                  backgroundColor: activeTab === 'PENDING' ? '#ef4444' : '#e2e8f0',
                  color: activeTab === 'PENDING' ? '#ffffff' : '#0f172a',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'ALL' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'ALL' ? '#ffffff' : '#475569',
            }}
          >
            Tất cả yêu cầu ({requests.length})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Đang tải danh sách yêu cầu...</p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '14px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <CalendarDays size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
                {activeTab === 'PENDING' ? 'Hiện không có yêu cầu nào chờ duyệt.' : 'Chưa có yêu cầu đổi lịch nào.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isMove = req.request_type === 'MOVE';
                const isRejectingThis = rejectingId === req._id;

                return (
                  <div
                    key={req._id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: isPending ? '#f8fafc' : '#ffffff',
                    }}
                  >
                    {/* Item Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isMove ? '#eff6ff' : '#fef2f2',
                              color: isMove ? '#2563eb' : '#dc2626',
                            }}
                          >
                            {isMove ? 'DỜI LỊCH HỌC' : 'HỦY BUỔI HỌC'}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {req.session_id?.title || 'Buổi học'}
                          </strong>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Học viên yêu cầu:{' '}
                          <strong>{req.requested_by?.full_name || req.requested_by?.email || 'Học viên'}</strong> • Gửi{' '}
                          {formatDate(req.created_at)}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor:
                            req.status === 'APPROVED'
                              ? '#dcfce7'
                              : req.status === 'REJECTED'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            req.status === 'APPROVED'
                              ? '#166534'
                              : req.status === 'REJECTED'
                              ? '#991b1b'
                              : '#92400e',
                        }}
                      >
                        {req.status === 'APPROVED'
                          ? 'Đã chấp thuận'
                          : req.status === 'REJECTED'
                          ? 'Đã từ chối'
                          : 'Chờ duyệt'}
                      </span>
                    </div>

                    {/* Schedule Comparison */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #f1f5f9',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        margin: '10px 0',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <Clock size={14} />
                        <span>
                          <strong>Lịch ban đầu:</strong>{' '}
                          {formatSessionTime(req.session_id?.start_time, req.session_id?.end_time)}
                        </span>
                      </div>

                      {isMove && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#0284c7',
                            marginTop: '6px',
                            fontWeight: 600,
                          }}
                        >
                          <ArrowRight size={14} />
                          <span>
                            <strong>Đề xuất dời sang:</strong>{' '}
                            {formatSessionTime(req.proposed_start_time, req.proposed_end_time)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reason */}
                    {req.reason && (
                      <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                        <strong>Lý do từ học viên:</strong> {req.reason}
                      </p>
                    )}

                    {/* Tutor feedback if resolved */}
                    {req.tutor_comment && (
                      <p style={{ margin: '6px 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                        <strong>Phản hồi của gia sư:</strong> {req.tutor_comment}
                      </p>
                    )}

                    {/* Action buttons if Pending */}
                    {isPending && !isRejectingThis && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '8px',
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => setRejectingId(req._id)}
                          disabled={Boolean(processingId)}
                        >
                          <XCircle size={14} />
                          <span>Từ chối</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRespond(req._id, 'APPROVED')}
                          disabled={Boolean(processingId)}
                        >
                          {processingId === req._id ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          <span>Chấp thuận</span>
                        </button>
                      </div>
                    )}

                    {/* Inline rejection box */}
                    {isRejectingThis && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '12px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '8px',
                        }}
                      >
                        <label
                          htmlFor={`reject-note-${req._id}`}
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#991b1b',
                            marginBottom: '6px',
                          }}
                        >
                          Lý do từ chối (tùy chọn để gửi cho học viên):
                        </label>
                        <input
                          id={`reject-note-${req._id}`}
                          type="text"
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder="Ví dụ: Gia sư bị trùng lịch dạy ca khác vào giờ này..."
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fca5a5',
                            fontSize: '13px',
                            marginBottom: '8px',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionNote('');
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                            onClick={() => handleRespond(req._id, 'REJECTED', rejectionNote)}
                            disabled={Boolean(processingId)}
                          >
                            {processingId === req._id ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            <span>Xác nhận từ chối</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#f8fafc',
          }}
        >
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

