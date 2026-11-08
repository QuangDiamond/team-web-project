import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { formatDate, formatTime } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

const isToday = (value) => new Date(value).toDateString() === new Date().toDateString();

const formatListTime = (value) => {
  if (!value) {
    return '';
  }
  if (isToday(value)) {
    return formatTime(value);
  }
  return formatDate(value);
};

const AVATAR_COLORS = ['#0284C7', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0D9488'];

const getAvatarBg = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getPreview = (lastMessage) => {
  if (!lastMessage) {
    return 'Chưa có tin nhắn nào';
  }
  let content = lastMessage.content || '';
  if (lastMessage.sender_is_me) {
    content = `Bạn: ${content}`;
  }
  return content;
};

const ROLE_DISPLAY = {
  PARENT: { label: 'Phụ huynh', className: 'role-parent' },
  TUTOR: { label: 'Gia sư', className: 'role-tutor' },
  STUDENT: { label: 'Học sinh', className: 'role-student' }
};

// Cột trái của màn chat (Figma: danh sách người liên hệ + thanh tìm kiếm). basePath: /parent/messages hoặc /tutor/messages
export default function ConversationList({ conversations, selectedId, basePath }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Chưa có cuộc trò chuyện nào"
        description="Hội thoại sẽ tự động mở khi phụ huynh duyệt đơn ứng tuyển của gia sư hoặc gia sư chấp nhận lời mời dạy kèm."
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const filtered = conversations.filter((c) => {
    if (!query) return true;
    const nameMatch = c.other?.name?.toLowerCase().includes(query);
    const requestMatch = c.request?.title?.toLowerCase().includes(query);
    return nameMatch || requestMatch;
  });

  return (
    <div className="chat-sidebar-inner">
      <div className="chat-search-bar">
        <div className="chat-search-wrap">
          <Search size={15} className="chat-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="chat-search-input"
            placeholder="Tìm kiếm người liên hệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm kiếm cuộc trò chuyện"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="chat-search-empty">
          <p>Không tìm thấy hội thoại phù hợp</p>
        </div>
      ) : (
        <ul className="chat-list" aria-label="Danh sách cuộc trò chuyện">
          {filtered.map((conversation) => {
            const isSelected = conversation._id === selectedId;
            const hasUnread = conversation.unread_count > 0;
            const roleInfo = ROLE_DISPLAY[conversation.other.role] || { label: 'Thành viên', className: '' };
            const avatarColor = getAvatarBg(conversation.other.name);

            let rowClass = 'chat-list-row';
            if (isSelected) {
              rowClass += ' is-selected';
            }
            if (hasUnread) {
              rowClass += ' has-unread';
            }

            let requestTitle = '';
            if (conversation.request) {
              requestTitle = conversation.request.title;
            }

            return (
              <li key={conversation._id}>
                <button
                  type="button"
                  className={rowClass}
                  onClick={() => navigate(`${basePath}/${conversation._id}`)}
                >
                  <div className="chat-avatar-wrap">
                    <span
                      className="chat-avatar"
                      style={{ background: avatarColor }}
                      aria-hidden="true"
                    >
                      {getInitials(conversation.other.name)}
                    </span>
                    <span className="chat-online-dot" title="Trạng thái kết nối" />
                  </div>

                  <span className="chat-list-body">
                    <span className="chat-list-top">
                      <span className="chat-list-name-wrap">
                        <span className="chat-list-name">{conversation.other.name}</span>
                        <span className={`chat-role-chip ${roleInfo.className}`}>
                          {roleInfo.label}
                        </span>
                      </span>
                      <span className="chat-list-time">
                        {formatListTime(
                          conversation.last_message
                            ? conversation.last_message.created_at
                            : conversation.updated_at
                        )}
                      </span>
                    </span>

                    {requestTitle && (
                      <span className="chat-list-request" title={requestTitle}>
                        {requestTitle}
                      </span>
                    )}

                    <span className="chat-list-preview">
                      {getPreview(conversation.last_message)}
                    </span>
                  </span>

                  {hasUnread && (
                    <span
                      className="chat-unread-badge"
                      aria-label={`${conversation.unread_count} tin nhắn chưa đọc`}
                    >
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
