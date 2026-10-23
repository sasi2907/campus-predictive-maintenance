import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LoaderCircle,
  Search,
  X,
  Eye,
} from "lucide-react";

import { API_BASE_URL, apiFetch } from "../services/api";
import { getMaintenanceLogs } from "../services/maintenanceService";
import MaintenanceRecordDetails from "./MaintenanceRecordDetails";

const SEVERITY_CLASSES = {
  High: "maintenance-severity-high",
  Medium: "maintenance-severity-medium",
  Low: "maintenance-severity-low",
};

const STATUS_CLASSES = {
  Open: "maintenance-status-open",
  "In Progress": "maintenance-status-progress",
  Resolved: "maintenance-status-resolved",
};

const EMPTY_FILTERS = {
  search: "",
  location: "",
  facilityType: "",
  issueType: "",
  severity: "",
};

export default function MaintenanceLogs({ onWorkflowSaved }) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [workflowStatuses, setWorkflowStatuses] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusRefreshKey, setStatusRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const response = await getMaintenanceLogs({
          ...filters,
          page,
          limit: 10,
        });

        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load maintenance logs.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  useEffect(() => {
    const records = data?.records;

    if (!records?.length) {
      setWorkflowStatuses({});
      return;
    }

    let cancelled = false;

    async function loadWorkflowStatuses() {
      setStatusLoading(true);

      try {
        const results = await Promise.all(
          records.map(async (record) => {
            try {
              const response = await apiFetch(
                `${API_BASE_URL}/maintenance-actions/${encodeURIComponent(
                  record.Log_ID
                )}`
              );

              if (!response.ok) {
                throw new Error("Unable to load workflow status.");
              }

              const action = await response.json();

              return [
                String(record.Log_ID),
                action.status || "Open",
              ];
            } catch {
              return [String(record.Log_ID), null];
            }
          })
        );

        if (!cancelled) {
          setWorkflowStatuses((previous) => ({
            ...previous,
            ...Object.fromEntries(results),
          }));
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    }

    loadWorkflowStatuses();

    return () => {
      cancelled = true;
    };
  }, [data, statusRefreshKey]);

  useEffect(() => {
    if (selectedLogId === null) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedLogId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLogId]);

  const pagination = data?.pagination;
  const filterOptions = data?.filters;

  function updateFilter(name, value) {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPage(1);
  }

  function handleSearch(event) {
    event.preventDefault();
    updateFilter("search", searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
  }

  function changePage(nextPage) {
    if (!pagination) return;

    if (nextPage >= 1 && nextPage <= pagination.total_pages) {
      setPage(nextPage);
    }
  }

  return (
    <>
      <section
        id="logs"
        data-dashboard-section
        className="maintenance-logs-section"
      >
        <div className="maintenance-logs-heading">
          <div className="maintenance-logs-heading-content">
            <div className="maintenance-logs-eyebrow">
              <ClipboardList size={20} />
              <span>Historical records</span>
            </div>

            <h2 className="maintenance-logs-title">
              Maintenance Logs
            </h2>

            <p className="maintenance-logs-description">
              Search and filter the generated campus maintenance dataset.
              Select a record to inspect its details and update its workflow.
            </p>
          </div>

          <div className="maintenance-record-count">
            <p className="maintenance-record-count-label">
              Matching records
            </p>

            <p className="maintenance-record-count-value">
              {pagination?.total_records ?? "—"}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="maintenance-search-form"
        >
          <div className="maintenance-search-field">
            <Search
              size={18}
              className="maintenance-search-icon"
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search ID, location, issue, facility..."
              aria-label="Search maintenance records"
              className="maintenance-search-input"
            />
          </div>

          <button
            type="submit"
            className="maintenance-search-button"
          >
            <Search size={16} />
            Search
          </button>
        </form>

        <div className="maintenance-filter-grid">
          <FilterSelect
            label="Location"
            value={filters.location}
            options={filterOptions?.locations}
            onChange={(value) => updateFilter("location", value)}
          />

          <FilterSelect
            label="Facility type"
            value={filters.facilityType}
            options={filterOptions?.facility_types}
            onChange={(value) => updateFilter("facilityType", value)}
          />

          <FilterSelect
            label="Issue type"
            value={filters.issueType}
            options={filterOptions?.issue_types}
            onChange={(value) => updateFilter("issueType", value)}
          />

          <FilterSelect
            label="Severity"
            value={filters.severity}
            options={filterOptions?.severities}
            onChange={(value) => updateFilter("severity", value)}
          />
        </div>

        <div className="maintenance-clear-filters-row">
          <button
            type="button"
            onClick={clearFilters}
            className="maintenance-clear-filters-button"
          >
            <X size={15} />
            Clear filters
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="maintenance-logs-error"
          >
            <AlertCircle
              size={19}
              className="maintenance-logs-error-icon"
            />

            <div>
              <p className="maintenance-logs-error-title">
                Could not load maintenance records
              </p>

              <p className="maintenance-logs-error-description">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="maintenance-table-container">
          <div className="maintenance-table-scroll">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Location</th>
                  <th>Facility</th>
                  <th>Issue type</th>
                  <th>Day</th>
                  <th>Footfall</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="maintenance-table-message-cell"
                    >
                      <LoaderCircle
                        size={22}
                        className="maintenance-loading-icon"
                      />

                      <p className="maintenance-table-message">
                        Loading maintenance records...
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  data?.records?.map((record) => {
                    const recordId = String(record.Log_ID);
                    const status = workflowStatuses[recordId];

                    const displayStatus =
                      status === undefined
                        ? statusLoading
                          ? "Loading..."
                          : "Open"
                        : status === null
                          ? "Unavailable"
                          : status;

                    const severityClass =
                      SEVERITY_CLASSES[record.Severity_Level] ||
                      "maintenance-badge-neutral";

                    const statusClass =
                      STATUS_CLASSES[displayStatus] ||
                      "maintenance-badge-neutral";

                    return (
                      <tr key={record.Log_ID}>
                        <td className="maintenance-cell-id">
                          {record.Log_ID}
                        </td>

                        <td>{record.Location}</td>
                        <td>{record.Facility_Type}</td>

                        <td className="maintenance-cell-issue">
                          {record.Issue_Type}
                        </td>

                        <td>{record.Day_of_Week}</td>
                        <td>{record.Footfall}</td>

                        <td>
                          <span
                            className={`maintenance-badge ${severityClass}`}
                          >
                            {record.Severity_Level}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`maintenance-badge ${statusClass}`}
                          >
                            {displayStatus}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedLogId(record.Log_ID)}
                            className="maintenance-view-button"
                            aria-label={`View details for record ${record.Log_ID}`}
                          >
                            <Eye size={15} />
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                {!loading &&
                  !error &&
                  data?.records?.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="maintenance-table-message-cell"
                      >
                        <p className="maintenance-table-message">
                          No maintenance records match your filters.
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="maintenance-pagination">
          <p className="maintenance-pagination-summary">
            {pagination && pagination.total_records > 0
              ? `Page ${pagination.page} of ${pagination.total_pages} · ${pagination.total_records} matching records`
              : "No matching records"}
          </p>

          <div className="maintenance-pagination-actions">
            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={loading || page <= 1}
              className="maintenance-pagination-button"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              type="button"
              onClick={() => changePage(page + 1)}
              disabled={
                loading ||
                !pagination ||
                page >= pagination.total_pages
              }
              className="maintenance-pagination-button"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {selectedLogId !== null && (
        <MaintenanceRecordDetails
          logId={selectedLogId}
          onWorkflowSaved={(action) => {
            setWorkflowStatuses((previous) => ({
              ...previous,
              [String(selectedLogId)]: action.status || "Open",
            }));

            onWorkflowSaved?.(action);
          }}
          onClose={() => {
            setSelectedLogId(null);
            setStatusRefreshKey((previous) => previous + 1);
          }}
        />
      )}
    </>
  );
}

function FilterSelect({ label, value, options = [], onChange }) {
  return (
    <label className="maintenance-filter">
      <span className="maintenance-filter-label">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="maintenance-filter-select"
      >
        <option value="">All {label.toLowerCase()}s</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
