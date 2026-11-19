from sqlalchemy.orm import Session

from app import models, schemas


# ------------------------------------------------
# Generate Next Incident Number
# ------------------------------------------------

def generate_incident_number(db: Session) -> str:
    """
    Generate the next incident number.

    Example:
    INC0001
    INC0002
    INC0003
    """

    last_incident = (
        db.query(models.Incident)
        .order_by(models.Incident.id.desc())
        .first()
    )

    if last_incident is None:
        next_number = 1
    else:
        next_number = last_incident.id + 1

    return f"INC{next_number:04d}"


# ------------------------------------------------
# Create New Incident
# ------------------------------------------------

def create_incident(
    db: Session,
    incident: schemas.IncidentCreate
):
    incident_number = generate_incident_number(db)

    db_incident = models.Incident(
        incident_number=incident_number,
        **incident.model_dump()
    )

    db.add(db_incident)

    db.commit()

    db.refresh(db_incident)

    return db_incident


# ------------------------------------------------
# Get All Incidents
# ------------------------------------------------

def get_all_incidents(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(models.Incident)
        .order_by(models.Incident.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ------------------------------------------------
# Get Incident by Database ID
# ------------------------------------------------

def get_incident_by_id(
    db: Session,
    incident_id: int
):
    return (
        db.query(models.Incident)
        .filter(
            models.Incident.id == incident_id
        )
        .first()
    )


# ------------------------------------------------
# Get Incident by Incident Number
# ------------------------------------------------

def get_incident_by_number(
    db: Session,
    incident_number: str
):
    return (
        db.query(models.Incident)
        .filter(
            models.Incident.incident_number
            == incident_number
        )
        .first()
    )