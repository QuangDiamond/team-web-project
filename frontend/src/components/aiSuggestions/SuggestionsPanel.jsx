import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, SearchX } from 'lucide-react';
import { useAiSuggestions } from '../../hooks/useAiSuggestions';
import { getMyInvitations } from '../../services/invitationService';
import Alert from '../common/Alert';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import InviteModal from '../invitations/InviteModal';
import SuggestionCard from './SuggestionCard';

/*
 * Gợi ý gia sư (UC09) của một request: danh sách gia sư xếp theo độ phù hợp, nút Refresh và nút Invite (UC14).
 * Trang cha dùng key={requestId} để đổi request thì panel dựng lại từ đầu.
 */
export default function SuggestionsPanel({ requestId }) {
  const { data, loading, refreshing, error, refreshError, reload, refresh, page, setPage } = useAiSuggestions(requestId);
  // UC14: gia sư đang được mời (mở hộp thoại), các gia sư đã mời và thông báo kết quả
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
    setInviteNotice(`Đã gửi lời mời. Bạn còn ${result.remaining_credits} credits.`);
    setInvitingSuggestion(null);
  };

  const list = { loading: loading, data: data, error: error, reload: reload };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Gia sư đã chọn cả môn học và cấp học / trình độ phù hợp trong hồ sơ. Danh sách sắp theo đánh giá.</p>
        <button type="button" className="btn btn-outline btn-sm" disabled={refreshing || loading} onClick={() => refresh()}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} aria-hidden="true" />
          <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
        </button>
      </div>

      {refreshError && <Alert type="error">{refreshError.message}</Alert>}
      {inviteNotice && <Alert type="success">{inviteNotice}</Alert>}

      <ListState
        list={list}
        empty={{ icon: SearchX, title: 'Chưa có gia sư phù hợp', description: 'Chưa có gia sư đăng ký giảng dạy cả môn học và trình độ này trong hồ sơ.' }}
      >
        {data && (
          <ul className="ai-list">
            {data.items.map((suggestion, index) => (
              <SuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                rank={(page - 1) * data.pagination.limit + index + 1}
                isInvited={invitedTutorIds.includes(suggestion.tutor.profile_id)}
                onInvite={setInvitingSuggestion}
              />
            ))}
          </ul>
        )}
      </ListState>
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} disabled={loading} />}

      <p className="ai-footer-link">
        <Link to="/parent/invitations" className="link">Xem lời mời của tôi</Link>
      </p>

      {invitingSuggestion && data && (
        <InviteModal
          requestId={data.request._id}
          requestTitle={data.request.title}
          tutorProfileId={invitingSuggestion.tutor.profile_id}
          tutorName={invitingSuggestion.tutor.full_name}
          onClose={() => setInvitingSuggestion(null)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}
