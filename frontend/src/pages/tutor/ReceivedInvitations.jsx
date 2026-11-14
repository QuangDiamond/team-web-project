import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { acceptInvitation, declineInvitation, getReceivedInvitations } from '../../services/invitationService';
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
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [detailInvitation, setDetailInvitation] = useState(null);
  const list = usePagedList(getReceivedInvitations, { page: page, limit: PAGE_SIZE });

  const handleAction = async (action, invitation, successMessage) => {

    try {
      await action(invitation._id);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    }
    // Tải lại để hiện trạng thái thật từ server (kể cả khi thao tác lỗi vì lời mời vừa đổi trạng thái)
    await list.reload();
  };

  // Yêu cầu còn mở thì mở trang chi tiết chung với trang tìm yêu cầu; không còn mở (trang đó trả 404) thì xem bằng modal
  const handleViewDetails = (invitation) => {
    const request = invitation.request;
    if (request && request.is_available) {
      navigate(`/tutor/requests/${request._id}`);
      return;
    }
    setDetailInvitation(invitation);
  };

  const handleAccept = (invitation) => handleAction(acceptInvitation, invitation, "Đã chấp nhận lời mời và mở cuộc trò chuyện.");
  const handleDecline = (invitation) => handleAction(declineInvitation, invitation, "Đã từ chối lời mời.");

  return (
    <div className="page-stack">
      <p className="item-meta">Lời mời từ phụ huynh. Chấp nhận để mở cuộc trò chuyện. Lời mời dùng nhiều credits hơn nằm trên cùng.</p>

      <ListState
        list={list}
        empty={{ icon: Mail, title: "Chưa có lời mời", description: "Lời mời từ phụ huynh sẽ hiển thị ở đây." }}
      >
        {list.data && (
          <ReceivedInvitationList
            invitations={list.data.items}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onViewDetails={handleViewDetails}
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
