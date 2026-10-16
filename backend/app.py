from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

import json
from datetime import datetime, timezone
from threading import Lock

# --------------------------------------------------
# Paths and application setup
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
DATA_PATH = BASE_DIR / "data" / "campus_maintenance_logs.csv"

app = Flask(__name__)
CORS(app)


# --------------------------------------------------
# Load trained models and saved encoders
# --------------------------------------------------

issue_model = joblib.load(MODEL_DIR / "issue_model.pkl")
severity_model = joblib.load(MODEL_DIR / "severity_model.pkl")
feature_encoders = joblib.load(MODEL_DIR / "encoders.pkl")
feature_columns = joblib.load(MODEL_DIR / "feature_columns.pkl")


# --------------------------------------------------
# Load maintenance records from CSV
# --------------------------------------------------

maintenance_df = pd.read_csv(DATA_PATH)

SEVERITY_WEIGHTS = {
    "High": 3,
    "Medium": 2,
    "Low": 1,
}

# Demo assumption:
# Main Cafeteria = 3, Main Corridor = 1,
# all other locations = 2.
LOCATION_WEIGHTS = {
    "Main Cafeteria": 3,
    "Main Corridor": 1,
}


# --------------------------------------------------
# JSON storage for maintenance workflow actions
# --------------------------------------------------

ACTIONS_PATH = BASE_DIR / "maintenance_actions.json"
ACTIONS_LOCK = Lock()

ALLOWED_STATUSES = {"Open", "In Progress", "Resolved"}


def load_maintenance_actions():
    if not ACTIONS_PATH.exists():
        return {"actions": []}

    with ACTIONS_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict) or not isinstance(data.get("actions"), list):
        raise ValueError("Invalid maintenance_actions.json structure.")

    return data


def save_maintenance_actions(data):
    temporary_path = ACTIONS_PATH.with_suffix(".tmp")

    with temporary_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

    temporary_path.replace(ACTIONS_PATH)


# --------------------------------------------------
# Prediction helpers
# --------------------------------------------------

def get_priority(score):
    if score == 9:
        return "Critical"
    if score >= 6:
        return "High"
    if score >= 3:
        return "Medium"
    return "Low"


def get_recommended_action(priority):
    actions = {
        "Critical": "Inspect immediately and arrange urgent maintenance.",
        "High": "Assign maintenance staff as soon as possible.",
        "Medium": "Schedule an inspection and resolve the issue soon.",
        "Low": "Add to routine monitoring and maintenance.",
    }
    return actions[priority]


# --------------------------------------------------
# Health endpoint
# GET /api/health
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "Campus maintenance prediction API is running.",
    })


# --------------------------------------------------
# Dashboard statistics endpoint
# GET /api/dashboard-stats
# --------------------------------------------------

@app.route("/api/dashboard-stats", methods=["GET"])
def get_dashboard_stats():
    return jsonify({
        "total_logs": int(len(maintenance_df)),
        "high_severity_issues": int(
            maintenance_df["Severity_Level"]
            .astype(str)
            .str.casefold()
            .eq("high")
            .sum()
        ),
        "total_locations": int(
            maintenance_df["Location"].nunique()
        ),
        "total_issue_types": int(
            maintenance_df["Issue_Type"].nunique()
        ),
    })


# --------------------------------------------------
# Facilities summary endpoint
# GET /api/facilities-summary
# --------------------------------------------------

@app.route("/api/facilities-summary", methods=["GET"])
def get_facilities_summary():
    def get_counts(column):
        counts = maintenance_df[column].value_counts()

        return [
            {
                "name": str(name),
                "count": int(count),
            }
            for name, count in counts.items()
        ]

    return jsonify({
        "locations": get_counts("Location"),
        "facility_types": get_counts("Facility_Type"),
        "issue_types": get_counts("Issue_Type"),
        "severity_levels": get_counts("Severity_Level"),
    })


# --------------------------------------------------
# Analytics endpoint
# GET /api/analytics
# --------------------------------------------------

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    issue_counts = maintenance_df["Issue_Type"].value_counts()
    severity_counts = maintenance_df["Severity_Level"].value_counts()
    location_counts = maintenance_df["Location"].value_counts()

    day_order = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]

    day_counts = (
        maintenance_df["Day_of_Week"]
        .value_counts()
        .reindex(day_order, fill_value=0)
    )

    def make_chart_data(counts):
        return [
            {
                "name": str(name),
                "count": int(count),
            }
            for name, count in counts.items()
        ]

    return jsonify({
        "issue_distribution": make_chart_data(issue_counts),
        "severity_distribution": make_chart_data(severity_counts),
        "location_comparison": make_chart_data(location_counts),
        "weekly_pattern": make_chart_data(day_counts),
    })


