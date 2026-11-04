import { Link } from 'react-router-dom';

/*
 * Danh sách gọn cho các khối xem nhanh trên dashboard (Figma: Recommended Opportunities).
 * items: [{ key, title, meta, to, badge: { label, tone } (tùy chọn) }]. Bấm một dòng để mở trang chi tiết.
 */
export default function CompactList({ items }) {
  return (
    <ul className="compact-list">
      {items.map((item) => (
        <li key={item.key}>
          <Link to={item.to} className="compact-row">
            <span className="compact-row-body">
              <span className="compact-row-title">{item.title}</span>
              <span className="compact-row-meta">{item.meta}</span>
            </span>
            {item.badge && <span className={`status-badge tone-${item.badge.tone}`}>{item.badge.label}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
