import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

// Nút mở hội thoại 1-1. to: /parent/messages/:id hoặc /tutor/messages/:id
export default function OpenChatLink({ to }) {
  return (
    <Link to={to} className="btn btn-primary btn-sm">
      <MessageSquare size={14} aria-hidden="true" />
      <span>Mở cuộc trò chuyện</span>
    </Link>
  );
}
