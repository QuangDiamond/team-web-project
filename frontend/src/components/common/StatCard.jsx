// Ô số liệu nhỏ trên dashboard. tone = 'primary' | 'info' | 'warning' | 'success'
export default function StatCard({ label, value, detail, tone = 'primary' }) {
  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      <p className={`stat-card-value tone-${tone}`}>{value}</p>
      {detail && <p className="stat-card-detail">{detail}</p>}
    </div>
  );
}
