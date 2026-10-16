
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartNoAxesCombined,
  AlertTriangle,
  Building2,
  CalendarDays,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/analytics";

const CHARTS = [
  {
    key: "issue_distribution",
    title: "Issue Distribution",
    description: "Number of records for each issue type.",
    icon: AlertTriangle,
    color: "#0891b2",
  },
  {
    key: "severity_distribution",
    title: "Severity Distribution",
    description: "Historical records grouped by severity.",
    icon: ChartNoAxesCombined,
    color: "#6366f1",
  },
  {
    key: "location_comparison",
    title: "Location Comparison",
    description: "Maintenance records across campus locations.",
    icon: Building2,
    color: "#0d9488",
  },
  {
    key: "weekly_pattern",
    title: "Weekly Pattern",
    description: "Maintenance records by day of the week.",
    icon: CalendarDays,
    color: "#d97706",
  },
];

function AnalyticsCard({ chart, data }) {
  const Icon = chart.icon;

  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-heading">
        <div className="analytics-chart-icon">
          <Icon size={21} />
        </div>

        <div className="analytics-chart-heading-content">
          <h3 className="analytics-chart-title">{chart.title}</h3>
          <p className="analytics-chart-description">
            {chart.description}
          </p>
        </div>
      </div>

      <div className="analytics-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={data.length > 5 ? -25 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 65 : 35}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip
              formatter={(value) => [
                Number(value).toLocaleString(),
                "Records",
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
              wrapperClassName="analytics-chart-tooltip"
            />

            <Bar
              dataKey="count"
              name="Records"
              fill={chart.color}
              radius={[5, 5, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to load analytics data.");
        }

        const data = await response.json();

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Could not connect to the analytics API."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="analytics"
      data-dashboard-section
      className="analytics-section"
    >
      <div className="analytics-page-heading">
        <div className="analytics-page-icon">
          <ChartNoAxesCombined size={24} />
        </div>

        <div className="analytics-page-heading-content">
          <h2 className="analytics-page-title">
            Maintenance Analytics
          </h2>

          <p className="analytics-page-description">
            Explore historical issue patterns, severity levels, campus
            locations, and weekly trends.
          </p>
        </div>
      </div>

      {loading && (
        <div className="analytics-message analytics-loading">
          Loading analytics...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="analytics-message analytics-error"
        >
          {error} Check that Flask is running and the /api/analytics
          endpoint returns JSON.
        </div>
      )}

      {analytics && !loading && !error && (
        <div className="analytics-chart-grid">
          {CHARTS.map((chart) => (
            <AnalyticsCard
              key={chart.key}
              chart={chart}
              data={analytics[chart.key] || []}
            />
          ))}
        </div>
      )}

      <p className="analytics-disclaimer">
        Charts summarize the historical synthetic demonstration dataset.
        They do not represent live campus conditions or establish future
        risk by themselves.
      </p>
    </section>
  );
}
