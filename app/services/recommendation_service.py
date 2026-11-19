def get_confidence_level(
    similarity_score: float
) -> str:
    """
    Convert similarity score into an
    easy-to-understand confidence level.
    """

    if similarity_score >= 0.85:
        return "Very High"

    if similarity_score >= 0.70:
        return "High"

    if similarity_score >= 0.60:
        return "Medium"

    if similarity_score >= 0.50:
        return "Low"

    return "Very Low"


# ---------------------------------------------------------
# Find Best Historical Evidence
# ---------------------------------------------------------

def find_best_evidence(
    similar_incidents
):
    """
    Prefer a similar historical incident that has
    useful RCA information.

    Priority:
    1. Resolved incident with root cause + resolution
    2. Incident with resolution
    3. Incident with root cause
    4. Highest similarity incident
    """

    if not similar_incidents:
        return None

    # ---------------------------------------------
    # First preference:
    # Resolved + Root Cause + Resolution
    # ---------------------------------------------

    for incident in similar_incidents:

        status = str(
            incident.get("status") or ""
        ).lower()

        root_cause = incident.get(
            "root_cause"
        )

        resolution = incident.get(
            "resolution"
        )

        if (
            status == "resolved"
            and root_cause
            and resolution
        ):
            return incident


    # ---------------------------------------------
    # Second preference:
    # Has Resolution
    # ---------------------------------------------

    for incident in similar_incidents:

        if incident.get("resolution"):
            return incident


    # ---------------------------------------------
    # Third preference:
    # Has Root Cause
    # ---------------------------------------------

    for incident in similar_incidents:

        if incident.get("root_cause"):
            return incident


    # ---------------------------------------------
    # Final fallback:
    # Highest similarity
    # ---------------------------------------------

    return similar_incidents[0]


# ---------------------------------------------------------
# Generate Recommendation
# ---------------------------------------------------------

def generate_recommendation(
    similar_incidents
):
    """
    Generate an investigation recommendation from
    historical incident evidence.

    Historical resolutions are treated as evidence,
    not as automatic remediation instructions.
    """

    if not similar_incidents:

        return {
            "recommended_action": (
                "No reliable historical incident was found. "
                "Perform manual investigation."
            ),

            "confidence_level": "Very Low",

            "similarity_score": 0.0,

            "similarity_percentage": 0.0,

            "evidence_incident": None,

            "evidence_root_cause": None,

            "previous_resolution": None,

            "manual_review_required": True,
        }


    # -----------------------------------------------------
    # Select useful historical evidence
    # -----------------------------------------------------

    best_match = find_best_evidence(
        similar_incidents
    )

    similarity_score = float(
        best_match.get(
            "similarity_score",
            0.0
        )
    )

    similarity_percentage = round(
        similarity_score * 100,
        2
    )

    evidence_incident = (
        best_match.get(
            "incident_number"
        )
    )

    root_cause = (
        best_match.get(
            "root_cause"
        )
    )

    historical_resolution = (
        best_match.get(
            "resolution"
        )
    )

    confidence_level = (
        get_confidence_level(
            similarity_score
        )
    )


    # -----------------------------------------------------
    # Recommendation
    # -----------------------------------------------------

    if (
        similarity_score >= 0.70
        and historical_resolution
    ):

        recommended_action = (
            f"Review historical incident "
            f"{evidence_incident}. "
        )

        if root_cause:

            recommended_action += (
                f"The previous root cause was: "
                f"{root_cause}. "
            )

        recommended_action += (
            f"The previous resolution was: "
            f"{historical_resolution}. "
            "Validate the current incident before "
            "applying the same resolution."
        )


    elif (
        similarity_score >= 0.50
        and historical_resolution
    ):

        recommended_action = (
            f"A related historical incident "
            f"({evidence_incident}) was found. "
            f"Review its previous resolution: "
            f"{historical_resolution}. "
            "Perform additional validation because "
            "the semantic match is moderate."
        )


    elif root_cause:

        recommended_action = (
            f"Historical incident "
            f"{evidence_incident} suggests the "
            f"possible root cause: {root_cause}. "
            "Verify this cause using logs, service "
            "health and current incident evidence."
        )


    else:

        recommended_action = (
            "Similar historical incidents were found, "
            "but they do not contain sufficient resolved "
            "RCA information. Continue manual investigation."
        )


    # -----------------------------------------------------
    # Always require engineer validation
    # -----------------------------------------------------

    manual_review_required = True


    return {
        "recommended_action":
            recommended_action,

        "confidence_level":
            confidence_level,

        "similarity_score": round(
            similarity_score,
            4
        ),

        "similarity_percentage":
            similarity_percentage,

        "evidence_incident":
            evidence_incident,

        "evidence_root_cause":
            root_cause,

        "previous_resolution":
            historical_resolution,

        "manual_review_required":
            manual_review_required,
    }