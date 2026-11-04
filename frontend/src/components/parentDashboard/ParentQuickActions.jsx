import { useNavigate } from 'react-router-dom';
import { ClipboardList, Mail, MessageSquare, Plus } from 'lucide-react';
import SectionCard from '../common/SectionCard';

// Các lối tắt vào luồng chính của phụ huynh (Figma: Quick actions)
export default function ParentQuickActions() {
  const navigate = useNavigate();

  return (
    <SectionCard title="Quick actions">
      <div className="quick-actions">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/parent/requests/new')}>
          <Plus size={16} aria-hidden="true" />
          <span>Create tutoring request</span>
        </button>
        <button type="button" className="btn btn-outline btn-block" onClick={() => navigate('/parent/requests')}>
          <ClipboardList size={16} aria-hidden="true" />
          <span>Review applications</span>
        </button>
        <button type="button" className="btn btn-outline btn-block" onClick={() => navigate('/parent/invitations')}>
          <Mail size={16} aria-hidden="true" />
          <span>View my invitations</span>
        </button>
        <button type="button" className="btn btn-outline btn-block" onClick={() => navigate('/parent/messages')}>
          <MessageSquare size={16} aria-hidden="true" />
          <span>Open messages</span>
        </button>
      </div>
    </SectionCard>
  );
}
