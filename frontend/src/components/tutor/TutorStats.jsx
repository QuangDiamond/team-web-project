import StatCard from '../common/StatCard';

// Hàng số liệu của Tutor Dashboard (số thật từ /dashboard/v1/tutor/summary)
export default function TutorStats({ summary }) {
  return (
    <div className="stat-grid">
      <StatCard
        label="Pending applications"
        value={summary.pending_applications}
        detail={`${summary.accepted_applications} accepted`}
        tone="warning"
      />
      <StatCard label="Invitations to answer" value={summary.pending_invitations} detail="From parents" tone="info" />
      <StatCard label="Credits" value={summary.credit_balance} detail="1 per application" tone="success" />
    </div>
  );
}
