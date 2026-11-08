import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Minus,
  ChevronLeft,
  Send,
  Search,
  Maximize2,
  LoaderCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markConversationRead
} from '../../services/chatService';
import { getInitials } from '../../utils/getInitials';
import { formatTime } from '../../utils/dateFormat';
import '../../styles/FloatingChatWidget.css';

const AVATAR_PALETTE = ['#0284C7', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0D9488'];

const getAvatarBg = (name) => {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

const getRelativeTime = (isoString) => {
  if (!isoString) return '';
  const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)}p`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)} ngày`;
};

const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Widget visibility & window states
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dragging state for the floating button
  const [coords, setCoords] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementStartRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const scrollRef = useRef(null);

  // Set default position on bottom-right corner
  useEffect(() => {
    const handleResize = () => {
      const defaultX = window.innerWidth - 84;
      const defaultY = window.innerHeight - 88;
      setCoords((prev) => {
        if (!prev) return { x: defaultX, y: defaultY };
        return {
          x: clamp(prev.x, 16, window.innerWidth - 76),
          y: clamp(prev.y, 16, window.innerHeight - 76)
        };
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const messagesBasePath = user?.role === 'PARENT' ? '/parent/messages' : '/tutor/messages';

  // Fetch conversations and calculate total unread count
  const fetchConversations = async () => {
    if (!user || (user.role !== 'PARENT' && user.role !== 'TUTOR')) return;
    try {
      const res = await getConversations({ page: 1, limit: 20 });
      const items = res?.data?.items || [];
      setConversations(items);
      const totalUnread = items.reduce((sum, item) => sum + (item.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch {}
  };

  useEffect(() => {
    fetchConversations();
    const timer = setInterval(fetchConversations, 6000);
    return () => clearInterval(timer);
  }, [user]);

  // Fetch active conversation messages
  const fetchActiveThread = async (convId) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const [convRes, msgRes] = await Promise.all([
        getConversation(convId),
        getMessages(convId, { page: 1, limit: 40 })
      ]);
      setActiveConv(convRes.data);
      const items = msgRes?.data?.items || [];
      // Backend returns newest first; reverse so oldest is first
      setMessages([...items].reverse());
      await markConversationRead(convId);
      fetchConversations();
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      fetchActiveThread(activeConvId);
      const timer = setInterval(() => {
        getMessages(activeConvId, { page: 1, limit: 40 })
          .then((res) => {
            const items = res?.data?.items || [];
            setMessages([...items].reverse());
          })
          .catch(() => {});
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [activeConvId]);

  // Auto scroll to bottom of thread
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Dragging handlers
  const handlePointerDown = (e) => {
    didDragRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { ...(coords || { x: 0, y: 0 }) };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 6) {
      didDragRef.current = true;
    }
    const newX = clamp(elementStartRef.current.x + dx, 16, window.innerWidth - 76);
    const newY = clamp(elementStartRef.current.y + dy, 16, window.innerHeight - 76);
    setCoords({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // If moved under threshold, treat as a clean click
    if (!didDragRef.current) {
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        fetchConversations();
      }
    }
  };

  // Send a message
  const handleSend = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeConvId || sending) return;

    setSending(true);
    try {
      await sendMessage(activeConvId, content);
      setDraft('');
      // Refresh messages
      const msgRes = await getMessages(activeConvId, { page: 1, limit: 40 });
      const items = msgRes?.data?.items || [];
      setMessages([...items].reverse());
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations in list
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.other?.name?.toLowerCase().includes(q);
    const reqMatch = c.request?.title?.toLowerCase().includes(q);
    return nameMatch || reqMatch;
  });

  if (!user || (user.role !== 'PARENT' && user.role !== 'TUTOR')) {
    return null;
  }

  // Calculate popup window anchor coordinates
  const windowRight = coords ? window.innerWidth - coords.x - 64 : 24;
  const windowBottom = coords ? window.innerHeight - coords.y + 12 : 88;

  return (
    <>
      {/* 1. Floating Draggable Bubble Button */}
      <div
        className={`floating-chat-bubble ${isDragging ? 'is-dragging' : ''} ${isOpen ? 'is-open' : ''}`}
        style={coords ? { left: `${coords.x}px`, top: `${coords.y}px` } : {}}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title={isOpen ? 'Thu nhỏ tin nhắn' : 'Mở tin nhắn (Kéo thả để di chuyển)'}
        role="button"
        aria-label="Tin nhắn thả nổi"
      >
        <div className="bubble-icon-wrap">
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </div>
        {!isOpen && unreadCount > 0 && (
          <span className="bubble-unread-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {/* 2. Floating Chat Popup Window (Messenger style) */}
      {isOpen && (
        <aside
          className="floating-chat-window"
          style={{
            right: `${clamp(windowRight, 16, window.innerWidth - 400)}px`,
            bottom: `${clamp(windowBottom, 16, window.innerHeight - 560)}px`
          }}
          aria-label="Khung tin nhắn tức thì"
        >
          {/* Header */}
          <div className="floating-window-header">
            {activeConvId ? (
              <div className="header-conv-info">
                <button
                  type="button"
                  className="btn-header-back"
                  onClick={() => setActiveConvId(null)}
                  title="Quay lại danh sách hội thoại"
                  aria-label="Quay lại"
                >
                  <ChevronLeft size={20} />
                </button>
                <div
                  className="header-avatar"
                  style={{ background: getAvatarBg(activeConv?.other?.name) }}
                >
                  {getInitials(activeConv?.other?.name)}
                </div>
                <div className="header-meta">
                  <span className="header-name">{activeConv?.other?.name || 'Trò chuyện'}</span>
                  <span className="header-sub">
                    {activeConv?.other?.role === 'PARENT' ? 'Phụ huynh' : 'Gia sư'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="header-title-box">
                <span className="header-title-text">Tin nhắn</span>
                {unreadCount > 0 && (
                  <span className="header-badge">{unreadCount} mới</span>
                )}
              </div>
            )}

            <div className="header-actions">
              <button
                type="button"
                className="btn-header-icon"
                onClick={() => {
                  setIsOpen(false);
                  if (activeConvId) {
                    navigate(`${messagesBasePath}/${activeConvId}`);
                  } else {
                    navigate(messagesBasePath);
                  }
                }}
                title="Mở toàn màn hình trong Dashboard"
                aria-label="Mở toàn màn hình"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                className="btn-header-icon"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                aria-label="Thu nhỏ"
              >
                <Minus size={18} />
              </button>
            </div>
          </div>

          {/* Body: Mode 1 (Conversation List) */}
          {!activeConvId && (
            <div className="floating-conv-list-container">
              {/* Search */}
              <div className="floating-search-bar">
                <div className="floating-search-wrap">
                  <Search size={14} className="floating-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="floating-search-input"
                    placeholder="Tìm kiếm người liên hệ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* List */}
              <div className="floating-conv-scroll">
                {filteredConversations.length === 0 ? (
                  <div className="floating-empty">
                    <p>Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const otherName = c.other?.name || 'Người dùng';
                    const hasUnread = c.unread_count > 0;
                    const preview = c.last_message?.content || 'Bắt đầu cuộc trò chuyện...';
                    const time = getRelativeTime(c.last_message?.created_at || c.updated_at);

                    return (
                      <div
                        key={c._id}
                        className={`floating-conv-row ${hasUnread ? 'unread' : ''}`}
                        onClick={() => setActiveConvId(c._id)}
                      >
                        <div
                          className="conv-avatar"
                          style={{ background: getAvatarBg(otherName) }}
                        >
                          {getInitials(otherName)}
                          <span className="conv-online-dot" />
                        </div>
                        <div className="conv-content">
                          <div className="conv-top">
                            <span className="conv-name">{otherName}</span>
                            <span className="conv-time">{time}</span>
                          </div>
                          <p className="conv-preview">
                            {c.last_message?.sender_is_me ? `Bạn: ${preview}` : preview}
                          </p>
                        </div>
                        {hasUnread && (
                          <span className="conv-badge">
                            {c.unread_count > 9 ? '9+' : c.unread_count}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="floating-window-footer">
                <button
                  type="button"
                  className="btn-open-full"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(messagesBasePath);
                  }}
                >
                  Mở trang tin nhắn đầy đủ →
                </button>
              </div>
            </div>
          )}

          {/* Body: Mode 2 (Active Chat Thread) */}
          {activeConvId && (
            <div className="floating-thread-container">
              <div className="floating-messages-scroll" ref={scrollRef}>
                {loadingMessages && (
                  <div className="thread-loading">
                    <LoaderCircle size={22} className="spin" color="#0284c7" />
                    <span>Đang tải tin nhắn...</span>
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div className="floating-empty">
                    <p>Hãy gửi lời chào đầu tiên 👋</p>
                  </div>
                )}

                {messages.map((m) => {
                  const isMine = Boolean(m.sender_is_me);
                  return (
                    <div
                      key={m._id}
                      className={`floating-msg-row ${isMine ? 'is-mine' : 'is-theirs'}`}
                    >
                      <div className="floating-msg-bubble">
                        <p className="floating-msg-text">{m.content}</p>
                        <div className="floating-msg-meta">
                          <span className="floating-msg-time">{formatTime(m.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <form className="floating-composer" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  title="Gửi (Enter)"
                  aria-label="Gửi tin nhắn"
                >
                  {sending ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </form>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
