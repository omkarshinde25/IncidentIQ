from app.services.embedding_service import (
    find_similar_incidents,
)


# ---------------------------------------------------------
# Correlate incidents
# ---------------------------------------------------------

def correlate_incidents(
    target_incident,
    historical_incidents,
    top_k: int = 5,
    min_similarity: float = 0.50,
):
    """
    Find historical incidents that are semantically
    similar to the target incident.

    The function returns the most similar incidents
    together with previous root-cause and resolution
    information.

    Parameters
    ----------
    target_incident:
        The incident currently being investigated.

    historical_incidents:
        Historical incidents retrieved from the database.

    top_k:
        Maximum number of similar incidents to return.

    min_similarity:
        Minimum cosine similarity required for a match.

    Returns
    -------
    list:
        List of correlated historical incidents ordered
        from highest similarity to lowest similarity.
    """

    # -----------------------------------------------------
    # Validate input
    # -----------------------------------------------------

    if target_incident is None:
        raise ValueError(
            "Target incident is required."
        )

    if not historical_incidents:
        return []

    # -----------------------------------------------------
    # Find similar incidents using embeddings
    # -----------------------------------------------------

    similar_incidents = find_similar_incidents(
        target_incident=target_incident,
        historical_incidents=historical_incidents,
        top_k=top_k,
        min_similarity=min_similarity,
    )

    # -----------------------------------------------------
    # Build correlation response
    # -----------------------------------------------------

    correlated_incidents = []

    for incident in similar_incidents:

        similarity_score = incident.get(
            "similarity_score",
            0.0,
        )

        similarity_percentage = incident.get(
            "similarity_percentage",
            round(similarity_score * 100, 2),
        )

        correlated_incident = {

            # ---------------------------------------------
            # Incident identification
            # ---------------------------------------------

            "incident_id": incident.get(
                "id"
            ),

            "incident_number": incident.get(
                "incident_number"
            ),

            "title": incident.get(
                "title"
            ),

            # ---------------------------------------------
            # Incident information
            # ---------------------------------------------

            "category": incident.get(
                "category"
            ),

            "subcategory": incident.get(
                "subcategory"
            ),

            "affected_service": incident.get(
                "affected_service"
            ),

            "priority": incident.get(
                "priority"
            ),

            "status": incident.get(
                "status"
            ),

            # ---------------------------------------------
            # Historical RCA information
            # ---------------------------------------------

            "root_cause": incident.get(
                "root_cause"
            ),

            "resolution": incident.get(
                "resolution"
            ),

            # ---------------------------------------------
            # Semantic similarity
            # ---------------------------------------------

            "similarity_score": (
                similarity_score
            ),

            "similarity_percentage": (
                similarity_percentage
            ),

            # ---------------------------------------------
            # Human-readable similarity level
            # ---------------------------------------------

            "similarity_level": (
                get_similarity_level(
                    similarity_score
                )
            ),
        }

        correlated_incidents.append(
            correlated_incident
        )

    return correlated_incidents


# ---------------------------------------------------------
# Similarity level helper
# ---------------------------------------------------------

def get_similarity_level(
    similarity_score: float,
) -> str:
    """
    Convert a numerical similarity score into
    an easy-to-understand label.

    These thresholds are prototype thresholds and
    can be tuned later using evaluation data.
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
# Best correlated incident
# ---------------------------------------------------------

def get_best_correlated_incident(
    target_incident,
    historical_incidents,
    min_similarity: float = 0.50,
):
    """
    Return only the best historical incident match.

    Useful when the frontend needs to display the
    strongest previous incident and resolution.
    """

    results = correlate_incidents(
        target_incident=target_incident,
        historical_incidents=historical_incidents,
        top_k=1,
        min_similarity=min_similarity,
    )

    if not results:
        return None

    return results[0]