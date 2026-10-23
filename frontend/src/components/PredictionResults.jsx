const PRIORITY_CLASSES = {
  Critical: "prediction-priority-critical",
  High: "prediction-priority-high",
  Medium: "prediction-priority-medium",
  Low: "prediction-priority-low",
};

function ConfidenceBar({ label, value }) {
  const percentage = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="prediction-confidence-item">
      <div className="prediction-confidence-heading">
        <span className="prediction-confidence-label">{label}</span>
        <span className="prediction-confidence-value">{percentage}%</span>
      </div>

      <div
        className="prediction-confidence-track"
        role="progressbar"
        aria-label={`${label} probability`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="prediction-confidence-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ProbabilityGroup({ title, probabilities }) {
  return (
    <div className="prediction-probability-group">
      <h5 className="prediction-probability-title">{title}</h5>

      <div className="prediction-confidence-list">
        {Object.entries(probabilities || {}).map(([label, value]) => (
          <ConfidenceBar key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

export default function PredictionResults({ result }) {
  if (!result) return null;

  const priorityClass =
    PRIORITY_CLASSES[result.priority_rank] || "prediction-priority-neutral";

  return (
    <section
      aria-live="polite"
      className="prediction-results-section"
    >
      <div className="prediction-results-heading">
        <div className="prediction-results-heading-content">
          <p className="prediction-results-eyebrow">
            Analysis complete
          </p>

          <h3 className="prediction-results-title">
            Prediction results
          </h3>

          <p className="prediction-results-description">
            Results returned by the prediction API
          </p>
        </div>

        <span className={`prediction-priority-badge ${priorityClass}`}>
          {result.priority_rank} priority
        </span>
      </div>

      <div className="prediction-summary-grid">
        <article className="prediction-summary-card">
          <p className="prediction-summary-label">Predicted issue</p>

          <p className="prediction-summary-value">
            {result.predicted_issue}
          </p>

          <p className="prediction-summary-meta">
            Confidence: {result.confidence?.issue ?? "N/A"}%
          </p>
        </article>

        <article className="prediction-summary-card">
          <p className="prediction-summary-label">Predicted severity</p>

          <p className="prediction-summary-value">
            {result.predicted_severity}
          </p>

          <p className="prediction-summary-meta">
            Confidence: {result.confidence?.severity ?? "N/A"}%
          </p>
        </article>

        <article className="prediction-summary-card">
          <p className="prediction-summary-label">Priority score</p>

          <p className="prediction-score-value">
            {result.priority_score}
            <span className="prediction-score-maximum"> / 9</span>
          </p>

          <p className="prediction-summary-meta">
            Rule-based priority calculation
          </p>
        </article>
      </div>

      <div className="prediction-recommended-action">
        <p className="prediction-recommended-title">
          Recommended maintenance action
        </p>

        <p className="prediction-recommended-description">
          {result.recommended_action}
        </p>
      </div>

      <details className="prediction-probability-details">
        <summary className="prediction-probability-summary">
          View model probability scores
        </summary>

        <div className="prediction-probability-grid">
          <ProbabilityGroup
            title="Issue probabilities"
            probabilities={result.probabilities?.issue}
          />

          <ProbabilityGroup
            title="Severity probabilities"
            probabilities={result.probabilities?.severity}
          />
        </div>
      </details>

      <p className="prediction-results-disclaimer">
        This prototype uses synthetic data. Predictions and confidence scores
        require real-world validation before being used for actual maintenance
        decisions.
      </p>
    </section>
  );
}
