from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import engine, get_db

from app.services.correlation_service import correlate_incidents
from app.services.preprocessing import detect_recurring_patterns
from app.services.recommendation_service import generate_recommendation
from app.services.rca_service import (
    predict_root_cause,
    predict_root_cause_ml,
)


# =========================================================
# Configuration
# =========================================================

HISTORICAL_INCIDENT_LIMIT = 10000


# =========================================================
# Database
# =========================================================

models.Base.metadata.create_all(bind=engine)


# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="IncidentIQ",
    description=(
        "IT Incident Correlation, Root Cause Analysis, "
        "Recommendation and ML Prediction API"
    ),
    version="1.3.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Home
# =========================================================

@app.get("/")
def home():
    return {
        "project": "IncidentIQ",
        "message": "IncidentIQ API is running successfully",
        "status": "healthy",
        "version": "1.3.0",
    }


# =========================================================
# Health Check
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "IncidentIQ API",
    }


# =========================================================
# Create Incident
# =========================================================

@app.post(
    "/incidents",
    response_model=schemas.IncidentResponse,
    status_code=201,
)
def create_incident(
    incident: schemas.IncidentCreate,
    db: Session = Depends(get_db),
):
    return crud.create_incident(
        db=db,
        incident=incident,
    )


# =========================================================
# Get All Incidents
# Pagination Endpoint
# =========================================================

@app.get(
    "/incidents",
    response_model=list[schemas.IncidentResponse],
)
def get_incidents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if skip < 0:
        raise HTTPException(
            status_code=400,
            detail="skip cannot be negative",
        )

    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=400,
            detail="limit must be between 1 and 1000",
        )

    return crud.get_all_incidents(
        db=db,
        skip=skip,
        limit=limit,
    )


# =========================================================
# Get One Incident
# =========================================================

@app.get(
    "/incidents/{incident_id}",
    response_model=schemas.IncidentResponse,
)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = crud.get_incident_by_id(
        db=db,
        incident_id=incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return incident


# =========================================================
# Correlate Incident
#
# SentenceTransformer Embeddings
# +
# Cosine Similarity
# +
# Historical Root Cause
# +
# Previous Resolution
# =========================================================

@app.post("/incidents/{incident_id}/correlate")
def correlate_incident(
    incident_id: int,
    top_k: int = 5,
    min_similarity: float = 0.50,
    db: Session = Depends(get_db),
):
    if top_k < 1 or top_k > 20:
        raise HTTPException(
            status_code=400,
            detail="top_k must be between 1 and 20",
        )

    if (
        min_similarity < 0.0
        or min_similarity > 1.0
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "min_similarity must be "
                "between 0.0 and 1.0"
            ),
        )

    target_incident = crud.get_incident_by_id(
        db=db,
        incident_id=incident_id,
    )

    if target_incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    # Full historical dataset for prototype
    historical_incidents = crud.get_all_incidents(
        db=db,
        skip=0,
        limit=HISTORICAL_INCIDENT_LIMIT,
    )

    try:
        similar_incidents = correlate_incidents(
            target_incident=target_incident,
            historical_incidents=historical_incidents,
            top_k=top_k,
            min_similarity=min_similarity,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Incident correlation failed: "
                f"{str(error)}"
            ),
        ) from error

    return {
        "target_incident": {
            "id": target_incident.id,
            "incident_number": (
                target_incident.incident_number
            ),
            "title": target_incident.title,
            "description": target_incident.description,
            "category": target_incident.category,
            "subcategory": target_incident.subcategory,
            "affected_service": (
                target_incident.affected_service
            ),
            "priority": target_incident.priority,
            "status": target_incident.status,
        },

        "correlation_summary": {
            "matches_found": len(
                similar_incidents
            ),
            "requested_top_k": top_k,
            "minimum_similarity": (
                min_similarity
            ),
            "minimum_similarity_percentage": round(
                min_similarity * 100,
                2,
            ),
            "historical_incidents_analyzed": len(
                historical_incidents
            ),
        },

        "similar_incidents": similar_incidents,
    }


# =========================================================
# Analyze Incident
#
# Correlation
# +
# Historical RCA
# +
# Recommendation
# =========================================================

