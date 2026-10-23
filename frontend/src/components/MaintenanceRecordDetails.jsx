import { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Building2,
  CalendarDays,
  Clock,
  Users,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  RefreshCw,
  Save,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL, apiFetch } from "../services/api";

const PRIORITY_CLASSES = {
  Critical: "record-priority-critical",
  High: "record-priority-high",
  Medium: "record-priority-medium",
  Low: "record-priority-low",
};

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="record-detail-item">
      <div className="record-detail-label">
        {Icon && <Icon size={15} />}
        {label}
      </div>

      <p className="record-detail-value">
        {value ?? "Not available"}
      </p>
    </div>
  );
}

function formatTimestamp(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default function MaintenanceRecordDetails({
  logId,
  onClose,
  onWorkflowSaved,
}) {
  const [record, setRecord] = useState(null);
  const [workflow, setWorkflow] = useState(null);

  const [status, setStatus] = useState("Open");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (logId === null || logId === undefined) return;

    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");
      setSaveMessage("");
      setRecord(null);
      setWorkflow(null);

      try {
        const [recordResponse, workflowResponse] = await Promise.all([
          apiFetch(
            `${API_BASE_URL}/maintenance-logs/${encodeURIComponent(logId)}`,
            { signal: controller.signal }
          ),
          apiFetch(
            `${API_BASE_URL}/maintenance-actions/${encodeURIComponent(logId)}`,
            { signal: controller.signal }
          ),
        ]);

        const recordData = await recordResponse.json().catch(() => null);
        const workflowData = await workflowResponse.json().catch(() => null);

        if (!recordResponse.ok) {
          throw new Error(
            recordData?.error || "Unable to load the maintenance record."
          );
        }

        if (!workflowResponse.ok) {
          throw new Error(
            workflowData?.error || "Unable to load workflow information."
          );
        }

        if (controller.signal.aborted) return;

        setRecord(recordData.record);
        setWorkflow(workflowData);

        setStatus(workflowData.status || "Open");
        setAssignedTeam(workflowData.assigned_team || "");
        setResolutionNotes(workflowData.resolution_notes || "");
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(
            err.message || "Could not connect to the maintenance API."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [logId]);

  async function handleSaveWorkflow(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/maintenance-actions/${encodeURIComponent(logId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            assigned_team: assignedTeam,
            resolution_notes: resolutionNotes,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save workflow changes."
        );
      }

      setWorkflow(data.action);
      setStatus(data.action.status);
      setAssignedTeam(data.action.assigned_team || "");
      setResolutionNotes(data.action.resolution_notes || "");
      setSaveMessage("Workflow changes saved successfully.");

      onWorkflowSaved?.(data.action);
    } catch (err) {
      setError(err.message || "Could not save workflow changes.");
    } finally {
      setSaving(false);
    }
  }

  if (logId === null || logId === undefined) return null;

  const priorityClass =
    PRIORITY_CLASSES[record?.priority] || "record-priority-neutral";

  return (
    <div
      className="record-details-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-details-title"
        className="record-details-drawer"
      >
        <header className="record-details-header">
          <div className="record-details-header-content">
            <div className="record-details-eyebrow">
              <ClipboardList size={17} />
              <span>Maintenance record</span>
            </div>

            <h2
              id="record-details-title"
              className="record-details-title"
            >
              Record #{String(logId)}
            </h2>

            <p className="record-details-subtitle">
              Record details and maintenance workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close record details"
            className="record-details-close-button"
          >
            <X size={21} />
          </button>
        </header>

        <div className="record-details-body">
          {loading && (
            <div className="record-details-loading">
              <RefreshCw
                size={18}
                className="record-details-spinner"
              />
              <span>Loading record details...</span>
            </div>
          )}

          {error && (
            <div role="alert" className="record-details-error">
              {error}
            </div>
          )}

          {record && !loading && (
            <>
              <div className="record-detail-grid">
                <DetailItem
                  label="Location"
                  value={record.Location}
                  icon={MapPin}
                />

                <DetailItem
                  label="Facility"
                  value={record.Facility_Type}
                  icon={Building2}
                />

                <DetailItem
                  label="Day"
                  value={record.Day_of_Week}
                  icon={CalendarDays}
                />

                <DetailItem
                  label="Time of day"
                  value={record.Time_of_Day}
                  icon={Clock}
                />

                <DetailItem
                  label="Footfall"
                  value={record.Footfall}
                  icon={Users}
                />

                <DetailItem
                  label="Issue type"
                  value={record.Issue_Type}
                  icon={AlertTriangle}
                />
              </div>

              <section className="record-panel">
                <h3 className="record-panel-title">
                  Priority assessment
                </h3>

                <div className="record-priority-row">
                  <span className="record-severity-text">
                    Recorded severity:{" "}
                    <strong>{record.Severity_Level}</strong>
                  </span>

                  <span
                    className={`record-priority-badge ${priorityClass}`}
                  >
                    {record.priority} priority
                  </span>
                </div>

                <div className="record-priority-score">
                  <p className="record-priority-score-label">
                    Demonstration priority score
                  </p>

                  <p className="record-priority-score-value">
                    {record.priority_score}
                  </p>
                </div>

                <div className="record-recommended-action">
                  <ShieldCheck
                    size={19}
                    className="record-recommended-icon"
                  />

                  <div>
                    <p className="record-recommended-title">
                      Recommended action
                    </p>

                    <p className="record-recommended-description">
                      {record.recommended_action}
                    </p>
                  </div>
                </div>
              </section>

              <section className="record-panel">
                <div className="record-workflow-heading">
                  <CheckCircle2
                    size={20}
                    className="record-workflow-icon"
                  />

                  <h3 className="record-panel-title">
                    Maintenance Workflow
                  </h3>
                </div>

                <p className="record-workflow-description">
                  Update the progress and save it to the local JSON file.
                </p>

                <form
                  onSubmit={handleSaveWorkflow}
                  className="record-workflow-form"
                >
                  <label className="record-form-field">
                    <span className="record-form-label">Status</span>

                    <select
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value);
                        setSaveMessage("");
                      }}
                      className="record-form-control"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="record-form-field">
                    <span className="record-form-label">
                      Assigned maintenance team
                    </span>

                    <input
                      type="text"
                      value={assignedTeam}
                      maxLength={150}
                      onChange={(event) => {
                        setAssignedTeam(event.target.value);
                        setSaveMessage("");
                      }}
                      placeholder="e.g. Electrical Maintenance Team"
                      className="record-form-control"
                    />
                  </label>

                  <label className="record-form-field">
                    <span className="record-form-label">
                      Resolution notes
                    </span>

                    <textarea
                      value={resolutionNotes}
                      maxLength={5000}
                      rows={4}
                      onChange={(event) => {
                        setResolutionNotes(event.target.value);
                        setSaveMessage("");
                      }}
                      placeholder="Describe the inspection, work performed, or resolution..."
                      className="record-form-control record-form-textarea"
                    />

                    <span className="record-character-count">
                      {resolutionNotes.length}/5000
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="record-save-button"
                  >
                    {saving ? (
                      <RefreshCw
                        size={17}
                        className="record-details-spinner"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    {saving ? "Saving..." : "Save workflow"}
                  </button>
                </form>

                {saveMessage && (
                  <p role="status" className="record-save-success">
                    {saveMessage}
                  </p>
                )}

                {workflow && (
                  <div className="record-workflow-timestamps">
                    <p>
                      Last updated: {formatTimestamp(workflow.updated_at)}
                    </p>

                    <p>
                      Resolved at: {formatTimestamp(workflow.resolved_at)}
                    </p>
                  </div>
                )}
              </section>

              <section className="record-all-fields">
                <h3 className="record-panel-title">
                  All record fields
                </h3>

                <div className="record-fields-list">
                  {Object.entries(record)
                    .filter(
                      ([key]) =>
                        ![
                          "priority",
                          "priority_score",
                          "recommended_action",
                        ].includes(key)
                    )
                    .map(([key, value]) => (
                      <div className="record-field-row" key={key}>
                        <span className="record-field-name">
                          {key.replaceAll("_", " ")}
                        </span>

                        <span className="record-field-value">
                          {value === null || value === undefined
                            ? "Not available"
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </section>

              <p className="record-details-disclaimer">
                This is a historical synthetic record. Its priority is
                calculated using demonstration rules and is not a verified
                live safety assessment.
              </p>
            </>
          )}
        </div>

        <footer className="record-details-footer">
          <button
            type="button"
            onClick={onClose}
            className="record-details-footer-button"
          >
            Close details
          </button>
        </footer>
      </section>
    </div>
  );
}
