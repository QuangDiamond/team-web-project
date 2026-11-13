import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  LoaderCircle,
  Send
} from 'lucide-react';
import Alert from '../common/Alert';
import ChatAgreementButton from './ChatAgreementButton';
import { formatDate, formatTime } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

const MESSAGE_MAX_LENGTH = 2000;
const NEAR_BOTTOM_PX = 80;

const ROLE_DISPLAY = {
  PARENT: { label: 'Phụ huynh', className: 'role-parent' },
  TUTOR: { label: 'Gia sư', className: 'role-tutor' },
  STUDENT: { label: 'Học sinh', className: 'role-student' }
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

function Bubble({ message, otherName }) {
  const isMine = Boolean(message.sender_is_me);

  return (
    <div className={isMine ? 'chat-row is-mine' : 'chat-row is-theirs'}>
      {!isMine && (
        <span
          className="chat-bubble-avatar"
          style={{ background: getAvatarBg(otherName) }}
          aria-hidden="true"
        >
          {getInitials(otherName)}
        </span>
      )}
      <div className={`chat-bubble ${isMine ? 'is-mine' : 'is-theirs'}`}>
        <p className="chat-bubble-text">{message.content}</p>
        <div className="chat-bubble-footer">
          <span className="chat-bubble-time">{formatTime(message.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// Khung tin nhắn bên phải (Figma: header người liên hệ, bong bóng chat hiện đại, composer chuyên nghiệp). thread: kết quả của useChatThread
export default function MessageThread({ thread, basePath }) {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [agreementNotice, setAgreementNotice] = useState('');
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);

  const { messages, conversation } = thread;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || messages.length === 0) {
      return;
    }
    const lastMessage = messages[messages.length - 1];
    if (stickToBottom.current || lastMessage.sender_is_me) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottom.current = distanceFromBottom < NEAR_BOTTOM_PX;
  };

  const submitDraft = async () => {
    const content = draft.trim();
    if (!content || thread.sending) {
      return;
    }
    setSendError('');
    try {
      await thread.send(content);
      setDraft('');
      stickToBottom.current = true;
    } catch (error) {
      setSendError(error.message);
    }
  };

  // UC16: thông báo gửi đề xuất thỏa thuận thành công, tự ẩn sau 4 giây
  const showAgreementNotice = (message) => {
    setSendError('');
    setAgreementNotice(message);
    setTimeout(() => setAgreementNotice(''), 4000);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitDraft();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitDraft();
    }
  };

  if (thread.error) {
    return (
      <div className="chat-thread">
        <div className="chat-thread-state">
          <Alert type="error">{thread.error.message}</Alert>
          <Link to={basePath} className="link">
            Quay lại danh sách trò chuyện
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = conversation && conversation.is_active === false;
  const otherName = conversation?.other?.name || 'Người dùng';
  const roleInfo = ROLE_DISPLAY[conversation?.other?.role] || { label: 'Thành viên', className: '' };

  let previousDay = '';
  const items = [];
  messages.forEach((message) => {
    const day = formatDate(message.created_at);
    if (day !== previousDay) {
      items.push(
        <div key={`day-${message._id}`} className="chat-day-divider">
          <span className="chat-day-pill">{day}</span>
        </div>
      );
      previousDay = day;
    }
    items.push(<Bubble key={message._id} message={message} otherName={otherName} />);
  });

  return (
    <div className="chat-thread">
      {/* Header */}
      <div className="chat-thread-header">
        <Link
          to={basePath}
          className="chat-back dashboard-icon-button"
          aria-label="Quay lại danh sách trò chuyện"
          title="Quay lại"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>

        {conversation ? (
          <div className="chat-header-main">
            <div className="chat-avatar-wrap">
              <span
                className="chat-avatar"
                style={{ background: getAvatarBg(otherName) }}
                aria-hidden="true"
              >
                {getInitials(otherName)}
              </span>
              <span className="chat-online-dot" />
            </div>

            <div className="chat-thread-title">
              <div className="chat-thread-title-row">
                <span className="chat-thread-name">{otherName}</span>
                <span className={`chat-role-chip ${roleInfo.className}`}>
                  {roleInfo.label}
                </span>
              </div>

              {conversation.request && (
                <div className="chat-thread-request-pill" title={conversation.request.title}>
                  <span>Lớp: {conversation.request.title}</span>
                </div>
              )}
            </div>

            {/* Quick Context Action: Thỏa thuận */}
            <div className="chat-header-actions">
              {!isClosed && (
                <ChatAgreementButton
                  conversationId={conversation._id}
                  onProposed={showAgreementNotice}
                  onError={setSendError}
                />
              )}
              <Link
                to={basePath.startsWith('/parent') ? '/parent/connections' : '/tutor/connections'}
                className="btn-chat-agreement"
                title="Xem danh sách thỏa thuận"
              >
                <span>Xem thỏa thuận</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="page-loading-inline">
            <LoaderCircle size={18} className="spin" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Message List */}
      <div
        className="chat-messages"
        ref={scrollRef}
        onScroll={handleScroll}
        aria-live="polite"
      >
        {thread.hasOlder && (
          <button
            type="button"
            className="btn btn-outline btn-sm chat-load-older"
            disabled={thread.loadingOlder}
            onClick={thread.loadOlder}
          >
            {thread.loadingOlder ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
          </button>
        )}

        {thread.loading && messages.length === 0 && (
          <div className="page-loading-inline" role="status">
            <LoaderCircle size={24} className="spin" aria-hidden="true" />
            <span className="visually-hidden">Đang tải tin nhắn...</span>
          </div>
        )}

        {!thread.loading && messages.length === 0 && (
          <div className="chat-empty-thread">
            <h4>Bắt đầu cuộc trò chuyện</h4>
            <p>
              Hãy gửi lời chào và thảo luận cùng <strong>{otherName}</strong> về lịch học và nhu cầu học tập.
            </p>
          </div>
        )}
        {items}
      </div>

      {sendError && (
        <div className="chat-send-error">
          <Alert type="error">{sendError}</Alert>
        </div>
      )}
      {agreementNotice && (
        <div className="chat-send-error">
          <Alert type="success">{agreementNotice}</Alert>
        </div>
      )}

      {/* Composer Input */}
      {isClosed ? (
        <div className="chat-closed-notice">
          <p>Cuộc trò chuyện này đã kết thúc do yêu cầu hoặc thỏa thuận đã hoàn tất.</p>
        </div>
      ) : (
        <div className="chat-composer-wrap">
          <form className="chat-composer" onSubmit={handleSubmit}>
            <label htmlFor="chat-draft" className="visually-hidden">
              Nhập tin nhắn
            </label>
            <textarea
              id="chat-draft"
              rows={1}
              value={draft}
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder={`Nhắn tin cho ${otherName}...`}
              disabled={thread.sending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={!draft.trim() || thread.sending}
              aria-label="Gửi tin nhắn"
              title="Gửi (Enter)"
            >
              {thread.sending ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          <div className="chat-composer-hint">
            <span>Nhấn <strong>Enter</strong> để gửi · <strong>Shift + Enter</strong> để xuống dòng</span>
          </div>
        </div>
      )}
    </div>
  );
}