# --------------------------------------------------
# Priority overview endpoint
# GET /api/priority-overview
# --------------------------------------------------

@app.route("/api/priority-overview", methods=["GET"])
def get_priority_overview():
    df = maintenance_df.copy()

    # Count historical records by severity.
    severity_counts = (
        df["Severity_Level"]
        .value_counts()
        .to_dict()
    )

    # Apply the same demo location weights used by the predictor.
    df["Severity_Weight"] = (
        df["Severity_Level"]
        .map(SEVERITY_WEIGHTS)
        .fillna(1)
        .astype(int)
    )

    df["Location_Weight"] = (
        df["Location"]
        .map(LOCATION_WEIGHTS)
        .fillna(2)
        .astype(int)
    )

    df["Priority_Score"] = (
        df["Severity_Weight"] * df["Location_Weight"]
    )

    df["Priority"] = df["Priority_Score"].apply(get_priority)

    # Overall historical priority distribution.
    priority_order = ["Critical", "High", "Medium", "Low"]

    priority_counts = (
        df["Priority"]
        .value_counts()
        .reindex(priority_order, fill_value=0)
    )

    priority_distribution = [
        {
            "name": priority,
            "count": int(count),
        }
        for priority, count in priority_counts.items()
    ]

    # Locations with the most High-severity historical records.
    high_severity_by_location = (
        df[df["Severity_Level"] == "High"]
        .groupby("Location")
        .size()
        .sort_values(ascending=False)
    )

    location_ranking = [
        {
            "location": str(location),
            "high_severity_count": int(count),
        }
        for location, count in high_severity_by_location.items()
    ]

    # Highest-priority historical records.
    top_records = df.sort_values(
        ["Priority_Score", "Log_ID"],
        ascending=[False, True],
    ).head(10)

    top_issues = []

    for _, row in top_records.iterrows():
        top_issues.append({
            "log_id": str(row["Log_ID"]),
            "location": str(row["Location"]),
            "facility_type": str(row["Facility_Type"]),
            "issue_type": str(row["Issue_Type"]),
            "severity": str(row["Severity_Level"]),
            "priority_score": int(row["Priority_Score"]),
            "priority": str(row["Priority"]),
            "recommended_action": get_recommended_action(
                str(row["Priority"])
            ),
        })

    return jsonify({
        "historical_severity_counts": {
            severity: int(severity_counts.get(severity, 0))
            for severity in ["High", "Medium", "Low"]
        },
        "priority_distribution": priority_distribution,
        "high_severity_by_location": location_ranking,
        "top_priority_records": top_issues,
        "note": (
            "Priorities are calculated from historical synthetic records "
            "using demonstration severity and location weights. "
            "They are not verified live maintenance alerts."
        ),
    })

# --------------------------------------------------
# Prediction endpoint
# POST /api/predict
# --------------------------------------------------

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Send a valid JSON object."}), 400

    required_fields = [
        "location",
        "facility_type",
        "day_of_week",
        "time_of_day",
        "footfall",
    ]

    missing_fields = [
        field
        for field in required_fields
        if not isinstance(data.get(field), str) or not data[field].strip()
    ]

    if missing_fields:
        return jsonify({
            "error": "Missing or invalid required fields.",
            "fields": missing_fields,
        }), 400

    values = {
        "Location": data["location"].strip(),
        "Facility_Type": data["facility_type"].strip(),
        "Day_of_Week": data["day_of_week"].strip(),
        "Time_of_Day": data["time_of_day"].strip(),
        "Footfall": data["footfall"].strip(),
    }

    encoded_values = {}

    for column in feature_columns:
        encoder = feature_encoders[column]
        value = values[column]

        if value not in encoder.classes_:
            return jsonify({
                "error": f"Invalid value for {column}.",
                "allowed_values": encoder.classes_.tolist(),
            }), 400

        encoded_values[column] = int(
            encoder.transform([value])[0]
        )

    input_df = pd.DataFrame(
        [[encoded_values[column] for column in feature_columns]],
        columns=feature_columns,
    )

    issue_prediction = str(issue_model.predict(input_df)[0])
    severity_prediction = str(severity_model.predict(input_df)[0])

    issue_probabilities = issue_model.predict_proba(input_df)[0]
    severity_probabilities = severity_model.predict_proba(input_df)[0]

    issue_confidence = float(max(issue_probabilities))
    severity_confidence = float(max(severity_probabilities))

    severity_weight = SEVERITY_WEIGHTS[severity_prediction]
    location_weight = LOCATION_WEIGHTS.get(values["Location"], 2)

    priority_score = severity_weight * location_weight
    priority = get_priority(priority_score)

    return jsonify({
        "predicted_issue": issue_prediction,
        "predicted_severity": severity_prediction,
        "priority_score": priority_score,
        "priority_rank": priority,
        "recommended_action": get_recommended_action(priority),
        "confidence": {
            "issue": round(issue_confidence * 100, 2),
            "severity": round(severity_confidence * 100, 2),
        },
        "probabilities": {
            "issue": {
                str(label): round(float(probability) * 100, 2)
                for label, probability in zip(
                    issue_model.classes_, issue_probabilities
                )
            },
            "severity": {
                str(label): round(float(probability) * 100, 2)
                for label, probability in zip(
                    severity_model.classes_, severity_probabilities
                )
            },
        },
    })


