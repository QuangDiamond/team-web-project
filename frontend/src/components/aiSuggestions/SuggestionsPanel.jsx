import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, SearchX } from 'lucide-react';
import { useAiSuggestions } from '../../hooks/useAiSuggestions';
import { getMyInvitations } from '../../services/invitationService';
import Alert from '../common/Alert';
import ListState from '../common/ListState';
import InviteModal from '../invitations/InviteModal';
import SuggestionCard from './SuggestionCard';

/*
 * Gợi ý gia sư (UC09) của một request: danh sách gia sư xếp theo độ phù hợp, nút Refresh và nút Invite (UC14).
 * Trang cha dùng key={requestId} để đổi request thì panel dựng lại từ đầu.
 */
export default function SuggestionsPanel({ requestId }) {
  const { data, loading, refreshing, error, refreshError, reload, refresh } = useAiSuggestions(requestId);
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
    setInviteNotice(`Invitation sent. You have ${result.remaining_credits} credit(s) left.`);
    setInvitingSuggestion(null);
  };

  const list = { loading: loading, data: data, error: error, reload: reload };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Tutors who teach this subject and grade level.</p>
        <button type="button" className="btn btn-outline btn-sm" disabled={refreshing || loading} onClick={() => refresh()}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} aria-hidden="true" />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {refreshError && <Alert type="error">{refreshError.message}</Alert>}
      {inviteNotice && <Alert type="success">{inviteNotice}</Alert>}

      <ListState
        list={list}
        empty={{ icon: SearchX, title: 'No matching tutor yet', description: 'Check back when more tutors publish posts.' }}
      >
        {data && (
          <ul className="ai-list">
            {data.items.map((suggestion, index) => (
              <SuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                rank={index + 1}
                isInvited={invitedTutorIds.includes(suggestion.tutor.profile_id)}
                onInvite={setInvitingSuggestion}
              />
            ))}
          </ul>
        )}
      </ListState>

      <p className="ai-footer-link">
        <Link to="/parent/invitations" className="link">View my invitations</Link>
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
