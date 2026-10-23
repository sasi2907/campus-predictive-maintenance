from pathlib import Path

import numpy as np
import pandas as pd


# Reproducible results: running the script again generates the same dataset.
RANDOM_SEED = 42
TOTAL_RECORDS = 5000

rng = np.random.default_rng(RANDOM_SEED)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_FILE = DATA_DIR / "campus_maintenance_logs.csv"

LOCATIONS = [
    "Engineering Block",
    "Main Cafeteria",
    "Central Library",
    "Science Lab",
    "Hostel A",
    "Main Corridor",
]

FACILITY_TYPES = [
    "Washroom",
    "Water-Cooler",
    "Common Area",
    "Classroom",
]

DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

TIMES = ["Morning", "Afternoon", "Evening"]
FOOTFALL_LEVELS = ["Low", "Medium", "High"]

ISSUE_TYPES = [
    "Cleanliness Issue",
    "Garbage Overflow",
    "Water-Cooler Failure",
    "Lighting Problem",
]

SEVERITY_LEVELS = ["Low", "Medium", "High"]


def choose_footfall(location, facility_type, time_of_day, day_of_week):
    """Generate realistic footfall patterns for campus facilities."""

    high_probability = 0.25

    if location == "Main Cafeteria":
        high_probability += 0.35

    if facility_type == "Common Area":
        high_probability += 0.10

    if time_of_day in ["Morning", "Afternoon"]:
        high_probability += 0.10

    if day_of_week in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
        high_probability += 0.10

    if location == "Hostel A" and time_of_day == "Evening":
        high_probability += 0.15

    high_probability = min(high_probability, 0.85)

    low_probability = 0.30
    medium_probability = 1 - high_probability - low_probability

    if medium_probability < 0.05:
        low_probability = 1 - high_probability - 0.05
        medium_probability = 0.05

    probabilities = [
        low_probability,
        medium_probability,
        high_probability,
    ]

    return rng.choice(FOOTFALL_LEVELS, p=probabilities)


def choose_issue(location, facility_type, footfall, time_of_day):
    """Make issue type depend on facility, location, and footfall."""

    weights = {
        "Cleanliness Issue": 1.0,
        "Garbage Overflow": 1.0,
        "Water-Cooler Failure": 1.0,
        "Lighting Problem": 1.0,
    }

    # Washrooms are more likely to have cleanliness issues.
    if facility_type == "Washroom":
        weights["Cleanliness Issue"] += 5.0

    # Water coolers are more likely to have water-cooler failures.
    if facility_type == "Water-Cooler":
        weights["Water-Cooler Failure"] += 10.0

    # Cafeterias generate more waste, especially with high footfall.
    if location == "Main Cafeteria":
        weights["Garbage Overflow"] += 4.0

        if footfall == "High":
            weights["Garbage Overflow"] += 7.0

    # High footfall increases cleanliness and garbage-related problems.
    if footfall == "High":
        weights["Cleanliness Issue"] += 2.0
        weights["Garbage Overflow"] += 2.0

    elif footfall == "Medium":
        weights["Cleanliness Issue"] += 1.0
        weights["Garbage Overflow"] += 1.0

    # Corridors have greater exposure to lighting issues.
    if location == "Main Corridor":
        weights["Lighting Problem"] += 3.0

    # Evening usage makes lighting issues somewhat more likely.
    if time_of_day == "Evening":
        weights["Lighting Problem"] += 2.0

    if facility_type == "Classroom":
        weights["Lighting Problem"] += 1.5

    issue_weights = np.array(
        [weights[issue] for issue in ISSUE_TYPES],
        dtype=float,
    )

    probabilities = issue_weights / issue_weights.sum()

    return rng.choice(ISSUE_TYPES, p=probabilities)


def choose_severity(issue, location, facility_type, footfall, time_of_day):
    """Generate severity based on the predicted issue's characteristics."""

    weights = {
        "Low": 0.50,
        "Medium": 0.35,
        "High": 0.15,
    }

    if footfall == "High":
        weights["High"] += 0.10
        weights["Low"] -= 0.05

    if issue == "Garbage Overflow":
        weights["Medium"] += 0.10
        weights["Low"] -= 0.05

    if issue == "Water-Cooler Failure":
        weights["Medium"] += 0.10
        weights["Low"] -= 0.05

    if issue == "Lighting Problem" and time_of_day == "Evening":
        weights["High"] += 0.10
        weights["Low"] -= 0.05

    if facility_type == "Washroom" and footfall == "High":
        weights["Medium"] += 0.05
        weights["Low"] -= 0.05

    if location == "Main Cafeteria" and footfall == "High":
        weights["Medium"] += 0.05
        weights["Low"] -= 0.05

    probabilities = np.array(
        [weights[level] for level in SEVERITY_LEVELS],
        dtype=float,
    )

    probabilities = np.maximum(probabilities, 0.01)
    probabilities /= probabilities.sum()

    return rng.choice(SEVERITY_LEVELS, p=probabilities)


def generate_dataset():
    """Create and save the complete campus maintenance dataset."""

    records = []

    for log_id in range(1, TOTAL_RECORDS + 1):
        location = rng.choice(LOCATIONS)
        facility_type = rng.choice(FACILITY_TYPES)
        day_of_week = rng.choice(DAYS)
        time_of_day = rng.choice(TIMES)

        footfall = choose_footfall(
            location,
            facility_type,
            time_of_day,
            day_of_week,
        )

        issue_type = choose_issue(
            location,
            facility_type,
            footfall,
            time_of_day,
        )

        severity = choose_severity(
            issue_type,
            location,
            facility_type,
            footfall,
            time_of_day,
        )

        records.append(
            {
                "Log_ID": log_id,
                "Location": location,
                "Facility_Type": facility_type,
                "Day_of_Week": day_of_week,
                "Time_of_Day": time_of_day,
                "Footfall": footfall,
                "Issue_Type": issue_type,
                "Severity_Level": severity,
            }
        )

    df = pd.DataFrame(records)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print("=" * 55)
    print("CAMPUS MAINTENANCE DATASET GENERATED")
    print("=" * 55)
    print(f"Records generated: {len(df)}")
    print(f"Unique Log_ID values: {df['Log_ID'].nunique()}")
    print(f"Saved to: {OUTPUT_FILE}")

    print("\nIssue type distribution:")
    print(df["Issue_Type"].value_counts())

    print("\nSeverity distribution:")
    print(df["Severity_Level"].value_counts())

    print("\nHigh-footfall cafeteria records:")
    cafeteria_data = df[
        (df["Location"] == "Main Cafeteria")
        & (df["Footfall"] == "High")
    ]
    print(cafeteria_data["Issue_Type"].value_counts())

    print("\nFirst five records:")
    print(df.head().to_string(index=False))


if __name__ == "__main__":
    generate_dataset()
