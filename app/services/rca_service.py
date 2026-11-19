import os

import joblib


# ------------------------------------------------
# ML Model Path
# ------------------------------------------------

MODEL_PATH = os.path.join(
    "ml",
    "artifacts",
    "rca_model.joblib"
)


# ------------------------------------------------
# Similarity-Based RCA
# ------------------------------------------------

def predict_root_cause(similar_incidents):
    """
    Predict likely root cause using the most
    similar historical resolved incident.
    """

    if not similar_incidents:
        return {
            "likely_root_cause": None,
            "similarity_score": 0.0,
            "evidence_incident": None,
            "recommended_action": None
        }

    # Highest similarity result comes first
    best_match = similar_incidents[0]

    return {
        "likely_root_cause": best_match.get("root_cause"),
        "similarity_score": best_match.get("similarity_score"),
        "evidence_incident": best_match.get("incident_number"),
        "recommended_action": best_match.get("resolution")
    }


# ------------------------------------------------
# Load ML Model
# ------------------------------------------------

def load_rca_model():
    """
    Load the trained RCA ML model.
    """

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "RCA ML model not found. "
            "Run: python ml/train_model.py"
        )

    return joblib.load(MODEL_PATH)


# ------------------------------------------------
# Build Incident Text
# ------------------------------------------------

def build_ml_incident_text(incident):
    """
    Prepare incident information in the same format
    used while training the ML model.
    """

    parts = [
        incident.title or "",
        incident.description or "",
        incident.category or "",
        incident.subcategory or "",
        incident.affected_service or ""
    ]

    return " ".join(parts)


# ------------------------------------------------
# ML Root Cause Prediction
# ------------------------------------------------

def predict_root_cause_ml(incident):
    """
    Predict root cause using the trained
    TF-IDF + Logistic Regression model.
    """

    model = load_rca_model()

    incident_text = build_ml_incident_text(
        incident
    )

    # Predict root cause
    predicted_root_cause = model.predict(
        [incident_text]
    )[0]

    # Get class probabilities
    probabilities = model.predict_proba(
        [incident_text]
    )[0]

    # Highest prediction probability
    confidence = float(
        max(probabilities)
    )

    return {
        "predicted_root_cause": predicted_root_cause,
        "prediction_confidence": round(
            confidence,
            4
        ),
        "model_type": "TF-IDF + Logistic Regression"
    }