
import { useState } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Wrench,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, target: "dashboard" },
  { label: "Risk Predictor", icon: Activity, target: "predictor" },
  { label: "Maintenance Logs", icon: ClipboardList, target: "logs" },
  { label: "Facilities", icon: Building2, target: "facilities" },
];

export default function Sidebar({ activeSection, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (target) => {
    onNavigate(target);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={23} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        className={`app-sidebar ${
          mobileOpen ? "mobile-sidebar-open" : ""
        }`}
      >
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

          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={21} />
          </button>
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
                  onClick={() => handleNavigate(target)}
                  aria-current={active ? "page" : undefined}
                  className={`sidebar-nav-link ${
                    active ? "sidebar-nav-link-active" : ""
                  }`}
                >
                  <Icon size={19} />
                  <span className="sidebar-nav-label">{label}</span>

                  {active && (
                    <span
                      className="sidebar-nav-indicator"
                      aria-hidden="true"
                    />
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
              <span
                className="sidebar-service-indicator"
                aria-hidden="true"
              />
              <span>Prediction service available</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
