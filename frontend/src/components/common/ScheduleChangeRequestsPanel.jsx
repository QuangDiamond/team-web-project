import { useEffect, useState } from 'react';
import { CalendarClock, CalendarSearch, Check, Clock3, LoaderCircle, Pencil, Undo2, X } from 'lucide-react';
import Alert from './Alert';
import EmptyState from './EmptyState';
import ScheduleChangeCompare from './ScheduleChangeCompare';
import ScheduleChangeFormModal from './ScheduleChangeFormModal';
import { isRequestExpired } from '../../utils/scheduleChangeDates';
import {
  getScheduleChangeRequests,
  respondScheduleChangeRequest,
  withdrawScheduleChangeRequest,
} from '../../services/scheduleChangeRequestService';
import '../../styles/scheduleChangeRequests.css';

const PAGE_SIZE = 100;

async function getAllRequests() {
  const firstPage = await getScheduleChangeRequests({ page: 1, limit: PAGE_SIZE });
  const requests = [...firstPage.data.items];
  const totalPages = firstPage.data.pagination.totalPages;
  const otherPages = [];

  for (let page = 2; page <= totalPages; page += 1) {
    otherPages.push(getScheduleChangeRequests({ page, limit: PAGE_SIZE }));
  }
  const results = await Promise.all(otherPages);
  for (const result of results) requests.push(...result.data.items);
  return requests;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const ROLE_LABELS = { TUTOR: 'Gia sư', STUDENT: 'Học sinh', PARENT: 'Phụ huynh', ADMIN: 'Quản trị viên' };

// Nhãn nguồn đề nghị: của mình (người đang đăng nhập) hoặc theo role người tạo
function getRequesterBadge(request) {
  if (request.direction === 'OUTGOING') return { label: 'Đề nghị của bạn', className: 'is-outgoing' };
  if (request.requester.role === 'PARENT') return { label: 'Đề nghị của phụ huynh', className: 'is-parent' };
  if (request.requester.role === 'TUTOR') return { label: 'Đề nghị từ gia sư', className: 'is-incoming' };
  if (request.requester.role === 'STUDENT') return { label: 'Đề nghị từ học sinh', className: 'is-incoming' };
  return { label: 'Đề nghị từ đối phương', className: 'is-incoming' };
}

// Đề nghị của mình được bên kia duyệt → "Được chấp nhận"; mình duyệt đề nghị của người khác → "Đã chấp nhận"
function getStatusLabel(status, isOutgoing = false) {
  if (status === 'EXPIRED') return 'Đã hết hạn';
  if (status === 'APPROVED') return isOutgoing ? 'Được chấp nhận' : 'Đã chấp nhận';
  if (status === 'REJECTED') return 'Đã từ chối';
  if (status === 'WITHDRAWN') return 'Đã rút';
  return 'Đang chờ phản hồi';
}

export default function ScheduleChangeRequestsPanel({ onChanged, reloadSignal = 0, onRequestsLoaded, selectedRequestId = '', onShowOnCalendar }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseComments, setResponseComments] = useState({});
  const [submittingRequestId, setSubmittingRequestId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editingRequest, setEditingRequest] = useState(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState('');

  const reloadAfterChange = () => {
    // Trang cha tải lại cả lịch lẫn danh sách yêu cầu (qua reloadSignal)
    if (onChanged) onChanged();
    else setReloadKey((currentKey) => currentKey + 1);
  };

  const handleWithdraw = async (request) => {
    setError('');
    setSubmittingRequestId(request._id);
    try {
      await withdrawScheduleChangeRequest(request._id);
      setConfirmWithdrawId('');
      reloadAfterChange();
    } catch (requestError) {
      setError(requestError.message || 'Không thể rút đề nghị đổi lịch.');
    } finally {
      setSubmittingRequestId('');
    }
  };

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setError('');
    getAllRequests()
      .then((items) => {
        if (isCurrentRequest) {
          setRequests(items);
          if (onRequestsLoaded) onRequestsLoaded(items);
        }
      })
      .catch((requestError) => {
        if (isCurrentRequest) setError(requestError.message || 'Không thể tải danh sách yêu cầu đổi lịch.');
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });
    return () => {
      isCurrentRequest = false;
    };
  }, [reloadKey, reloadSignal]);

  const handleRespond = async (request, decision) => {
    const responseComment = (responseComments[request._id] || '').trim();
    if (decision === 'REJECT' && responseComment.length < 3) {
      setError('Nhập lý do ít nhất 3 ký tự để từ chối yêu cầu.');
      return;
    }
    setError('');
    setSubmittingRequestId(request._id);
    try {
      await respondScheduleChangeRequest(request._id, {
        decision,
        response_comment: responseComment,
      });
      // Trang cha tải lại cả lịch lẫn danh sách yêu cầu (qua reloadSignal)
      if (onChanged) onChanged();
      else setReloadKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.message || 'Không thể phản hồi yêu cầu đổi lịch.');
    } finally {
      setSubmittingRequestId('');
    }
  };

  return (
    <section className="schedule-change-requests-panel" aria-label="Danh sách yêu cầu đổi lịch">
      <header className="schedule-change-list-heading">
        <div>
          <h2><CalendarClock size={19} aria-hidden="true" /> Yêu cầu đổi lịch học</h2>
          <p>Xem đề nghị của bạn và phản hồi đề nghị từ bên kia.</p>
        </div>
        <span>{requests.length} yêu cầu</span>
      </header>
      {error && <Alert type="error"><p>{error}</p></Alert>}
      {isLoading ? (
        <div className="schedule-change-loading" role="status"><LoaderCircle size={18} className="spin" /> Đang tải yêu cầu...</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Chưa có yêu cầu đổi lịch" description="Các đề nghị đổi lịch của bạn và lớp sẽ xuất hiện ở đây." />
      ) : (
        <div className="schedule-change-request-list">
          {requests.map((request) => {
            const requesterBadge = getRequesterBadge(request);
            const isExpired = isRequestExpired(request);
            const isPending = request.status === 'PENDING' && !isExpired;
            const displayStatus = isExpired ? 'EXPIRED' : request.status;
            const isSubmitting = submittingRequestId === request._id;
            return (
              <article
                key={request._id}
                id={`schedule-change-request-${request._id}`}
                className={`schedule-change-request-card is-${displayStatus.toLowerCase()}${selectedRequestId === request._id ? ' is-selected' : ''}`}
              >
                <div className="schedule-change-request-topline">
                  <span className={`schedule-change-direction ${requesterBadge.className}`}>
                    {requesterBadge.label}
                  </span>
                  <span className={`schedule-change-status is-${displayStatus.toLowerCase()}`}>{getStatusLabel(displayStatus, request.direction === 'OUTGOING')}</span>
                </div>
                <h3>{request.session?.class_name || 'Lớp học'} · {request.session?.title || 'Buổi học'}</h3>
                <p className="schedule-change-request-person">
                  {request.requester.full_name} · {ROLE_LABELS[request.requester.role] || 'Người dùng'}
                </p>
                <div className="schedule-change-times">
                  <span>Lịch hiện tại: {formatDateTime(request.session.start_time)} – {new Date(request.session.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="is-proposed"><Clock3 size={14} aria-hidden="true" /> Đề xuất: {formatDateTime(request.proposed_start_time)} – {new Date(request.proposed_end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {isPending && request.session && (
                  <>
                    <ScheduleChangeCompare request={request} />
                    {onShowOnCalendar && (
                      <button type="button" className="btn btn-outline btn-sm schedule-change-show-on-calendar" onClick={() => onShowOnCalendar(request)}>
                        <CalendarSearch size={15} aria-hidden="true" /> Xem trên lịch
                      </button>
                    )}
                  </>
                )}
                {isExpired && (
                  <p className="schedule-change-expired-note">Đã quá thời gian của buổi học hoặc giờ đề xuất nên không thể phản hồi yêu cầu này nữa.</p>
                )}
                <p className="schedule-change-request-reason"><strong>Lý do:</strong> {request.reason}</p>
                {request.response_comment && <p className="schedule-change-response-comment"><strong>Phản hồi:</strong> {request.response_comment}</p>}
                {request.direction === 'OUTGOING' && isPending && (
                  <div className="schedule-change-owner-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingRequest(request)} disabled={isSubmitting}>
                      <Pencil size={15} aria-hidden="true" /> Sửa đề nghị
                    </button>
                    {confirmWithdrawId === request._id ? (
                      <>
                        <span>Rút đề nghị này?</span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmWithdrawId('')} disabled={isSubmitting}>Không</button>
                        <button type="button" className="btn btn-danger btn-sm schedule-change-withdraw-confirm" onClick={() => handleWithdraw(request)} disabled={isSubmitting}>
                          <Undo2 size={15} aria-hidden="true" /> Rút đề nghị
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmWithdrawId(request._id)} disabled={isSubmitting}>
                        <Undo2 size={15} aria-hidden="true" /> Rút đề nghị
                      </button>
                    )}
                  </div>
                )}
                {request.can_respond && isPending && (
                  <div className="schedule-change-response-actions">
                    <label className="form-field">
                      <span className="form-label">Ghi chú khi phản hồi (bắt buộc nếu từ chối)</span>
                      <textarea
                        className="form-control"
                        rows="2"
                        maxLength="500"
                        value={responseComments[request._id] || ''}
                        onChange={(event) => setResponseComments((current) => ({ ...current, [request._id]: event.target.value }))}
                        disabled={isSubmitting}
                      />
                    </label>
                    <div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => handleRespond(request, 'REJECT')} disabled={isSubmitting}>
                        <X size={15} aria-hidden="true" /> Từ chối
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleRespond(request, 'APPROVE')} disabled={isSubmitting}>
                        <Check size={15} aria-hidden="true" /> Chấp nhận
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {editingRequest && (
        <ScheduleChangeFormModal
          session={editingRequest.session}
          mode="REQUEST"
          editingRequest={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSaved={() => {
            setEditingRequest(null);
            reloadAfterChange();
          }}
        />
      )}
    </section>
  );
}
