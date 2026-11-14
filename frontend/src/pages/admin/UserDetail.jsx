import { toast } from 'sonner';
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
    toast.success(message);
    await loadDetail();
    // Nút đã mở hộp thoại (vd Suspend) biến mất sau khi đổi trạng thái -> đưa focus về tiêu đề khối trạng thái
    const heading = document.getElementById('user-actions-title');
    if (heading) {
      heading.focus();
    }
  };

  const openStatusDialog = (actionKey) => {

    setOpenAction(actionKey);
  };

  const backLink = (
    <Link to="/admin/users" className="link-back user-detail-back">
      <ChevronLeft size={16} aria-hidden="true" />
      <span>Quay lại danh sách người dùng</span>
    </Link>
  );

  if (loadError) {
    let message = `Không thể tải thông tin người dùng: ${loadError.message}`;
    if (loadError.status === 404) {
      message = 'Người dùng này không tồn tại hoặc đã bị xóa.';
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
          <span>Đang tải thông tin người dùng...</span>
        </div>
      </div>
    );
  }

  const isOwnAccount = detail.user._id === currentUser._id;

  return (
    <div className="user-detail">
      {backLink}

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
