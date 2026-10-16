
import {
  Activity,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, target: "dashboard" },
  { label: "Risk Predictor", icon: Activity, target: "predictor" },
  { label: "Maintenance Logs", icon: ClipboardList, target: "logs" },
  { label: "Facilities", icon: Building2, target: "facilities" },
];

export default function Sidebar({ activeSection, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Wrench size={23} />
        </div>

        <div className="sidebar-brand-content">
          <h1 className="sidebar-brand-title">CampusCare</h1>
          <p className="sidebar-brand-subtitle">
            Predictive maintenance
          </p>
        </div>
      </div>

      <div className="sidebar-navigation-area">
        <p className="sidebar-section-label">Workspace</p>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, target }) => {
            const active = activeSection === target;

            return (
              <button
                key={target}
                type="button"
                onClick={() => onNavigate(target)}
                aria-current={active ? "page" : undefined}
                className={`sidebar-nav-link ${
                  active ? "sidebar-nav-link-active" : ""
                }`}
              >
                <Icon size={19} />
                <span className="sidebar-nav-label">{label}</span>

                {active && (
                  <span className="sidebar-nav-indicator" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-system-card">
          <div className="sidebar-system-heading">
            <ShieldCheck size={19} />
            <span>System status</span>
          </div>

          <p className="sidebar-system-description">
            Campus facility risk prediction powered by machine learning.
          </p>

          <div className="sidebar-service-status">
            <span className="sidebar-service-indicator" aria-hidden="true" />
            <span>Prediction service available</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
