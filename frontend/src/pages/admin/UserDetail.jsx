import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserDetail } from '../../services/adminService';
import Alert from '../../components/common/Alert';
import UserProfileCard from '../../components/admin/UserProfileCard';
import UserStatusActions from '../../components/admin/UserStatusActions';
import UserAuditList from '../../components/admin/UserAuditList';
import UserStatusDialog from '../../components/admin/UserStatusDialog';
import '../../styles/userDetail.css';

// Chi tiết 1 user (UC37 bước 2–4): hồ sơ, đổi trạng thái có lý do, lịch sử thao tác của Admin
export default function UserDetail() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  // Thao tác đang mở hộp thoại: 'SUSPEND' | 'BAN' | 'REACTIVATE' | null
  const [openAction, setOpenAction] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      const response = await getUserDetail(userId);
      setDetail(response.data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error);
    }
  }, [userId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSaved = async (message) => {
    setOpenAction(null);
    setSuccessMessage(message);
    await loadDetail();
    // Nút đã mở hộp thoại (vd Suspend) biến mất sau khi đổi trạng thái -> đưa focus về tiêu đề khối trạng thái
    const heading = document.getElementById('user-actions-title');
    if (heading) {
      heading.focus();
    }
  };

  const openStatusDialog = (actionKey) => {
    setSuccessMessage('');
    setOpenAction(actionKey);
  };

  const backLink = (
    <Link to="/admin/users" className="link-back user-detail-back">
      <ChevronLeft size={16} aria-hidden="true" />
      <span>Back to users</span>
    </Link>
  );

  if (loadError) {
    let message = `Could not load this user: ${loadError.message}`;
    if (loadError.status === 404) {
      message = 'This user does not exist or was deleted.';
    }
    return (
      <div className="user-detail">
        {backLink}
        <Alert type="error">{message}</Alert>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="user-detail">
        {backLink}
        <div className="card user-detail-loading" role="status">
          <LoaderCircle size={22} className="spin" aria-hidden="true" />
          <span>Loading user...</span>
        </div>
      </div>
    );
  }

  const isOwnAccount = detail.user._id === currentUser._id;

  return (
    <div className="user-detail">
      {backLink}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      <div className="user-detail-grid">
        <UserProfileCard user={detail.user} />
        <div className="user-detail-side">
          <UserStatusActions user={detail.user} isOwnAccount={isOwnAccount} onAction={openStatusDialog} />
          <UserAuditList auditLogs={detail.audit_logs} />
        </div>
      </div>

      {openAction && (
        <UserStatusDialog
          user={detail.user}
          actionKey={openAction}
          onClose={() => setOpenAction(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
