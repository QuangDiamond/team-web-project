import { useEffect } from 'react';
import { toast } from 'sonner';
import ApplyModal from './ApplyModal';
import RequestCard from './RequestCard';

// Lưới request + thông báo + hộp thoại ứng tuyển, dùng chung cho Browse, Saved, Suggested (actions từ useRequestActions)
export default function RequestGrid({ items, actions, readOnly = false }) {
  useEffect(() => {
    if (actions.notice) {
      toast.success(actions.notice, { id: 'request-action-success' });
    }
  }, [actions.notice]);

  useEffect(() => {
    if (actions.actionError) {
      toast.error(actions.actionError, { id: 'request-action-error' });
    }
  }, [actions.actionError]);

  return (
    <>

      <ul className="request-grid">
        {items.map((request) => (
          <RequestCard key={request._id} request={request} onToggleSave={actions.toggleSave} onApply={actions.openApply} readOnly={readOnly} />
        ))}
      </ul>

      {actions.applyingRequest && (
        <ApplyModal request={actions.applyingRequest} onClose={actions.closeApply} onApplied={actions.handleApplied} />
      )}
    </>
  );
}
