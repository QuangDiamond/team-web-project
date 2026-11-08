import StatCard from '../common/StatCard';

// Hàng số liệu của Tutor Dashboard (số thật từ /dashboard/v1/tutor/summary)
export default function TutorStats({ summary }) {
  return (
    <div className="stat-grid">
      <StatCard
        label="Đơn ứng tuyển đang chờ"
        value={summary.pending_applications}
        detail={`${summary.accepted_applications} đã được chấp nhận`}
        tone="warning"
      />
      <StatCard label="Lời mời cần phản hồi" value={summary.pending_invitations} detail="Từ phụ huynh" tone="info" />
      <StatCard label="Tín dụng" value={summary.credit_balance} detail="Dùng khi ứng tuyển" tone="success" />
    </div>
  );
}
