import Alert from '../common/Alert';
import ApplyModal from './ApplyModal';
import RequestCard from './RequestCard';

// Lưới request + thông báo + hộp thoại ứng tuyển, dùng chung cho Browse, Saved, Suggested (actions từ useRequestActions)
export default function RequestGrid({ items, actions }) {
  return (
    <>
      {actions.notice && <Alert type="success">{actions.notice}</Alert>}
      {actions.actionError && <Alert type="error">{actions.actionError}</Alert>}

      <ul className="request-grid">
        {items.map((request) => (
          <RequestCard key={request._id} request={request} onToggleSave={actions.toggleSave} onApply={actions.openApply} />
        ))}
      </ul>

      {actions.applyingRequest && (
        <ApplyModal request={actions.applyingRequest} onClose={actions.closeApply} onApplied={actions.handleApplied} />
      )}
    </>
  );
}
