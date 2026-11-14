import { toast } from 'sonner';
import { useState } from 'react';
import { Link2Off, Send, Undo2, Users } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyParentLinks, inviteStudentByEmail, removeParentLink } from '../../services/parentLinkService';
import { validateEmail } from '../../utils/authValidators';
import FormInput from '../common/FormInput';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import LinkRow from './LinkRow';

const EMPTY_LIST = { icon: Users, title: 'Chưa gửi lời mời nào', description: 'Nhập email tài khoản học sinh ở trên để gửi lời mời liên kết.' };

// Phía phụ huynh: mời học sinh bằng email và quản lý các lời mời / liên kết đã có.
// onChanged được gọi khi danh sách con có thể đã thay đổi (hủy liên kết) để màn cha tải lại
export default function ParentLinkPanel({ onChanged }) {
  const [page, setPage] = useState(1);
  const list = usePagedList(getMyParentLinks, {}, page);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (event) => {
    event.preventDefault();
    const validationError = validateEmail(email);
    setEmailError(validationError);
    if (validationError) {
      return;
    }

    setIsSending(true);
    try {
      const response = await inviteStudentByEmail(email.trim());
      toast.success(response.message);
      setEmail('');
      setPage(1);
      list.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleRemove = async (link) => {
    let confirmText = 'Hủy lời mời liên kết này?';
    if (link.status === 'ACCEPTED') {
      confirmText = 'Hủy liên kết với học sinh này? Bạn sẽ không còn theo dõi được tiến độ của em.';
    }
    if (!window.confirm(confirmText)) {
      return;
    }

    setBusyId(link._id);
    try {
      await removeParentLink(link._id);
      list.reload();
      if (onChanged) {
        onChanged();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="parent-link-panel">
      <form className="parent-link-form" onSubmit={handleInvite} noValidate>
        <FormInput
          id="parent-link-email"
          label="Email tài khoản học sinh"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          placeholder="hocsinh@example.com"
          autoComplete="off"
          maxLength={254}
        />
        <button type="submit" className="btn btn-primary" disabled={isSending}>
          <Send size={16} aria-hidden="true" />
          <span>{isSending ? 'Đang gửi...' : 'Gửi lời mời'}</span>
        </button>
      </form>
      <p className="parent-link-hint">Học sinh sẽ nhận được thông báo và cần xác nhận. Sau khi liên kết, bạn xem được mọi lớp em tham gia mà không cần vào lớp.</p>

      <ListState list={list} empty={EMPTY_LIST}>
        {list.data && (
          <ul className="progress-list">
            {list.data.items.map((link) => {
              let buttonLabel = 'Hủy lời mời';
              let ButtonIcon = Undo2;
              if (link.status === 'ACCEPTED') {
                buttonLabel = 'Hủy liên kết';
                ButtonIcon = Link2Off;
              }
              let actions = null;
              // Lời mời bị từ chối không xóa được (giữ thời gian chờ mời lại), nên không có nút
              if (link.status !== 'DECLINED') {
                actions = (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busyId === link._id}
                    onClick={() => handleRemove(link)}
                  >
                    <ButtonIcon size={14} aria-hidden="true" />
                    <span>{buttonLabel}</span>
                  </button>
                );
              }
              return <LinkRow key={link._id} person={link.student} status={link.status} createdAt={link.created_at} actions={actions} />;
            })}
          </ul>
        )}
      </ListState>
      <Pagination pagination={list.pagination} onPageChange={setPage} disabled={list.loading} />
    </div>
  );
}
