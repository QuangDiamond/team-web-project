import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { formatDate, formatTime } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

const isToday = (value) => new Date(value).toDateString() === new Date().toDateString();

// Hôm nay hiện giờ, ngày khác hiện ngày
const formatListTime = (value) => {
  if (!value) {
    return '';
  }
  if (isToday(value)) {
    return formatTime(value);
  }
  return formatDate(value);
};

const getPreview = (lastMessage) => {
  if (!lastMessage) {
    return "Chưa có tin nhắn";
  }
  let content = lastMessage.content || '';
  if (lastMessage.sender_is_me) {
    content = `Bạn: ${content}`;
  }
  return content;
};

// Cột trái của màn chat (Figma: danh sách người liên hệ). basePath: /parent/messages hoặc /tutor/messages
export default function ConversationList({ conversations, selectedId, basePath }) {
  const navigate = useNavigate();

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Chưa có cuộc trò chuyện"
        description="Cuộc trò chuyện được mở khi phụ huynh đồng ý trao đổi với gia sư ứng tuyển hoặc gia sư chấp nhận lời mời."
      />
    );
  }

  return (
    <ul className="chat-list">
      {conversations.map((conversation) => {
        const isSelected = conversation._id === selectedId;
        let rowClass = 'chat-list-row';
        if (isSelected) {
          rowClass = 'chat-list-row is-selected';
        }
        let requestTitle = '';
        if (conversation.request) {
          requestTitle = conversation.request.title;
        }
        return (
          <li key={conversation._id}>
            <button type="button" className={rowClass} onClick={() => navigate(`${basePath}/${conversation._id}`)}>
              <span className="chat-avatar" aria-hidden="true">{getInitials(conversation.other.name)}</span>
              <span className="chat-list-body">
                <span className="chat-list-top">
                  <span className="chat-list-name">{conversation.other.name}</span>
                  <span className="chat-list-time">{formatListTime(conversation.last_message ? conversation.last_message.created_at : conversation.updated_at)}</span>
                </span>
                {requestTitle && <span className="chat-list-request">{requestTitle}</span>}
                <span className="chat-list-preview">{getPreview(conversation.last_message)}</span>
              </span>
              {conversation.unread_count > 0 && (
                <span className="chat-unread-badge" aria-label={`${conversation.unread_count} tin nhắn chưa đọc`}>{conversation.unread_count}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
