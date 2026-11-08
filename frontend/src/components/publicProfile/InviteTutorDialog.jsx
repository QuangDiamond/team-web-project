import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyRequests } from '../../services/parentRequestService';
import Modal from '../common/Modal';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import InviteModal from '../invitations/InviteModal';

export default function InviteTutorDialog({ profile, onClose, onInvited }) {
  const [page, setPage] = useState(1);
  const [request, setRequest] = useState(null);
  const list = usePagedList(getMyRequests, { status: 'OPEN' }, page, !request);

  if (request) {
    return <InviteModal requestId={request._id} requestTitle={request.title}
      tutorProfileId={profile._id} tutorName={profile.full_name} onClose={onClose} onInvited={onInvited} />;
  }

  return (
    <Modal title="Chọn yêu cầu để mời gia sư này" onClose={onClose}>
      <p className="item-meta">Mỗi lời mời tốn credit. Hãy chọn một yêu cầu đang mở bên dưới.</p>
      <ListState list={list} empty={{ title: 'Chưa có yêu cầu đang mở', description: 'Hãy tạo một yêu cầu tìm gia sư trước.' }}>
        <ul className="public-profile-list">
          {list.data?.items.map((item) => (
            <li key={item._id}>
              <h3>{item.title}</h3>
              <p className="item-meta">{item.subject_name} · {item.grade_level}</p>
              <button type="button" className="btn btn-outline btn-sm" disabled={item.is_expired}
                onClick={() => setRequest(item)}>{item.is_expired ? 'Hết hạn' : 'Chọn yêu cầu'}</button>
            </li>
          ))}
        </ul>
      </ListState>
      <Pagination pagination={list.pagination} onPageChange={setPage} disabled={list.loading} />
      <Link to="/parent/requests/new" className="link">Tạo yêu cầu mới</Link>
    </Modal>
  );
}
