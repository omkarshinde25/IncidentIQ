from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


# ---------------------------------------------------------
# Test 1: Health Check
# ---------------------------------------------------------

def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data is not None
    assert data["status"] == "healthy"


# ---------------------------------------------------------
# Test 2: Get Incidents
# ---------------------------------------------------------

def test_get_incidents():
    response = client.get("/incidents")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (list, dict))


# ---------------------------------------------------------
# Test 3: Correlate Incident
# ---------------------------------------------------------

def test_correlate_incident():
    # First get incidents so the test does not rely
    # blindly on hardcoded incident ID = 1.
    incidents_response = client.get(
        "/incidents?skip=0&limit=100"
    )

    assert incidents_response.status_code == 200

    incidents = incidents_response.json()

    assert isinstance(incidents, list)
    assert len(incidents) > 0

    # Use first available incident.
    target_incident = incidents[0]

    incident_id = target_incident["id"]

    # Call the correlation endpoint.
    response = client.post(
        f"/incidents/{incident_id}/correlate"
        "?top_k=5&min_similarity=0.5"
    )

    assert response.status_code == 200

    data = response.json()

    # -----------------------------------------------------
    # Check main response sections
    # -----------------------------------------------------

    assert "target_incident" in data
    assert "correlation_summary" in data
    assert "similar_incidents" in data

    # -----------------------------------------------------
    # Check target incident
    # -----------------------------------------------------

    assert data["target_incident"]["id"] == incident_id

    assert (
        data["target_incident"]["incident_number"]
        == target_incident["incident_number"]
    )

    # -----------------------------------------------------
    # Check correlation summary
    # -----------------------------------------------------

    summary = data["correlation_summary"]

    assert "matches_found" in summary
    assert "requested_top_k" in summary
    assert "minimum_similarity" in summary

    assert summary["requested_top_k"] == 5
    assert summary["minimum_similarity"] == 0.5

    # -----------------------------------------------------
    # Check similar incidents
    # -----------------------------------------------------

    similar_incidents = data["similar_incidents"]

    assert isinstance(similar_incidents, list)

    assert len(similar_incidents) <= 5

    # -----------------------------------------------------
    # Validate every returned correlation
    # -----------------------------------------------------

    for incident in similar_incidents:

        assert "incident_id" in incident
        assert "incident_number" in incident
        assert "title" in incident

        assert "similarity_score" in incident
        assert "similarity_percentage" in incident
        assert "similarity_level" in incident

        assert "root_cause" in incident
        assert "resolution" in incident

        # Incident must not correlate with itself.
        assert incident["incident_id"] != incident_id

        # Score must satisfy our current threshold.
        assert incident["similarity_score"] >= 0.5

        # Percentage should be between 0 and 100.
        assert (
            0
            <= incident["similarity_percentage"]
            <= 100
        )

        # Similarity level must be one of our labels.
        assert incident["similarity_level"] in {
            "Very High",
            "High",
            "Medium",
            "Low",
            "Very Low",
        }


# ---------------------------------------------------------
# Test 4: Invalid Incident Correlation
# ---------------------------------------------------------

def test_correlate_invalid_incident():
    response = client.post(
        "/incidents/999999/correlate"
        "?top_k=5&min_similarity=0.5"
    )

    assert response.status_code == 404

    data = response.json()

    assert data["detail"] == "Incident not found"