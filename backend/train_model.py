
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


# Find project directories.
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "campus_maintenance_logs.csv"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)


# Features used to make predictions.
FEATURE_COLUMNS = [
    "Location",
    "Facility_Type",
    "Day_of_Week",
    "Time_of_Day",
    "Footfall",
]

TARGET_COLUMNS = ["Issue_Type", "Severity_Level"]


def main():
    # 1. Load the generated dataset.
    df = pd.read_csv(DATA_PATH)

    print("Dataset loaded successfully.")
    print(f"Number of records: {len(df)}")

    # 2. Select input features and target columns.
    X = df[FEATURE_COLUMNS].copy()

    # Save one encoder for each input feature.
    feature_encoders = {}

    # 3. Convert categorical text features into numbers.
    for column in FEATURE_COLUMNS:
        encoder = LabelEncoder()
        X[column] = encoder.fit_transform(X[column].astype(str))
        feature_encoders[column] = encoder

    # Keep the original target labels for evaluation and prediction.
    y_issue = df["Issue_Type"].astype(str)
    y_severity = df["Severity_Level"].astype(str)

    # 4. Use the same train/test split for both models.
    X_train, X_test, y_issue_train, y_issue_test, y_sev_train, y_sev_test = (
        train_test_split(
            X,
            y_issue,
            y_severity,
            test_size=0.20,
            random_state=42,
            stratify=y_issue,
        )
    )

    print(f"Training records: {len(X_train)}")
    print(f"Testing records: {len(X_test)}")

    # 5. Train the issue prediction model.
    issue_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    print("\nTraining issue prediction model...")
    issue_model.fit(X_train, y_issue_train)

    issue_predictions = issue_model.predict(X_test)
    issue_accuracy = accuracy_score(y_issue_test, issue_predictions)

    print(f"Issue model accuracy: {issue_accuracy:.2%}")
    print(classification_report(y_issue_test, issue_predictions))

    # 6. Train the severity prediction model.
    severity_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    print("Training severity prediction model...")
    severity_model.fit(X_train, y_sev_train)

    severity_predictions = severity_model.predict(X_test)
    severity_accuracy = accuracy_score(y_sev_test, severity_predictions)

    print(f"Severity model accuracy: {severity_accuracy:.2%}")
    print(classification_report(y_sev_test, severity_predictions))

    # 7. Save both trained models and all feature encoders.
    joblib.dump(issue_model, MODEL_DIR / "issue_model.pkl")
    joblib.dump(severity_model, MODEL_DIR / "severity_model.pkl")
    joblib.dump(feature_encoders, MODEL_DIR / "encoders.pkl")

    # Save feature order so the API uses the same order.
    joblib.dump(FEATURE_COLUMNS, MODEL_DIR / "feature_columns.pkl")

    print("\nTraining completed successfully.")
    print(f"Models and encoders saved in: {MODEL_DIR}")


if __name__ == "__main__":
    main()
