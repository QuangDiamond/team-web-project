import { useParams } from 'react-router-dom';
import { LoaderCircle, MessageSquare } from 'lucide-react';
import { useChatThread } from '../../hooks/useChatThread';
import { useConversationList } from '../../hooks/useConversationList';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import ConversationList from '../../components/chat/ConversationList';
import MessageThread from '../../components/chat/MessageThread';
import '../../styles/chat.css';

// Màn Messages dùng chung cho Parent và Tutor (Figma: hai cột). basePath: /parent/messages hoặc /tutor/messages
export default function ChatPage({ basePath }) {
  const { conversationId } = useParams();
  const conversations = useConversationList();
  const thread = useChatThread(conversationId, conversations.refresh);

  let layoutClass = 'chat-layout';
  if (conversationId) {
    layoutClass = 'chat-layout has-selection';
  }

  return (
    <div className={layoutClass}>
      <aside className="chat-sidebar" aria-label="Danh sách cuộc trò chuyện">
        {conversations.loading && (
          <div className="page-loading-inline" role="status">
            <LoaderCircle size={24} className="spin" aria-hidden="true" />
            <span className="visually-hidden">Đang tải danh sách...</span>
          </div>
        )}
        {conversations.error && <Alert type="error">{conversations.error.message}</Alert>}
        {!conversations.loading && !conversations.error && (
          <ConversationList
            conversations={conversations.items}
            selectedId={conversationId}
            basePath={basePath}
          />
        )}
      </aside>

      <section className="chat-main">
        {conversationId ? (
          <MessageThread key={conversationId} thread={thread} basePath={basePath} />
        ) : (
          <div className="chat-placeholder-container">
            <EmptyState
              icon={MessageSquare}
              title="Chọn một cuộc trò chuyện"
              description="Chọn một người liên hệ ở danh sách bên trái để đọc tin nhắn, trao đổi việc học và chuẩn bị tiến tới Thỏa thuận gia sư (UC16)."
            />
          </div>
        )}
      </section>
    </div>
  );
}
