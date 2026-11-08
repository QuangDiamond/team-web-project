import StatCard from '../common/StatCard';

// Hàng số liệu của Parent Dashboard (số thật từ /dashboard/v1/parent/summary)
export default function ParentStats({ summary }) {
  return (
    <div className="stat-grid">
      <StatCard label="Applications to review" value={summary.pending_applications} detail="Waiting for you" tone="warning" />
      <StatCard label="Invitations sent" value={summary.pending_invitations} detail="Awaiting a reply" tone="info" />
      <StatCard label="Credits" value={summary.credit_balance} detail="1 per invitation" tone="success" />
    </div>
  );
}
