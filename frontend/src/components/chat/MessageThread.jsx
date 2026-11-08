import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LoaderCircle, Send } from 'lucide-react';
import Alert from '../common/Alert';
import { formatDate, formatTime } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

const MESSAGE_MAX_LENGTH = 2000;
const NEAR_BOTTOM_PX = 80;

const ROLE_LABELS = { PARENT: 'Parent', TUTOR: 'Tutor' };

// Tin nhắn "danh thiếp" / file do dữ liệu cũ tạo ra vẫn hiển thị nội dung văn bản của nó
function Bubble({ message }) {
  let bubbleClass = 'chat-bubble is-theirs';
  if (message.sender_is_me) {
    bubbleClass = 'chat-bubble is-mine';
  }
  return (
    <div className={message.sender_is_me ? 'chat-row is-mine' : 'chat-row'}>
      <div className={bubbleClass}>
        <p className="chat-bubble-text">{message.content}</p>
        <p className="chat-bubble-time">{formatTime(message.created_at)}</p>
      </div>
    </div>
  );
}

// Khung tin nhắn bên phải (Figma: header người liên hệ, bong bóng chat, ô nhập + nút gửi). thread: kết quả của useChatThread
export default function MessageThread({ thread, basePath }) {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);

  const { messages, conversation } = thread;

  // Tự cuộn xuống tin mới nhất khi đang ở cuối, hoặc khi chính mình vừa gửi
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

  const handleSubmit = (event) => {
    event.preventDefault();
    submitDraft();
  };

  // Enter gửi tin, Shift+Enter xuống dòng
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
          <Link to={basePath} className="link">Back to conversations</Link>
        </div>
      </div>
    );
  }

  const isClosed = conversation && conversation.is_active === false;

  let previousDay = '';
  const items = [];
  messages.forEach((message) => {
    const day = formatDate(message.created_at);
    if (day !== previousDay) {
      items.push(<p key={`day-${message._id}`} className="chat-day">{day}</p>);
      previousDay = day;
    }
    items.push(<Bubble key={message._id} message={message} />);
  });

  return (
    <div className="chat-thread">
      <div className="chat-thread-header">
        <Link to={basePath} className="chat-back dashboard-icon-button" aria-label="Back to conversations">
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
        {conversation ? (
          <>
            <span className="chat-avatar" aria-hidden="true">{getInitials(conversation.other.name)}</span>
            <div className="chat-thread-title">
              <p className="chat-thread-name">{conversation.other.name}</p>
              <p className="chat-thread-meta">
                {ROLE_LABELS[conversation.other.role]}
                {conversation.request ? ` · ${conversation.request.title}` : ''}
              </p>
            </div>
          </>
        ) : (
          <LoaderCircle size={18} className="spin" aria-hidden="true" />
        )}
      </div>

      <div className="chat-messages" ref={scrollRef} onScroll={handleScroll} aria-live="polite">
        {thread.hasOlder && (
          <button type="button" className="btn btn-outline btn-sm chat-load-older" disabled={thread.loadingOlder} onClick={thread.loadOlder}>
            {thread.loadingOlder ? 'Loading...' : 'Load earlier messages'}
          </button>
        )}
        {thread.loading && messages.length === 0 && (
          <div className="page-loading-inline" role="status">
            <LoaderCircle size={22} className="spin" aria-hidden="true" />
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
        {!thread.loading && messages.length === 0 && <p className="chat-empty">No messages yet. Say hello 👋</p>}
        {items}
      </div>

      {sendError && <div className="chat-send-error"><Alert type="error">{sendError}</Alert></div>}
      {isClosed ? (
        <p className="chat-closed">This conversation is closed.</p>
      ) : (
        <form className="chat-composer" onSubmit={handleSubmit}>
          <label htmlFor="chat-draft" className="visually-hidden">Type a message</label>
          <textarea
            id="chat-draft"
            rows={1}
            value={draft}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Type a message…"
            disabled={thread.sending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="btn btn-primary chat-send-button" disabled={thread.sending || draft.trim() === ''} aria-label="Send message">
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
