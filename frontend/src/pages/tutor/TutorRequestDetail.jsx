import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ChevronLeft, LoaderCircle } from 'lucide-react';
import { getTutorRequest, saveRequest, unsaveRequest } from '../../services/tutorRequestService';
import { acceptInvitation, declineInvitation } from '../../services/invitationService';
import Alert from '../../components/common/Alert';
import OpenChatLink from '../../components/common/OpenChatLink';
import PriorityBadge from '../../components/common/PriorityBadge';
import SectionCard from '../../components/common/SectionCard';
import ApplyModal from '../../components/tutor/ApplyModal';
import ReportContentButton from '../../components/common/ReportContentButton';
import { formatBudget, getModeLabel } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import '../../styles/tutorRequests.css';

// UC11 – chi tiết một yêu cầu đang mở (Figma: tutor-post-detail), có nút lưu và ứng tuyển (UC12)
export default function TutorRequestDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, request: null });
  const [applying, setApplying] = useState(false);
  const [invitationBusy, setInvitationBusy] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const load = useCallback(async () => {
    setState({ loading: true, error: null, request: null });
    try {
      const response = await getTutorRequest(id);
      setState({ loading: false, error: null, request: response.data });
    } catch (error) {
      setState({ loading: false, error: error, request: null });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleSave = async () => {

    const request = state.request;
    try {
      if (request.is_bookmarked) {
        await unsaveRequest(request._id);
      } else {
        await saveRequest(request._id);
      }
      setState({ ...state, request: { ...request, is_bookmarked: !request.is_bookmarked } });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleApplied = (result) => {
    const request = state.request;
    setState({ ...state, request: { ...request, has_applied: true, application_count: request.application_count + 1 } });
    toast.success(`Đã gửi đơn ứng tuyển. Bạn còn ${result.remaining_credits} credits.`);
    setApplying(false);
  };

  // Gia sư phản hồi lời mời ngay trên trang chi tiết; tải lại để lấy trạng thái thật từ server
  const handleInvitationAction = async (action, successMessage) => {
    setInvitationBusy(true);
    try {
      const response = await action(state.request.invitation._id);
      if (response.data && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    }
    const reloaded = await getTutorRequest(id).catch(() => null);
    if (reloaded) {
      setState({ loading: false, error: null, request: reloaded.data });
    }
    setInvitationBusy(false);
  };

  if (state.loading) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-stack">
        <Alert type="error">
          <p>{state.error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={load}>Thử lại</button>
        </Alert>
        <Link to="/tutor/requests" className="link">Quay lại danh sách yêu cầu</Link>
      </div>
    );
  }

  const request = state.request;
  const SaveIcon = request.is_bookmarked ? BookmarkCheck : Bookmark;

  // Nút ứng tuyển đổi theo lời mời: đang chờ phản hồi / đã chấp nhận thì không ứng tuyển thêm; đã từ chối thì ứng tuyển bình thường
  const invitation = request.invitation;
  let applyLabel = "Ứng tuyển";
  let applyDisabled = false;
  if (request.has_applied) {
    applyLabel = "Đã ứng tuyển";
    applyDisabled = true;
  } else if (invitation && invitation.status === 'PENDING') {
    applyLabel = "Đang nhận được lời mời";
    applyDisabled = true;
  } else if (invitation && invitation.status === 'ACCEPTED') {
    applyLabel = "Đã chấp nhận lời mời";
    applyDisabled = true;
  }
  const facts = [
    ["Môn học", request.subject_name],
    ["Khối lớp", request.grade_level],
    ["Ngân sách", formatBudget(request.budget)],
    ["Lịch học", request.schedule],
    ["Hình thức học", getModeLabel(request.teaching_mode)],
    ["Khu vực", request.location_address || '—'],
  ];

  return (
    <div className="tutor-detail">
      <Link to="/tutor/requests" className="tutor-back-link">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Quay lại danh sách yêu cầu</span>
      </Link>

      <div className="tutor-detail-grid">
        <div className="tutor-detail-main">
          {invitation && invitation.status !== 'DECLINED' && (
            <SectionCard title="Lời mời từ phụ huynh">
              <p className="item-meta">Nhận ngày {formatDate(invitation.created_at)}</p>
              <PriorityBadge credits={invitation.credits_spent} />
              {invitation.message ? (
                <p className="tutor-detail-text">“{invitation.message}”</p>
              ) : (
                <p className="item-meta">Phụ huynh không để lại lời nhắn.</p>
              )}
              {invitation.status === 'PENDING' && (
                <div className="tutor-detail-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={invitationBusy}
                    onClick={() => handleInvitationAction(declineInvitation, "Đã từ chối lời mời.")}
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={invitationBusy}
                    onClick={() => handleInvitationAction(acceptInvitation, "Đã chấp nhận lời mời và mở cuộc trò chuyện.")}
                  >
                    Chấp nhận
                  </button>
                </div>
              )}
              {invitation.status === 'ACCEPTED' && (
                <p className="item-meta">Đã mở cuộc trò chuyện.</p>
              )}
              {invitation.status === 'ACCEPTED' && conversationId && (
                <OpenChatLink to={`/tutor/messages/${conversationId}`} />
              )}
            </SectionCard>
          )}
          <SectionCard title={request.title}>
            <p className="item-meta">Đã đăng {formatDate(request.created_at)} bởi phụ huynh · {request.application_count} gia sư đã ứng tuyển</p>
            {request.parent_user_id && <Link to={`/parents/${request.parent_user_id}`} className="link">Xem hồ sơ phụ huynh</Link>}
            <p className="tutor-detail-text">{request.description}</p>
            <dl className="tutor-facts">
              {facts.map((fact) => (
                <div key={fact[0]} className="tutor-fact">
                  <dt>{fact[0]}</dt>
                  <dd>{fact[1]}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
          <SectionCard title="Yêu cầu đối với gia sư">
            <p className="tutor-detail-text">{request.tutor_requirements || "Không có yêu cầu cụ thể."}</p>
          </SectionCard>
        </div>

        <SectionCard title="Bạn quan tâm đến yêu cầu này?">
          <p className="item-meta">Giới thiệu ngắn về kinh nghiệm của bạn. Ứng tuyển tốn ít nhất 1 credits.</p>
          <div className="tutor-detail-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={applyDisabled}
              onClick={() => setApplying(true)}
            >
              {applyLabel}
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={handleToggleSave}>
              <SaveIcon size={16} aria-hidden="true" />
              <span>{request.is_bookmarked ? "Đã lưu" : "Lưu yêu cầu"}</span>
            </button>
            <ReportContentButton
              targetType="REQUEST"
              targetId={request._id}
              targetTitle={request.title}
              onReported={toast.success}
            />
          </div>
        </SectionCard>
      </div>

      {applying && <ApplyModal request={request} onClose={() => setApplying(false)} onApplied={handleApplied} />}
    </div>
  );
}
