import { useEffect, useState } from "react";

import {
  getIncidents,
  analyzeIncident,
} from "../services/api";


function RCAAnalysis() {
  const [incidents, setIncidents] = useState([]);

  const [
    selectedIncidentId,
    setSelectedIncidentId,
  ] = useState("");

  const [topK, setTopK] = useState(5);

  const [
    minSimilarity,
    setMinSimilarity,
  ] = useState(0.5);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] = useState("");


  // ------------------------------------------------
  // Load Incidents
  // ------------------------------------------------

  useEffect(() => {
    const loadIncidents = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getIncidents(
          0,
          100
        );

        const incidentList =
          Array.isArray(data)
            ? data
            : [];

        setIncidents(incidentList);

        if (incidentList.length > 0) {
          setSelectedIncidentId(
            String(incidentList[0].id)
          );
        }
      } catch (err) {
        console.error(
          "Load incidents error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load incidents."
        );
      } finally {
        setLoading(false);
      }
    };

    loadIncidents();
  }, []);


  // ------------------------------------------------
  // Analyze Incident
  // ------------------------------------------------

  const handleAnalyze = async () => {
    if (!selectedIncidentId) {
      setError(
        "Please select an incident."
      );

      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeIncident(
        Number(selectedIncidentId),
        Number(topK),
        Number(minSimilarity)
      );

      setResult(data);
    } catch (err) {
      console.error(
        "RCA Analysis error:",
        err
      );

      setError(
        err?.message ||
          "Unable to analyze incident."
      );
    } finally {
      setAnalyzing(false);
    }
  };


  // ------------------------------------------------
  // Confidence Class
  // ------------------------------------------------

  const getConfidenceClass = (level) => {
    switch (
      String(level || "").toLowerCase()
    ) {
      case "very high":
        return "very-high";

      case "high":
        return "high";

      case "medium":
        return "medium";

      case "low":
        return "low";

      default:
        return "very-low";
    }
  };


  // ------------------------------------------------
  // Similarity Percentage
  // ------------------------------------------------

  const getSimilarityPercentage = (
    incident
  ) => {
    if (
      incident?.similarity_percentage != null
    ) {
      return Number(
        incident.similarity_percentage
      );
    }

    return Number(
      (
        Number(
          incident?.similarity_score || 0
        ) * 100
      ).toFixed(2)
    );
  };


  // ------------------------------------------------
  // Loading
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="panel coming-soon">
        <h2>
          Loading RCA Analysis...
        </h2>

        <p>
          Retrieving incidents from IncidentIQ.
        </p>
      </div>
    );
  }


  // ------------------------------------------------
  // Main UI
  // ------------------------------------------------

  return (
    <div className="rca-page">

      {/* ======================================== */}
      {/* Analysis Controls */}
      {/* ======================================== */}

      <section className="panel rca-control">
        <div className="panel-header">
          <div>
            <span className="section-eyebrow">
              ROOT CAUSE INTELLIGENCE
            </span>

            <h3>
              Root Cause Analysis
            </h3>

            <p>
              Analyze historical evidence,
              identify a likely root cause and
              generate an investigation
              recommendation.
            </p>
          </div>
        </div>


        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}


        {incidents.length === 0 ? (
          <div className="empty-incidents">
            No incidents are available for
            RCA analysis.
          </div>
        ) : (
          <div className="rca-form">

            {/* Incident */}

            <div className="form-group">
              <label htmlFor="rca-incident">
                Select Incident
              </label>

              <select
                id="rca-incident"
                value={selectedIncidentId}
                onChange={(event) => {
                  setSelectedIncidentId(
                    event.target.value
                  );

                  setResult(null);
                  setError("");
                }}
              >
                {incidents.map((incident) => (
                  <option
                    key={incident.id}
                    value={incident.id}
                  >
                    {incident.incident_number}
                    {" - "}
                    {incident.title}
                  </option>
                ))}
              </select>
            </div>


            {/* Historical Matches */}

            <div className="form-group">
              <label htmlFor="rca-top-k">
                Historical Matches
              </label>

              <select
                id="rca-top-k"
                value={topK}
                onChange={(event) => {
                  setTopK(
                    Number(event.target.value)
                  );

                  setResult(null);
                }}
              >
                <option value={3}>
                  Top 3
                </option>

                <option value={5}>
                  Top 5
                </option>

                <option value={10}>
                  Top 10
                </option>
              </select>
            </div>


            {/* Minimum Similarity */}

            <div className="form-group">
              <label htmlFor="rca-min-similarity">
                Minimum Match
              </label>

              <select
                id="rca-min-similarity"
                value={minSimilarity}
                onChange={(event) => {
                  setMinSimilarity(
                    Number(event.target.value)
                  );

                  setResult(null);
                }}
              >
                <option value={0.5}>
                  50%
                </option>

                <option value={0.6}>
                  60%
                </option>

                <option value={0.7}>
                  70%
                </option>

                <option value={0.8}>
                  80%
                </option>
              </select>
            </div>


            {/* Analyze */}

            <button
              type="button"
              className="new-incident-btn"
              onClick={handleAnalyze}
              disabled={
                analyzing ||
                incidents.length === 0
              }
            >
              {analyzing
                ? "Analyzing..."
                : "Analyze Incident"}
            </button>
          </div>
        )}
      </section>


      {/* ======================================== */}
      {/* Results */}
      {/* ======================================== */}

      {result && (
        <div className="rca-results">

          {/* ==================================== */}
          {/* Target Incident */}
          {/* ==================================== */}

          <section className="panel target-incident-card">
            <span className="section-eyebrow">
              TARGET INCIDENT
            </span>

            <div className="target-header">
              <div>
                <h3>
                  {
                    result.target_incident
                      ?.incident_number
                  }
                </h3>

                <p>
                  {
                    result.target_incident
                      ?.title
                  }
                </p>
              </div>

              <div className="target-meta">
                <span>
                  {
                    result.target_incident
                      ?.category ||
                    "Uncategorized"
                  }
                </span>

                <span>
                  {
                    result.target_incident
                      ?.affected_service ||
                    "Service N/A"
                  }
                </span>

                <span>
                  {
                    result.target_incident
                      ?.priority ||
                    "Priority N/A"
                  }
                </span>

                <span>
                  {
                    result.target_incident
                      ?.status ||
                    "Status N/A"
                  }
                </span>
              </div>
            </div>
          </section>


          {/* ==================================== */}
          {/* RCA Intelligence */}
          {/* ==================================== */}

          <div className="rca-evidence-header">
            <span className="section-eyebrow">
              RCA RESULT
            </span>

            <h3>
              Root Cause Intelligence
            </h3>
          </div>


          <section className="panel rca-intelligence-card">

            {/* Likely Root Cause */}

            <div className="rca-intelligence-root">
              <span className="detail-label">
                Likely Root Cause
              </span>

              <h3>
                {
                  result.rca
                    ?.likely_root_cause ||
                  "Not enough historical evidence"
                }
              </h3>
            </div>


            {/* Confidence + Evidence */}

            <div className="rca-intelligence-meta">

              {/* Confidence */}

              <div className="rca-meta-item">
                <span className="detail-label">
                  Confidence
                </span>

                <strong
                  className={`rca-confidence-value ${getConfidenceClass(
                    result.recommendation
                      ?.confidence_level
                  )}`}
                >
                  {
                    result.recommendation
                      ?.confidence_level ||
                    "N/A"
                  }
                </strong>

                {result.recommendation
                  ?.similarity_percentage != null && (
                  <small>
                    {Number(
                      result.recommendation
                        .similarity_percentage
                    ).toFixed(2)}
                    % semantic similarity
                  </small>
                )}
              </div>


              {/* Evidence Incident */}

              <div className="rca-meta-item">
                <span className="detail-label">
                  Evidence Incident
                </span>

                <strong className="rca-evidence-value">
                  {
                    result.recommendation
                      ?.evidence_incident ||
                    result.rca
                      ?.evidence_incident ||
                    "N/A"
                  }
                </strong>

                <small>
                  Strongest historical match
                </small>
              </div>
            </div>
          </section>


          {/* ==================================== */}
          {/* Historical Root Cause */}
          {/* ==================================== */}

          {result.recommendation
            ?.evidence_root_cause && (
            <section className="panel recommendation-card">
              <span className="section-eyebrow">
                HISTORICAL ROOT CAUSE
              </span>

              <h3>
                Root Cause From Previous Incident
              </h3>

              <p>
                {
                  result.recommendation
                    .evidence_root_cause
                }
              </p>

              <small>
                Evidence from{" "}
                <strong>
                  {
                    result.recommendation
                      .evidence_incident
                  }
                </strong>
              </small>
            </section>
          )}


          {/* ==================================== */}
          {/* Previous Resolution */}
          {/* ==================================== */}

          {result.recommendation
            ?.previous_resolution && (
            <section className="panel previous-resolution-card">
              <span className="section-eyebrow">
                HISTORICAL RESOLUTION
              </span>

              <h3>
                Previous Successful Resolution
              </h3>

              <p>
                {
                  result.recommendation
                    .previous_resolution
                }
              </p>

              <small>
                Evidence from{" "}
                <strong>
                  {
                    result.recommendation
                      .evidence_incident
                  }
                </strong>
              </small>
            </section>
          )}


          {/* ==================================== */}
          {/* Recommendation */}
          {/* ==================================== */}

          <section className="panel recommendation-card">
            <div className="recommendation-card-header">
              <div>
                <span className="section-eyebrow">
                  RECOMMENDED ACTION
                </span>

                <h3>
                  Incident Response Recommendation
                </h3>
              </div>

              {result.recommendation && (
                <span
                  className={`confidence-badge ${getConfidenceClass(
                    result.recommendation
                      .confidence_level
                  )}`}
                >
                  {
                    result.recommendation
                      .confidence_level
                  }
                </span>
              )}
            </div>

            <p>
              {
                result.recommendation
                  ?.recommended_action ||
                result.rca
                  ?.recommended_action ||
                "No recommendation is currently available."
              }
            </p>

            <div
              className={
                result.recommendation
                  ?.manual_review_required
                  ? "manual-review required"
                  : "manual-review not-required"
              }
            >
              <span>
                Engineer Validation
              </span>

              <strong>
                {
                  result.recommendation
                    ?.manual_review_required
                    ? "Required"
                    : "Not Required"
                }
              </strong>
            </div>
          </section>


          {/* ==================================== */}
          {/* Historical Evidence Header */}
          {/* ==================================== */}

          <div className="rca-evidence-header">
            <span className="section-eyebrow">
              HISTORICAL EVIDENCE
            </span>

            <h3>
              Similar Incidents
            </h3>

            <p>
              Showing incidents above{" "}
              <strong>
                {minSimilarity * 100}%
              </strong>{" "}
              semantic similarity.
            </p>
          </div>


          {/* ==================================== */}
          {/* Similar Incidents */}
          {/* ==================================== */}

          {(
            result.similar_incidents
              ?.length || 0
          ) === 0 ? (
            <div className="panel empty-incidents">
              <h4>
                No historical matches found
              </h4>

              <p>
                No incidents met the selected
                similarity threshold.
              </p>
            </div>
          ) : (
            <div className="correlation-list">
              {result.similar_incidents.map(
                (incident, index) => {
                  const percentage =
                    getSimilarityPercentage(
                      incident
                    );

                  const similarityClass =
                    String(
                      incident
                        .similarity_level || ""
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-");

                  return (
                    <div
                      className="panel correlation-card"
                      key={
                        incident.incident_id ||
                        incident.incident_number ||
                        index
                      }
                    >

                      {/* Header */}

                      <div className="correlation-card-top">
                        <div className="correlation-rank">
                          #{index + 1}
                        </div>

                        <div className="correlation-title">
                          <strong>
                            {
                              incident
                                .incident_number
                            }
                          </strong>

                          <h4>
                            {incident.title}
                          </h4>
                        </div>

                        <div className="similarity-score">
                          <span>
                            Similarity
                          </span>

                          <strong>
                            {percentage.toFixed(2)}%
                          </strong>

                          {incident
                            .similarity_level && (
                            <span
                              className={`similarity-level ${similarityClass}`}
                            >
                              {
                                incident
                                  .similarity_level
                              }{" "}
                              Match
                            </span>
                          )}
                        </div>
                      </div>


                      {/* Similarity Bar */}

                      <div className="similarity-bar">
                        <div
                          className="similarity-fill"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                percentage,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>


                      {/* Metadata */}

                      <div className="correlation-meta">
                        <span>
                          Category:{" "}
                          <strong>
                            {
                              incident.category ||
                              "N/A"
                            }
                          </strong>
                        </span>

                        <span>
                          Service:{" "}
                          <strong>
                            {
                              incident
                                .affected_service ||
                              "N/A"
                            }
                          </strong>
                        </span>

                        <span>
                          Priority:{" "}
                          <strong>
                            {
                              incident.priority ||
                              "N/A"
                            }
                          </strong>
                        </span>

                        <span>
                          Status:{" "}
                          <strong>
                            {
                              incident.status ||
                              "N/A"
                            }
                          </strong>
                        </span>
                      </div>


                      {/* RCA Evidence */}

                      <div className="correlation-details">
                        <div>
                          <span className="detail-label">
                            Historical Root Cause
                          </span>

                          <p>
                            {
                              incident.root_cause ||
                              "Root cause not yet recorded."
                            }
                          </p>
                        </div>

                        <div>
                          <span className="detail-label">
                            Previous Resolution
                          </span>

                          <p>
                            {
                              incident.resolution ||
                              "Resolution not yet recorded."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default RCAAnalysis;