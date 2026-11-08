import { useState } from 'react';
import { Send } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyApplications, withdrawApplication } from '../../services/applicationService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import ApplicationList from '../../components/tutor/ApplicationList';

const PAGE_SIZE = 10;

// UC12 – các đơn ứng tuyển gia sư đã gửi (xem lại và rút đơn đang chờ)
export default function MyApplications() {
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const list = usePagedList(getMyApplications, { page: page, limit: PAGE_SIZE });

  const handleWithdraw = async (application) => {
    setActionError('');
    try {
      await withdrawApplication(application._id);
      await list.reload();
    } catch (error) {
      setActionError(error.message);
    }
  };

  return (
    <div className="page-stack">
      <p className="item-meta">Các đơn ứng tuyển bạn đã gửi. Mỗi đơn dùng ít nhất 1 credit và không được hoàn lại.</p>

      {actionError && <Alert type="error">{actionError}</Alert>}

      <ListState
        list={list}
        empty={{ icon: Send, title: 'Chưa có đơn ứng tuyển', description: 'Hãy xem các yêu cầu đang mở và ứng tuyển yêu cầu phù hợp với bạn.' }}
      >
        {list.data && <ApplicationList applications={list.data.items} onWithdraw={handleWithdraw} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
