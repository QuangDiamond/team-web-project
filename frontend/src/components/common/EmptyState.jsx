// Trạng thái rỗng dùng chung. icon: component icon của lucide-react (tùy chọn)
export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-state-icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
    </div>
  );
}
