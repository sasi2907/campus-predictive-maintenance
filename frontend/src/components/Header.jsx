import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-heading">
        <p className="app-header-breadcrumb">
          Campus operations / Overview
        </p>

        <h2 className="app-header-title">
          Facility Risk Dashboard
        </h2>
      </div>

      <div className="app-header-actions">
        <div className="app-header-team">
          <p className="app-header-team-name">Maintenance Team</p>
          <p className="app-header-team-description">
            Campus operations
          </p>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="app-header-notification"
        >
          <Bell size={19} />
          <span
            className="app-header-notification-indicator"
            aria-hidden="true"
          />
        </button>

        <div
          className="app-header-avatar"
          aria-label="Maintenance Team"
          title="Maintenance Team"
        >
          MT
        </div>
      </div>
    </header>
  );
}
