// Nhãn "Ưu tiên" cho đơn ứng tuyển / lời mời có dùng nhiều hơn 1 credit (được xếp lên đầu danh sách phía nhận)
export default function PriorityBadge({ credits }) {
  if (!credits || credits <= 1) {
    return null;
  }
  return <span className="status-badge tone-warning">Ưu tiên · {credits} credit</span>;
}
