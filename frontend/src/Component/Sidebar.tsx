function sidebar({ activeMenu }: { activeMenu: string }) {
  return (
    <div className="sidebar">
      <div className="logo-section">
        <div className="logo">NB</div>

        <div className="brand">
          <span>Financial</span>
          <span>Dashboard</span>
        </div>
      </div>

      <nav className="nav-menu">
        <div
          className={`nav-item ${activeMenu === "dashboard" ? "active" : ""}`}
        >
          Dashboard
        </div>

        <div
          className={`nav-item ${activeMenu === "transactions" ? "active" : ""}`}
        >
          Transactions
        </div>

        <div
          className={`nav-item ${activeMenu === "analytics" ? "active" : ""}`}
        >
          Analytics
        </div>

        <div
          className={`nav-item ${activeMenu === "settings" ? "active" : ""}`}
        >
          Settings
        </div>
      </nav>
    </div>
  );
}

export default sidebar;
