import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoaderCircle, UserPlus, Users } from 'lucide-react';
import { useSummary } from '../../hooks/useSummary';
import { getMyChildren } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import ChildProgressContent from '../../components/childProgress/ChildProgressContent';
import ChildSelector from '../../components/childProgress/ChildSelector';
import Modal from '../../components/common/Modal';
import ParentLinkPanel from '../../components/parentLinks/ParentLinkPanel';
import '../../styles/childProgress.css';
import '../../styles/parentLinks.css';

// UC35 – Monitor Child Progress: phụ huynh chọn con rồi xem lớp, buổi học sắp tới, chuyên cần, điểm và nhận xét của gia sư
export default function ChildProgress() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const children = useSummary(getMyChildren);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linksChanged, setLinksChanged] = useState(false);

  // Đóng hộp thoại: nếu có hủy liên kết thì tải lại danh sách con
  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    if (linksChanged) {
      setLinksChanged(false);
      children.reload();
    }
  };

  if (children.loading) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (children.error) {
    return (
      <div className="page-stack">
        <Alert type="error">
          <p>{children.error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={children.reload}>Thử lại</button>
        </Alert>
      </div>
    );
  }

  const linkedChildren = children.data;
  if (linkedChildren.length === 0) {
    return (
      <div className="page-stack">
        <EmptyState
          icon={Users}
          title="Chưa có học sinh nào được liên kết"
          description="Mời con liên kết bằng email tài khoản học sinh. Sau khi con xác nhận, bạn theo dõi được mọi lớp con tham gia."
        />
        <section className="section-card">
          <h2 className="section-card-title">Liên kết với học sinh</h2>
          <ParentLinkPanel />
        </section>
        <button type="button" className="btn btn-outline btn-sm child-progress-recheck" onClick={children.reload}>Kiểm tra lại danh sách</button>
      </div>
    );
  }

  // Con trên URL được chọn sẵn; không có hoặc không thuộc danh sách thì chọn người đầu tiên
  let selectedChild = linkedChildren.find((child) => child._id === childId);
  if (!selectedChild) {
    selectedChild = linkedChildren[0];
  }

  return (
    <div className="child-progress-page">
      <div className="page-toolbar">
        <ChildSelector
          childList={linkedChildren}
          selectedChildId={selectedChild._id}
          onChange={(nextChildId) => navigate(`/parent/children/${nextChildId}`)}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsLinkModalOpen(true)}>
          <UserPlus size={14} aria-hidden="true" />
          <span>Liên kết học sinh</span>
        </button>
      </div>
      {isLinkModalOpen && (
        <Modal title="Liên kết với học sinh" onClose={closeLinkModal} className="parent-link-modal">
          <ParentLinkPanel onChanged={() => setLinksChanged(true)} />
        </Modal>
      )}
      <ChildProgressContent key={selectedChild._id} childId={selectedChild._id} />
    </div>
  );
}
