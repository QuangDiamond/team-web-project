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
    const name = application.tutor ? application.tutor.full_name : 'the tutor';
    return handleAction(continueApplication, application, `Conversation opened with ${name}.`);
  };

  const handleSkip = (application) => handleAction(skipApplication, application, 'Application skipped.');

  let requestTitle = 'Applications';
  if (list.data && list.data.request) {
    requestTitle = list.data.request.title;
  }

  return (
    <div className="review-page">
      <Link to={`/parent/requests/${id}`} className="review-back-link">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Back to request</span>
      </Link>

      <div className="page-toolbar">
        <h2 className="review-title">{requestTitle}</h2>
        <Link to={`/parent/requests/${id}/ai-suggestions`} className="link">See AI tutor suggestions</Link>
      </div>
      <p className="item-meta">Tutors who applied to your request. Choose Continue to open a conversation, or Skip to pass.</p>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

      <ListState
        list={list}
        empty={{ icon: Users, title: 'No applications yet', description: 'Tutors who apply to this request will appear here.' }}
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
