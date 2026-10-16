
import { Activity } from "lucide-react";

const OPTIONS = {
  location: [
    "Engineering Block",
    "Main Cafeteria",
    "Central Library",
    "Science Lab",
    "Hostel A",
    "Main Corridor",
  ],
  facility_type: ["Washroom", "Water-Cooler", "Common Area", "Classroom"],
  day_of_week: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  time_of_day: ["Morning", "Afternoon", "Evening"],
  footfall: ["Low", "Medium", "High"],
};

const LABELS = {
  location: "Campus location",
  facility_type: "Facility type",
  day_of_week: "Day of week",
  time_of_day: "Time of day",
  footfall: "Expected footfall",
};

export const INITIAL_FORM = {
  location: "Main Cafeteria",
  facility_type: "Common Area",
  day_of_week: "Monday",
  time_of_day: "Afternoon",
  footfall: "High",
};

export default function PredictionForm({
  form,
  onChange,
  onSubmit,
  loading,
}) {
  return (
    <section className="prediction-form-section">
      <div className="prediction-form-heading">
        <p className="prediction-form-eyebrow">
          Machine learning
        </p>

        <h3 className="prediction-form-title">
          Predict the next facility risk
        </h3>

        <p className="prediction-form-description">
          Configure campus conditions to estimate the likely issue and severity.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="prediction-form-grid">
          {Object.entries(OPTIONS).map(([name, values]) => (
            <label key={name} className="prediction-form-field">
              <span className="prediction-form-label">
                {LABELS[name]}
              </span>

              <select
                name={name}
                value={form[name]}
                onChange={onChange}
                className="prediction-form-select"
              >
                {values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="prediction-form-footer">
          <button
            type="submit"
            disabled={loading}
            className="prediction-form-submit"
          >
            <Activity size={18} />
            <span>
              {loading ? "Analyzing conditions..." : "Predict Next Risk"}
            </span>
          </button>

          <p className="prediction-form-note">
            Predictions use your trained Random Forest models.
          </p>
        </div>
      </form>
    </section>
  );
}