# --------------------------------------------------
# Maintenance logs endpoint
# GET /api/maintenance-logs
# Optional parameters:
# search, location, facility_type, issue_type,
# severity, page, limit
# --------------------------------------------------

@app.route("/api/maintenance-logs", methods=["GET"])
def get_maintenance_logs():
    df = maintenance_df.copy()

    # Search across text columns.
    search = request.args.get("search", "").strip()

    if search:
        searchable_columns = [
            "Log_ID",
            "Location",
            "Facility_Type",
            "Day_of_Week",
            "Time_of_Day",
            "Footfall",
            "Issue_Type",
            "Severity_Level",
        ]

        mask = pd.Series(False, index=df.index)

        for column in searchable_columns:
            mask |= df[column].astype(str).str.contains(
                search,
                case=False,
                regex=False,
                na=False,
            )

        df = df[mask]

    # Apply exact-match filters.
    filters = {
        "location": "Location",
        "facility_type": "Facility_Type",
        "issue_type": "Issue_Type",
        "severity": "Severity_Level",
    }

    for parameter, column in filters.items():
        value = request.args.get(parameter, "").strip()

        if value:
            df = df[
                df[column].astype(str).str.casefold()
                == value.casefold()
            ]

    # Count matching records before pagination.
    total_filtered = len(df)

    # Validate pagination parameters.
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
    except ValueError:
        return jsonify({
            "error": "page and limit must be integers."
        }), 400

    if page < 1 or limit < 1 or limit > 100:
        return jsonify({
            "error": "page must be >= 1 and limit must be between 1 and 100."
        }), 400

    # Sort by Log_ID for consistent page ordering.
    df = df.sort_values("Log_ID")
    start = (page - 1) * limit
    page_df = df.iloc[start:start + limit]

    records = page_df.where(
        pd.notna(page_df), None
    ).to_dict(orient="records")

    return jsonify({
        "records": records,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_records": total_filtered,
            "total_pages": (
                total_filtered + limit - 1
            ) // limit,
        },
        "filters": {
            "locations": sorted(
                maintenance_df["Location"].dropna().unique().tolist()
            ),
            "facility_types": sorted(
                maintenance_df["Facility_Type"].dropna().unique().tolist()
            ),
            "issue_types": sorted(
                maintenance_df["Issue_Type"].dropna().unique().tolist()
            ),
            "severities": sorted(
                maintenance_df["Severity_Level"].dropna().unique().tolist()
            ),
        },
    })


# --------------------------------------------------
# Maintenance record details endpoint
# GET /api/maintenance-logs/<log_id>
# --------------------------------------------------

@app.route("/api/maintenance-logs/<log_id>", methods=["GET"])
def get_maintenance_log_details(log_id):
    matching_records = maintenance_df[
        maintenance_df["Log_ID"].astype(str) == str(log_id)
    ]

    if matching_records.empty:
        return jsonify({
            "error": f"No maintenance record found with ID {log_id}."
        }), 404

    row = matching_records.iloc[0]

    severity = str(row["Severity_Level"])
    location = str(row["Location"])

    severity_weight = SEVERITY_WEIGHTS.get(severity, 1)
    location_weight = LOCATION_WEIGHTS.get(location, 2)

    priority_score = severity_weight * location_weight
    priority = get_priority(priority_score)

    record = {
        str(column): (
            None if pd.isna(value) else value.item()
            if hasattr(value, "item") else value
        )
        for column, value in row.items()
    }

    record["priority_score"] = priority_score
    record["priority"] = priority
    record["recommended_action"] = get_recommended_action(priority)

    return jsonify({"record": record})


# --------------------------------------------------
# Maintenance workflow statistics endpoint
# GET /api/maintenance-workflow-stats
# --------------------------------------------------

