
import { useEffect, useState } from "react";
import {
  Building2,
  Layers3,
  AlertTriangle,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { API_BASE_URL, apiFetch } from "../services/api";

const API_URL = `${API_BASE_URL}/facilities-summary`;

function SummaryCard({ title, icon: Icon, items, color }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="facilities-summary-card">
      <div className="facilities-summary-heading">
        <div className={`facilities-summary-icon ${color}`}>
          <Icon size={22} />
        </div>

        <div className="facilities-summary-heading-content">
          <h3 className="facilities-summary-title">{title}</h3>
          <p className="facilities-summary-meta">
            {items.length} categories · {total.toLocaleString()} records
          </p>
        </div>
      </div>

      <div className="facilities-summary-list">
        {items.map((item) => {
          const percentage = total
            ? (item.count / total) * 100
            : 0;

          return (
            <div className="facilities-summary-item" key={item.name}>
              <div className="facilities-summary-item-heading">
                <span className="facilities-summary-item-name">
                  {item.name}
                </span>

                <span className="facilities-summary-item-count">
                  {item.count.toLocaleString()}
                </span>
              </div>

              <div
                className="facilities-progress-track"
                role="progressbar"
                aria-label={`${item.name} records`}
                aria-valuenow={Math.round(percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="facilities-progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="facilities-empty-message">
            No records available.
          </p>
        )}
      </div>
    </section>
  );
}

export default function Facilities() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        setError("");

        const response = await apiFetch(API_URL);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load facility summaries."
          );
        }

        if (!cancelled) {
          setSummary(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Could not connect to the Flask API."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="facilities"
      data-dashboard-section
      className="facilities-section"
    >
      <div className="facilities-page-heading">
        <div className="facilities-page-icon">
          <Building2 size={24} />
        </div>

        <div className="facilities-page-heading-content">
          <h2 className="facilities-page-title">
            Campus Facilities
          </h2>

          <p className="facilities-page-description">
            Explore campus locations, facility types, and historical
            maintenance patterns.
          </p>
        </div>
      </div>

      {loading && (
        <div className="facilities-message facilities-loading">
          Loading facility data...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="facilities-message facilities-error"
        >
          {error} Check your connection to the deployed Flask API.
        </div>
      )}

      {summary && !loading && !error && (
        <div className="facilities-summary-grid">
          <SummaryCard
            title="Campus Locations"
            icon={MapPin}
            items={summary.locations || []}
            color="facilities-icon-cyan"
          />

          <SummaryCard
            title="Facility Types"
            icon={Layers3}
            items={summary.facility_types || []}
            color="facilities-icon-indigo"
          />

          <SummaryCard
            title="Issue Distribution"
            icon={AlertTriangle}
            items={summary.issue_types || []}
            color="facilities-icon-amber"
          />

          <SummaryCard
            title="Severity Distribution"
            icon={ShieldCheck}
            items={summary.severity_levels || []}
            color="facilities-icon-emerald"
          />
        </div>
      )}

      <p className="facilities-disclaimer">
        Counts represent historical records in the synthetic demonstration
        dataset. They do not represent verified live campus conditions.
      </p>
    </section>
  );
}
