import { useState } from 'react';
import { Mail } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { acceptInvitation, declineInvitation, getReceivedInvitations } from '../../services/invitationService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import ReceivedInvitationList from '../../components/invitations/ReceivedInvitationList';
import '../../styles/tutorRequests.css';

const PAGE_SIZE = 10;

// Gia sư xem và phản hồi lời mời của phụ huynh: Accept mở hội thoại 1-1, Decline từ chối
export default function ReceivedInvitations() {
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const list = usePagedList(getReceivedInvitations, { page: page, limit: PAGE_SIZE });

  const handleAction = async (action, invitation, successMessage) => {
    setNotice('');
    setActionError('');
    try {
      await action(invitation._id);
      setNotice(successMessage);
    } catch (error) {
      setActionError(error.message);
    }
    // Tải lại để hiện trạng thái thật từ server (kể cả khi thao tác lỗi vì lời mời vừa đổi trạng thái)
    await list.reload();
  };

  const handleAccept = (invitation) => handleAction(acceptInvitation, invitation, 'Invitation accepted. A conversation has been opened.');
  const handleDecline = (invitation) => handleAction(declineInvitation, invitation, 'Invitation declined.');

  return (
    <div className="page-stack">
      <p className="item-meta">Invitations from parents. Accepting opens a conversation with them.</p>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

      <ListState
        list={list}
        empty={{ icon: Mail, title: 'No invitations yet', description: 'When a parent invites you to a request, it will appear here.' }}
      >
        {list.data && <ReceivedInvitationList invitations={list.data.items} onAccept={handleAccept} onDecline={handleDecline} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
