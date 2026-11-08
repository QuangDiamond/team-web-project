import { useState } from 'react';
import { LoaderCircle, Mail } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { cancelInvitation, getMyInvitations } from '../../services/invitationService';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import InvitationList from '../../components/invitations/InvitationList';

const PAGE_SIZE = 10;

// UC14 – các lời mời phụ huynh đã gửi cho gia sư (xem lại và hủy lời mời đang chờ)
export default function SentInvitations() {
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const { loading, error, data, reload } = usePagedList(getMyInvitations, { page: page, limit: PAGE_SIZE });

  const handleCancel = async (invitation) => {
    setActionError('');
    try {
      await cancelInvitation(invitation._id);
      await reload();
    } catch (cancelError) {
      setActionError(cancelError.message);
    }
  };

  return (
    <div className="page-stack">
      <p className="item-meta">Các lời mời bạn đã gửi cho gia sư. Mỗi lời mời dùng ít nhất 1 credit và không được hoàn lại.</p>

      {actionError && <Alert type="error">{actionError}</Alert>}

      {loading && !data && (
        <div className="page-loading-inline" role="status">
          <LoaderCircle size={26} className="spin" aria-hidden="true" />
          <span className="visually-hidden">Đang tải...</span>
        </div>
      )}

      {error && (
        <Alert type="error">
          <p>{error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>Thử lại</button>
        </Alert>
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={Mail}
          title="Chưa gửi lời mời nào"
          description="Hãy mời gia sư từ tab Tìm gia sư hoặc từ gợi ý gia sư của một yêu cầu."
        />
      )}

      {data && data.items.length > 0 && <InvitationList invitations={data.items} onCancel={handleCancel} />}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