@app.route("/api/maintenance-workflow-stats", methods=["GET"])
def get_maintenance_workflow_stats():
    try:
        with ACTIONS_LOCK:
            data = load_maintenance_actions()

        # Keep only actions for records that exist in the CSV.
        valid_log_ids = set(
            maintenance_df["Log_ID"].astype(str)
        )

        saved_actions = {
            str(action.get("log_id")): action
            for action in data["actions"]
            if str(action.get("log_id")) in valid_log_ids
        }

        total_records = len(valid_log_ids)

        status_counts = {
            "Open": 0,
            "In Progress": 0,
            "Resolved": 0,
        }

        for log_id in valid_log_ids:
            action = saved_actions.get(log_id)
            status = action.get("status", "Open") if action else "Open"

            if status not in status_counts:
                status = "Open"

            status_counts[status] += 1

        return jsonify({
            "total_records": total_records,
            "open": status_counts["Open"],
            "in_progress": status_counts["In Progress"],
            "resolved": status_counts["Resolved"],
        })

    except (OSError, json.JSONDecodeError, ValueError) as error:
        app.logger.error(
            "Could not calculate maintenance workflow statistics: %s",
            error,
        )
        return jsonify({
            "error": "Could not load maintenance workflow statistics."
        }), 500



# --------------------------------------------------
# Maintenance workflow endpoints
# --------------------------------------------------

@app.route("/api/maintenance-actions", methods=["GET"])
def get_maintenance_actions():
    try:
        with ACTIONS_LOCK:
            data = load_maintenance_actions()

        return jsonify(data)

    except (OSError, json.JSONDecodeError, ValueError) as error:
        app.logger.error("Could not read maintenance actions: %s", error)
        return jsonify({
            "error": "Could not read maintenance workflow data."
        }), 500


@app.route("/api/maintenance-actions/<log_id>", methods=["GET"])
def get_maintenance_action(log_id):
    # Only allow actions for records present in the CSV.
    exists = maintenance_df["Log_ID"].astype(str).eq(log_id).any()

    if not exists:
        return jsonify({"error": "Maintenance log not found."}), 404

    try:
        with ACTIONS_LOCK:
            data = load_maintenance_actions()

        action = next(
            (
                item for item in data["actions"]
                if str(item.get("log_id")) == log_id
            ),
            None,
        )

        if action is None:
            return jsonify({
                "log_id": log_id,
                "status": "Open",
                "assigned_team": "",
                "resolution_notes": "",
                "created_at": None,
                "updated_at": None,
                "resolved_at": None,
            })

        return jsonify(action)

    except (OSError, json.JSONDecodeError, ValueError) as error:
        app.logger.error("Could not read maintenance action: %s", error)
        return jsonify({
            "error": "Could not read maintenance workflow data."
        }), 500


@app.route("/api/maintenance-actions/<log_id>", methods=["PUT"])
def update_maintenance_action(log_id):
    exists = maintenance_df["Log_ID"].astype(str).eq(log_id).any()

    if not exists:
        return jsonify({"error": "Maintenance log not found."}), 404

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Send a valid JSON object."}), 400

    status = payload.get("status", "Open")
    assigned_team = payload.get("assigned_team", "")
    resolution_notes = payload.get("resolution_notes", "")

    if not isinstance(status, str) or status not in ALLOWED_STATUSES:
        return jsonify({
            "error": "status must be Open, In Progress, or Resolved."
        }), 400

    if not isinstance(assigned_team, str):
        return jsonify({"error": "assigned_team must be text."}), 400

    if not isinstance(resolution_notes, str):
        return jsonify({"error": "resolution_notes must be text."}), 400

    assigned_team = assigned_team.strip()
    resolution_notes = resolution_notes.strip()

    if len(assigned_team) > 150:
        return jsonify({
            "error": "assigned_team must be 150 characters or fewer."
        }), 400

    if len(resolution_notes) > 5000:
        return jsonify({
            "error": "resolution_notes must be 5000 characters or fewer."
        }), 400

    now = datetime.now(timezone.utc).isoformat()

    try:
        with ACTIONS_LOCK:
            data = load_maintenance_actions()

            action = next(
                (
                    item for item in data["actions"]
                    if str(item.get("log_id")) == log_id
                ),
                None,
            )

            if action is None:
                action = {
                    "log_id": log_id,
                    "created_at": now,
                }
                data["actions"].append(action)

            action.update({
                "status": status,
                "assigned_team": assigned_team,
                "resolution_notes": resolution_notes,
                "updated_at": now,
                "resolved_at": (
                    now if status == "Resolved" else None
                ),
            })

            save_maintenance_actions(data)

        return jsonify({
            "message": "Maintenance action saved.",
            "action": action,
        })

    except (OSError, json.JSONDecodeError, ValueError) as error:
        app.logger.error("Could not save maintenance action: %s", error)
        return jsonify({
            "error": "Could not save maintenance workflow data."
        }), 500


# --------------------------------------------------
# Start the Flask server
# --------------------------------------------------

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
