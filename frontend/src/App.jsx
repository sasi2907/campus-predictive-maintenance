import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import PredictionForm, { INITIAL_FORM } from "./components/PredictionForm";
import PredictionResults from "./components/PredictionResults";
import MaintenanceLogs from "./components/MaintenanceLogs";
import Facilities from "./components/Facilities";
import Analytics from "./components/Analytics";
import PriorityOverview from "./components/PriorityOverview";

import { predictFacilityRisk } from "./services/predictionService";
import { getDashboardStats } from "./services/dashboardService";
import { getMaintenanceWorkflowStats } from "./services/workflowService";

export default function App() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [workflowStats, setWorkflowStats] = useState(null);
  const [workflowStatsLoading, setWorkflowStatsLoading] = useState(true);
  const [workflowStatsError, setWorkflowStatsError] = useState("");

  // Load historical dashboard statistics.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboardStats() {
      try {
        setStatsLoading(true);
        setStatsError("");

        const data = await getDashboardStats();

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setStatsError(
            err.message || "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    loadDashboardStats();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load maintenance workflow statistics.
  useEffect(() => {
    let cancelled = false;

    async function loadWorkflowStats() {
      try {
        setWorkflowStatsLoading(true);
        setWorkflowStatsError("");

        const data = await getMaintenanceWorkflowStats();

        if (!cancelled) {
          setWorkflowStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setWorkflowStatsError(
            err.message ||
              "Unable to load maintenance workflow statistics."
          );
        }
      } finally {
        if (!cancelled) {
          setWorkflowStatsLoading(false);
        }
      }
    }

    loadWorkflowStats();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshWorkflowStats() {
    try {
      setWorkflowStatsError("");

      const data = await getMaintenanceWorkflowStats();
      setWorkflowStats(data);
    } catch (err) {
      setWorkflowStatsError(
        err.message || "Unable to refresh workflow statistics."
      );
    }
  }

  // Track the active section while scrolling.
  useEffect(() => {
    const sections = document.querySelectorAll(
      "[data-dashboard-section]"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  function handleNavigate(sectionId) {
    setActiveSection(sectionId);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handlePrediction(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const prediction = await predictFacilityRisk(form);
      setResult(prediction);
    } catch (err) {
      setError(err.message || "Unable to generate a prediction.");
    } finally {
      setLoading(false);
    }
  }

  function formatStat(value, isLoading) {
    if (isLoading) return "…";
    if (value === undefined || value === null) return "—";

    return Number(value).toLocaleString();
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      <main className="app-main">
        <Header />

        <div className="app-content">
          {/* Dashboard hero */}
          <section
            id="dashboard"
            data-dashboard-section
            className="dashboard-hero"
          >
            <div className="dashboard-hero-content">
              <div className="dashboard-hero-eyebrow">
                <Activity size={14} />
                <span>Predictive maintenance intelligence</span>
              </div>

              <h2 className="dashboard-hero-title">
                Anticipate facility issues before they disrupt campus.
              </h2>

              <p className="dashboard-hero-description">
                Analyze campus conditions, estimate likely facility
                issues, and prioritize maintenance using machine learning.
              </p>

              <button
                type="button"
                onClick={() => handleNavigate("predictor")}
                className="dashboard-hero-button"
              >
                Open Risk Predictor
              </button>
            </div>
          </section>

          {/* Historical dashboard statistics */}
          <section
            aria-label="Historical dashboard statistics"
            className="dashboard-historical-stats"
          >
            <StatCard
              label="Historical records"
              value={formatStat(stats?.total_logs, statsLoading)}
              description="Maintenance records in the CSV"
              icon={ClipboardList}
            />

            <StatCard
              label="High-severity issues"
              value={formatStat(
                stats?.high_severity_issues,
                statsLoading
              )}
              description="Records marked High severity"
              icon={AlertTriangle}
            />

            <StatCard
              label="Facility locations"
              value={formatStat(stats?.total_locations, statsLoading)}
              description="Unique campus locations"
              icon={Building2}
            />

            <StatCard
              label="Issue categories"
              value={formatStat(
                stats?.total_issue_types,
                statsLoading
              )}
              description="Unique types in the dataset"
              icon={ChartNoAxesCombined}
            />
          </section>

          {statsError && (
            <div className="app-warning-message" role="alert">
              <p className="app-warning-title">
                Dashboard statistics could not be loaded.
              </p>

              <p className="app-warning-detail">{statsError}</p>

              <p className="app-warning-detail">
                Check that the Flask backend is running on port 5000,
                then refresh this page.
              </p>
            </div>
          )}

          {/* Maintenance workflow statistics */}
          <section
            aria-label="Maintenance workflow statistics"
            className="dashboard-workflow-stats"
          >
            <StatCard
              label="Open complaints"
              value={formatStat(
                workflowStats?.open,
                workflowStatsLoading
              )}
              description="Awaiting resolution"
              icon={ClipboardList}
            />

            <StatCard
              label="In progress"
              value={formatStat(
                workflowStats?.in_progress,
                workflowStatsLoading
              )}
              description="Currently being handled"
              icon={Activity}
            />

            <StatCard
              label="Resolved complaints"
              value={formatStat(
                workflowStats?.resolved,
                workflowStatsLoading
              )}
              description="Marked as resolved"
              icon={ShieldCheck}
            />
          </section>

          {workflowStatsError && (
            <div className="app-warning-message" role="alert">
              <p className="app-warning-title">
                Maintenance workflow statistics could not be loaded.
              </p>

              <p className="app-warning-detail">
                {workflowStatsError}
              </p>

              <p className="app-warning-detail">
                Check that the Flask backend is running and the workflow
                statistics endpoint is available.
              </p>
            </div>
          )}

          {/* Risk predictor */}
          <div
            id="predictor"
            data-dashboard-section
            className="app-predictor-section"
          >
            <PredictionForm
              form={form}
              onChange={handleFormChange}
              onSubmit={handlePrediction}
              loading={loading}
            />

            {error && (
              <div className="app-prediction-error" role="alert">
                {error}
              </div>
            )}

            <PredictionResults result={result} />
          </div>

          {/* Other dashboard sections */}
          <MaintenanceLogs onWorkflowSaved={refreshWorkflowStats} />

          <Facilities />

          <Analytics />

          <PriorityOverview />

          <footer className="app-footer">
            CampusCare · Predictions are estimates, not verified safety
            assessments. This prototype uses synthetic data.
          </footer>
        </div>
      </main>
    </div>
  );
}
