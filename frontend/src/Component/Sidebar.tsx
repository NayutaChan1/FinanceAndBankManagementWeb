import { Link } from "react-router-dom";

function Sidebar({ activeMenu }: { activeMenu: string }) {
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
        <Link
          to="/dashboard"
          className={`nav-item ${activeMenu === "dashboard" ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          Dashboard
        </Link>

        <Link
          to="/transactions"
          className={`nav-item ${activeMenu === "transactions" ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          Transactions
        </Link>

        <Link
          to="/analytics"
          className={`nav-item ${activeMenu === "analytics" ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          Analytics
        </Link>

        <Link
          to="/goals"
          className={`nav-item ${activeMenu === "goals" ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          Goals
        </Link>

        <Link
          to="/uploadfile"
          className={`nav-item ${activeMenu === "uploadfile" ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          Upload
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;
