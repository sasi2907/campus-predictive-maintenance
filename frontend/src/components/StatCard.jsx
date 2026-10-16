
export default function StatCard({ label, value, description, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-card-heading">
        <p className="stat-card-label">{label}</p>

        <span className="stat-card-icon">
          <Icon size={20} />
        </span>
      </div>

      <p className="stat-card-value">{value}</p>

      <p className="stat-card-description">{description}</p>
    </article>
  );
}
