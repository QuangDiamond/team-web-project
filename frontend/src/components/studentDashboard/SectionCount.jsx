// Ghi chú "Showing 5 of 12" khi khối có nhiều mục hơn số đang hiển thị
export default function SectionCount({ section, label }) {
  if (section.loading || section.error || section.total === 0) {
    return null;
  }

  if (section.total > section.items.length) {
    return <span className="student-section-count">Đang hiển thị {section.items.length} trên {section.total}</span>;
  }

  return <span className="student-section-count">{label}</span>;
}
