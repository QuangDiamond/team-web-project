import { toast } from 'sonner';
import { useState } from 'react';
import { Check, Link2Off, UsersRound, X } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyParentLinks, removeParentLink, respondToParentLink } from '../../services/parentLinkService';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import SectionCard from '../../components/common/SectionCard';
import LinkRow from '../../components/parentLinks/LinkRow';
import '../../styles/parentLinks.css';

const PENDING_EMPTY = { icon: UsersRound, title: 'Không có lời mời nào', description: 'Khi phụ huynh gửi lời mời liên kết, bạn sẽ thấy ở đây để xác nhận.' };
const ACCEPTED_EMPTY = { icon: UsersRound, title: 'Chưa liên kết với phụ huynh nào', description: 'Sau khi bạn chấp nhận lời mời, phụ huynh sẽ theo dõi được các lớp bạn tham gia.' };

// Phía học sinh: xác nhận hoặc từ chối lời mời liên kết của phụ huynh, và hủy liên kết đã có
export default function ParentLinks() {
  const [pendingPage, setPendingPage] = useState(1);
  const [acceptedPage, setAcceptedPage] = useState(1);
  const pendingList = usePagedList(getMyParentLinks, { status: 'PENDING' }, pendingPage);
  const acceptedList = usePagedList(getMyParentLinks, { status: 'ACCEPTED' }, acceptedPage);
  const [busyId, setBusyId] = useState('');

  const handleRespond = async (link, action) => {
    setBusyId(link._id);
    try {
      await respondToParentLink(link._id, action);
      if (action === 'ACCEPT') {
        toast.success('Đã chấp nhận. Phụ huynh có thể theo dõi tiến độ học tập của bạn.');
      } else {
        toast.success('Đã từ chối lời mời liên kết.');
      }
      pendingList.reload();
      acceptedList.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId('');
    }
  };

  const handleRemove = async (link) => {
    if (!window.confirm('Hủy liên kết với phụ huynh này? Họ sẽ không còn theo dõi được tiến độ của bạn.')) {
      return;
    }
    setBusyId(link._id);
    try {
      await removeParentLink(link._id);
      acceptedList.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="page-stack">

      <SectionCard title="Lời mời đang chờ">
        <ListState list={pendingList} empty={PENDING_EMPTY}>
          {pendingList.data && (
            <ul className="progress-list">
              {pendingList.data.items.map((link) => (
                <LinkRow
                  key={link._id}
                  person={link.parent}
                  status={link.status}
                  createdAt={link.created_at}
                  actions={(
                    <>
                      <button type="button" className="btn btn-primary btn-sm" disabled={busyId === link._id} onClick={() => handleRespond(link, 'ACCEPT')}>
                        <Check size={14} aria-hidden="true" />
                        <span>Chấp nhận</span>
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" disabled={busyId === link._id} onClick={() => handleRespond(link, 'DECLINE')}>
                        <X size={14} aria-hidden="true" />
                        <span>Từ chối</span>
                      </button>
                    </>
                  )}
                />
              ))}
            </ul>
          )}
        </ListState>
        <Pagination pagination={pendingList.pagination} onPageChange={setPendingPage} disabled={pendingList.loading} />
      </SectionCard>

      <SectionCard title="Phụ huynh đã liên kết">
        <ListState list={acceptedList} empty={ACCEPTED_EMPTY}>
          {acceptedList.data && (
            <ul className="progress-list">
              {acceptedList.data.items.map((link) => (
                <LinkRow
                  key={link._id}
                  person={link.parent}
                  status={link.status}
                  createdAt={link.created_at}
                  actions={(
                    <button type="button" className="btn btn-outline btn-sm" disabled={busyId === link._id} onClick={() => handleRemove(link)}>
                      <Link2Off size={14} aria-hidden="true" />
                      <span>Hủy liên kết</span>
                    </button>
                  )}
                />
              ))}
            </ul>
          )}
        </ListState>
        <Pagination pagination={acceptedList.pagination} onPageChange={setAcceptedPage} disabled={acceptedList.loading} />
      </SectionCard>
    </div>
  );
}
