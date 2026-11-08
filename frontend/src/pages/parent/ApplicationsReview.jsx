import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { continueApplication, getReceivedApplications, skipApplication } from '../../services/applicationService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import ReceivedApplicationCard from '../../components/applicationReview/ReceivedApplicationCard';
import '../../styles/applicationReview.css';

const PAGE_SIZE = 10;

// Phụ huynh duyệt các đơn ứng tuyển vào một request: Continue mở hội thoại 1-1, Skip bỏ qua
export default function ApplicationsReview() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchPage = useCallback((params) => getReceivedApplications(id, params), [id]);
  const list = usePagedList(fetchPage, { page: page, limit: PAGE_SIZE });

  const handleAction = async (action, application, successMessage) => {
    setNotice('');
    setActionError('');
    try {
      await action(application._id);
      setNotice(successMessage);
    } catch (error) {
      setActionError(error.message);
    }
    // Tải lại để hiện trạng thái thật từ server (kể cả khi thao tác lỗi vì đơn vừa đổi trạng thái)
    await list.reload();
  };

  const handleContinue = (application) => {
    const name = application.tutor ? application.tutor.full_name : "gia sư";
    return handleAction(continueApplication, application, `Đã mở cuộc trò chuyện với ${name}.`);
  };

  const handleSkip = (application) => handleAction(skipApplication, application, "Đã bỏ qua đơn ứng tuyển.");

  let requestTitle = "Đơn ứng tuyển";
  if (list.data && list.data.request) {
    requestTitle = list.data.request.title;
  }

  return (
    <div className="review-page">
      <Link to={`/parent/requests/${id}`} className="review-back-link">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Quay lại yêu cầu</span>
      </Link>

      <div className="page-toolbar">
        <h2 className="review-title">{requestTitle}</h2>
        <Link to={`/parent/requests/${id}/ai-suggestions`} className="link">Xem gia sư do AI gợi ý</Link>
      </div>
      <p className="item-meta">Danh sách gia sư ứng tuyển. Chọn Tiếp tục để mở trò chuyện hoặc Bỏ qua để từ chối.</p>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

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
              />
            ))}
          </ul>
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
