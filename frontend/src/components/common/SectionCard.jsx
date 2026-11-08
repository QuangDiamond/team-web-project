// Khung card có tiêu đề dùng trong các dashboard. action: nội dung bên phải tiêu đề (link, ghi chú...)
export default function SectionCard({ title, action, children }) {
  return (
    <section className="section-card">
      <div className="section-card-header">
        <h2 className="section-card-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
