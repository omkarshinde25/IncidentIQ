const menuItems = [
  { label: "Dashboard", icon: "◫" },
  { label: "Incidents", icon: "▤" },
  { label: "New Incident", icon: "+" },
  { label: "Correlation", icon: "◎" },
  { label: "RCA Analysis", icon: "◇" },
  { label: "ML Prediction", icon: "✦" },
  { label: "Patterns", icon: "⌁" },
];

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">IQ</div>

        <div>
          <h1>IncidentIQ</h1>
          <span>Incident Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={
              activePage === item.label
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => onNavigate(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>

        <div>
          <strong>System Online</strong>
          <span>FastAPI + ML Engine</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;