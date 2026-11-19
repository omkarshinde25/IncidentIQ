from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class IncidentCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=10)

    category: str
    subcategory: Optional[str] = None
    affected_service: str

    priority: str = Field(pattern=r"^P[1-4]$")
    status: str = "Open"

    root_cause: Optional[str] = None
    resolution: Optional[str] = None


class IncidentResponse(IncidentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_number: str

    created_at: datetime
    resolved_at: Optional[datetime] = None