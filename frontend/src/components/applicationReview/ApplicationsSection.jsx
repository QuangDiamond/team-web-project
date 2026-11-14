import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import { Users } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { continueApplication, getReceivedApplications, skipApplication } from '../../services/applicationService';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import SectionCard from '../common/SectionCard';
import ApplicationDetailModal from './ApplicationDetailModal';
import ReceivedApplicationCard from './ReceivedApplicationCard';
import '../../styles/applicationReview.css';

const PAGE_SIZE = 10;

// Đơn ứng tuyển của gia sư vào một request, hiện ngay trong trang chi tiết request.
// Continue mở hội thoại 1-1, Skip bỏ qua. Đơn dùng nhiều credit hơn nằm trên cùng
export default function ApplicationsSection({ requestId }) {
  const [page, setPage] = useState(1);
  const [detailApplication, setDetailApplication] = useState(null);

  const fetchPage = useCallback((params) => getReceivedApplications(requestId, params), [requestId]);
  const list = usePagedList(fetchPage, { page: page, limit: PAGE_SIZE });

  const handleAction = async (action, application, successMessage) => {

    try {
      await action(application._id);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    }
    // Tải lại để hiện trạng thái thật từ server (kể cả khi thao tác lỗi vì đơn vừa đổi trạng thái)
    await list.reload();
  };

  const handleContinue = (application) => {
    let name = 'gia sư';
    if (application.tutor) {
      name = application.tutor.full_name;
    }
    return handleAction(continueApplication, application, `Đã mở cuộc trò chuyện với ${name}.`);
  };

  const handleSkip = (application) => handleAction(skipApplication, application, 'Đã bỏ qua đơn ứng tuyển.');

  return (
    <SectionCard title="Đơn ứng tuyển">
      <p className="item-meta">Các gia sư đã ứng tuyển yêu cầu này. Chọn Tiếp tục để mở cuộc trò chuyện hoặc Bỏ qua để từ chối.</p>

      <ListState
        list={list}
        empty={{ icon: Users, title: "Chưa có đơn ứng tuyển", description: "Gia sư ứng tuyển vào yêu cầu này sẽ hiển thị ở đây." }}
      >
        {list.data && (
          <ul className="review-list">
            {list.data.items.map((application) => (
              <ReceivedApplicationCard
                key={application._id}
                application={application}
                onContinue={handleContinue}
                onSkip={handleSkip}
                onViewDetails={setDetailApplication}
              />
            ))}
          </ul>
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}

      {detailApplication && (
        <ApplicationDetailModal
          application={detailApplication}
          request={list.data ? list.data.request : null}
          onClose={() => setDetailApplication(null)}
          onContinue={handleContinue}
          onSkip={handleSkip}
        />
      )}
    </SectionCard>
  );
}
