import { useState } from 'react';
import { Mail } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { acceptInvitation, declineInvitation, getReceivedInvitations } from '../../services/invitationService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import InvitationDetailModal from '../../components/tutor/InvitationDetailModal';
import ReceivedInvitationList from '../../components/tutor/ReceivedInvitationList';
import '../../styles/applicationReview.css';
import '../../styles/tutoringRequests.css';
import '../../styles/tutorRequests.css';

const PAGE_SIZE = 10;

// Gia sư xem và phản hồi lời mời của phụ huynh: Chấp nhận mở hội thoại 1-1, Từ chối để bỏ qua
export default function ReceivedInvitations() {
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [detailInvitation, setDetailInvitation] = useState(null);
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

  const handleAccept = (invitation) => handleAction(acceptInvitation, invitation, 'Đã chấp nhận lời mời. Hội thoại đã được mở.');
  const handleDecline = (invitation) => handleAction(declineInvitation, invitation, 'Đã từ chối lời mời.');

  return (
    <div className="page-stack">
      <p className="item-meta">Lời mời từ phụ huynh. Chấp nhận lời mời sẽ mở hội thoại với họ. Lời mời dùng nhiều credit hơn nằm trên cùng.</p>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

      <ListState
        list={list}
        empty={{ icon: Mail, title: 'Chưa có lời mời nào', description: 'Khi phụ huynh mời bạn vào một yêu cầu, lời mời sẽ hiện ở đây.' }}
      >
        {list.data && (
          <ReceivedInvitationList
            invitations={list.data.items}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onViewDetails={setDetailInvitation}
          />
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}

      {detailInvitation && (
        <InvitationDetailModal
          invitation={detailInvitation}
          onClose={() => setDetailInvitation(null)}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </div>
  );
}
