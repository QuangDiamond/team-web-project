import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoaderCircle, SearchX } from 'lucide-react';
import { useAiSuggestions } from '../../hooks/useAiSuggestions';
import { getMyInvitations } from '../../services/invitationService';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import SectionCard from '../../components/common/SectionCard';
import InviteModal from '../../components/invitations/InviteModal';
import SuggestionCard from '../../components/aiSuggestions/SuggestionCard';
import WeightControls from '../../components/aiSuggestions/WeightControls';
import '../../styles/aiSuggestions.css';

const MODE_LABELS = { ONLINE: "Trực tuyến", OFFLINE: "Trực tiếp", HYBRID: "Kết hợp" };

// UC09 – View AI Tutor Suggestions (SC18). Hiển thị trong DashboardLayout với PARENT_MENU
export default function AiTutorSuggestions() {
  const { requestId } = useParams();
  const { data, loading, refreshing, error, refreshError, reload, refresh } = useAiSuggestions(requestId);
  // UC14: gia sư đang được mời (mở hộp thoại), các gia sư đã mời trong phiên này và thông báo kết quả
  const [invitingSuggestion, setInvitingSuggestion] = useState(null);
  const [invitedTutorIds, setInvitedTutorIds] = useState([]);
  const [inviteNotice, setInviteNotice] = useState('');

  // Gia sư đã được mời vào request này từ trước (kể cả đã hủy, vì mỗi gia sư chỉ mời được một lần) hiện "Invited"
  useEffect(() => {
    let ignore = false;
    getMyInvitations({ page: 1, limit: 100 })
      .then((response) => {
        if (ignore) {
          return;
        }
        const invitedIds = response.data.items
          .filter((invitation) => invitation.request && invitation.request._id === requestId)
          .map((invitation) => invitation.tutor.profile_id);
        setInvitedTutorIds(invitedIds);
      })
      .catch(() => {
        // Không tải được thì bỏ qua: nút Invite vẫn dùng được, server sẽ chặn mời trùng bằng 409
      });
    return () => {
      ignore = true;
    };
  }, [requestId]);

  const handleInvited = (result) => {
    setInvitedTutorIds([...invitedTutorIds, invitingSuggestion.tutor.profile_id]);
    setInviteNotice(`Đã gửi lời mời. Bạn còn ${result.remaining_credits} tín dụng.`);
    setInvitingSuggestion(null);
  };

  if (loading) {
    return (
      <div className="ai-state" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-page">
        <Alert type="error">
          <p className="ai-error-text">{error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>Thử lại</button>
        </Alert>
      </div>
    );
  }

  const { request, items, ai_status: aiStatus, hint } = data;
  const isOnlineRequest = request.teaching_mode === 'ONLINE';

  return (
    <div className="ai-page">
      <SectionCard title={request.title || "Yêu cầu tìm gia sư"} action={<span className="ai-request-mode">{MODE_LABELS[request.teaching_mode]}</span>}>
        <p className="ai-request-meta">{request.subject_name} · {request.grade_level}</p>
        <WeightControls
          initialWeights={data.weights}
          isOnlineRequest={isOnlineRequest}
          refreshing={refreshing}
          onRefresh={refresh}
        />
        {refreshError && <Alert type="error">{refreshError.message}</Alert>}
      </SectionCard>

      {inviteNotice && <Alert type="success">{inviteNotice}</Alert>}

      {aiStatus === 'FALLBACK' && items.length > 0 && (
        <Alert type="info">Hiện chưa có giải thích từ AI. Gia sư được xếp hạng theo học phí, đánh giá, lịch học và khu vực.</Alert>
      )}

      {items.length === 0 ? (
        <SectionCard title="Gia sư được gợi ý">
          <EmptyState icon={SearchX} title="Chưa có gia sư phù hợp" description={hint} />
        </SectionCard>
      ) : (
        <SectionCard title="Gia sư được gợi ý" action={<span className="ai-count">Hàng đầu {items.length}</span>}>
          <ul className="ai-list">
            {items.map((suggestion, index) => (
              <SuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                rank={index + 1}
                isInvited={invitedTutorIds.includes(suggestion.tutor.profile_id)}
                onInvite={setInvitingSuggestion}
              />
            ))}
          </ul>
        </SectionCard>
      )}

      <p className="ai-footer-link">
        <Link to="/parent/invitations" className="link">Xem lời mời đã gửi</Link>
      </p>

      {invitingSuggestion && (
        <InviteModal
          requestId={request._id}
          requestTitle={request.title}
          tutorProfileId={invitingSuggestion.tutor.profile_id}
          tutorName={invitingSuggestion.tutor.full_name}
          onClose={() => setInvitingSuggestion(null)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}
