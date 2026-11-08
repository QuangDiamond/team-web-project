import StatCard from '../common/StatCard';

// Hàng số liệu của Parent Dashboard (số thật từ /dashboard/v1/parent/summary)
export default function ParentStats({ summary }) {
  return (
    <div className="stat-grid">
      <StatCard label="Yêu cầu đang mở" value={summary.open_requests} detail="Đang hiển thị với gia sư" tone="primary" />
      <StatCard label="Đơn cần xem xét" value={summary.pending_applications} detail="Đang chờ bạn" tone="warning" />
      <StatCard label="Lời mời đã gửi" value={summary.pending_invitations} detail="Đang chờ phản hồi" tone="info" />
      <StatCard label="Tín dụng" value={summary.credit_balance} detail="1 tín dụng mỗi lời mời" tone="success" />
    </div>
  );
}
