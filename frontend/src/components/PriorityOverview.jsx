
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { API_BASE_URL, apiFetch } from "../services/api";

const API_URL = `${API_BASE_URL}/priority-overview`;

const PRIORITY_CLASSES = {
  Critical: "priority-overview-badge-critical",
  High: "priority-overview-badge-high",
  Medium: "priority-overview-badge-medium",
  Low: "priority-overview-badge-low",
};

const SEVERITY_CLASSES = {
  High: "priority-overview-severity-high",
  Medium: "priority-overview-severity-medium",
  Low: "priority-overview-severity-low",
};

function PriorityBadge({ priority }) {
  const priorityClass =
    PRIORITY_CLASSES[priority] || "priority-overview-badge-neutral";

  return (
    <span className={`priority-overview-badge ${priorityClass}`}>
      {priority}
    </span>
  );
}

function OverviewCard({ title, value, description, icon: Icon }) {
  return (
    <article className="priority-overview-stat-card">
      <div className="priority-overview-stat-content">
        <div className="priority-overview-stat-text">
          <p className="priority-overview-stat-label">{title}</p>

          <p className="priority-overview-stat-value">
            {value.toLocaleString()}
          </p>

          <p className="priority-overview-stat-description">
            {description}
          </p>
        </div>

        <div className="priority-overview-stat-icon">
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

function CountBar({ label, count, percentage, colorClass }) {
  return (
    <div className="priority-overview-bar-item">
      <div className="priority-overview-bar-heading">
        <span className="priority-overview-bar-label">{label}</span>

        <span className="priority-overview-bar-count">
          {count.toLocaleString()}{" "}
          <span className="priority-overview-bar-percentage">
            ({percentage.toFixed(1)}%)
          </span>
        </span>
      </div>

      <div
        className="priority-overview-bar-track"
        role="progressbar"
        aria-label={`${label} severity records`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`priority-overview-bar-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function PriorityOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(API_URL);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load the priority overview."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the priority API."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const severityCounts = data?.historical_severity_counts || {};
  const priorityCounts = data?.priority_distribution || [];
  const locations = data?.high_severity_by_location || [];
  const topIssues = data?.top_priority_records || [];

  const criticalCount =
    priorityCounts.find((item) => item.name === "Critical")?.count || 0;

  const highCount =
    priorityCounts.find((item) => item.name === "High")?.count || 0;

  const mediumCount =
    priorityCounts.find((item) => item.name === "Medium")?.count || 0;

  const lowCount =
    priorityCounts.find((item) => item.name === "Low")?.count || 0;

  const highSeverityCount = severityCounts.High || 0;
  const mediumSeverityCount = severityCounts.Medium || 0;
  const lowSeverityCount = severityCounts.Low || 0;

  const totalSeverityCount =
    highSeverityCount + mediumSeverityCount + lowSeverityCount;

  const severityItems = [
    {
      label: "High",
      count: highSeverityCount,
      colorClass: SEVERITY_CLASSES.High,
    },
    {
      label: "Medium",
      count: mediumSeverityCount,
      colorClass: SEVERITY_CLASSES.Medium,
    },
    {
      label: "Low",
      count: lowSeverityCount,
      colorClass: SEVERITY_CLASSES.Low,
    },
  ];

  const maxLocationCount = Math.max(
    ...locations.map((item) => Number(item.high_severity_count) || 0),
    1
  );

  return (
    <section
      id="priority"
      data-dashboard-section
      className="priority-overview-section"
    >
      <div className="priority-overview-heading">
        <div className="priority-overview-heading-content">
          <div className="priority-overview-heading-icon">
            <ShieldAlert size={24} />
          </div>

          <div className="priority-overview-heading-text">
            <h2 className="priority-overview-title">
              Priority Overview
            </h2>

            <p className="priority-overview-description">
              Review historical maintenance records ranked using the
              project's demonstration priority rules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="priority-overview-refresh-button"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "priority-overview-refresh-spinning" : ""
            }
          />
          <span>Refresh</span>
        </button>
      </div>

      {loading && (
        <div className="priority-overview-message">
          Loading priority overview...
        </div>
      )}

      {error && (
        <div className="priority-overview-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            onClick={loadOverview}
            className="priority-overview-retry-button"
          >
            Try again
          </button>
        </div>
      )}

      {data && !loading && !error && (
        <>
          <div className="priority-overview-stat-grid">
            <OverviewCard
              title="Critical priority"
              value={criticalCount}
              description="Historical records ranked Critical"
              icon={ShieldAlert}
            />

            <OverviewCard
              title="High priority"
              value={highCount}
              description="Historical records ranked High"
              icon={AlertTriangle}
            />

            <OverviewCard
              title="Medium priority"
              value={mediumCount}
              description="Historical records ranked Medium"
              icon={ClipboardList}
            />

            <OverviewCard
              title="Low priority"
              value={lowCount}
              description="Historical records ranked Low"
              icon={MapPin}
            />
          </div>

          <div className="priority-overview-chart-grid">
            <section className="priority-overview-panel">
              <div className="priority-overview-panel-heading">
                <h3 className="priority-overview-panel-title">
                  Historical Severity
                </h3>

                <p className="priority-overview-panel-description">
                  Number of records by recorded severity.
                </p>
              </div>

              <div className="priority-overview-bars">
                {severityItems.map((item) => {
                  const percentage = totalSeverityCount
                    ? (item.count / totalSeverityCount) * 100
                    : 0;

                  return (
                    <CountBar
                      key={item.label}
                      label={item.label}
                      count={item.count}
                      percentage={percentage}
                      colorClass={item.colorClass}
                    />
                  );
                })}
              </div>
            </section>

            <section className="priority-overview-panel">
              <div className="priority-overview-panel-heading">
                <h3 className="priority-overview-panel-title">
                  High-Severity Records by Location
                </h3>

                <p className="priority-overview-panel-description">
                  Locations ordered by historical High-severity counts.
                </p>
              </div>

              <div className="priority-overview-location-list">
                {locations.map((item) => {
                  const count =
                    Number(item.high_severity_count) || 0;
                  const percentage = (count / maxLocationCount) * 100;

                  return (
                    <div
                      key={item.location}
                      className="priority-overview-location-item"
                    >
                      <div className="priority-overview-location-heading">
                        <span className="priority-overview-location-name">
                          {item.location}
                        </span>

                        <span className="priority-overview-location-count">
                          {count.toLocaleString()}
                        </span>
                      </div>

                      <div
                        className="priority-overview-location-track"
                        role="progressbar"
                        aria-label={`${item.location} high-severity records`}
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="priority-overview-location-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {locations.length === 0 && (
                  <p className="priority-overview-empty-message">
                    No High-severity records found.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="priority-overview-table-panel">
            <div className="priority-overview-table-heading">
              <h3 className="priority-overview-panel-title">
                Highest-Priority Historical Records
              </h3>

              <p className="priority-overview-panel-description">
                Up to 10 records ranked by the configured priority score.
              </p>
            </div>

            <div className="priority-overview-table-scroll">
              <table className="priority-overview-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Location</th>
                    <th>Facility</th>
                    <th>Issue</th>
                    <th>Severity</th>
                    <th>Priority</th>
                    <th>Score</th>
                  </tr>
                </thead>

                <tbody>
                  {topIssues.map((item) => (
                    <tr key={item.log_id}>
                      <td className="priority-overview-table-id">
                        {item.log_id}
                      </td>

                      <td>{item.location}</td>
                      <td>{item.facility_type}</td>
                      <td>{item.issue_type}</td>
                      <td>{item.severity}</td>

                      <td>
                        <PriorityBadge priority={item.priority} />
                      </td>

                      <td className="priority-overview-table-score">
                        {item.priority_score}
                      </td>
                    </tr>
                  ))}

                  {topIssues.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="priority-overview-table-empty"
                      >
                        No historical records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="priority-overview-disclaimer">
            <strong>Interpretation:</strong>{" "}
            These rankings use synthetic historical records and the
            project's demonstration severity and location weights.
            They are not verified live alerts or evidence that a facility
            currently needs repair.
          </div>
        </>
      )}
    </section>
  );
}