@app.post("/incidents/{incident_id}/analyze")
def analyze_incident(
    incident_id: int,
    top_k: int = 5,
    min_similarity: float = 0.50,
    db: Session = Depends(get_db),
):
    if top_k < 1 or top_k > 20:
        raise HTTPException(
            status_code=400,
            detail="top_k must be between 1 and 20",
        )

    if (
        min_similarity < 0.0
        or min_similarity > 1.0
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "min_similarity must be "
                "between 0.0 and 1.0"
            ),
        )

    target_incident = crud.get_incident_by_id(
        db=db,
        incident_id=incident_id,
    )

    if target_incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    # Full historical dataset for RCA
    historical_incidents = crud.get_all_incidents(
        db=db,
        skip=0,
        limit=HISTORICAL_INCIDENT_LIMIT,
    )

    try:
        similar_incidents = correlate_incidents(
            target_incident=target_incident,
            historical_incidents=historical_incidents,
            top_k=top_k,
            min_similarity=min_similarity,
        )

        # Historical RCA
        rca_result = predict_root_cause(
            similar_incidents
        )

        # Recommendation
        recommendation_result = (
            generate_recommendation(
                similar_incidents
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Incident analysis failed: "
                f"{str(error)}"
            ),
        ) from error

    return {
        "target_incident": {
            "id": target_incident.id,
            "incident_number": (
                target_incident.incident_number
            ),
            "title": target_incident.title,
            "description": target_incident.description,
            "category": target_incident.category,
            "subcategory": target_incident.subcategory,
            "affected_service": (
                target_incident.affected_service
            ),
            "priority": target_incident.priority,
            "status": target_incident.status,
        },

        "analysis_summary": {
            "matches_found": len(
                similar_incidents
            ),
            "minimum_similarity": (
                min_similarity
            ),
            "historical_incidents_analyzed": len(
                historical_incidents
            ),
        },

        "rca": rca_result,

        "recommendation":
            recommendation_result,

        "similar_incidents":
            similar_incidents,
    }


# =========================================================
# ML Root Cause Prediction
#
# TF-IDF
# +
# Logistic Regression
# =========================================================

@app.post(
    "/incidents/{incident_id}/predict-root-cause"
)
def predict_incident_root_cause(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = crud.get_incident_by_id(
        db=db,
        incident_id=incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    try:
        prediction = predict_root_cause_ml(
            incident
        )

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "ML prediction failed: "
                f"{str(error)}"
            ),
        ) from error

    return {
        "incident": {
            "id": incident.id,
            "incident_number": (
                incident.incident_number
            ),
            "title": incident.title,
            "description": incident.description,
            "category": incident.category,
            "subcategory": incident.subcategory,
            "affected_service": (
                incident.affected_service
            ),
            "priority": incident.priority,
            "status": incident.status,
        },

        "ml_prediction": prediction,
    }


# =========================================================
# Detect Recurring Incident Patterns
# =========================================================

@app.get("/patterns/recurring")
def get_recurring_patterns(
    minimum_count: int = 2,
    db: Session = Depends(get_db),
):
    if minimum_count < 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "minimum_count must be at least 1"
            ),
        )

    # Analyze complete historical dataset
    incidents = crud.get_all_incidents(
        db=db,
        skip=0,
        limit=HISTORICAL_INCIDENT_LIMIT,
    )

    try:
        patterns = detect_recurring_patterns(
            incidents=incidents,
            minimum_count=minimum_count,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Pattern detection failed: "
                f"{str(error)}"
            ),
        ) from error

    return patterns


# =========================================================
# Dashboard Summary
# =========================================================

@app.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
):
    # ---------------------------------------------
    # Database KPI Counts
    # ---------------------------------------------

    total_incidents = (
        db.query(models.Incident)
        .count()
    )

    critical_p1 = (
        db.query(models.Incident)
        .filter(
            models.Incident.priority == "P1"
        )
        .count()
    )

    open_incidents = (
        db.query(models.Incident)
        .filter(
            models.Incident.status == "Open"
        )
        .count()
    )

    investigating_incidents = (
        db.query(models.Incident)
        .filter(
            models.Incident.status
            == "Investigating"
        )
        .count()
    )

    resolved_incidents = (
        db.query(models.Incident)
        .filter(
            models.Incident.status
            == "Resolved"
        )
        .count()
    )

    closed_incidents = (
        db.query(models.Incident)
        .filter(
            models.Incident.status
            == "Closed"
        )
        .count()
    )


    # ---------------------------------------------
    # Pattern KPI
    # ---------------------------------------------

    historical_incidents = (
        crud.get_all_incidents(
            db=db,
            skip=0,
            limit=HISTORICAL_INCIDENT_LIMIT,
        )
    )

    pattern_data = (
        detect_recurring_patterns(
            incidents=historical_incidents,
            minimum_count=2,
        )
    )


    # ---------------------------------------------
    # Response
    # ---------------------------------------------

    return {
        "total_incidents":
            total_incidents,

        "critical_p1":
            critical_p1,

        "open_incidents":
            open_incidents,

        "investigating_incidents":
            investigating_incidents,

        "resolved_incidents":
            resolved_incidents,

        "closed_incidents":
            closed_incidents,

        "recurring_patterns":
            pattern_data.get(
                "total_patterns",
                0,
            ),

        "problem_candidates":
            pattern_data.get(
                "problem_candidates",
                0,
            ),

        "ml_model":
            "Ready",

        "ml_model_type":
            "TF-IDF + Logistic Regression",
    }