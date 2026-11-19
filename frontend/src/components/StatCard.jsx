function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue"
}) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-top">
        <div className={`stat-icon ${color}`}>
          {icon}
        </div>

        <span className="stat-label">
          {title}
        </span>
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-subtitle">
        {subtitle}
      </div>
    </div>
  );
}

export default StatCard;